/**
 * POST /api/v1/database/query
 * 自然语言查询 API 端点
 */

import { NextRequest, NextResponse } from 'next/server';
import { TextToSqlUseCase } from '@/application/use-cases/TextToSqlUseCase';
import { MockDatabaseAdapter } from '@/adapters/database/MockDatabaseAdapter';
import { MockLLMAdapter } from '@/adapters/llm/MockLLMAdapter';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, autoExecute = true } = body;

    if (!query) {
      return NextResponse.json(
        { success: false, error: '缺少查询参数' },
        { status: 400 }
      );
    }

    // 初始化依赖
    const databaseAdapter = new MockDatabaseAdapter();
    const llmAdapter = new MockLLMAdapter();

    // 测试连接
    await databaseAdapter.testConnection();

    // 创建用例
    const useCase = new TextToSqlUseCase(databaseAdapter, llmAdapter);

    // 执行查询
    const result = await useCase.executeQuery({
      query,
      userId: 'anonymous',
      autoExecute,
    });

    if (result.status === 'error') {
      return NextResponse.json(
        { success: false, error: result.error, sql: result.sql },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    );
  }
}
