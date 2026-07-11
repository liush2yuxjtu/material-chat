/**
 * GET /api/v1/sandbox/status
 *
 * 查询沙盒状态和空闲时长
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSandboxAdapter } from '@/features/sandbox/infrastructure/sandboxContainer';

export async function GET(request: NextRequest) {
  try {
    // 获取沙盒适配器
    const sandboxAdapter = getSandboxAdapter();

    // 查询状态
    const status = await sandboxAdapter.status();

    // 返回状态信息
    return NextResponse.json({
      success: true,
      status,
    });
  } catch (error) {
    console.error('[API] /sandbox/status 错误:', error);
    return NextResponse.json(
      { error: '查询状态时发生错误', details: (error as Error).message },
      { status: 500 }
    );
  }
}
