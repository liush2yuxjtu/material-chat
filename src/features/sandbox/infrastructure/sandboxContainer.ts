/**
 * Sandbox 容器 - 沙盒适配器工厂
 *
 * 根据环境变量 SANDBOX_PROVIDER 选择适配器实现：
 * - 'vercel': MockVercelSandboxAdapter
 * - 'aliyun-fc': MockAliyunFCSandboxAdapter
 * - 默认: MockVercelSandboxAdapter
 */

import { SandboxPort } from '@/shared/ports/SandboxPort';
import { MockVercelSandboxAdapter } from '@/adapters/sandbox/MockVercelSandboxAdapter';
import { MockAliyunFCSandboxAdapter } from '@/adapters/sandbox/MockAliyunFCSandboxAdapter';

/**
 * 沙盒提供商类型
 */
export type SandboxProvider = 'vercel' | 'aliyun-fc';

/**
 * 获取当前配置的沙盒提供商
 */
export function getSandboxProvider(): SandboxProvider {
  const provider = process.env.SANDBOX_PROVIDER?.toLowerCase();

  if (provider === 'aliyun-fc') {
    return 'aliyun-fc';
  }

  // 默认使用 Vercel
  return 'vercel';
}

/**
 * 创建沙盒适配器实例
 * 根据环境变量 SANDBOX_PROVIDER 选择实现
 */
export function createSandboxAdapter(): SandboxPort {
  const provider = getSandboxProvider();

  switch (provider) {
    case 'vercel':
      return new MockVercelSandboxAdapter();

    case 'aliyun-fc':
      return new MockAliyunFCSandboxAdapter();

    default:
      // 不应该到达这里，但提供兜底
      console.warn(`未知的沙盒提供商: ${provider}，使用默认 Vercel`);
      return new MockVercelSandboxAdapter();
  }
}

/**
 * 单例沙盒适配器实例
 * 在应用生命周期中复用同一个实例
 */
let sandboxInstance: SandboxPort | null = null;

/**
 * 获取沙盒适配器单例
 */
export function getSandboxAdapter(): SandboxPort {
  if (!sandboxInstance) {
    sandboxInstance = createSandboxAdapter();
    console.log(`[Sandbox] 已初始化适配器: ${getSandboxProvider()}`);
  }
  return sandboxInstance;
}
