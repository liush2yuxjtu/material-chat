/**
 * Text-to-SQL 用例
 * 协调 LLM、数据库和安全校验，实现自然语言到 SQL 查询的完整流程
 */

import { DatabasePort, SchemaInfo } from '@/shared/ports/DatabasePort';
import { LLMPort, DatabaseSchema } from '@/shared/ports/LLMPort';
import { SqlSecurityValidator } from '@/shared/security/SqlSecurityValidator';

export interface QueryRequest {
  /** 用户的自然语言查询 */
  query: string;
  /** 用户 ID */
  userId: string;
  /** 是否自动执行 */
  autoExecute?: boolean;
}

export interface QueryResponse {
  /** 生成的 SQL 语句 */
  sql: string;
  /** SQL 解释说明 */
  explanation: string;
  /** 查询结果（如果已执行） */
  result?: {
    rows: any[];
    rowCount: number;
    executionTime: number;
  };
  /** 执行状态 */
  status: 'generated' | 'executed' | 'error';
  /** 错误信息 */
  error?: string;
}

export class TextToSqlUseCase {
  private securityValidator: SqlSecurityValidator;
  private schemaCache: SchemaInfo | null = null;
  private schemaCacheExpiry: Date | null = null;

  constructor(
    private databasePort: DatabasePort,
    private llmPort: LLMPort,
    private cacheExpiryMinutes: number = 60
  ) {
    this.securityValidator = new SqlSecurityValidator({
      queryTimeout: 30000,
      maxResultRows: 1000,
      allowJoin: true,
      allowSubquery: true,
    });
  }

  /**
   * 执行自然语言查询
   */
  async executeQuery(request: QueryRequest): Promise<QueryResponse> {
    try {
      // 1. 获取数据库 Schema（带缓存）
      const schema = await this.getSchemaWithCache();

      // 2. 使用 LLM 生成 SQL
      const dbSchema = this.convertToDatabaseSchema(schema);
      const sql = await this.llmPort.generateSQL(
        request.query,
        dbSchema
      );

      // 3. SQL 安全校验
      const validation = this.securityValidator.validate(sql);
      if (!validation.isValid) {
        return {
          sql,
          explanation: '生成的 SQL',
          status: 'error',
          error: `安全校验失败: ${validation.errors.join('; ')}`,
        };
      }

      // 4. 是否自动执行
      if (request.autoExecute === false) {
        return {
          sql,
          explanation: '已生成 SQL，等待确认执行',
          status: 'generated',
        };
      }

      // 5. 执行查询
      const queryResult = await this.executeWithTimeout(sql, 30000);

      // 6. 限制结果集
      if (queryResult.rowCount > 1000) {
        queryResult.rows = queryResult.rows.slice(0, 1000);
      }

      return {
        sql,
        explanation: '查询执行成功',
        result: {
          rows: queryResult.rows,
          rowCount: Math.min(queryResult.rowCount, 1000),
          executionTime: queryResult.executionTime,
        },
        status: 'executed',
      };
    } catch (error) {
      return {
        sql: '',
        explanation: '',
        status: 'error',
        error: error instanceof Error ? error.message : '未知错误',
      };
    }
  }

  /**
   * 执行已生成的 SQL
   */
  async executeSql(sql: string, userId: string): Promise<QueryResponse> {
    try {
      // 安全校验
      this.securityValidator.validateOrThrow(sql);

      // 执行查询
      const result = await this.executeWithTimeout(sql, 30000);

      // 限制结果集
      if (result.rowCount > 1000) {
        result.rows = result.rows.slice(0, 1000);
      }

      return {
        sql,
        explanation: '直接执行的 SQL',
        result: {
          rows: result.rows,
          rowCount: Math.min(result.rowCount, 1000),
          executionTime: result.executionTime,
        },
        status: 'executed',
      };
    } catch (error) {
      return {
        sql,
        explanation: '',
        status: 'error',
        error: error instanceof Error ? error.message : '执行失败',
      };
    }
  }

  /**
   * 获取 Schema（带缓存）
   */
  private async getSchemaWithCache(): Promise<SchemaInfo> {
    const now = new Date();

    if (
      this.schemaCache &&
      this.schemaCacheExpiry &&
      now < this.schemaCacheExpiry
    ) {
      return this.schemaCache;
    }

    const schema = await this.databasePort.getSchema();
    this.schemaCache = schema;
    this.schemaCacheExpiry = new Date(
      now.getTime() + this.cacheExpiryMinutes * 60 * 1000
    );

    return schema;
  }

  /**
   * 转换为 LLMPort 需要的 Schema 格式
   */
  private convertToDatabaseSchema(schema: SchemaInfo): DatabaseSchema {
    return {
      tables: schema.tables.map((table) => ({
        name: table.name,
        columns: table.columns.map((col) => ({
          name: col.name,
          type: col.type,
          nullable: col.nullable,
          primaryKey: col.isPrimaryKey,
        })),
        rowCount: table.rowCount,
      })),
    };
  }

  /**
   * 带超时的查询执行
   */
  private async executeWithTimeout(sql: string, timeoutMs: number) {
    return Promise.race([
      this.databasePort.query(sql),
      this.createTimeout(timeoutMs),
    ]);
  }

  /**
   * 创建超时 Promise
   */
  private createTimeout(ms: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`查询超时（${ms}ms）`));
      }, ms);
    });
  }

  /**
   * 刷新 Schema 缓存
   */
  async refreshSchemaCache(): Promise<SchemaInfo> {
    this.schemaCache = null;
    this.schemaCacheExpiry = null;
    return this.getSchemaWithCache();
  }
}
