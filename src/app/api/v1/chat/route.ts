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

const chatRequestSchema = z.object({
  message: z.string().min(1, '消息不能为空'),
  conversationId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new Response(
        JSON.stringify({ error: '未登录' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const body = await request.json();
    const validatedData = chatRequestSchema.parse(body);
    const chatUseCase = new ChatUseCase(new MockKimiAdapter());

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of chatUseCase.streamChat({
            userId: session.user.id,
            conversationId: validatedData.conversationId,
            message: validatedData.message,
          })) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`),
            );
          }

          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (streamError) {
          console.error('Chat 流式响应错误:', streamError);
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: 'error',
                error: '生成响应失败',
              })}\n\n`,
            ),
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({
          error: error.issues[0]?.message || '聊天参数无效',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    console.error('Chat API 错误:', error);
    return new Response(
      JSON.stringify({ error: '请求失败' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
}
