/**
 * Memory 持久化功能使用示例
 * 展示如何在应用中集成记忆功能
 */

import { PostgresMemoryAdapter } from '../../adapters/postgres/PostgresMemoryAdapter';
import { PersistMemoryUseCase } from './PersistMemoryUseCase';
import { RecallMemoryUseCase } from './RecallMemoryUseCase';

interface CachedSchema {
  dbId: string;
  userId: string;
  tables: Array<{
    name: string;
    columns: Array<{ name: string; type: string; nullable: boolean }>;
    indexes: string[];
  }>;
  cachedAt: Date;
  expiresAt: Date;
}

function isCachedSchema(value: unknown): value is CachedSchema {
  return (
    typeof value === 'object'
    && value !== null
    && 'tables' in value
    && Array.isArray((value as { tables?: unknown }).tables)
  );
}

// 初始化适配器和用例；PrismaClient 会从 DATABASE_URL 读取连接配置。
const memoryAdapter = new PostgresMemoryAdapter();
const persistMemory = new PersistMemoryUseCase(memoryAdapter);
const recallMemory = new RecallMemoryUseCase(memoryAdapter);

/**
 * 示例 1: 保存和读取用户偏好
 */
async function exampleUserPreferences() {
  const userId = 'user123';

  // 保存用户偏好
  await persistMemory.saveUserPreference(userId, 'language', 'zh-CN');
  await persistMemory.saveUserPreference(userId, 'theme', 'dark');
  await persistMemory.saveUserPreference(userId, 'defaultDatabase', 'prod_db');

  // 读取单个偏好
  const language = await recallMemory.getUserPreference(userId, 'language', 'en-US');
  console.log('用户语言偏好:', language); // zh-CN

  // 当前公共 API 按键读取偏好；会话初始化时可并行读取所需键。
  const [theme, defaultDatabase] = await Promise.all([
    recallMemory.getUserPreference(userId, 'theme', 'light'),
    recallMemory.getUserPreference(userId, 'defaultDatabase', ''),
  ]);
  console.log('会话偏好:', { language, theme, defaultDatabase });
}

/**
 * 示例 2: 查询模板学习和匹配
 */
async function exampleQueryTemplates() {
  const userId = 'user123';

  // 用户执行查询后，系统自动学习
  const userIntent1 = '查询所有素材的数量';
  const generatedSql1 = 'SELECT COUNT(*) FROM materials';
  await persistMemory.learnQueryTemplate(
    userId,
    '素材数量',
    userIntent1,
    generatedSql1,
  );

  const userIntent2 = '查看最近上传的素材';
  const generatedSql2 = 'SELECT * FROM materials ORDER BY created_at DESC LIMIT 10';
  await persistMemory.learnQueryTemplate(
    userId,
    '最近上传素材',
    userIntent2,
    generatedSql2,
  );

  // 下次用户输入类似意图，自动匹配模板
  const newIntent = '看看素材总数有多少';
  const matchedTemplate = await recallMemory.findBestQueryTemplate(userId, newIntent);

  if (matchedTemplate) {
    console.log('找到匹配的模板:');
    console.log('  描述:', matchedTemplate.description);
    console.log('  SQL:', matchedTemplate.sqlTemplate);
    console.log('  命中次数:', matchedTemplate.useCount);
    // 可以直接使用或作为提示
  } else {
    console.log('未找到匹配模板，需要生成新查询');
  }
}

/**
 * 示例 3: Schema 缓存管理
 */
async function exampleSchemaCache() {
  const userId = 'user123';
  const dbId = 'prod_db';

  // 首次连接数据库，获取并缓存 Schema
  const schema: CachedSchema = {
    dbId,
    userId,
    tables: [
      {
        name: 'materials',
        columns: [
          { name: 'id', type: 'uuid', nullable: false },
          { name: 'title', type: 'varchar', nullable: false },
          { name: 'created_at', type: 'timestamp', nullable: false },
        ],
        indexes: ['idx_materials_created_at'],
      },
    ],
    cachedAt: new Date(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24小时后
  };

  await memoryAdapter.cacheSchema(userId, dbId, schema);

  // 后续查询时，直接从缓存读取
  const cachedSchema = await recallMemory.getCachedSchema(userId, dbId);
  if (isCachedSchema(cachedSchema)) {
    console.log('使用缓存的 Schema，避免重复查询数据库元数据');
    console.log('表数量:', cachedSchema.tables.length);
  } else {
    console.log('缓存已过期或结构无效，需要重新获取 Schema');
  }

  // 数据库结构变更后，刷新缓存
  const updatedSchema: CachedSchema = {
    ...schema,
    tables: [...schema.tables],
    cachedAt: new Date(),
  };
  await recallMemory.refreshSchemaCache(userId, dbId, updatedSchema);
}

/**
 * 示例 4: 完整的会话流程
 */
async function exampleFullSession() {
  const userId = 'user456';

  console.log('=== 会话开始 ===');

  // 1. 加载当前会话需要的用户偏好
  const language = await recallMemory.getUserPreference(userId, 'language', 'zh-CN');
  console.log('已加载语言偏好:', language);

  // 2. 用户输入查询意图
  const userInput = '帮我找出今天上传的素材';

  // 3. 尝试匹配历史模板
  const template = await recallMemory.findBestQueryTemplate(userId, userInput);

  if (template) {
    console.log('✅ 命中历史模板，直接使用');
    console.log('SQL:', template.sqlTemplate);
  } else {
    console.log('⚠️ 未命中模板，调用 LLM 生成新查询');
    const newSql = "SELECT * FROM materials WHERE DATE(created_at) = CURRENT_DATE";

    // 4. 学习新模板
    await persistMemory.learnQueryTemplate(
      userId,
      '今日上传素材',
      userInput,
      newSql,
    );
    console.log('💾 已保存新模板，下次可直接使用');
  }

  // 5. 更新用户偏好
  await persistMemory.saveUserPreference(userId, 'lastQuery', userInput);

  console.log('=== 会话结束 ===');
}

// 导出供其他模块使用
export {
  memoryAdapter,
  persistMemory,
  recallMemory,
  exampleUserPreferences,
  exampleQueryTemplates,
  exampleSchemaCache,
  exampleFullSession,
};
