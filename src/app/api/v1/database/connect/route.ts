/**
 * POST /api/v1/database/connect
 * 测试数据库连接
 */

import { NextRequest, NextResponse } from 'next/server';
import { MockDatabaseAdapter } from '@/adapters/database/MockDatabaseAdapter';

export async function POST(request: NextRequest) {
  try {
    const adapter = new MockDatabaseAdapter();
    const connected = await adapter.testConnection();

    if (connected) {
      const schema = await adapter.getSchema();
      return NextResponse.json({
        success: true,
        data: {
          connected: true,
          tableCount: schema.tables.length,
        },
      });
    }

    return NextResponse.json(
      { success: false, error: '连接失败' },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}
