/**
 * Storage 存储端口接口
 * 负责文件上传、下载和管理（支持 OSS 或本地文件系统）
 */

export interface UploadResult {
  fileId: string;
  url: string;
  size: number;
  mimeType: string;
  uploadedAt: Date;
}

export interface FileMetadata {
  fileId: string;
  fileName: string;
  size: number;
  mimeType: string;
  url: string;
  uploadedBy: string;
  uploadedAt: Date;
}

export interface StoragePort {
  /**
   * 上传文件
   * @param file 文件内容（Buffer 或流）
   * @param fileName 文件名
   * @param userId 用户 ID
   * @returns 上传结果
   */
  upload(
    file: Buffer | NodeJS.ReadableStream,
    fileName: string,
    userId: string
  ): Promise<UploadResult>;

  /**
   * 下载文件
   * @param fileId 文件 ID
   * @returns 文件内容流
   */
  download(fileId: string): Promise<NodeJS.ReadableStream>;

  /**
   * 获取文件元数据
   * @param fileId 文件 ID
   * @returns 文件元数据
   */
  getMetadata(fileId: string): Promise<FileMetadata>;

  /**
   * 删除文件
   * @param fileId 文件 ID
   */
  delete(fileId: string): Promise<void>;

  /**
   * 列出用户的所有文件
   * @param userId 用户 ID
   * @returns 文件列表
   */
  listFiles(userId: string): Promise<FileMetadata[]>;
}
