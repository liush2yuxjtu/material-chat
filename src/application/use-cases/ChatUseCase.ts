/**
 * Chat 业务用例
 * 处理用户聊天请求，调用LLM生成响应
 */

import { LLMPort, Message, StreamChunk } from '@/shared/ports/LLMPort';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface ChatRequest {
  userId: string;
  conversationId?: string;
  message: string;
}

export class ChatUseCase {
  constructor(private llmAdapter: LLMPort) {}

  /**
   * 流式聊天响应
   * @param request 聊天请求
   * @returns 异步生成器，返回流式响应
   */
  async *streamChat(request: ChatRequest): AsyncIterableIterator<StreamChunk> {
    const { userId, conversationId, message } = request;

    // 1. 获取或创建会话
    let conversation = conversationId
      ? await prisma.conversation.findUnique({
          where: { id: conversationId },
          include: { messages: { orderBy: { createdAt: 'asc' }, take: 10 } }
        })
      : await prisma.conversation.create({
          data: { userId, title: message.substring(0, 50) },
          include: { messages: true }
        });

    if (!conversation) {
      throw new Error('会话不存在');
    }

    // 2. 保存用户消息
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: 'user',
        content: message,
      }
    });

    // 3. 构建对话历史
    const messages: Message[] = [
      ...conversation.messages.map(m => ({
        role: m.role as 'user' | 'assistant' | 'system',
        content: m.content
      })),
      { role: 'user', content: message }
    ];

    // 4. 调用LLM流式生成
    let assistantMessage = '';
    for await (const chunk of this.llmAdapter.stream(messages)) {
      if (chunk.type === 'text' && chunk.content) {
        assistantMessage += chunk.content;
      }
      yield chunk;
    }

    // 5. 保存AI响应
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: 'assistant',
        content: assistantMessage,
      }
    });
  }
}
