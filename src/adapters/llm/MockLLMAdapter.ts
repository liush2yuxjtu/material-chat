/**
 * Mock LLM 适配器（SQL 生成专用）
 * 用于开发和测试，基于关键词匹配返回预定义的 SQL
 */

import {
  LLMPort,
  ChatMessage,
  LLMOptions,
  DatabaseSchema,
} from '@/shared/ports/LLMPort';

export class MockLLMAdapter implements LLMPort {
  async *streamChat(
    messages: ChatMessage[],
    options?: LLMOptions
  ): AsyncGenerator<string, void, unknown> {
    // Mock 实现：逐字符返回
    const response = await this.chat(messages, options);
    for (const char of response) {
      yield char;
      await this.delay(10);
    }
  }

  async chat(messages: ChatMessage[], options?: LLMOptions): Promise<string> {
    await this.delay(200);
    const lastMessage = messages[messages.length - 1];
    return `这是对 "${lastMessage.content}" 的模拟回复`;
  }

  async generateSQL(
    naturalLanguage: string,
    schema: DatabaseSchema,
    options?: LLMOptions
  ): Promise<string> {
    // 模拟 LLM 处理延迟
    await this.delay(300);

    const queryLower = naturalLanguage.toLowerCase();

    // 根据关键词匹配返回预定义的 SQL
    if (this.matchesPattern(queryLower, ['用户', '所有', '列表'])) {
      return 'SELECT id, name, email, created_at FROM users ORDER BY created_at DESC;';
    }

    if (this.matchesPattern(queryLower, ['订单', '张三'])) {
      return `SELECT o.id, o.total_amount, o.status, o.created_at
FROM orders o
JOIN users u ON o.user_id = u.id
WHERE u.name = '张三'
ORDER BY o.created_at DESC;`;
    }

    if (this.matchesPattern(queryLower, ['产品', '价格', '大于', '5000'])) {
      return 'SELECT id, name, price, stock FROM products WHERE price > 5000 ORDER BY price DESC;';
    }

    if (this.matchesPattern(queryLower, ['订单', '总金额', '统计'])) {
      return `SELECT
  COUNT(*) as total_orders,
  SUM(total_amount) as total_revenue,
  AVG(total_amount) as avg_order_value
FROM orders
WHERE status = 'completed';`;
    }

    if (this.matchesPattern(queryLower, ['用户', '邮箱'])) {
      return "SELECT id, name, email FROM users WHERE email LIKE '%@example.com';";
    }

    // 默认查询
    return 'SELECT * FROM users LIMIT 10;';
  }

  private matchesPattern(query: string, keywords: string[]): boolean {
    return keywords.every((keyword) => query.includes(keyword));
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
