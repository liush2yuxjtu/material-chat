/**
 * Prisma Seed 脚本
 * 用于初始化测试数据
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 开始 seed 数据...');

  // 1. 创建测试用户
  const hashedPassword = await bcrypt.hash('test123', 10);
  
  const user = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      name: '测试用户',
      password: hashedPassword,
    },
  });

  console.log('✅ 创建测试用户:', user.email);

  // 2. 创建测试对话
  const conversation = await prisma.conversation.create({
    data: {
      title: '第一次对话',
      userId: user.id,
    },
  });

  console.log('✅ 创建测试对话:', conversation.id);

  // 3. 创建测试消息
  await prisma.message.createMany({
    data: [
      {
        conversationId: conversation.id,
        role: 'user',
        content: '你好，请帮我查询数据库中的用户表。',
      },
      {
        conversationId: conversation.id,
        role: 'assistant',
        content: '好的，我来帮你查询用户表。',
        sql: 'SELECT * FROM users LIMIT 10;',
      },
    ],
  });

  console.log('✅ 创建测试消息');

  // 4. 创建测试素材
  await prisma.material.createMany({
    data: [
      {
        userId: user.id,
        name: '测试图片.png',
        type: 'image',
        localPath: '/uploads/test-image.png',
        size: 1024000,
        mimeType: 'image/png',
        tags: ['测试', '图片'],
      },
      {
        userId: user.id,
        name: '测试文档.pdf',
        type: 'document',
        localPath: '/uploads/test-doc.pdf',
        size: 2048000,
        mimeType: 'application/pdf',
        tags: ['测试', '文档'],
      },
    ],
  });

  console.log('✅ 创建测试素材');

  // 5. 创建用户偏好
  await prisma.userPreference.create({
    data: {
      userId: user.id,
      key: 'language',
      value: 'zh-CN',
    },
  });

  console.log('✅ 创建用户偏好');

  // 6. 创建外部数据库连接（测试）
  const externalDb = await prisma.externalDatabase.create({
    data: {
      userId: user.id,
      name: '测试数据库',
      host: 'localhost',
      port: 5432,
      database: 'test_db',
      username: 'test_user',
      encryptedPassword: 'encrypted_password_placeholder',
      sslEnabled: true,
    },
  });

  console.log('✅ 创建外部数据库连接:', externalDb.name);

  console.log('🎉 Seed 完成！');
}

main()
  .catch((e) => {
    console.error('❌ Seed 失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
