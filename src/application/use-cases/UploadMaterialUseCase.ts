/**
 * 上传素材用例
 * 处理文件上传、校验、存储和数据库记录
 */

import { MaterialPort, FileData, MaterialMetadata } from '@/shared/ports/MaterialPort';
import { prisma } from '@/lib/prisma';

// 文件大小限制：100MB
const MAX_FILE_SIZE = 100 * 1024 * 1024;

// 允许的 MIME 类型
const ALLOWED_MIME_TYPES = {
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  video: ['video/mp4', 'video/webm', 'video/quicktime'],
  document: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
  ],
};

export interface UploadMaterialRequest {
  userId: string;
  file: FileData;
  type: 'image' | 'video' | 'document' | 'other';
  tags?: string[];
}

export interface UploadMaterialResponse {
  materialId: string;
  url: string;
  key: string;
  size: number;
  mimeType: string;
  createdAt: Date;
}

export class UploadMaterialUseCase {
  constructor(private materialAdapter: MaterialPort) {}

  /**
   * 上传素材
   */
  async execute(request: UploadMaterialRequest): Promise<UploadMaterialResponse> {
    const { userId, file, type, tags } = request;

    // 1. 校验文件大小
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`文件大小超过限制（最大 100MB）`);
    }

    // 2. 校验 MIME 类型
    this.validateMimeType(file.mimeType, type);

    // 3. 上传到存储适配器
    const metadata: MaterialMetadata = {
      userId,
      type,
      tags: tags || [],
      originalName: file.filename,
    };

    const uploadResult = await this.materialAdapter.upload(file, metadata);

    // 4. 保存到数据库
    const material = await prisma.material.create({
      data: {
        userId,
        name: file.filename,
        type,
        ossKey: uploadResult.key,
        localPath: uploadResult.key,
        size: uploadResult.size,
        mimeType: file.mimeType,
        tags: tags || [],
      },
    });

    return {
      materialId: material.id,
      url: uploadResult.url,
      key: uploadResult.key,
      size: material.size,
      mimeType: material.mimeType,
      createdAt: material.createdAt,
    };
  }

  /**
   * 校验 MIME 类型
   */
  private validateMimeType(mimeType: string, type: string): void {
    if (type === 'other') {
      // 'other' 类型允许任意 MIME
      return;
    }

    const allowedTypes = ALLOWED_MIME_TYPES[type as keyof typeof ALLOWED_MIME_TYPES];
    if (!allowedTypes || !allowedTypes.includes(mimeType)) {
      throw new Error(
        `不支持的文件类型。${type} 类型允许的格式：${allowedTypes?.join(', ')}`
      );
    }
  }
}
