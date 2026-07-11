/**
 * LocalFileSystemAdapter - 本地文件系统存储适配器
 *
 * 用途：开发环境的真实本地存储
 * 实际行为：将文件存储到项目的 uploads/ 目录
 * 返回：本地文件访问 URL（http://localhost:3000/uploads/...）
 */

import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import { randomUUID } from 'crypto';
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

export class LocalFileSystemAdapter implements MaterialPort {
  private baseDir: string;
  private baseUrl: string;

  constructor(
    baseDir: string = './uploads',
    baseUrl: string = 'http://localhost:3000/uploads'
  ) {
    this.baseDir = baseDir;
    this.baseUrl = baseUrl;
    this.ensureBaseDir();
  }

  /**
   * 上传文件到本地文件系统
   */
  async upload(
    file: FileData,
    metadata: MaterialMetadata
  ): Promise<UploadResult> {
    try {
      // 生成文件 key: userId/type/uuid-filename
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

      // 返回本地访问 URL
      const url = `${this.baseUrl}/${key}`;

      return {
        key,
        url,
        size: file.size,
        uploadedAt: new Date(),
      };
    } catch (error) {
      console.error('本地文件系统上传失败:', error);
      throw new Error(`上传失败: ${(error as Error).message}`);
    }
  }

  /**
   * 从本地文件系统下载文件
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
      console.error('本地文件系统下载失败:', error);
      throw error;
    }
  }

  /**
   * 从本地文件系统删除文件
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
      console.error('本地文件系统删除失败:', error);
      throw new Error(`删除失败: ${(error as Error).message}`);
    }
  }

  /**
   * 生成预签名 URL
   * 注意：本地文件系统不需要签名，直接返回公开 URL
   */
  async getSignedUrl(key: string, expiresIn: number): Promise<string> {
    // 本地文件系统不需要签名，直接返回 URL
    return `${this.baseUrl}/${key}`;
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
