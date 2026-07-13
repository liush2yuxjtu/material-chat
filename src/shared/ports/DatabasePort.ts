/**
 * Database 数据库端口接口
 * 负责与外部 PostgreSQL 数据库交互，执行 SQL 查询
 */

export type QueryRow = Record<string, unknown>;

export interface QueryResult<Row extends QueryRow = QueryRow> {
  rows: Row[];
  fields: FieldInfo[];
  rowCount: number;
  executionTime: number; // 毫秒
}

export interface FieldInfo {
  name: string;
  type: string;
  tableID?: number;
  columnID?: number;
}

export interface ConnectionConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  ssl?: boolean;
  connectionTimeout?: number; // 毫秒
}

export interface DatabasePort {
  /**
   * 执行 SQL 查询（只读）
   * @param sql SQL 查询语句
   * @param params 参数化查询参数
   * @returns 查询结果
   */
  query<Row extends QueryRow = QueryRow>(
    sql: string,
    params?: unknown[],
  ): Promise<QueryResult<Row>>;

  /**
   * 获取数据库 Schema 信息
   * @returns Schema 结构信息
   */
  getSchema(): Promise<SchemaInfo>;

  /**
   * 测试数据库连接
   * @returns 连接是否可用
   */
  testConnection(): Promise<boolean>;

  /**
   * 关闭数据库连接
   */
  close(): Promise<void>;
}

export interface SchemaInfo {
  tables: TableInfo[];
  version?: string;
}

export interface TableInfo {
  name: string;
  schema: string;
  columns: ColumnInfo[];
  indexes: IndexInfo[];
  rowCount?: number;
}

export interface ColumnInfo {
  name: string;
  type: string;
  nullable: boolean;
  defaultValue?: string;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
}

export interface IndexInfo {
  name: string;
  columns: string[];
  unique: boolean;
}
