/**
 * GET /api/v1/database/schema
 * 获取数据库Schema
 */

import { NextRequest, NextResponse } from 'next/server';
import { MockDatabaseAdapter } from '@/adapters/database/MockDatabaseAdapter';

export async function GET(request: NextRequest) {
  try {
    const adapter = new MockDatabaseAdapter();
    await adapter.testConnection();
    const schema = await adapter.getSchema();

    return NextResponse.json({
      success: true,
      data: schema,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}
