/**
 * LLM 端口接口（SQL 生成专用）
 * 将自然语言转换为 SQL 查询
 */

import { SchemaInfo } from './DatabasePort';

/**
 * SQL 生成请求
 */
export interface SqlGenerationRequest {
  /** 用户的自然语言查询 */
  query: string;
  /** 数据库 Schema 信息 */
  schemaInfo: SchemaInfo;
  /** 历史对话上下文 */
  conversationHistory?: ConversationMessage[];
}

/**
 * 对话消息
 */
export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * SQL 生成结果
 */
export interface SqlGenerationResult {
  /** 生成的 SQL 语句 */
  sql: string;
  /** SQL 解释说明 */
  explanation: string;
  /** 置信度（0-1） */
  confidence: number;
  /** 是否需要人工确认 */
  requiresConfirmation: boolean;
}

/**
 * LLM 端口接口
 */
export interface LLMPort {
  /**
   * 生成 SQL 查询
   */
  generateSql(request: SqlGenerationRequest): Promise<SqlGenerationResult>;
}
