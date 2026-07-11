/**
 * POST /api/v1/database/execute
 * 执行SQL语句
 */

import { NextRequest, NextResponse } from 'next/server';
import { TextToSqlUseCase } from '@/application/use-cases/TextToSqlUseCase';
import { MockDatabaseAdapter } from '@/adapters/database/MockDatabaseAdapter';
import { MockLLMAdapter } from '@/adapters/llm/MockLLMAdapter';

export async function POST(request: NextRequest) {
  try {
    const { sql } = await request.json();

    if (!sql) {
      return NextResponse.json(
        { success: false, error: '缺少SQL参数' },
        { status: 400 }
      );
    }

    const databaseAdapter = new MockDatabaseAdapter();
    const llmAdapter = new MockLLMAdapter();
    await databaseAdapter.testConnection();

    const useCase = new TextToSqlUseCase(databaseAdapter, llmAdapter);
    const result = await useCase.executeSql(sql, 'anonymous');

    if (result.status === 'error') {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}
