import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

/**
 * 数据库初始化脚本
 * 读取 schema.sql 并执行建表语句
 */
export async function initDatabase(connectionString: string): Promise<void> {
  const pool = new Pool({ connectionString });

  try {
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf-8');

    console.log('正在初始化数据库表结构...');
    await pool.query(schemaSql);
    console.log('✅ 数据库表结构初始化完成');

  } catch (error) {
    console.error('❌ 数据库初始化失败:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('❌ 请设置 DATABASE_URL 环境变量');
    process.exit(1);
  }

  initDatabase(dbUrl)
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
