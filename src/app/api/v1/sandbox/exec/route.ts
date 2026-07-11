/**
 * POST /api/v1/sandbox/exec
 *
 * 在沙盒环境中执行 Bash 命令
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSandboxAdapter } from '@/features/sandbox/infrastructure/sandboxContainer';
import { ExecBashUseCase } from '@/features/sandbox/application/use-cases/ExecBashUseCase';

export async function POST(request: NextRequest) {
  try {
    // 解析请求体
    const body = await request.json();
    const { command, options } = body;

    // 验证必需字段
    if (!command) {
      return NextResponse.json(
        { error: '缺少必需字段: command' },
        { status: 400 }
      );
    }

    // 获取沙盒适配器
    const sandboxAdapter = getSandboxAdapter();

    // 创建用例并执行
    const useCase = new ExecBashUseCase(sandboxAdapter);
    const result = await useCase.execute({ command, options });

    // 返回执行结果
    return NextResponse.json({
      success: result.exitCode === 0,
      result,
    });
  } catch (error) {
    console.error('[API] /sandbox/exec 错误:', error);
    return NextResponse.json(
      { error: '执行命令时发生错误', details: (error as Error).message },
      { status: 500 }
    );
  }
}
