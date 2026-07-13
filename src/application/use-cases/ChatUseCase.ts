/**
 * Chat 业务用例
 * 处理用户聊天请求，调用 LLM 生成响应
 */

import { LLMPort, ChatMessage } from '@/shared/ports/LLMPort';
import { prisma } from '@/lib/prisma';

export interface ChatRequest {
  userId: string;
  conversationId?: string;
  message: string;
}

export interface StreamChunk {
  type: 'text' | 'done';
  content?: string;
}

export class ChatUseCase {
  constructor(private llmAdapter: LLMPort) {}

  /**
   * 流式聊天响应
   * @param request 聊天请求
   * @returns 异步生成器，返回标准化流式响应
   */
  async *streamChat(request: ChatRequest): AsyncIterableIterator<StreamChunk> {
    const { userId, conversationId, message } = request;

    // 1. 获取或创建会话
    const conversation = conversationId
      ? await prisma.conversation.findUnique({
          where: { id: conversationId },
          include: { messages: { orderBy: { createdAt: 'asc' }, take: 10 } },
        })
      : await prisma.conversation.create({
          data: { userId, title: message.substring(0, 50) },
          include: { messages: true },
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
      },
    });

    // 3. 构建对话历史
    const messages: ChatMessage[] = [
      ...conversation.messages.map((storedMessage) => ({
        role: storedMessage.role as ChatMessage['role'],
        content: storedMessage.content,
      })),
      { role: 'user', content: message },
    ];

    // 4. 调用当前 LLMPort.streamChat，并标准化为前端使用的 chunk
    let assistantMessage = '';
    for await (const token of this.llmAdapter.streamChat(messages)) {
      assistantMessage += token;
      yield { type: 'text', content: token };
    }
    yield { type: 'done' };

    // 5. 保存 AI 响应
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: 'assistant',
        content: assistantMessage,
      },
    });
  }
}
