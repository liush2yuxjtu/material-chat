/**
 * Mock 数据库适配器
 * 用于开发和测试，返回固定测试数据
 */

import {
  DatabasePort,
  QueryResult,
  QueryRow,
  SchemaInfo,
  ConnectionConfig,
  TableInfo,
} from '@/shared/ports/DatabasePort';

export class MockDatabaseAdapter implements DatabasePort {
  private connected = false;
  private config: ConnectionConfig | null = null;

  async query<Row extends QueryRow = QueryRow>(
    sql: string,
    params: unknown[] = [],
  ): Promise<QueryResult<Row>> {
    void params;

    if (!this.connected) {
      throw new Error('数据库未连接');
    }

    // 模拟查询延迟
    await this.delay(50);

    const startTime = Date.now();
    const sqlLower = sql.toLowerCase().trim();

    // 根据 SQL 关键词返回不同的测试数据
    let result: QueryResult;

    if (sqlLower.includes('users')) {
      result = this.getMockUsersData();
    } else if (sqlLower.includes('orders')) {
      result = this.getMockOrdersData();
    } else if (sqlLower.includes('products')) {
      result = this.getMockProductsData();
    } else {
      result = this.getMockGenericData();
    }

    result.executionTime = Date.now() - startTime;
    return result as QueryResult<Row>;
  }

  async getSchema(): Promise<SchemaInfo> {
    if (!this.connected) {
      throw new Error('数据库未连接');
    }

    await this.delay(100);

    const tables: TableInfo[] = [
      {
        name: 'users',
        schema: 'public',
        columns: [
          {
            name: 'id',
            type: 'integer',
            nullable: false,
            isPrimaryKey: true,
            isForeignKey: false,
          },
          {
            name: 'name',
            type: 'varchar',
            nullable: false,
            isPrimaryKey: false,
            isForeignKey: false,
          },
          {
            name: 'email',
            type: 'varchar',
            nullable: false,
            isPrimaryKey: false,
            isForeignKey: false,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            nullable: false,
            isPrimaryKey: false,
            isForeignKey: false,
          },
        ],
        indexes: [
          { name: 'users_pkey', columns: ['id'], unique: true },
          { name: 'users_email_idx', columns: ['email'], unique: true },
        ],
        rowCount: 150,
      },
      {
        name: 'orders',
        schema: 'public',
        columns: [
          {
            name: 'id',
            type: 'integer',
            nullable: false,
            isPrimaryKey: true,
            isForeignKey: false,
          },
          {
            name: 'user_id',
            type: 'integer',
            nullable: false,
            isPrimaryKey: false,
            isForeignKey: true,
          },
          {
            name: 'total_amount',
            type: 'decimal',
            nullable: false,
            isPrimaryKey: false,
            isForeignKey: false,
          },
          {
            name: 'status',
            type: 'varchar',
            nullable: false,
            isPrimaryKey: false,
            isForeignKey: false,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            nullable: false,
            isPrimaryKey: false,
            isForeignKey: false,
          },
        ],
        indexes: [{ name: 'orders_pkey', columns: ['id'], unique: true }],
        rowCount: 500,
      },
    ];

    return {
      tables,
      version: '1.0.0',
    };
  }

  async testConnection(): Promise<boolean> {
    await this.delay(100);
    this.connected = true;
    return true;
  }

  async close(): Promise<void> {
    this.connected = false;
    this.config = null;
  }

  // 私有方法：测试数据生成
  private getMockUsersData(): QueryResult {
    return {
      rows: [
        {
          id: 1,
          name: '张三',
          email: 'zhangsan@example.com',
          created_at: new Date('2024-01-15'),
        },
        {
          id: 2,
          name: '李四',
          email: 'lisi@example.com',
          created_at: new Date('2024-02-10'),
        },
      ],
      fields: [
        { name: 'id', type: 'integer' },
        { name: 'name', type: 'varchar' },
        { name: 'email', type: 'varchar' },
        { name: 'created_at', type: 'timestamp' },
      ],
      rowCount: 2,
      executionTime: 0,
    };
  }

  private getMockOrdersData(): QueryResult {
    return {
      rows: [
        {
          id: 101,
          user_id: 1,
          total_amount: 299.99,
          status: 'completed',
          created_at: new Date('2024-06-01'),
        },
        {
          id: 102,
          user_id: 2,
          total_amount: 150.5,
          status: 'pending',
          created_at: new Date('2024-06-15'),
        },
      ],
      fields: [
        { name: 'id', type: 'integer' },
        { name: 'user_id', type: 'integer' },
        { name: 'total_amount', type: 'decimal' },
        { name: 'status', type: 'varchar' },
        { name: 'created_at', type: 'timestamp' },
      ],
      rowCount: 2,
      executionTime: 0,
    };
  }

  private getMockProductsData(): QueryResult {
    return {
      rows: [
        {
          id: 1001,
          name: 'MacBook Pro 16"',
          price: 19999.0,
          stock: 25,
        },
        {
          id: 1002,
          name: 'iPhone 15 Pro',
          price: 8999.0,
          stock: 120,
        },
      ],
      fields: [
        { name: 'id', type: 'integer' },
        { name: 'name', type: 'varchar' },
        { name: 'price', type: 'decimal' },
        { name: 'stock', type: 'integer' },
      ],
      rowCount: 2,
      executionTime: 0,
    };
  }

  private getMockGenericData(): QueryResult {
    return {
      rows: [
        { id: 1, value: '测试数据', created_at: new Date() },
      ],
      fields: [
        { name: 'id', type: 'integer' },
        { name: 'value', type: 'varchar' },
        { name: 'created_at', type: 'timestamp' },
      ],
      rowCount: 1,
      executionTime: 0,
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
