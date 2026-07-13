import { Prisma, PrismaClient } from '@prisma/client';
import { prisma as defaultPrisma } from '@/lib/prisma';
import {
  MemoryPort,
  MessageData,
  QueryTemplateData,
} from '../../shared/ports/MemoryPort';

function toPrismaJson(value: unknown) {
  if (value === null || value === undefined) {
    return Prisma.JsonNull;
  }

  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

/**
 * Prisma 实现的 Memory 持久化适配器
 * 负责用户偏好、查询模板和 Schema 缓存的数据库操作
 */
export class PostgresMemoryAdapter implements MemoryPort {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient = defaultPrisma) {
    this.prisma = prisma;
  }

  async close(): Promise<void> {
    await this.prisma.$disconnect();
  }

  // ============ 对话消息管理 ============

  async saveMessage(message: MessageData): Promise<string> {
    const created = await this.prisma.message.create({
      data: {
        conversationId: message.conversationId,
        role: message.role,
        content: message.content,
        sql: message.sql,
        sqlResult:
          message.sqlResult === undefined
            ? undefined
            : toPrismaJson(message.sqlResult),
        bashCommand: message.bashCommand,
        bashOutput: message.bashOutput,
        materialIds: message.materialIds || [],
      },
    });
    return created.id;
  }

  async getConversationHistory(conversationId: string, limit: number = 50): Promise<MessageData[]> {
    const messages = await this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      take: limit,
    });

    return messages.map(msg => ({
      id: msg.id,
      conversationId: msg.conversationId,
      role: msg.role as 'user' | 'assistant' | 'system',
      content: msg.content,
      sql: msg.sql || undefined,
      sqlResult: msg.sqlResult || undefined,
      bashCommand: msg.bashCommand || undefined,
      bashOutput: msg.bashOutput || undefined,
      materialIds: msg.materialIds,
      createdAt: msg.createdAt,
    }));
  }

  // ============ 用户偏好管理 ============

  async savePreference(userId: string, key: string, value: unknown): Promise<void> {
    const jsonValue = toPrismaJson(value);
    await this.prisma.userPreference.upsert({
      where: {
        userId_key: {
          userId,
          key,
        },
      },
      create: {
        userId,
        key,
        value: jsonValue,
      },
      update: {
        value: jsonValue,
      },
    });
  }

  async getPreference(userId: string, key: string): Promise<unknown | null> {
    const preference = await this.prisma.userPreference.findUnique({
      where: {
        userId_key: {
          userId,
          key,
        },
      },
    });

    return preference?.value || null;
  }

  // ============ 查询模板学习与匹配 ============

  async saveQueryTemplate(userId: string, name: string, description: string, sqlTemplate: string): Promise<void> {
    await this.prisma.queryTemplate.create({
      data: {
        userId,
        name,
        description,
        sqlTemplate,
      },
    });
  }

  async findMatchingTemplate(userId: string, intent: string): Promise<QueryTemplateData | null> {
    // 简化实现：查找描述包含关键词的模板，按使用次数排序
    const templates = await this.prisma.queryTemplate.findMany({
      where: {
        userId,
        description: {
          contains: intent,
          mode: 'insensitive',
        },
      },
      orderBy: {
        useCount: 'desc',
      },
      take: 1,
    });

    if (templates.length === 0) {
      return null;
    }

    const template = templates[0];
    return {
      id: template.id,
      userId: template.userId,
      name: template.name,
      description: template.description,
      sqlTemplate: template.sqlTemplate,
      useCount: template.useCount,
      createdAt: template.createdAt,
    };
  }

  async incrementTemplateUse(templateId: string): Promise<void> {
    await this.prisma.queryTemplate.update({
      where: { id: templateId },
      data: {
        useCount: {
          increment: 1,
        },
      },
    });
  }

  // ============ Schema 缓存管理 ============

  async cacheSchema(userId: string, externalDbId: string, schema: unknown): Promise<void> {
    const schemaJson = toPrismaJson(schema);
    await this.prisma.schemaCache.upsert({
      where: {
        userId_externalDbId: {
          userId,
          externalDbId,
        },
      },
      create: {
        userId,
        externalDbId,
        schemaJson,
      },
      update: {
        schemaJson,
        refreshedAt: new Date(),
      },
    });
  }

  async getCachedSchema(userId: string, externalDbId: string): Promise<unknown | null> {
    const cache = await this.prisma.schemaCache.findUnique({
      where: {
        userId_externalDbId: {
          userId,
          externalDbId,
        },
      },
    });

    return cache?.schemaJson || null;
  }
}
