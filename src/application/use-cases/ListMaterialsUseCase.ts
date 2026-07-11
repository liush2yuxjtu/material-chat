/**
 * 列出素材用例
 * 支持分页、标签筛选、类型筛选
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface ListMaterialsRequest {
  userId: string;
  type?: 'image' | 'video' | 'document' | 'other';
  tags?: string[];
  page?: number;
  pageSize?: number;
}

export interface MaterialItem {
  id: string;
  name: string;
  type: string;
  url: string;
  size: number;
  mimeType: string;
  tags: string[];
  createdAt: Date;
}

export interface ListMaterialsResponse {
  materials: MaterialItem[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export class ListMaterialsUseCase {
  /**
   * 列出用户的素材
   */
  async execute(request: ListMaterialsRequest): Promise<ListMaterialsResponse> {
    const { userId, type, tags, page = 1, pageSize = 20 } = request;

    // 构建查询条件
    const where: any = { userId };

    if (type) {
      where.type = type;
    }

    if (tags && tags.length > 0) {
      where.tags = {
        hasSome: tags,
      };
    }

    // 计算偏移量
    const skip = (page - 1) * pageSize;

    // 查询总数
    const total = await prisma.material.count({ where });

    // 查询素材列表
    const materials = await prisma.material.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
    });

    // 转换为响应格式
    const materialItems: MaterialItem[] = materials.map((m) => ({
      id: m.id,
      name: m.name,
      type: m.type,
      url: this.buildMaterialUrl(m),
      size: m.size,
      mimeType: m.mimeType,
      tags: m.tags,
      createdAt: m.createdAt,
    }));

    return {
      materials: materialItems,
      total,
      page,
      pageSize,
      hasMore: skip + materials.length < total,
    };
  }

  /**
   * 构建素材访问 URL
   */
  private buildMaterialUrl(material: any): string {
    // 优先使用 OSS URL，否则使用本地路径
    if (material.ossKey) {
      // 在生产环境应该从环境变量读取 OSS 域名
      const ossDomain = process.env.OSS_DOMAIN || 'http://mock-oss.local';
      return `${ossDomain}/${material.ossKey}`;
    }

    if (material.localPath) {
      const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
      return `${baseUrl}/uploads/${material.localPath}`;
    }

    return '';
  }
}
