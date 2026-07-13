/**
 * Chat 业务用例
 * 处理用户聊天请求，调用 LLM 生成响应
 */

import { ChatMessage, LLMPort } from '@/shared/ports/LLMPort';
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

interface StoredConversationMessage {
  role: string;
  content: string;
}

export class ChatUseCase {
  constructor(private llmAdapter: LLMPort) {}

  async *streamChat(request: ChatRequest): AsyncIterableIterator<StreamChunk> {
    const { userId, conversationId, message } = request;
    const messagesSelection = {
      orderBy: { createdAt: 'asc' as const },
      take: 10,
    };

    const conversation = conversationId
      ? await prisma.conversation.findFirst({
          where: { id: conversationId, userId },
          include: { messages: messagesSelection },
        })
      : await prisma.conversation.create({
          data: { userId, title: message.substring(0, 50) },
          include: { messages: messagesSelection },
        });

    if (!conversation) {
      throw new Error('会话不存在');
    }

    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: 'user',
        content: message,
      },
    });

    const messages: ChatMessage[] = [
      ...conversation.messages.map((storedMessage: StoredConversationMessage) => ({
        role: storedMessage.role as ChatMessage['role'],
        content: storedMessage.content,
      })),
      { role: 'user', content: message },
    ];

    let assistantMessage = '';
    let completed = false;

    try {
      for await (const token of this.llmAdapter.streamChat(messages)) {
        assistantMessage += token;
        yield { type: 'text', content: token };
      }
      completed = true;
    } finally {
      // Preserve any content already delivered to the user, even when the upstream
      // stream fails after yielding one or more tokens.
      if (assistantMessage) {
        await prisma.message.create({
          data: {
            conversationId: conversation.id,
            role: 'assistant',
            content: assistantMessage,
          },
        });
      }
    }

    if (completed) {
      yield { type: 'done' };
    }
  }
}
