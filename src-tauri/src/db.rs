use std::collections::HashMap;
use std::sync::Arc;
use std::time::Instant;
use tokio::sync::RwLock;
use sqlx::{Column, Row, TypeInfo};
use sqlparser::dialect::{MySqlDialect, PostgreSqlDialect, SQLiteDialect};
use sqlparser::parser::Parser;
use crate::models::{
    ColumnInfo, ColumnMetadata, ConnectionConfig, DatabaseMetadata, DriverType, QueryResult,
    SchemaMetadata, SqlValidationResult, TableMetadata,
};

pub enum ManagedPool {
    Postgres(sqlx::PgPool),
    MySql(sqlx::MySqlPool),
    Sqlite(sqlx::SqlitePool),
}

pub struct DatabaseManager {
    pools: Arc<RwLock<HashMap<String, (ConnectionConfig, ManagedPool)>>>,
}

impl DatabaseManager {
    pub fn new() -> Self {
        Self {
            pools: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    pub async fn connect(&self, config: ConnectionConfig) -> Result<String, String> {
        let pool = match config.driver {
            DriverType::Sqlite => {
                let path = config.file_path.clone().unwrap_or_else(|| ":memory:".to_string());
                let url = if path == ":memory:" {
                    "sqlite::memory:".to_string()
                } else {
                    format!("sqlite://{}", path)
                };

                let pool = sqlx::sqlite::SqlitePoolOptions::new()
                    .max_connections(5)
                    .connect(&url)
                    .await
                    .map_err(|e| format!("Error connecting to SQLite: {}", e))?;

                ManagedPool::Sqlite(pool)
            }
            DriverType::Postgres => {
                let host = config.host.as_deref().unwrap_or("localhost");
                let port = config.port.unwrap_or(5432);
                let user = config.username.as_deref().unwrap_or("postgres");
                let password = config.password.as_deref().unwrap_or("");
                let db = config.database.as_deref().unwrap_or("postgres");
                let ssl = config.ssl_mode.as_deref().unwrap_or("prefer");

                let url = format!(
                    "postgres://{}:{}@{}:{}/{}?sslmode={}",
                    urlencoding(user),
                    urlencoding(password),
                    host,
                    port,
                    db,
                    ssl
                );

                let pool = sqlx::postgres::PgPoolOptions::new()
                    .max_connections(5)
                    .connect(&url)
                    .await
                    .map_err(|e| format!("Error connecting to PostgreSQL: {}", e))?;

                ManagedPool::Postgres(pool)
            }
            DriverType::MySql => {
                let host = config.host.as_deref().unwrap_or("localhost");
                let port = config.port.unwrap_or(3306);
                let user = config.username.as_deref().unwrap_or("root");
                let password = config.password.as_deref().unwrap_or("");
                let db = config.database.as_deref().unwrap_or("").trim();

                let url = if db.is_empty() {
                    format!(
                        "mysql://{}:{}@{}:{}",
                        urlencoding(user),
                        urlencoding(password),
                        host,
                        port
                    )
                } else {
                    format!(
                        "mysql://{}:{}@{}:{}/{}",
                        urlencoding(user),
                        urlencoding(password),
                        host,
                        port,
                        db
                    )
                };

                let pool = sqlx::mysql::MySqlPoolOptions::new()
                    .max_connections(5)
                    .connect(&url)
                    .await
                    .map_err(|e| format!("Error connecting to MySQL: {}", e))?;

                ManagedPool::MySql(pool)
            }
        };

        let mut pools = self.pools.write().await;
        let id = config.id.clone();
        pools.insert(id.clone(), (config, pool));
        Ok(id)
    }

    pub async fn disconnect(&self, id: &str) -> Result<(), String> {
        let mut pools = self.pools.write().await;
        if pools.remove(id).is_some() {
            Ok(())
        } else {
            Err("Connection not found".to_string())
        }
    }

    pub async fn is_connected(&self, id: &str) -> bool {
        let pools = self.pools.read().await;
        pools.contains_key(id)
    }

    pub async fn get_schema_metadata(&self, id: &str) -> Result<DatabaseMetadata, String> {
        let pools = self.pools.read().await;
        let (config, managed_pool) = pools.get(id).ok_or("Connection not found")?;

        match managed_pool {
            ManagedPool::Sqlite(pool) => {
                let rows = sqlx::query(
                    "SELECT name, type FROM sqlite_master WHERE type IN ('table', 'view') AND name NOT LIKE 'sqlite_%' ORDER BY name"
                )
                .fetch_all(pool)
                .await
                .map_err(|e| e.to_string())?;

                let mut tables = Vec::new();
                for row in rows {
                    let table_name: String = row.try_get(0).unwrap_or_default();
                    let table_type: String = row.try_get(1).unwrap_or_else(|_| "table".to_string()).to_uppercase();

                    // Get column metadata using PRAGMA
                    let col_rows = sqlx::query(&format!("PRAGMA table_info('{}')", table_name))
                        .fetch_all(pool)
                        .await
                        .unwrap_or_default();

                    let columns = col_rows
                        .into_iter()
                        .map(|col| {
                            let name: String = col.try_get("name").unwrap_or_default();
                            let data_type: String = col.try_get("type").unwrap_or_default();
                            let not_null: i64 = col.try_get("notnull").unwrap_or(0);
                            let pk: i64 = col.try_get("pk").unwrap_or(0);
                            ColumnMetadata {
                                name,
                                data_type,
                                is_nullable: not_null == 0,
                                is_primary_key: pk > 0,
                            }
                        })
                        .collect();

                    let count_val: Option<i64> = if table_type == "TABLE" {
                        sqlx::query_scalar(&format!("SELECT COUNT(*) FROM \"{}\"", table_name.replace('"', "\"\"")))
                            .fetch_one(pool)
                            .await
                            .ok()
                    } else {
                        None
                    };

                    tables.push(TableMetadata {
                        name: table_name,
                        schema: Some("main".to_string()),
                        table_type,
                        columns,
                        row_count_estimate: count_val,
                    });
                }

                Ok(DatabaseMetadata {
                    database_name: config.name.clone(),
                    schemas: vec![SchemaMetadata {
                        name: "main".to_string(),
                        tables,
                    }],
                })
            }
            ManagedPool::Postgres(pool) => {
                let db_name = config.database.clone().unwrap_or_else(|| "postgres".to_string());

                // 1. Fetch tables and views
                let table_rows = sqlx::query(
                    r#"
                    SELECT table_schema, table_name, table_type
                    FROM information_schema.tables
                    WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
                    ORDER BY table_schema, table_name
                    "#
                )
                .fetch_all(pool)
                .await
                .map_err(|e| format!("Error en introspección de tablas PostgreSQL: {}", e))?;

                // 2. Fetch row count estimates from pg_class reltuples
                let row_count_query = r#"
                    SELECT 
                        n.nspname AS table_schema,
                        c.relname AS table_name,
                        GREATEST(c.reltuples::bigint, 0) AS row_estimate
                    FROM pg_class c
                    JOIN pg_namespace n ON n.oid = c.relnamespace
                    WHERE c.relkind IN ('r', 'p', 'm', 'v')
                      AND n.nspname NOT IN ('pg_catalog', 'information_schema')
                "#;
                let mut row_count_map: HashMap<(String, String), i64> = HashMap::new();
                if let Ok(count_rows) = sqlx::query(row_count_query).fetch_all(pool).await {
                    for crow in count_rows {
                        let schema: String = crow.try_get(0).unwrap_or_default();
                        let name: String = crow.try_get(1).unwrap_or_default();
                        let count: i64 = crow.try_get(2).unwrap_or(0);
                        row_count_map.insert((schema, name), count);
                    }
                }

                // 3. Batch query all columns with primary key detection
                let col_query = r#"
                    SELECT 
                        c.table_schema,
                        c.table_name,
                        c.column_name,
                        c.data_type,
                        c.is_nullable,
                        CASE WHEN pk.column_name IS NOT NULL THEN true ELSE false END AS is_primary_key
                    FROM information_schema.columns c
                    LEFT JOIN (
                        SELECT 
                            kcu.table_schema,
                            kcu.table_name,
                            kcu.column_name
                        FROM information_schema.table_constraints tc
                        JOIN information_schema.key_column_usage kcu
                            ON tc.constraint_name = kcu.constraint_name
                            AND tc.table_schema = kcu.table_schema
                        WHERE tc.constraint_type = 'PRIMARY KEY'
                    ) pk 
                    ON c.table_schema = pk.table_schema 
                    AND c.table_name = pk.table_name 
                    AND c.column_name = pk.column_name
                    WHERE c.table_schema NOT IN ('pg_catalog', 'information_schema')
                    ORDER BY c.table_schema, c.table_name, c.ordinal_position
                "#;

                let col_rows = sqlx::query(col_query)
                    .fetch_all(pool)
                    .await
                    .unwrap_or_default();

                let mut col_map: HashMap<(String, String), Vec<ColumnMetadata>> = HashMap::new();
                for crow in col_rows {
                    let schema: String = crow.try_get(0).unwrap_or_default();
                    let tname: String = crow.try_get(1).unwrap_or_default();
                    let cname: String = crow.try_get(2).unwrap_or_default();
                    let dtype: String = crow.try_get(3).unwrap_or_default();
                    let is_null_str: String = crow.try_get(4).unwrap_or_default();
                    let is_pk: bool = crow.try_get(5).unwrap_or(false);

                    col_map.entry((schema, tname)).or_default().push(ColumnMetadata {
                        name: cname,
                        data_type: dtype,
                        is_nullable: is_null_str.eq_ignore_ascii_case("YES"),
                        is_primary_key: is_pk,
                    });
                }

                let mut schema_map: HashMap<String, Vec<TableMetadata>> = HashMap::new();
                for trow in table_rows {
                    let schema: String = trow.try_get(0).unwrap_or_default();
                    let name: String = trow.try_get(1).unwrap_or_default();
                    let ttype: String = trow.try_get(2).unwrap_or_else(|_| "BASE TABLE".to_string());
                    let count_val = row_count_map.get(&(schema.clone(), name.clone())).copied();

                    let cols = col_map.remove(&(schema.clone(), name.clone())).unwrap_or_default();

                    schema_map
                        .entry(schema.clone())
                        .or_default()
                        .push(TableMetadata {
                            name,
                            schema: Some(schema),
                            table_type: ttype,
                            columns: cols,
                            row_count_estimate: count_val,
                        });
                }

                // Discover schemas that have 0 tables
                let schemata_query = "SELECT schema_name FROM information_schema.schemata WHERE schema_name NOT IN ('pg_catalog', 'information_schema', 'pg_toast') ORDER BY schema_name";
                if let Ok(s_rows) = sqlx::query(schemata_query).fetch_all(pool).await {
                    for srow in s_rows {
                        let sname: String = srow.try_get(0).unwrap_or_default();
                        if !sname.is_empty() {
                            schema_map.entry(sname).or_default();
                        }
                    }
                }

                let mut schemas: Vec<SchemaMetadata> = schema_map
                    .into_iter()
                    .map(|(name, tables)| SchemaMetadata { name, tables })
                    .collect();

                schemas.sort_by(|a, b| a.name.cmp(&b.name));

                Ok(DatabaseMetadata {
                    database_name: db_name,
                    schemas,
                })
            }
            ManagedPool::MySql(pool) => {
                let db_name = match &config.database {
                    Some(d) if !d.trim().is_empty() => d.trim().to_string(),
                    _ => config.name.clone(),
                };

                // Filter by database if specified by the user!
                // If user connected to marketplace_db, ONLY fetch marketplace_db!
                // If user left database empty, fetch ALL user databases (excluding internal MySQL schemas).
                let (schema_filter, schemata_filter) = match &config.database {
                    Some(d) if !d.trim().is_empty() => {
                        let escaped = d.trim().replace('\'', "''");
                        (
                            format!("AND TABLE_SCHEMA = '{}'", escaped),
                            format!("AND SCHEMA_NAME = '{}'", escaped),
                        )
                    }
                    _ => (
                        "".to_string(),
                        "".to_string(),
                    ),
                };

                // 1. Fetch tables
                let table_query = format!(
                    r#"
                    SELECT 
                        TABLE_SCHEMA, 
                        TABLE_NAME, 
                        TABLE_TYPE, 
                        COALESCE(TABLE_ROWS, 0)
                    FROM information_schema.tables
                    WHERE TABLE_SCHEMA NOT IN ('information_schema', 'performance_schema', 'mysql', 'sys') {}
                    ORDER BY TABLE_SCHEMA, TABLE_NAME
                    "#,
                    schema_filter
                );

                let table_rows = sqlx::query(&table_query)
                    .fetch_all(pool)
                    .await
                    .map_err(|e| format!("Error en introspección de tablas MySQL: {}", e))?;

                // 2. Fetch columns in batch
                let col_query = format!(
                    r#"
                    SELECT 
                        TABLE_SCHEMA, 
                        TABLE_NAME, 
                        COLUMN_NAME, 
                        DATA_TYPE, 
                        IS_NULLABLE, 
                        COLUMN_KEY
                    FROM information_schema.columns
                    WHERE TABLE_SCHEMA NOT IN ('information_schema', 'performance_schema', 'mysql', 'sys') {}
                    ORDER BY TABLE_SCHEMA, TABLE_NAME, ORDINAL_POSITION
                    "#,
                    schema_filter
                );

                let col_rows = sqlx::query(&col_query)
                    .fetch_all(pool)
                    .await
                    .unwrap_or_default();

                let mut col_map: HashMap<(String, String), Vec<ColumnMetadata>> = HashMap::new();
                for crow in col_rows {
                    // Extract by index: 100% immune to case-sensitivity differences!
                    let schema: String = crow.try_get(0).unwrap_or_default();
                    let tname: String = crow.try_get(1).unwrap_or_default();
                    let cname: String = crow.try_get(2).unwrap_or_default();
                    let dtype: String = crow.try_get(3).unwrap_or_default();
                    let is_null_str: String = crow.try_get(4).unwrap_or_default();
                    let ckey: String = crow.try_get(5).unwrap_or_default();

                    col_map.entry((schema, tname)).or_default().push(ColumnMetadata {
                        name: cname,
                        data_type: dtype,
                        is_nullable: is_null_str.eq_ignore_ascii_case("YES"),
                        is_primary_key: ckey.eq_ignore_ascii_case("PRI"),
                    });
                }

                let mut schema_map: HashMap<String, Vec<TableMetadata>> = HashMap::new();
                for trow in table_rows {
                    // Extract by index!
                    let schema: String = trow.try_get(0).unwrap_or_default();
                    let name: String = trow.try_get(1).unwrap_or_default();
                    let ttype: String = trow.try_get(2).unwrap_or_else(|_| "BASE TABLE".to_string());
                    let row_count: i64 = trow
                        .try_get::<i64, _>(3)
                        .or_else(|_| trow.try_get::<u64, _>(3).map(|v| v as i64))
                        .unwrap_or(0);

                    let cols = col_map.remove(&(schema.clone(), name.clone())).unwrap_or_default();

                    schema_map.entry(schema.clone()).or_default().push(TableMetadata {
                        name,
                        schema: Some(schema),
                        table_type: ttype,
                        columns: cols,
                        row_count_estimate: Some(row_count),
                    });
                }

                // If user specified database, make sure that database exists in schema_map even if it has 0 tables!
                if let Some(ref d) = config.database {
                    if !d.trim().is_empty() {
                        schema_map.entry(d.trim().to_string()).or_default();
                    }
                }

                // Also discover schemas that currently have 0 tables
                let schemata_query = format!(
                    "SELECT SCHEMA_NAME FROM information_schema.schemata WHERE SCHEMA_NAME NOT IN ('information_schema', 'performance_schema', 'mysql', 'sys') {} ORDER BY SCHEMA_NAME",
                    schemata_filter
                );
                if let Ok(s_rows) = sqlx::query(&schemata_query).fetch_all(pool).await {
                    for srow in s_rows {
                        let sname: String = srow.try_get(0).unwrap_or_default();
                        if !sname.is_empty() {
                            schema_map.entry(sname).or_default();
                        }
                    }
                }

                let mut schemas: Vec<SchemaMetadata> = schema_map
                    .into_iter()
                    .map(|(name, tables)| SchemaMetadata { name, tables })
                    .collect();

                schemas.sort_by(|a, b| a.name.cmp(&b.name));

                Ok(DatabaseMetadata {
                    database_name: db_name,
                    schemas,
                })
            }
        }
    }

    pub async fn execute_query(&self, id: &str, sql: &str) -> Result<QueryResult, String> {
        let pools = self.pools.read().await;
        let (_, managed_pool) = pools.get(id).ok_or("Connection not found")?;

        let start = Instant::now();
        let is_mutation = is_mutation_query(sql);

        match managed_pool {
            ManagedPool::Sqlite(pool) => {
                if is_mutation {
                    let res = sqlx::query(sql)
                        .execute(pool)
                        .await
                        .map_err(|e| e.to_string())?;

                    let duration = start.elapsed().as_millis() as u64;
                    return Ok(QueryResult {
                        columns: Vec::new(),
                        rows: Vec::new(),
                        execution_time_ms: duration,
                        rows_affected: res.rows_affected(),
                    });
                }

                let rows = sqlx::query(sql)
                    .fetch_all(pool)
                    .await
                    .map_err(|e| e.to_string())?;

                let duration = start.elapsed().as_millis() as u64;

                if rows.is_empty() {
                    return Ok(QueryResult {
                        columns: Vec::new(),
                        rows: Vec::new(),
                        execution_time_ms: duration,
                        rows_affected: 0,
                    });
                }

                let first = &rows[0];
                let columns: Vec<ColumnInfo> = first
                    .columns()
                    .iter()
                    .map(|c| ColumnInfo {
                        name: c.name().to_string(),
                        data_type: c.type_info().name().to_string(),
                    })
                    .collect();

                let mut result_rows = Vec::with_capacity(rows.len());
                for row in &rows {
                    let mut row_vals = Vec::with_capacity(columns.len());
                    for (i, _) in columns.iter().enumerate() {
                        let val = extract_sqlite_value(row, i);
                        row_vals.push(val);
                    }
                    result_rows.push(row_vals);
                }

                let row_count = rows.len() as u64;
                Ok(QueryResult {
                    columns,
                    rows: result_rows,
                    execution_time_ms: duration,
                    rows_affected: row_count,
                })
            }
            ManagedPool::Postgres(pool) => {
                if is_mutation {
                    let res = sqlx::query(sql)
                        .execute(pool)
                        .await
                        .map_err(|e| e.to_string())?;

                    let duration = start.elapsed().as_millis() as u64;
                    return Ok(QueryResult {
                        columns: Vec::new(),
                        rows: Vec::new(),
                        execution_time_ms: duration,
                        rows_affected: res.rows_affected(),
                    });
                }

                let rows = sqlx::query(sql)
                    .fetch_all(pool)
                    .await
                    .map_err(|e| e.to_string())?;

                let duration = start.elapsed().as_millis() as u64;

                if rows.is_empty() {
                    return Ok(QueryResult {
                        columns: Vec::new(),
                        rows: Vec::new(),
                        execution_time_ms: duration,
                        rows_affected: 0,
                    });
                }

                let first = &rows[0];
                let columns: Vec<ColumnInfo> = first
                    .columns()
                    .iter()
                    .map(|c| ColumnInfo {
                        name: c.name().to_string(),
                        data_type: c.type_info().name().to_string(),
                    })
                    .collect();

                let mut result_rows = Vec::with_capacity(rows.len());
                for row in &rows {
                    let mut row_vals = Vec::with_capacity(columns.len());
                    for (i, _) in columns.iter().enumerate() {
                        let val = extract_pg_value(row, i);
                        row_vals.push(val);
                    }
                    result_rows.push(row_vals);
                }

                let row_count = rows.len() as u64;
                Ok(QueryResult {
                    columns,
                    rows: result_rows,
                    execution_time_ms: duration,
                    rows_affected: row_count,
                })
            }
            ManagedPool::MySql(pool) => {
                if is_mutation {
                    let res = sqlx::query(sql)
                        .execute(pool)
                        .await
                        .map_err(|e| e.to_string())?;

                    let duration = start.elapsed().as_millis() as u64;
                    return Ok(QueryResult {
                        columns: Vec::new(),
                        rows: Vec::new(),
                        execution_time_ms: duration,
                        rows_affected: res.rows_affected(),
                    });
                }

                let rows = sqlx::query(sql)
                    .fetch_all(pool)
                    .await
                    .map_err(|e| e.to_string())?;

                let duration = start.elapsed().as_millis() as u64;

                if rows.is_empty() {
                    return Ok(QueryResult {
                        columns: Vec::new(),
                        rows: Vec::new(),
                        execution_time_ms: duration,
                        rows_affected: 0,
                    });
                }

                let first = &rows[0];
                let columns: Vec<ColumnInfo> = first
                    .columns()
                    .iter()
                    .map(|c| ColumnInfo {
                        name: c.name().to_string(),
                        data_type: c.type_info().name().to_string(),
                    })
                    .collect();

                let mut result_rows = Vec::with_capacity(rows.len());
                for row in &rows {
                    let mut row_vals = Vec::with_capacity(columns.len());
                    for (i, _) in columns.iter().enumerate() {
                        let val = extract_mysql_value(row, i);
                        row_vals.push(val);
                    }
                    result_rows.push(row_vals);
                }

                let row_count = rows.len() as u64;
                Ok(QueryResult {
                    columns,
                    rows: result_rows,
                    execution_time_ms: duration,
                    rows_affected: row_count,
                })
            }
        }
    }

    pub fn validate_sql(&self, sql: &str, driver: &DriverType) -> SqlValidationResult {
        let dialect: Box<dyn sqlparser::dialect::Dialect> = match driver {
            DriverType::Postgres => Box::new(PostgreSqlDialect {}),
            DriverType::MySql => Box::new(MySqlDialect {}),
            DriverType::Sqlite => Box::new(SQLiteDialect {}),
        };

        match Parser::parse_sql(dialect.as_ref(), sql) {
            Ok(ast) => {
                let mut tables = Vec::new();
                for stmt in &ast {
                    if let sqlparser::ast::Statement::Query(query) = stmt {
                        if let sqlparser::ast::SetExpr::Select(select) = &*query.body {
                            for table in &select.from {
                                tables.push(table.relation.to_string());
                            }
                        }
                    }
                }
                SqlValidationResult {
                    is_valid: true,
                    statements_count: ast.len(),
                    tables_referenced: tables,
                    error: None,
                }
            }
            Err(e) => SqlValidationResult {
                is_valid: false,
                statements_count: 0,
                tables_referenced: Vec::new(),
                error: Some(e.to_string()),
            },
        }
    }
}

fn urlencoding(input: &str) -> String {
    url::form_urlencoded::byte_serialize(input.as_bytes()).collect()
}

fn is_mutation_query(sql: &str) -> bool {
    let mut cleaned = sql.trim();
    // Strip leading comments
    loop {
        if cleaned.starts_with("--") {
            if let Some(pos) = cleaned.find('\n') {
                cleaned = cleaned[pos + 1..].trim();
                continue;
            } else {
                return false;
            }
        }
        if cleaned.starts_with("/*") {
            if let Some(pos) = cleaned.find("*/") {
                cleaned = cleaned[pos + 2..].trim();
                continue;
            } else {
                return false;
            }
        }
        break;
    }

    let first_word = cleaned
        .split_whitespace()
        .next()
        .unwrap_or("")
        .to_uppercase();

    // Check if it's a DDL / DML mutation statement
    let is_mutation_verb = matches!(
        first_word.as_str(),
        "INSERT"
            | "UPDATE"
            | "DELETE"
            | "CREATE"
            | "DROP"
            | "ALTER"
            | "TRUNCATE"
            | "RENAME"
            | "SET"
            | "USE"
            | "GRANT"
            | "REVOKE"
            | "BEGIN"
            | "COMMIT"
            | "ROLLBACK"
            | "START"
            | "SAVEPOINT"
            | "VACUUM"
            | "REPLACE"
    );

    if !is_mutation_verb {
        return false;
    }

    // If it has RETURNING, it produces a result set (rows) like a query!
    let lower = cleaned.to_lowercase();
    let has_returning = lower.split_whitespace().any(|w| w == "returning");
    if has_returning {
        return false;
    }

    true
}

fn extract_sqlite_value(row: &sqlx::sqlite::SqliteRow, index: usize) -> serde_json::Value {
    if let Ok(v) = row.try_get::<i64, _>(index) {
        return serde_json::Value::Number(v.into());
    }
    if let Ok(v) = row.try_get::<i32, _>(index) {
        return serde_json::Value::Number(v.into());
    }
    if let Ok(v) = row.try_get::<f64, _>(index) {
        if let Some(num) = serde_json::Number::from_f64(v) {
            return serde_json::Value::Number(num);
        }
    }
    if let Ok(v) = row.try_get::<bool, _>(index) {
        return serde_json::Value::Bool(v);
    }
    if let Ok(dt) = row.try_get::<chrono::DateTime<chrono::Utc>, _>(index) {
        return serde_json::Value::String(dt.to_rfc3339());
    }
    if let Ok(ndt) = row.try_get::<chrono::NaiveDateTime, _>(index) {
        return serde_json::Value::String(ndt.to_string());
    }
    if let Ok(nd) = row.try_get::<chrono::NaiveDate, _>(index) {
        return serde_json::Value::String(nd.to_string());
    }
    if let Ok(json_val) = row.try_get::<serde_json::Value, _>(index) {
        return json_val;
    }
    if let Ok(v) = row.try_get::<String, _>(index) {
        return serde_json::Value::String(v);
    }
    if let Ok(v) = row.try_get::<Vec<u8>, _>(index) {
        if let Ok(s) = String::from_utf8(v.clone()) {
            return serde_json::Value::String(s);
        }
        let hex_str: String = v.iter().map(|b| format!("{:02x}", b)).collect();
        return serde_json::Value::String(format!("X'{}'", hex_str));
    }
    serde_json::Value::Null
}

fn extract_pg_value(row: &sqlx::postgres::PgRow, index: usize) -> serde_json::Value {
    // 1. Integers
    if let Ok(v) = row.try_get::<i64, _>(index) {
        return serde_json::Value::Number(v.into());
    }
    if let Ok(v) = row.try_get::<i32, _>(index) {
        return serde_json::Value::Number(v.into());
    }
    if let Ok(v) = row.try_get::<i16, _>(index) {
        return serde_json::Value::Number(v.into());
    }

    // 2. Floats
    if let Ok(v) = row.try_get::<f64, _>(index) {
        if let Some(num) = serde_json::Number::from_f64(v) {
            return serde_json::Value::Number(num);
        }
    }
    if let Ok(v) = row.try_get::<f32, _>(index) {
        if let Some(num) = serde_json::Number::from_f64(v as f64) {
            return serde_json::Value::Number(num);
        }
    }

    // 3. Decimals (NUMERIC / DECIMAL)
    if let Ok(d) = row.try_get::<rust_decimal::Decimal, _>(index) {
        return serde_json::Value::String(d.to_string());
    }

    // 4. Booleans
    if let Ok(v) = row.try_get::<bool, _>(index) {
        return serde_json::Value::Bool(v);
    }

    // 5. UUID
    if let Ok(u) = row.try_get::<uuid::Uuid, _>(index) {
        return serde_json::Value::String(u.to_string());
    }

    // 6. Dates and Timestamps
    if let Ok(dt) = row.try_get::<chrono::DateTime<chrono::Utc>, _>(index) {
        return serde_json::Value::String(dt.to_rfc3339());
    }
    if let Ok(dt) = row.try_get::<chrono::DateTime<chrono::FixedOffset>, _>(index) {
        return serde_json::Value::String(dt.to_rfc3339());
    }
    if let Ok(ndt) = row.try_get::<chrono::NaiveDateTime, _>(index) {
        return serde_json::Value::String(ndt.to_string());
    }
    if let Ok(nd) = row.try_get::<chrono::NaiveDate, _>(index) {
        return serde_json::Value::String(nd.to_string());
    }
    if let Ok(nt) = row.try_get::<chrono::NaiveTime, _>(index) {
        return serde_json::Value::String(nt.to_string());
    }

    // 7. JSON / JSONB
    if let Ok(json_val) = row.try_get::<serde_json::Value, _>(index) {
        return json_val;
    }

    // 8. Strings
    if let Ok(v) = row.try_get::<String, _>(index) {
        return serde_json::Value::String(v);
    }

    // 9. Binary / BYTEA
    if let Ok(v) = row.try_get::<Vec<u8>, _>(index) {
        if let Ok(s) = String::from_utf8(v.clone()) {
            return serde_json::Value::String(s);
        }
        let hex_str: String = v.iter().map(|b| format!("{:02x}", b)).collect();
        return serde_json::Value::String(format!("\\x{}", hex_str));
    }

    // 10. Arrays
    if let Ok(arr) = row.try_get::<Vec<String>, _>(index) {
        return serde_json::json!(arr);
    }
    if let Ok(arr) = row.try_get::<Vec<i64>, _>(index) {
        return serde_json::json!(arr);
    }
    if let Ok(arr) = row.try_get::<Vec<i32>, _>(index) {
        return serde_json::json!(arr);
    }
    if let Ok(arr) = row.try_get::<Vec<f64>, _>(index) {
        return serde_json::json!(arr);
    }
    if let Ok(arr) = row.try_get::<Vec<bool>, _>(index) {
        return serde_json::json!(arr);
    }

    serde_json::Value::Null
}

fn extract_mysql_value(row: &sqlx::mysql::MySqlRow, index: usize) -> serde_json::Value {
    // 1. Integers
    if let Ok(v) = row.try_get::<i64, _>(index) {
        return serde_json::Value::Number(v.into());
    }
    if let Ok(v) = row.try_get::<u64, _>(index) {
        return serde_json::Value::Number(v.into());
    }
    if let Ok(v) = row.try_get::<i32, _>(index) {
        return serde_json::Value::Number(v.into());
    }
    if let Ok(v) = row.try_get::<u32, _>(index) {
        return serde_json::Value::Number(v.into());
    }
    if let Ok(v) = row.try_get::<i16, _>(index) {
        return serde_json::Value::Number(v.into());
    }
    if let Ok(v) = row.try_get::<u16, _>(index) {
        return serde_json::Value::Number(v.into());
    }
    if let Ok(v) = row.try_get::<i8, _>(index) {
        return serde_json::Value::Number(v.into());
    }
    if let Ok(v) = row.try_get::<u8, _>(index) {
        return serde_json::Value::Number(v.into());
    }

    // 2. Floats
    if let Ok(v) = row.try_get::<f64, _>(index) {
        if let Some(num) = serde_json::Number::from_f64(v) {
            return serde_json::Value::Number(num);
        }
    }
    if let Ok(v) = row.try_get::<f32, _>(index) {
        if let Some(num) = serde_json::Number::from_f64(v as f64) {
            return serde_json::Value::Number(num);
        }
    }

    // 3. Decimals (DECIMAL / NUMERIC)
    if let Ok(d) = row.try_get::<rust_decimal::Decimal, _>(index) {
        return serde_json::Value::String(d.to_string());
    }

    // 4. Booleans
    if let Ok(v) = row.try_get::<bool, _>(index) {
        return serde_json::Value::Bool(v);
    }

    // 5. Dates and Timestamps
    if let Ok(dt) = row.try_get::<chrono::DateTime<chrono::Utc>, _>(index) {
        return serde_json::Value::String(dt.to_rfc3339());
    }
    if let Ok(v) = row.try_get::<chrono::NaiveDateTime, _>(index) {
        return serde_json::Value::String(v.to_string());
    }
    if let Ok(v) = row.try_get::<chrono::NaiveDate, _>(index) {
        return serde_json::Value::String(v.to_string());
    }
    if let Ok(v) = row.try_get::<chrono::NaiveTime, _>(index) {
        return serde_json::Value::String(v.to_string());
    }

    // 6. JSON
    if let Ok(json_val) = row.try_get::<serde_json::Value, _>(index) {
        return json_val;
    }

    // 7. Strings
    if let Ok(v) = row.try_get::<String, _>(index) {
        return serde_json::Value::String(v);
    }

    // 8. Binary / BLOB
    if let Ok(v) = row.try_get::<Vec<u8>, _>(index) {
        if let Ok(s) = String::from_utf8(v.clone()) {
            return serde_json::Value::String(s);
        }
        let hex_str: String = v.iter().map(|b| format!("{:02x}", b)).collect();
        return serde_json::Value::String(format!("0x{}", hex_str));
    }

    serde_json::Value::Null
}
