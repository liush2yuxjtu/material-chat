/**
 * Kimi LLM 真实适配器
 * 连接 Kimi API（Anthropic 兼容接口）提供 LLM 能力
 */

import {
  LLMPort,
  ChatMessage,
  LLMOptions,
  DatabaseSchema,
} from '@/shared/ports/LLMPort';

export class KimiAdapter implements LLMPort {
  private apiKey: string;
  private baseUrl: string;
  private model: string;

  constructor(
    apiKey: string,
    baseUrl = 'https://api.kimi.com/coding',
    model = 'claude-sonnet-4-6'
  ) {
    if (!apiKey) {
      throw new Error('Kimi API key 不能为空');
    }
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
    this.model = model;
  }

  async *streamChat(
    messages: ChatMessage[],
    options?: LLMOptions
  ): AsyncGenerator<string, void, unknown> {
    const requestBody = {
      model: this.model,
      messages: this.buildMessages(messages, options?.systemPrompt),
      stream: true,
      max_tokens: options?.maxTokens || 4096,
      temperature: options?.temperature || 0.7,
    };

    try {
      const response = await fetch(`${this.baseUrl}/v1/messages`, {
        method: 'POST',
        headers: {
          'anthropic-api-key': this.apiKey,
          'content-type': 'application/json',
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Kimi API 调用失败: ${response.status} - ${errorText}`
        );
      }

      if (!response.body) {
        throw new Error('响应体为空');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (data === '[DONE]') {
              return;
            }

            try {
              const parsed = JSON.parse(data);
              if (parsed.type === 'content_block_delta' && parsed.delta?.type === 'text_delta') {
                yield parsed.delta.text;
              }
            } catch (e) {
              console.error('解析 SSE 数据失败:', e);
            }
          }
        }
      }
    } catch (error) {
      console.error('Kimi 流式调用错误:', error);
      throw error;
    }
  }

  async chat(messages: ChatMessage[], options?: LLMOptions): Promise<string> {
    const requestBody = {
      model: this.model,
      messages: this.buildMessages(messages, options?.systemPrompt),
      stream: false,
      max_tokens: options?.maxTokens || 4096,
      temperature: options?.temperature || 0.7,
    };

    try {
      const response = await fetch(`${this.baseUrl}/v1/messages`, {
        method: 'POST',
        headers: {
          'anthropic-api-key': this.apiKey,
          'content-type': 'application/json',
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Kimi API 调用失败: ${response.status} - ${errorText}`
        );
      }

      const data = await response.json();
      return this.extractTextFromResponse(data);
    } catch (error) {
      console.error('Kimi 非流式调用错误:', error);
      throw error;
    }
  }

  async generateSQL(
    naturalLanguage: string,
    schema: DatabaseSchema,
    options?: LLMOptions
  ): Promise<string> {
    const systemPrompt = this.buildSQLSystemPrompt(schema);
    const messages: ChatMessage[] = [
      {
        role: 'user',
        content: `请根据以下自然语言查询生成 SQL 语句：\n\n${naturalLanguage}\n\n只返回 SQL 语句，不要包含任何解释或其他内容。`,
      },
    ];

    const response = await this.chat(messages, {
      ...options,
      systemPrompt,
      temperature: 0.3, // 降低温度以获得更确定的输出
    });

    return this.extractSQLFromResponse(response);
  }

  private buildMessages(messages: ChatMessage[], systemPrompt?: string): any[] {
    const result: any[] = [];

    if (systemPrompt) {
      result.push({
        role: 'system',
        content: systemPrompt,
      });
    }

    for (const msg of messages) {
      result.push({
        role: msg.role,
        content: msg.content,
      });
    }

    return result;
  }

  private buildSQLSystemPrompt(schema: DatabaseSchema): string {
    let prompt = '你是一个专业的 SQL 查询生成专家。\n\n';
    prompt += '数据库结构如下：\n\n';

    for (const table of schema.tables) {
      prompt += `表名: ${table.name}\n`;
      prompt += '列信息:\n';
      for (const col of table.columns) {
        prompt += `  - ${col.name} (${col.type})${col.nullable ? ' [可为空]' : ''}${col.primaryKey ? ' [主键]' : ''}\n`;
      }
      if (table.rowCount !== undefined) {
        prompt += `行数估计: ${table.rowCount}\n`;
      }
      prompt += '\n';
    }

    prompt += '请根据用户的自然语言查询生成准确的 PostgreSQL SQL 语句。\n';
    prompt += '要求：\n';
    prompt += '1. 只返回 SQL 语句，不要包含任何解释\n';
    prompt += '2. 使用标准的 PostgreSQL 语法\n';
    prompt += '3. 确保查询高效且安全（只允许 SELECT 查询）\n';
    prompt += '4. 如果需要，使用适当的 JOIN、WHERE、GROUP BY 等子句\n';

    return prompt;
  }

  private extractTextFromResponse(data: any): string {
    if (data.content && Array.isArray(data.content)) {
      const textBlocks = data.content.filter(
        (block: any) => block.type === 'text'
      );
      return textBlocks.map((block: any) => block.text).join('');
    }
    return '';
  }

  private extractSQLFromResponse(response: string): string {
    // 移除 markdown 代码块标记
    let sql = response.trim();
    sql = sql.replace(/^```sql\n?/i, '');
    sql = sql.replace(/^```\n?/i, '');
    sql = sql.replace(/\n?```$/i, '');
    return sql.trim();
  }
}
