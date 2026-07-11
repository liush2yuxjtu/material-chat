/**
 * IdleTimeoutUseCase - 沙盒空闲超时检查与销毁用例
 *
 * 负责检查沙盒空闲时长，超过阈值自动销毁以释放资源
 */

import { SandboxPort, SandboxStatus } from '@/shared/ports/SandboxPort';

export interface IdleTimeoutResult {
  /** 沙盒当前状态 */
  status: SandboxStatus;
  /** 是否执行了销毁操作 */
  destroyed: boolean;
  /** 销毁原因（如果有） */
  reason?: string;
}

export interface IdleTimeoutOptions {
  /** 空闲超时阈值（秒），默认 600 秒（10分钟） */
  idleThresholdSeconds?: number;
}

export class IdleTimeoutUseCase {
  // 默认空闲超时：10分钟
  private readonly DEFAULT_IDLE_THRESHOLD_SECONDS = 600;

  constructor(private readonly sandboxPort: SandboxPort) {}

  /**
   * 检查空闲超时并处理
   * @param options 超时选项
   * @returns 检查结果
   */
  async execute(
    options?: IdleTimeoutOptions
  ): Promise<IdleTimeoutResult> {
    const idleThreshold =
      options?.idleThresholdSeconds || this.DEFAULT_IDLE_THRESHOLD_SECONDS;

    try {
      // 获取当前沙盒状态
      const status = await this.sandboxPort.status();

      // 如果沙盒已经不存活，无需处理
      if (!status.alive) {
        return {
          status,
          destroyed: false,
          reason: '沙盒已不存活',
        };
      }

      // 检查是否超过空闲阈值
      if (status.idleSeconds >= idleThreshold) {
        // 执行销毁操作
        await this.sandboxPort.destroy();

        return {
          status,
          destroyed: true,
          reason: `空闲时长 ${status.idleSeconds}秒 超过阈值 ${idleThreshold}秒，已自动销毁`,
        };
      }

      // 未超过阈值，正常返回
      return {
        status,
        destroyed: false,
      };
    } catch (error) {
      // 异常处理
      throw new Error(
        `空闲超时检查失败: ${(error as Error).message}`
      );
    }
  }
}
