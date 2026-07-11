/**
 * LLMPort - LLM 调用抽象端口
 *
 * 当前实现：
 * - KimiAdapter (Kimi - Anthropic 兼容 API)
 *
 * 未来可扩展：Claude, GPT-4 等
 */

export interface LLMPort {
  /**
   * 流式对话（SSE）
   * @param messages 对话历史
   * @param options 调用选项
   * @returns AsyncGenerator 流式返回 token
   */
  streamChat(
    messages: ChatMessage[],
    options?: LLMOptions
  ): AsyncGenerator<string, void, unknown>;

  /**
   * 非流式对话（一次性返回）
   * @param messages 对话历史
   * @param options 调用选项
   * @returns 完整响应文本
   */
  chat(messages: ChatMessage[], options?: LLMOptions): Promise<string>;

  /**
   * Text-to-SQL 生成
   * @param naturalLanguage 自然语言查询
   * @param schema 数据库 schema 信息
   * @param options 调用选项
   * @returns 生成的 SQL 语句
   */
  generateSQL(
    naturalLanguage: string,
    schema: DatabaseSchema,
    options?: LLMOptions
  ): Promise<string>;
}

/**
 * 对话消息
 */
export interface ChatMessage {
  /** 角色：user | assistant | system */
  role: 'user' | 'assistant' | 'system';
  /** 消息内容 */
  content: string;
}

/**
 * LLM 调用选项
 */
export interface LLMOptions {
  /** 温度参数（0-1） */
  temperature?: number;
  /** 最大 token 数 */
  maxTokens?: number;
  /** 系统提示词 */
  systemPrompt?: string;
}

/**
 * 数据库 Schema（用于 Text-to-SQL）
 */
export interface DatabaseSchema {
  /** 表列表 */
  tables: TableSchema[];
}

/**
 * 表 Schema
 */
export interface TableSchema {
  /** 表名 */
  name: string;
  /** 列信息 */
  columns: ColumnSchema[];
  /** 行数估计 */
  rowCount?: number;
}

/**
 * 列 Schema
 */
export interface ColumnSchema {
  /** 列名 */
  name: string;
  /** 数据类型 */
  type: string;
  /** 是否可为空 */
  nullable: boolean;
  /** 是否主键 */
  primaryKey?: boolean;
}
