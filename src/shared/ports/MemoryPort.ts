/**
 * MemoryPort - 记忆持久化抽象端口
 *
 * 当前实现：
 * - PostgresMemoryAdapter (PostgreSQL，用于存储对话、偏好、Schema 缓存)
 */

export interface MemoryPort {
  /**
   * 保存对话消息
   * @param message 消息数据
   * @returns 保存的消息 ID
   */
  saveMessage(message: MessageData): Promise<string>;

  /**
   * 查询对话历史
   * @param conversationId 对话 ID
   * @param limit 返回条数限制
   * @returns 消息列表
   */
  getConversationHistory(conversationId: string, limit?: number): Promise<MessageData[]>;

  /**
   * 保存用户偏好
   * @param userId 用户 ID
   * @param key 偏好键
   * @param value 偏好值
   * @returns void
   */
  savePreference(userId: string, key: string, value: unknown): Promise<void>;

  /**
   * 获取用户偏好
   * @param userId 用户 ID
   * @param key 偏好键
   * @returns 偏好值
   */
  getPreference(userId: string, key: string): Promise<unknown | null>;

  /**
   * 缓存外部数据库 Schema
   * @param userId 用户 ID
   * @param externalDbId 外部数据库 ID
   * @param schema Schema 数据
   * @returns void
   */
  cacheSchema(userId: string, externalDbId: string, schema: unknown): Promise<void>;

  /**
   * 获取缓存的 Schema
   * @param userId 用户 ID
   * @param externalDbId 外部数据库 ID
   * @returns Schema 数据或 null
   */
  getCachedSchema(userId: string, externalDbId: string): Promise<unknown | null>;

  /**
   * 保存查询模板
   * @param userId 用户 ID
   * @param name 模板名称
   * @param description 自然语言描述
   * @param sqlTemplate SQL 模板
   * @returns void
   */
  saveQueryTemplate(userId: string, name: string, description: string, sqlTemplate: string): Promise<void>;

  /**
   * 查找匹配的查询模板
   * @param userId 用户 ID
   * @param intent 用户意图
   * @returns 匹配的模板或 null
   */
  findMatchingTemplate(userId: string, intent: string): Promise<QueryTemplateData | null>;

  /**
   * 增加模板使用次数
   * @param templateId 模板 ID
   * @returns void
   */
  incrementTemplateUse(templateId: string): Promise<void>;
}

/**
 * 消息数据
 */
export interface MessageData {
  /** 消息 ID（可选，保存时由系统生成） */
  id?: string;
  /** 对话 ID */
  conversationId: string;
  /** 角色 */
  role: 'user' | 'assistant' | 'system';
  /** 消息内容 */
  content: string;
  /** SQL 语句（可选） */
  sql?: string;
  /** SQL 结果（可选） */
  sqlResult?: unknown;
  /** Bash 命令（可选） */
  bashCommand?: string;
  /** Bash 输出（可选） */
  bashOutput?: string;
  /** 关联素材 ID 列表 */
  materialIds?: string[];
  /** 创建时间 */
  createdAt?: Date;
}

/**
 * 查询模板数据
 */
export interface QueryTemplateData {
  /** 模板 ID */
  id: string;
  /** 用户 ID */
  userId: string;
  /** 模板名称 */
  name: string;
  /** 自然语言描述 */
  description: string | null;
  /** SQL 模板 */
  sqlTemplate: string;
  /** 使用次数 */
  useCount: number;
  /** 创建时间 */
  createdAt: Date;
}
