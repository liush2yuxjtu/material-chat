/**
 * MaterialPort - 素材存储抽象端口
 *
 * 支持双轨实现：
 * - OSSAdapter (阿里云 OSS，生产环境)
 * - LocalFileSystemAdapter (本地文件系统，开发环境)
 */

export interface MaterialPort {
  /**
   * 上传素材文件
   * @param file 文件数据
   * @param metadata 元数据
   * @returns 上传结果（URL、key 等）
   */
  upload(file: FileData, metadata: MaterialMetadata): Promise<UploadResult>;

  /**
   * 下载素材文件
   * @param key 素材唯一标识（OSS key 或本地路径）
   * @returns 文件数据流
   */
  download(key: string): Promise<ReadableStream>;

  /**
   * 删除素材文件
   * @param key 素材唯一标识
   * @returns void
   */
  delete(key: string): Promise<void>;

  /**
   * 生成预签名 URL（用于直接访问）
   * @param key 素材唯一标识
   * @param expiresIn 过期时间（秒）
   * @returns 预签名 URL
   */
  getSignedUrl(key: string, expiresIn: number): Promise<string>;
}

/**
 * 文件数据
 */
export interface FileData {
  /** 文件名 */
  filename: string;
  /** 文件内容（Buffer 或 Stream） */
  content: Buffer | ReadableStream;
  /** MIME 类型 */
  mimeType: string;
  /** 文件大小（字节） */
  size: number;
}

/**
 * 素材元数据
 */
export interface MaterialMetadata {
  /** 用户 ID */
  userId: string;
  /** 素材类型 */
  type: 'image' | 'video' | 'document' | 'other';
  /** 自定义标签 */
  tags?: string[];
  /** 原始文件名 */
  originalName?: string;
}

/**
 * 上传结果
 */
export interface UploadResult {
  /** 素材唯一标识（OSS key 或本地路径） */
  key: string;
  /** 可访问 URL */
  url: string;
  /** 文件大小 */
  size: number;
  /** 上传时间戳 */
  uploadedAt: Date;
}
