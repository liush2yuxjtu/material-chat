import { MemoryPort } from '../../shared/ports/MemoryPort';

/**
 * 持久化记忆用例
 * 负责保存用户偏好和学习查询模板
 */
export class PersistMemoryUseCase {
  constructor(private memoryPort: MemoryPort) {}

  /**
   * 保存用户偏好
   * @param userId 用户ID
   * @param key 偏好键名（如 'language', 'theme', 'defaultDatabase'）
   * @param value 偏好值
   */
  async saveUserPreference(
    userId: string,
    key: string,
    value: unknown,
  ): Promise<void> {
    await this.memoryPort.savePreference(userId, key, value);
  }

  /**
   * 学习并保存查询模板
   * 当用户执行一个成功的查询后，系统自动提取意图和SQL，保存为模板
   * @param userId 用户ID
   * @param name 模板名称
   * @param description 用户意图描述（从自然语言提取）
   * @param sqlTemplate 生成的SQL模板
   */
  async learnQueryTemplate(
    userId: string,
    name: string,
    description: string,
    sqlTemplate: string,
  ): Promise<void> {
    // 检查是否已有相似模板
    const existingTemplate = await this.memoryPort.findMatchingTemplate(
      userId,
      description,
    );

    if (
      existingTemplate
      && this.isSimilarIntent(existingTemplate.description || '', description)
    ) {
      // 如果已存在相似模板，增加使用次数
      await this.memoryPort.incrementTemplateUse(existingTemplate.id);
    } else {
      // 否则创建新模板
      await this.memoryPort.saveQueryTemplate(
        userId,
        name,
        description,
        sqlTemplate,
      );
    }
  }

  /**
   * 判断两个意图是否相似
   * 简单实现：提取关键词，计算交集比例
   */
  private isSimilarIntent(intent1: string, intent2: string): boolean {
    const keywords1 = this.extractKeywords(intent1);
    const keywords2 = this.extractKeywords(intent2);

    const intersection = keywords1.filter((keyword) => (
      keywords2.includes(keyword)
    ));
    const union = [...new Set([...keywords1, ...keywords2])];

    // Jaccard 相似度 > 0.6 认为相似
    return intersection.length / union.length > 0.6;
  }

  /**
   * 提取关键词（简单分词）
   */
  private extractKeywords(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s一-龥]/g, '')
      .split(/\s+/)
      .filter((word) => word.length > 1);
  }
}
