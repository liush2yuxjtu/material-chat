/**
 * Composition Root - 依赖注入容器
 * 根据环境变量选择和初始化适配器
 */

import { LLMPort } from '@/shared/ports/LLMPort';
import { DatabasePort } from '@/shared/ports/DatabasePort';
import { StoragePort } from '@/shared/ports/StoragePort';
import { SandboxPort } from '@/shared/ports/SandboxPort';
import { MemoryPort } from '@/shared/ports/MemoryPort';

import { KimiAdapter } from '@/adapters/llm/KimiAdapter';
import { PostgresAdapter } from '@/adapters/database/PostgresAdapter';
import { LocalFileSystemAdapter } from '@/adapters/storage/LocalFileSystemAdapter';
import { VercelSandboxAdapter } from '@/adapters/sandbox/VercelSandboxAdapter';
import { PostgresMemoryAdapter } from '@/adapters/postgres/PostgresMemoryAdapter';
import { prisma } from '@/lib/prisma';

export interface AppDependencies {
  llm: LLMPort;
  database: DatabasePort;
  storage: StoragePort;
  sandbox: SandboxPort;
  memory: MemoryPort;
}

export class CompositionRoot {
  private static instance: CompositionRoot;
  private dependencies: AppDependencies | null = null;

  private constructor() {}

  static getInstance(): CompositionRoot {
    if (!CompositionRoot.instance) {
      CompositionRoot.instance = new CompositionRoot();
    }
    return CompositionRoot.instance;
  }

  /**
   * 初始化所有依赖（根据环境变量）
   */
  initialize(): AppDependencies {
    if (this.dependencies) {
      return this.dependencies;
    }

    // 初始化 LLM 适配器
    const llm = this.createLLMAdapter();

    // 初始化数据库适配器
    const database = this.createDatabaseAdapter();

    // 初始化存储适配器
    const storage = this.createStorageAdapter();

    // 初始化沙盒适配器
    const sandbox = this.createSandboxAdapter();

    // 初始化内存适配器（使用共享 Prisma Client）
    const memory = this.createMemoryAdapter();

    this.dependencies = {
      llm,
      database,
      storage,
      sandbox,
      memory,
    };

    return this.dependencies;
  }

  /**
   * 获取已初始化的依赖
   */
  getDependencies(): AppDependencies {
    if (!this.dependencies) {
      throw new Error('CompositionRoot 尚未初始化，请先调用 initialize()');
    }
    return this.dependencies;
  }

  private createLLMAdapter(): LLMPort {
    const apiKey = process.env.KIMI_API_KEY;
    const baseUrl = process.env.KIMI_BASE_URL || 'https://api.kimi.com/coding';
    const model = process.env.KIMI_MODEL || 'claude-sonnet-4-6';

    if (!apiKey) {
      throw new Error('环境变量 KIMI_API_KEY 未设置');
    }

    return new KimiAdapter(apiKey, baseUrl, model);
  }

  private createDatabaseAdapter(): DatabasePort {
    const host = process.env.POSTGRES_HOST || 'localhost';
    const port = parseInt(process.env.POSTGRES_PORT || '5432', 10);
    const database = process.env.POSTGRES_DB || 'material_chat';
    const user = process.env.POSTGRES_USER || 'postgres';
    const password = process.env.POSTGRES_PASSWORD || '';
    const ssl = process.env.POSTGRES_SSL === 'true';

    if (!password) {
      throw new Error('环境变量 POSTGRES_PASSWORD 未设置');
    }

    return new PostgresAdapter({
      host,
      port,
      database,
      user,
      password,
      ssl,
      connectionTimeout: 10000,
    });
  }

  private createStorageAdapter(): StoragePort {
    const storageType = process.env.STORAGE_TYPE || 'local';

    if (storageType === 'local') {
      const baseDir = process.env.STORAGE_BASE_DIR || './storage/files';
      const baseUrl = process.env.STORAGE_BASE_URL || 'http://localhost:3000/files';
      return new LocalFileSystemAdapter(baseDir, baseUrl);
    }

    // TODO: 未来支持 OSS
    // if (storageType === 'oss') {
    //   return new OSSAdapter(...);
    // }

    throw new Error(`不支持的存储类型: ${storageType}`);
  }

  private createSandboxAdapter(): SandboxPort {
    const sandboxType = process.env.SANDBOX_TYPE || 'vercel';

    if (sandboxType === 'vercel') {
      const apiKey = process.env.VERCEL_SANDBOX_API_KEY;
      if (!apiKey) {
        throw new Error('环境变量 VERCEL_SANDBOX_API_KEY 未设置');
      }
      return new VercelSandboxAdapter(apiKey);
    }

    // TODO: 未来支持阿里云函数计算
    // if (sandboxType === 'aliyun') {
    //   return new AliyunFCSandboxAdapter(...);
    // }

    throw new Error(`不支持的沙盒类型: ${sandboxType}`);
  }

  private createMemoryAdapter(): MemoryPort {
    return new PostgresMemoryAdapter(prisma);
  }

  /**
   * 清理所有资源
   */
  async cleanup(): Promise<void> {
    if (this.dependencies) {
      await this.dependencies.database.close();
    }
  }
}

/**
 * 全局访问依赖的辅助函数
 */
export function getDependencies(): AppDependencies {
  return CompositionRoot.getInstance().getDependencies();
}
