/**
 * PostgreSQL 真实适配器
 * 连接外部 PostgreSQL 数据库执行查询
 */

import { Pool, PoolClient, QueryResult as PgQueryResult } from 'pg';
import {
  DatabasePort,
  QueryResult,
  FieldInfo,
  ConnectionConfig,
  SchemaInfo,
  TableInfo,
  ColumnInfo,
  IndexInfo,
} from '@/shared/ports/DatabasePort';

export class PostgresAdapter implements DatabasePort {
  private pool: Pool;
  private config: ConnectionConfig;

  constructor(config: ConnectionConfig) {
    this.config = config;
    this.pool = new Pool({
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.user,
      password: config.password,
      ssl: config.ssl ? { rejectUnauthorized: false } : false,
      connectionTimeoutMillis: config.connectionTimeout || 5000,
      max: 10, // 最大连接数
      idleTimeoutMillis: 30000,
    });
  }

  async query(sql: string, params?: any[]): Promise<QueryResult> {
    const startTime = Date.now();
    let client: PoolClient | null = null;

    try {
      client = await this.pool.connect();
      const result: PgQueryResult = await client.query(sql, params);
      const executionTime = Date.now() - startTime;

      return {
        rows: result.rows,
        fields: this.mapFields(result.fields),
        rowCount: result.rowCount || 0,
        executionTime,
      };
    } catch (error) {
      console.error('PostgreSQL 查询错误:', error);
      throw new Error(`数据库查询失败: ${(error as Error).message}`);
    } finally {
      if (client) {
        client.release();
      }
    }
  }

  async getSchema(): Promise<SchemaInfo> {
    try {
      // 获取所有表信息
      const tablesQuery = `
        SELECT
          table_schema,
          table_name,
          (SELECT COUNT(*) FROM information_schema.columns
           WHERE table_schema = t.table_schema AND table_name = t.table_name) as column_count
        FROM information_schema.tables t
        WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
        ORDER BY table_schema, table_name;
      `;

      const tablesResult = await this.query(tablesQuery);
      const tables: TableInfo[] = [];

      for (const tableRow of tablesResult.rows) {
        const schema = tableRow.table_schema;
        const tableName = tableRow.table_name;

        // 获取列信息
        const columns = await this.getTableColumns(schema, tableName);

        // 获取索引信息
        const indexes = await this.getTableIndexes(schema, tableName);

        tables.push({
          name: tableName,
          schema,
          columns,
          indexes,
        });
      }

      return {
        tables,
        version: await this.getDatabaseVersion(),
      };
    } catch (error) {
      console.error('获取 Schema 失败:', error);
      throw new Error(`获取数据库结构失败: ${(error as Error).message}`);
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const result = await this.query('SELECT 1 AS test');
      return result.rows.length === 1 && result.rows[0].test === 1;
    } catch (error) {
      console.error('数据库连接测试失败:', error);
      return false;
    }
  }

  async close(): Promise<void> {
    try {
      await this.pool.end();
    } catch (error) {
      console.error('关闭数据库连接池失败:', error);
      throw error;
    }
  }

  private mapFields(fields: any[]): FieldInfo[] {
    return fields.map((field) => ({
      name: field.name,
      type: this.mapPostgresType(field.dataTypeID),
      tableID: field.tableID,
      columnID: field.columnID,
    }));
  }

  private mapPostgresType(typeId: number): string {
    // PostgreSQL OID 类型映射
    const typeMap: Record<number, string> = {
      16: 'boolean',
      20: 'bigint',
      21: 'smallint',
      23: 'integer',
      25: 'text',
      1043: 'varchar',
      1082: 'date',
      1114: 'timestamp',
      1184: 'timestamptz',
      701: 'float8',
      700: 'float4',
      1700: 'numeric',
    };
    return typeMap[typeId] || 'unknown';
  }

  private async getTableColumns(
    schema: string,
    tableName: string
  ): Promise<ColumnInfo[]> {
    const columnsQuery = `
      SELECT
        c.column_name,
        c.data_type,
        c.is_nullable,
        c.column_default,
        CASE WHEN pk.column_name IS NOT NULL THEN true ELSE false END as is_primary_key,
        CASE WHEN fk.column_name IS NOT NULL THEN true ELSE false END as is_foreign_key
      FROM information_schema.columns c
      LEFT JOIN (
        SELECT ku.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage ku
          ON tc.constraint_name = ku.constraint_name
        WHERE tc.constraint_type = 'PRIMARY KEY'
          AND tc.table_schema = $1
          AND tc.table_name = $2
      ) pk ON c.column_name = pk.column_name
      LEFT JOIN (
        SELECT ku.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage ku
          ON tc.constraint_name = ku.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_schema = $1
          AND tc.table_name = $2
      ) fk ON c.column_name = fk.column_name
      WHERE c.table_schema = $1
        AND c.table_name = $2
      ORDER BY c.ordinal_position;
    `;

    const result = await this.query(columnsQuery, [schema, tableName]);
    return result.rows.map((row) => ({
      name: row.column_name,
      type: row.data_type,
      nullable: row.is_nullable === 'YES',
      defaultValue: row.column_default,
      isPrimaryKey: row.is_primary_key,
      isForeignKey: row.is_foreign_key,
    }));
  }

  private async getTableIndexes(
    schema: string,
    tableName: string
  ): Promise<IndexInfo[]> {
    const indexesQuery = `
      SELECT
        i.relname as index_name,
        array_agg(a.attname ORDER BY a.attnum) as columns,
        ix.indisunique as is_unique
      FROM pg_class t
      JOIN pg_index ix ON t.oid = ix.indrelid
      JOIN pg_class i ON i.oid = ix.indexrelid
      JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
      JOIN pg_namespace n ON n.oid = t.relnamespace
      WHERE n.nspname = $1
        AND t.relname = $2
      GROUP BY i.relname, ix.indisunique;
    `;

    const result = await this.query(indexesQuery, [schema, tableName]);
    return result.rows.map((row) => ({
      name: row.index_name,
      columns: row.columns,
      unique: row.is_unique,
    }));
  }

  private async getDatabaseVersion(): Promise<string> {
    try {
      const result = await this.query('SELECT version()');
      return result.rows[0].version;
    } catch {
      return 'unknown';
    }
  }
}
