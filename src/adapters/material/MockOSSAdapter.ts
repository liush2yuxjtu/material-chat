/**
 * MockOSSAdapter - 模拟阿里云 OSS 的存储适配器
 *
 * 用途：开发和测试环境
 * 实际行为：将文件存储到本地临时目录 /tmp/material-chat/
 * 返回：模拟的 OSS URL（http://mock-oss.local/...）
 */

import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import { randomUUID } from 'crypto';
import { Readable } from 'stream';
import {
  MaterialPort,
  FileData,
  MaterialMetadata,
  UploadResult,
} from '@/shared/ports/MaterialPort';

const mkdirAsync = promisify(fs.mkdir);
const writeFileAsync = promisify(fs.writeFile);
const readFileAsync = promisify(fs.readFile);
const unlinkAsync = promisify(fs.unlink);
const statAsync = promisify(fs.stat);

export class MockOSSAdapter implements MaterialPort {
  private baseDir: string;
  private mockDomain: string;

  constructor(
    baseDir: string = '/tmp/material-chat',
    mockDomain: string = 'http://mock-oss.local'
  ) {
    this.baseDir = baseDir;
    this.mockDomain = mockDomain;
    this.ensureBaseDir();
  }

  /**
   * 上传文件到模拟 OSS（实际存本地临时目录）
   */
  async upload(
    file: FileData,
    metadata: MaterialMetadata
  ): Promise<UploadResult> {
    try {
      // 生成 OSS 风格的 key: userId/type/uuid-filename
      const fileId = randomUUID();
      const ext = path.extname(file.filename);
      const key = `${metadata.userId}/${metadata.type}/${fileId}${ext}`;

      // 确保目录存在
      const dirPath = path.join(this.baseDir, metadata.userId, metadata.type);
      await this.ensureDir(dirPath);

      // 写入文件
      const filePath = path.join(this.baseDir, key);
      if (Buffer.isBuffer(file.content)) {
        await writeFileAsync(filePath, file.content);
      } else {
        // 处理 ReadableStream
        const chunks: Buffer[] = [];
        const stream = file.content as ReadableStream;
        const reader = stream.getReader();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(Buffer.from(value));
        }

        const buffer = Buffer.concat(chunks);
        await writeFileAsync(filePath, buffer);
      }

      // 写入元数据文件
      const metaPath = path.join(this.baseDir, `${key}.meta.json`);
      const metaData = {
        key,
        filename: file.filename,
        mimeType: file.mimeType,
        size: file.size,
        userId: metadata.userId,
        type: metadata.type,
        tags: metadata.tags || [],
        originalName: metadata.originalName || file.filename,
        uploadedAt: new Date().toISOString(),
      };
      await writeFileAsync(metaPath, JSON.stringify(metaData, null, 2));

      // 返回模拟的 OSS URL
      const mockUrl = `${this.mockDomain}/${key}`;

      return {
        key,
        url: mockUrl,
        size: file.size,
        uploadedAt: new Date(),
      };
    } catch (error) {
      console.error('MockOSS 上传失败:', error);
      throw new Error(`上传失败: ${(error as Error).message}`);
    }
  }

  /**
   * 从模拟 OSS 下载文件
   */
  async download(key: string): Promise<ReadableStream> {
    try {
      const filePath = path.join(this.baseDir, key);

      if (!fs.existsSync(filePath)) {
        throw new Error(`文件不存在: ${key}`);
      }

      const buffer = await readFileAsync(filePath);

      // 将 Buffer 转换为 ReadableStream
      return new ReadableStream({
        start(controller) {
          controller.enqueue(buffer);
          controller.close();
        },
      });
    } catch (error) {
      console.error('MockOSS 下载失败:', error);
      throw error;
    }
  }

  /**
   * 从模拟 OSS 删除文件
   */
  async delete(key: string): Promise<void> {
    try {
      const filePath = path.join(this.baseDir, key);
      const metaPath = path.join(this.baseDir, `${key}.meta.json`);

      if (fs.existsSync(filePath)) {
        await unlinkAsync(filePath);
      }

      if (fs.existsSync(metaPath)) {
        await unlinkAsync(metaPath);
      }
    } catch (error) {
      console.error('MockOSS 删除失败:', error);
      throw new Error(`删除失败: ${(error as Error).message}`);
    }
  }

  /**
   * 生成预签名 URL（模拟）
   * 注意：Mock 实现直接返回公开 URL，不做真实的签名
   */
  async getSignedUrl(key: string, expiresIn: number): Promise<string> {
    // 在真实 OSS 中，这会生成一个带时效的签名 URL
    // Mock 实现简单返回公开 URL + 过期时间参数
    const expireTime = Date.now() + expiresIn * 1000;
    return `${this.mockDomain}/${key}?expires=${expireTime}&signature=mock-signature`;
  }

  /**
   * 确保基础目录存在
   */
  private ensureBaseDir(): void {
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
  }

  /**
   * 确保目录存在
   */
  private async ensureDir(dir: string): Promise<void> {
    if (!fs.existsSync(dir)) {
      await mkdirAsync(dir, { recursive: true });
    }
  }
}
