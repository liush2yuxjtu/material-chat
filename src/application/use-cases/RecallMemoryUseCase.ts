import { MemoryPort, QueryTemplateData } from '../../shared/ports/MemoryPort';

/**
 * 回忆记忆用例
 * 负责读取用户偏好、匹配查询模板、获取缓存的 Schema
 */
export class RecallMemoryUseCase {
  constructor(private memoryPort: MemoryPort) {}

  /**
   * 获取用户偏好
   * @param userId 用户ID
   * @param key 偏好键名
   * @param defaultValue 默认值（如果不存在）
   */
  async getUserPreference<T>(
    userId: string,
    key: string,
    defaultValue: T,
  ): Promise<T> {
    const value = await this.memoryPort.getPreference(userId, key);
    return value === null || value === undefined ? defaultValue : (value as T);
  }

  /**
   * 根据用户意图匹配最佳查询模板
   * @param userId 用户ID
   * @param userIntent 用户输入的自然语言意图
   * @returns 匹配的模板或 null
   */
  async findBestQueryTemplate(
    userId: string,
    userIntent: string,
  ): Promise<QueryTemplateData | null> {
    const template = await this.memoryPort.findMatchingTemplate(userId, userIntent);

    if (template) {
      await this.memoryPort.incrementTemplateUse(template.id);
    }

    return template;
  }

  /**
   * 获取缓存的数据库 Schema
   * @param userId 用户ID
   * @param externalDbId 外部数据库ID
   * @returns 缓存的 Schema 或 null（需要重新获取）
   */
  async getCachedSchema(
    userId: string,
    externalDbId: string,
  ): Promise<unknown | null> {
    return this.memoryPort.getCachedSchema(userId, externalDbId);
  }

  /**
   * 刷新 Schema 缓存
   * @param userId 用户ID
   * @param externalDbId 外部数据库ID
   * @param newSchema 新的 Schema 数据
   */
  async refreshSchemaCache(
    userId: string,
    externalDbId: string,
    newSchema: unknown,
  ): Promise<void> {
    await this.memoryPort.cacheSchema(userId, externalDbId, newSchema);
  }
}
