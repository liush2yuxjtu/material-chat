/**
 * Mock Kimi LLM 适配器
 * 用于开发和测试阶段，返回固定的流式响应
 */

import { LLMPort, Message, StreamChunk } from '@/shared/ports/LLMPort';

export class MockKimiAdapter implements LLMPort {
  /**
   * 流式生成模拟响应
   * @param messages 对话历史
   * @param systemPrompt 系统提示词（可选）
   * @returns 异步生成器，逐块返回固定的模拟响应
   */
  async *stream(
    messages: Message[],
    systemPrompt?: string
  ): AsyncIterableIterator<StreamChunk> {
    // 模拟响应的固定内容（包含MOCK标记）
    const mockTokens = [
      '[MOCK] ',
      '你好',
      '，',
      '我是',
      '模拟',
      '的',
      ' AI ',
      '助手',
      '。',
      '这是',
      '一个',
      '测试',
      '响应',
      '。'
    ];

    // 逐个token返回，模拟真实的流式输出
    for (const token of mockTokens) {
      yield {
        type: 'text',
        content: token
      };

      // 模拟网络延迟（50ms per token）
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    // 发送完成信号
    yield {
      type: 'done'
    };
  }

  /**
   * 非流式生成（用于内部工具调用）
   * @param messages 对话历史
   * @param systemPrompt 系统提示词（可选）
   * @returns 完整的模拟响应文本
   */
  async generate(messages: Message[], systemPrompt?: string): Promise<string> {
    // 返回完整的模拟响应
    return '[MOCK] 你好，我是模拟的 AI 助手。这是一个测试响应。';
  }
}
