/**
 * Vercel Sandbox 真实适配器
 * 使用 Vercel Sandbox API 在隔离环境中执行 Bash 脚本
 */

import {
  SandboxPort,
  ExecResult,
  ExecOptions,
  SandboxStatus,
} from '@/shared/ports/SandboxPort';

export class VercelSandboxAdapter implements SandboxPort {
  private apiKey: string;
  private baseUrl: string;
  private sandboxId: string | null = null;
  private lastExecutionTime: number = 0;

  constructor(
    apiKey: string,
    baseUrl = 'https://api.vercel.com/v1/sandbox'
  ) {
    if (!apiKey) {
      throw new Error('Vercel API key 不能为空');
    }
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  async execute(command: string, options?: ExecOptions): Promise<ExecResult> {
    const startTime = Date.now();
    this.lastExecutionTime = startTime;

    try {
      const response = await fetch(`${this.baseUrl}/execute`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          command,
          cwd: options?.cwd,
          env: options?.env,
          timeout: options?.timeout || 30000,
          shell: 'bash',
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Vercel Sandbox API 调用失败: ${response.status} - ${errorText}`
        );
      }

      const data = await response.json();
      const durationMs = Date.now() - startTime;

      return {
        stdout: data.stdout || '',
        stderr: data.stderr || '',
        exitCode: data.exitCode || 0,
        durationMs,
      };
    } catch (error) {
      console.error('Vercel Sandbox 执行错误:', error);
      return {
        stdout: '',
        stderr: (error as Error).message,
        exitCode: 1,
        durationMs: Date.now() - startTime,
      };
    }
  }

  async status(): Promise<SandboxStatus> {
    const now = Date.now();
    const idleSeconds = this.lastExecutionTime
      ? Math.floor((now - this.lastExecutionTime) / 1000)
      : 0;

    return {
      alive: true,
      idleSeconds,
      provider: 'vercel',
    };
  }

  async destroy(): Promise<void> {
    // Vercel Sandbox 通常是无状态的，不需要显式销毁
    this.sandboxId = null;
    this.lastExecutionTime = 0;
  }
}
