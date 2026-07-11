/**
 * SandboxPort - 沙盒执行抽象端口
 *
 * 支持双轨实现：
 * - VercelSandboxAdapter (Vercel Sandbox)
 * - AliyunFCSandboxAdapter (阿里云函数计算)
 */

export interface SandboxPort {
  /**
   * 在沙盒中执行命令
   * @param command 要执行的命令
   * @param options 执行选项
   * @returns 执行结果（stdout, stderr, exitCode）
   */
  execute(command: string, options?: ExecOptions): Promise<ExecResult>;

  /**
   * 查询沙盒存活状态和空闲时长
   * @returns 沙盒状态信息
   */
  status(): Promise<SandboxStatus>;

  /**
   * 强制销毁沙盒实例
   * @returns void
   */
  destroy(): Promise<void>;
}

/**
 * 执行选项
 */
export interface ExecOptions {
  /** 工作目录 */
  cwd?: string;
  /** 环境变量 */
  env?: Record<string, string>;
  /** 超时时间（毫秒） */
  timeout?: number;
  /** 最大内存限制（MB） */
  maxMemoryMB?: number;
}

/**
 * 执行结果
 */
export interface ExecResult {
  /** 标准输出 */
  stdout: string;
  /** 标准错误输出 */
  stderr: string;
  /** 退出码 */
  exitCode: number;
  /** 执行耗时（毫秒） */
  durationMs: number;
}

/**
 * 沙盒状态
 */
export interface SandboxStatus {
  /** 是否存活 */
  alive: boolean;
  /** 空闲时长（秒） */
  idleSeconds: number;
  /** 提供商标识 */
  provider: 'vercel' | 'aliyun-fc';
}
