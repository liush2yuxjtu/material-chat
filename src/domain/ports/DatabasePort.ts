/**
 * 数据库端口接口
 * 定义数据库操作的抽象接口
 */

/**
 * 数据库连接配置
 */
export interface DatabaseConfig {
  /** 连接类型 */
  type: 'postgresql' | 'mysql';
  /** 主机地址 */
  host: string;
  /** 端口号 */
  port: number;
  /** 数据库名称 */
  database: string;
  /** 用户名（加密存储） */
  username: string;
  /** 密码（加密存储） */
  password: string;
  /** SSL 配置 */
  ssl?: boolean;
}

/**
 * 查询结果字段
 */
export interface QueryField {
  /** 字段名称 */
  name: string;
  /** 数据类型 */
  dataType?: string;
}

export type QueryRow = Record<string, unknown>;

/**
 * 查询结果
 */
export interface QueryResult<Row extends QueryRow = QueryRow> {
  /** 结果行数据 */
  rows: Row[];
  /** 影响的行数 */
  rowCount: number;
  /** 字段定义 */
  fields: QueryField[];
  /** 执行时间（毫秒） */
  executionTime?: number;
}

/**
 * 数据库端口接口
 */
export interface DatabasePort {
  /**
   * 测试数据库连接
   */
  testConnection(config: DatabaseConfig): Promise<boolean>;

  /**
   * 执行 SQL 查询
   */
  query<Row extends QueryRow = QueryRow>(
    sql: string,
    params?: unknown[],
  ): Promise<QueryResult<Row>>;

  /**
   * 获取数据库 Schema
   */
  getSchema(): Promise<SchemaInfo>;

  /**
   * 关闭连接
   */
  close(): Promise<void>;
}

/**
 * Schema 信息
 */
export interface SchemaInfo {
  databaseType: string;
  databaseName: string;
  tables: TableSchema[];
  version?: string;
  updatedAt?: Date;
}

/**
 * 表结构
 */
export interface TableSchema {
  name: string;
  comment?: string;
  columns: ColumnSchema[];
  primaryKeys: string[];
  foreignKeys?: ForeignKeySchema[];
}

/**
 * 列结构
 */
export interface ColumnSchema {
  name: string;
  dataType: string;
  nullable: boolean;
  defaultValue?: string;
  comment?: string;
}

/**
 * 外键定义
 */
export interface ForeignKeySchema {
  constraintName: string;
  columnName: string;
  referencedTable: string;
  referencedColumn: string;
}
