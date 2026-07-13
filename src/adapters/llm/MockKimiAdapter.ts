/**
 * Mock Kimi LLM 适配器
 * 用于开发和测试阶段，返回确定性的流式响应
 */

import {
  LLMPort,
  ChatMessage,
  LLMOptions,
  DatabaseSchema,
} from '@/shared/ports/LLMPort';

export class MockKimiAdapter implements LLMPort {
  async *streamChat(
    messages: ChatMessage[],
    options?: LLMOptions,
  ): AsyncGenerator<string, void, unknown> {
    const response = await this.chat(messages, options);
    const chunks = response.match(/.{1,8}/gu) || [response];

    for (const chunk of chunks) {
      yield chunk;
      await this.delay(90);
    }
  }

  async chat(messages: ChatMessage[], _options?: LLMOptions): Promise<string> {
    const userMessage = messages.at(-1)?.content || '当前问题';
    return [
      `针对“${userMessage}”，建议按以下三步整理：`,
      '1. 按课程主题建立清晰目录，并统一文件命名。',
      '2. 为每份资料补充标签、来源和学习状态。',
      '3. 每周归档重点结论，并删除重复或失效内容。',
    ].join('\n');
  }

  async generateSQL(
    _naturalLanguage: string,
    _schema: DatabaseSchema,
    _options?: LLMOptions,
  ): Promise<string> {
    return 'SELECT 1;';
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
