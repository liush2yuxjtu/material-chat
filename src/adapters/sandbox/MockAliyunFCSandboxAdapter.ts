/**
 * Mock 阿里云函数计算（FC）沙盒适配器
 * 用于开发和测试环境，模拟阿里云 FC 行为
 * 返回固定的模拟输出，不实际执行命令
 */

import {
  SandboxPort,
  ExecResult,
  ExecOptions,
  SandboxStatus,
} from '@/shared/ports/SandboxPort';

export class MockAliyunFCSandboxAdapter implements SandboxPort {
  private lastExecutionTime: number = 0;
  private executionCount: number = 0;
  private coldStart: boolean = true;

  // 阿里云 FC 超时限制：10分钟
  private readonly TIMEOUT_MS = 10 * 60 * 1000;
  // 空闲10分钟自动销毁
  private readonly IDLE_TIMEOUT_MS = 10 * 60 * 1000;

  async execute(command: string, options?: ExecOptions): Promise<ExecResult> {
    const startTime = Date.now();
    this.lastExecutionTime = startTime;
    this.executionCount++;

    // 模拟冷启动或热启动延迟
    let mockDelay: number;
    if (this.coldStart) {
      // 冷启动：2-3秒
      mockDelay = 2000 + Math.random() * 1000;
      this.coldStart = false;
    } else {
      // 热启动（预留实例）：150-250ms
      mockDelay = 150 + Math.random() * 100;
    }
    await new Promise(resolve => setTimeout(resolve, mockDelay));

    // 检查超时限制
    const effectiveTimeout = options?.timeout || this.TIMEOUT_MS;
    if (effectiveTimeout > this.TIMEOUT_MS) {
      return {
        stdout: '',
        stderr: `[MOCK Aliyun FC] 错误: 超时限制不能超过 ${this.TIMEOUT_MS}ms (10分钟)`,
        exitCode: 1,
        durationMs: Date.now() - startTime,
      };
    }

    // 检查内存限制（阿里云 FC 支持更高内存）
    if (options?.maxMemoryMB && options.maxMemoryMB > 3072) {
      return {
        stdout: '',
        stderr: '[MOCK Aliyun FC] 错误: 内存限制不能超过 3072MB',
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

    // 模拟空闲超过10分钟后自动销毁（触发冷启动）
    const alive = idleSeconds < (this.IDLE_TIMEOUT_MS / 1000);
    if (!alive) {
      this.coldStart = true;
    }

    return {
      alive,
      idleSeconds,
      provider: 'aliyun-fc',
    };
  }

  async destroy(): Promise<void> {
    // 模拟销毁操作
    this.lastExecutionTime = 0;
    this.executionCount = 0;
    this.coldStart = true;
    console.log('[MOCK Aliyun FC] 函数实例已销毁');
  }

  /**
   * 生成模拟输出
   */
  private generateMockOutput(command: string, options?: ExecOptions): string {
    const lines: string[] = [
      '[MOCK Aliyun FC]',
      `执行命令: ${command}`,
      `工作目录: ${options?.cwd || '/code'}`,
      `执行次数: ${this.executionCount}`,
      `实例状态: ${this.coldStart ? '冷启动' : '热启动（预留实例）'}`,
      '',
      '--- 模拟输出 ---',
    ];

    // 根据命令类型生成不同的模拟输出
    if (command.includes('ls')) {
      lines.push('main.py', 'requirements.txt', 'data/');
    } else if (command.includes('pwd')) {
      lines.push(options?.cwd || '/code');
    } else if (command.includes('echo')) {
      const match = command.match(/echo\s+(.+)/);
      if (match) {
        lines.push(match[1].replace(/['"]/g, ''));
      }
    } else if (command.includes('node')) {
      lines.push('Node.js v18.19.0');
    } else if (command.includes('python')) {
      lines.push('Python 3.10.0');
    } else if (command.includes('java')) {
      lines.push('openjdk version "11.0.16"');
    } else {
      lines.push('命令执行成功（模拟）');
    }

    lines.push('', '[函数执行完成]');
    return lines.join('\n');
  }
}
