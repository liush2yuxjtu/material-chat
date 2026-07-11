/**
 * Mock Vercel Sandbox 适配器
 * 用于开发和测试环境，模拟 Vercel Sandbox 行为
 * 返回固定的模拟输出，不实际执行命令
 */

import {
  SandboxPort,
  ExecResult,
  ExecOptions,
  SandboxStatus,
} from '@/shared/ports/SandboxPort';

export class MockVercelSandboxAdapter implements SandboxPort {
  private lastExecutionTime: number = 0;
  private executionCount: number = 0;

  // Vercel Sandbox 超时限制：5分钟
  private readonly TIMEOUT_MS = 5 * 60 * 1000;
  // 空闲10分钟自动销毁
  private readonly IDLE_TIMEOUT_MS = 10 * 60 * 1000;

  async execute(command: string, options?: ExecOptions): Promise<ExecResult> {
    const startTime = Date.now();
    this.lastExecutionTime = startTime;
    this.executionCount++;

    // 模拟执行延迟（100-200ms）
    const mockDelay = 100 + Math.random() * 100;
    await new Promise(resolve => setTimeout(resolve, mockDelay));

    // 检查超时限制
    const effectiveTimeout = options?.timeout || this.TIMEOUT_MS;
    if (effectiveTimeout > this.TIMEOUT_MS) {
      return {
        stdout: '',
        stderr: `[MOCK Vercel Sandbox] 错误: 超时限制不能超过 ${this.TIMEOUT_MS}ms (5分钟)`,
        exitCode: 1,
        durationMs: Date.now() - startTime,
      };
    }

    // 检查内存限制（模拟）
    if (options?.maxMemoryMB && options.maxMemoryMB > 1024) {
      return {
        stdout: '',
        stderr: '[MOCK Vercel Sandbox] 错误: 内存限制不能超过 1024MB',
        exitCode: 1,
        durationMs: Date.now() - startTime,
      };
    }

    // 模拟成功执行
    const mockOutput = this.generateMockOutput(command, options);
    const durationMs = Date.now() - startTime;

    return {
      stdout: mockOutput,
      stderr: '',
      exitCode: 0,
      durationMs,
    };
  }

  async status(): Promise<SandboxStatus> {
    const now = Date.now();
    const idleSeconds = this.lastExecutionTime
      ? Math.floor((now - this.lastExecutionTime) / 1000)
      : 0;

    // 模拟空闲超过10分钟后自动销毁
    const alive = idleSeconds < (this.IDLE_TIMEOUT_MS / 1000);

    return {
      alive,
      idleSeconds,
      provider: 'vercel',
    };
  }

  async destroy(): Promise<void> {
    // 模拟销毁操作
    this.lastExecutionTime = 0;
    this.executionCount = 0;
    console.log('[MOCK Vercel Sandbox] 沙盒已销毁');
  }

  /**
   * 生成模拟输出
   */
  private generateMockOutput(command: string, options?: ExecOptions): string {
    const lines: string[] = [
      '[MOCK Vercel Sandbox]',
      `执行命令: ${command}`,
      `工作目录: ${options?.cwd || '/sandbox'}`,
      `执行次数: ${this.executionCount}`,
      '',
      '--- 模拟输出 ---',
    ];

    // 根据命令类型生成不同的模拟输出
    if (command.includes('ls')) {
      lines.push('file1.txt', 'file2.txt', 'directory/');
    } else if (command.includes('pwd')) {
      lines.push(options?.cwd || '/sandbox');
    } else if (command.includes('echo')) {
      const match = command.match(/echo\s+(.+)/);
      if (match) {
        lines.push(match[1].replace(/['"]/g, ''));
      }
    } else if (command.includes('node')) {
      lines.push('Node.js v20.10.0');
    } else if (command.includes('python')) {
      lines.push('Python 3.11.0');
    } else {
      lines.push('命令执行成功（模拟）');
    }

    lines.push('', '[执行完成]');
    return lines.join('\n');
  }
}
