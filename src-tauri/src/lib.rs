pub mod db;
pub mod export;
pub mod models;
pub mod storage;

use db::DatabaseManager;
use models::{ColumnInfo, ConnectionConfig, DatabaseMetadata, DriverType, QueryResult, SqlValidationResult};
use serde_json::Value;
use tauri::{AppHandle, State};

#[tauri::command]
async fn get_saved_connections(app: AppHandle) -> Result<Vec<ConnectionConfig>, String> {
    storage::load_connections(&app).await
}

#[tauri::command]
async fn save_connection(app: AppHandle, config: ConnectionConfig) -> Result<(), String> {
    storage::save_connection(&app, config).await
}

#[tauri::command]
async fn delete_saved_connection(
    app: AppHandle,
    id: String,
    manager: State<'_, DatabaseManager>,
) -> Result<(), String> {
    let _ = manager.disconnect(&id).await;
    storage::delete_connection(&app, &id).await
}

#[tauri::command]
async fn is_connection_active(id: String, manager: State<'_, DatabaseManager>) -> Result<bool, String> {
    Ok(manager.is_connected(&id).await)
}

#[tauri::command]
async fn export_query_result(
    default_filename: String,
    format: String,
    columns: Vec<ColumnInfo>,
    rows: Vec<Vec<Value>>,
) -> Result<Option<String>, String> {
    export::export_results_dialog(&default_filename, &format, &columns, &rows).await
}

#[tauri::command]
async fn connect_db(
    config: ConnectionConfig,
    manager: State<'_, DatabaseManager>,
) -> Result<String, String> {
    manager.connect(config).await
}

#[tauri::command]
async fn disconnect_db(
    id: String,
    manager: State<'_, DatabaseManager>,
) -> Result<(), String> {
    manager.disconnect(&id).await
}

#[tauri::command]
async fn get_schema_metadata(
    id: String,
    manager: State<'_, DatabaseManager>,
) -> Result<DatabaseMetadata, String> {
    manager.get_schema_metadata(&id).await
}

#[tauri::command]
async fn execute_query(
    id: String,
    sql: String,
    manager: State<'_, DatabaseManager>,
) -> Result<QueryResult, String> {
    manager.execute_query(&id, &sql).await
}

#[tauri::command]
fn validate_sql(
    sql: String,
    driver: DriverType,
    manager: State<'_, DatabaseManager>,
) -> SqlValidationResult {
    manager.validate_sql(&sql, &driver)
}

#[tauri::command]
async fn create_demo_sqlite(manager: State<'_, DatabaseManager>) -> Result<String, String> {
    let id = "demo-sqlite".to_string();
    let config = ConnectionConfig {
        id: id.clone(),
        name: "Demo Store (SQLite)".to_string(),
        driver: DriverType::Sqlite,
        host: None,
        port: None,
        username: None,
        password: None,
        database: Some("demo.db".to_string()),
        file_path: Some(":memory:".to_string()),
        ssl_mode: None,
    };

    manager.connect(config).await?;

    // Populate with demo tables & data (E-commerce / Users / Orders / Products)
    let init_sql = r#"
        CREATE TABLE users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            role TEXT DEFAULT 'developer',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            category TEXT NOT NULL,
            price REAL NOT NULL,
            stock INTEGER DEFAULT 0
        );

        CREATE TABLE orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER REFERENCES users(id),
            product_id INTEGER REFERENCES products(id),
            quantity INTEGER NOT NULL,
            total_amount REAL NOT NULL,
            status TEXT DEFAULT 'completed',
            order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        INSERT INTO users (name, email, role) VALUES 
            ('Ada Lovelace', 'ada@computing.org', 'admin'),
            ('Alan Turing', 'alan@bletchley.ac.uk', 'developer'),
            ('Grace Hopper', 'grace@navy.mil', 'architect'),
            ('Linus Torvalds', 'linus@kernel.org', 'maintainer'),
            ('Margaret Hamilton', 'margaret@mit.edu', 'lead');

        INSERT INTO products (title, category, price, stock) VALUES
            ('Mechanical Keyboard Pro', 'Hardware', 149.99, 45),
            ('UltraWide 4K Monitor', 'Display', 599.00, 18),
            ('Ergonomic Mesh Chair', 'Furniture', 320.50, 12),
            ('USB-C 10Gbps Dock', 'Accessories', 89.90, 80),
            ('Noise-Canceling Headset', 'Audio', 199.99, 30);

        INSERT INTO orders (user_id, product_id, quantity, total_amount, status) VALUES
            (1, 1, 2, 299.98, 'completed'),
            (2, 2, 1, 599.00, 'completed'),
            (3, 4, 3, 269.70, 'processing'),
            (4, 1, 1, 149.99, 'completed'),
            (5, 5, 2, 399.98, 'completed');
    "#;

    for statement in init_sql.split(';') {
        let trimmed = statement.trim();
        if !trimmed.is_empty() {
            let _ = manager.execute_query(&id, trimmed).await?;
        }
    }

    Ok(id)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let db_manager = DatabaseManager::new();

    tauri::Builder::default()
        .manage(db_manager)
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            get_saved_connections,
            save_connection,
            delete_saved_connection,
            is_connection_active,
            connect_db,
            disconnect_db,
            get_schema_metadata,
            execute_query,
            validate_sql,
            create_demo_sqlite,
            export_query_result
        ])
        .run(tauri::generate_context!())
        .expect("error while running datasybil application");
}
