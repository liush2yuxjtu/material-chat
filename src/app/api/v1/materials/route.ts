/**
 * Materials API 端点
 * POST /api/v1/materials - 上传素材
 * GET /api/v1/materials - 列出素材
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { UploadMaterialUseCase } from '@/application/use-cases/UploadMaterialUseCase';
import { ListMaterialsUseCase } from '@/application/use-cases/ListMaterialsUseCase';
import { MockOSSAdapter } from '@/adapters/material/MockOSSAdapter';
import { FileData } from '@/shared/ports/MaterialPort';

/**
 * POST - 上传素材
 */
export async function POST(request: NextRequest) {
  try {
    // 1. 验证用户身份
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    // 2. 解析 FormData
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string;
    const tagsStr = formData.get('tags') as string;

    if (!file) {
      return NextResponse.json({ error: '未提供文件' }, { status: 400 });
    }

    if (!type || !['image', 'video', 'document', 'other'].includes(type)) {
      return NextResponse.json({ error: '无效的素材类型' }, { status: 400 });
    }

    // 3. 转换文件为 Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 4. 构建 FileData
    const fileData: FileData = {
      filename: file.name,
      content: buffer,
      mimeType: file.type,
      size: file.size,
    };

    // 5. 解析标签
    const tags = tagsStr ? tagsStr.split(',').map(t => t.trim()).filter(Boolean) : [];

    // 6. 创建 UseCase 并执行上传
    const mockAdapter = new MockOSSAdapter();
    const uploadUseCase = new UploadMaterialUseCase(mockAdapter);

    const result = await uploadUseCase.execute({
      userId: session.user.id,
      file: fileData,
      type: type as 'image' | 'video' | 'document' | 'other',
      tags,
    });

    return NextResponse.json(result, { status: 201 });

  } catch (error) {
    console.error('素材上传失败:', error);
    const errorMessage = error instanceof Error ? error.message : '上传失败';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

/**
 * GET - 列出素材
 */
export async function GET(request: NextRequest) {
  try {
    // 1. 验证用户身份
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    // 2. 解析查询参数
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as 'image' | 'video' | 'document' | 'other' | null;
    const tagsStr = searchParams.get('tags');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);

    // 3. 解析标签
    const tags = tagsStr ? tagsStr.split(',').map(t => t.trim()).filter(Boolean) : undefined;

    // 4. 创建 UseCase 并执行查询
    const listUseCase = new ListMaterialsUseCase();

    const result = await listUseCase.execute({
      userId: session.user.id,
      type: type || undefined,
      tags,
      page,
      pageSize,
    });

    return NextResponse.json(result);

  } catch (error) {
    console.error('素材列表查询失败:', error);
    const errorMessage = error instanceof Error ? error.message : '查询失败';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
