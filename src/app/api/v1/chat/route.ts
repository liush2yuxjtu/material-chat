/**
 * Chat API 端点
 * POST /api/v1/chat
 * 支持 SSE (Server-Sent Events) 流式响应
 */

import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { ChatUseCase } from '@/application/use-cases/ChatUseCase';
import { MockKimiAdapter } from '@/adapters/llm/MockKimiAdapter';
import { z } from 'zod';

// 请求验证schema
const chatRequestSchema = z.object({
  message: z.string().min(1, '消息不能为空'),
  conversationId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // 1. 验证用户身份
    const session = await auth();
    if (!session?.user?.id) {
      return new Response(
        JSON.stringify({ error: '未登录' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 2. 解析并验证请求
    const body = await request.json();
    const validatedData = chatRequestSchema.parse(body);

    // 3. 创建 ChatUseCase 实例（使用 Mock 适配器）
    const mockAdapter = new MockKimiAdapter();
    const chatUseCase = new ChatUseCase(mockAdapter);

    // 4. 创建 SSE 流式响应
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // 调用 ChatUseCase 流式生成
          for await (const chunk of chatUseCase.streamChat({
            userId: session.user.id,
            conversationId: validatedData.conversationId,
            message: validatedData.message,
          })) {
            // 发送 SSE 格式数据
            const sseData = `data: ${JSON.stringify(chunk)}\n\n`;
            controller.enqueue(encoder.encode(sseData));
          }

          // 发送完成信号
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (error) {
          console.error('Chat 流式响应错误:', error);
          const errorData = `data: ${JSON.stringify({
            type: 'error',
            error: '生成响应失败'
          })}\n\n`;
          controller.enqueue(encoder.encode(errorData));
          controller.close();
        }
      },
    });

    // 5. 返回 SSE 响应
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({ error: error.errors[0].message }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.error('Chat API 错误:', error);
    return new Response(
      JSON.stringify({ error: '请求失败' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
