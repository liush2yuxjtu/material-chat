# Memory 持久化功能

## 概述

Memory 持久化模块实现了用户偏好、查询模板学习和 Schema 缓存功能，支持跨会话记忆和智能查询优化。

## 核心功能

### 1. 用户偏好管理
保存和读取用户的个性化设置，如语言、主题、默认数据库等。

### 2. 查询模板学习
自动学习用户的查询模式，将自然语言意图映射到 SQL 模板，提高后续查询效率。

### 3. Schema 缓存
缓存数据库元数据，避免重复查询，提升性能。

## 快速开始

### 1. 环境配置

复制 `.env.example` 为 `.env` 并配置数据库连接：

```bash
cp .env.example .env
```

### 2. 初始化数据库

```bash
npm run init-db
```

### 3. 使用示例

```typescript
import { memoryAdapter, persistMemory, recallMemory } from './use-cases';

// 保存用户偏好
await persistMemory.saveUserPreference('user123', 'language', 'zh-CN');

// 读取偏好
const lang = await recallMemory.getUserPreference('user123', 'language', 'en-US');

// 学习查询模板
await persistMemory.learnQueryTemplate(
  'user123',
  '查询所有素材',
  'SELECT * FROM materials'
);

// 匹配模板
const template = await recallMemory.findBestQueryTemplate('user123', '看看素材');
```

## 数据库表结构

- `user_preferences`: 用户偏好表
- `query_templates`: 查询模板表
- `schema_cache`: Schema 缓存表

详见 `src/adapters/postgres/schema.sql`

## 验收标准

- ✅ AC-009: 跨会话偏好生效
- ✅ AC-011: 查询模板命中统计
