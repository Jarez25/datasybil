export type DriverType = 'postgres' | 'mysql' | 'sqlite';

export interface ConnectionConfig {
  id: string;
  name: string;
  driver: DriverType;
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  database?: string;
  file_path?: string;
  ssl_mode?: string;
}

export interface ColumnMetadata {
  name: string;
  data_type: string;
  is_nullable: boolean;
  is_primary_key: boolean;
}

export interface TableMetadata {
  name: string;
  schema?: string;
  table_type: string;
  columns: ColumnMetadata[];
  row_count_estimate?: number;
}

export interface SchemaMetadata {
  name: string;
  tables: TableMetadata[];
}

export interface DatabaseMetadata {
  database_name: string;
  schemas: SchemaMetadata[];
}

export interface ColumnInfo {
  name: string;
  data_type: string;
}

export interface QueryResult {
  columns: ColumnInfo[];
  rows: (string | number | boolean | null | object)[][];
  execution_time_ms: number;
  rows_affected: number;
}

export interface QueryTab {
  id: string;
  title: string;
  sql: string;
  connectionId: string | null;
  result: QueryResult | null;
  isExecuting: boolean;
  error: string | null;
}
