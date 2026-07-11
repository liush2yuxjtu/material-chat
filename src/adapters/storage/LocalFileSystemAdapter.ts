/**
 * 本地文件系统存储适配器
 * 用于开发环境和小规模部署
 */

import * as fs from 'fs';
import * as path from 'path';
import { createReadStream, createWriteStream } from 'fs';
import { promisify } from 'util';
import { pipeline } from 'stream';
import { randomUUID } from 'crypto';
import {
  StoragePort,
  UploadResult,
  FileMetadata,
} from '@/shared/ports/StoragePort';

const pipelineAsync = promisify(pipeline);
const mkdirAsync = promisify(fs.mkdir);
const statAsync = promisify(fs.stat);
const unlinkAsync = promisify(fs.unlink);
const readdirAsync = promisify(fs.readdir);

export class LocalFileSystemAdapter implements StoragePort {
  private baseDir: string;
  private baseUrl: string;

  constructor(baseDir: string, baseUrl: string = 'http://localhost:3000/files') {
    this.baseDir = baseDir;
    this.baseUrl = baseUrl;
    this.ensureBaseDir();
  }

  async upload(
    file: Buffer | NodeJS.ReadableStream,
    fileName: string,
    userId: string
  ): Promise<UploadResult> {
    try {
      const fileId = randomUUID();
      const ext = path.extname(fileName);
      const userDir = path.join(this.baseDir, userId);

      await this.ensureDir(userDir);

      const filePath = path.join(userDir, `${fileId}${ext}`);
      const metadataPath = path.join(userDir, `${fileId}.meta.json`);

      // 写入文件
      if (Buffer.isBuffer(file)) {
        await promisify(fs.writeFile)(filePath, file);
      } else {
        const writeStream = createWriteStream(filePath);
        await pipelineAsync(file, writeStream);
      }

      // 获取文件大小和 MIME 类型
      const stats = await statAsync(filePath);
      const mimeType = this.getMimeType(ext);

      // 写入元数据
      const metadata: FileMetadata = {
        fileId,
        fileName,
        size: stats.size,
        mimeType,
        url: `${this.baseUrl}/${userId}/${fileId}${ext}`,
        uploadedBy: userId,
        uploadedAt: new Date(),
      };

      await promisify(fs.writeFile)(
        metadataPath,
        JSON.stringify(metadata, null, 2)
      );

      return {
        fileId,
        url: metadata.url,
        size: stats.size,
        mimeType,
        uploadedAt: metadata.uploadedAt,
      };
    } catch (error) {
      console.error('文件上传失败:', error);
      throw new Error(`文件上传失败: ${(error as Error).message}`);
    }
  }

  async download(fileId: string): Promise<NodeJS.ReadableStream> {
    try {
      const metadata = await this.getMetadata(fileId);
      const ext = path.extname(metadata.fileName);
      const filePath = path.join(
        this.baseDir,
        metadata.uploadedBy,
        `${fileId}${ext}`
      );

      if (!fs.existsSync(filePath)) {
        throw new Error(`文件不存在: ${fileId}`);
      }

      return createReadStream(filePath);
    } catch (error) {
      console.error('文件下载失败:', error);
      throw error;
    }
  }

  async getMetadata(fileId: string): Promise<FileMetadata> {
    try {
      // 遍历所有用户目录查找元数据文件
      const userDirs = await readdirAsync(this.baseDir);

      for (const userDir of userDirs) {
        const metadataPath = path.join(
          this.baseDir,
          userDir,
          `${fileId}.meta.json`
        );

        if (fs.existsSync(metadataPath)) {
          const content = await promisify(fs.readFile)(metadataPath, 'utf-8');
          return JSON.parse(content) as FileMetadata;
        }
      }

      throw new Error(`文件元数据不存在: ${fileId}`);
    } catch (error) {
      console.error('获取文件元数据失败:', error);
      throw error;
    }
  }

  async delete(fileId: string): Promise<void> {
    try {
      const metadata = await this.getMetadata(fileId);
      const ext = path.extname(metadata.fileName);
      const userDir = path.join(this.baseDir, metadata.uploadedBy);
      const filePath = path.join(userDir, `${fileId}${ext}`);
      const metadataPath = path.join(userDir, `${fileId}.meta.json`);

      if (fs.existsSync(filePath)) {
        await unlinkAsync(filePath);
      }
      if (fs.existsSync(metadataPath)) {
        await unlinkAsync(metadataPath);
      }
    } catch (error) {
      console.error('删除文件失败:', error);
      throw new Error(`删除文件失败: ${(error as Error).message}`);
    }
  }

  async listFiles(userId: string): Promise<FileMetadata[]> {
    try {
      const userDir = path.join(this.baseDir, userId);

      if (!fs.existsSync(userDir)) {
        return [];
      }

      const files = await readdirAsync(userDir);
      const metadataFiles = files.filter((f) => f.endsWith('.meta.json'));

      const result: FileMetadata[] = [];
      for (const metaFile of metadataFiles) {
        const metadataPath = path.join(userDir, metaFile);
        const content = await promisify(fs.readFile)(metadataPath, 'utf-8');
        result.push(JSON.parse(content));
      }

      return result.sort(
        (a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime()
      );
    } catch (error) {
      console.error('列出文件失败:', error);
      throw new Error(`列出文件失败: ${(error as Error).message}`);
    }
  }

  private ensureBaseDir(): void {
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
  }

  private async ensureDir(dir: string): Promise<void> {
    if (!fs.existsSync(dir)) {
      await mkdirAsync(dir, { recursive: true });
    }
  }

  private getMimeType(ext: string): string {
    const mimeTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.txt': 'text/plain',
      '.csv': 'text/csv',
    };
    return mimeTypes[ext.toLowerCase()] || 'application/octet-stream';
  }
}
