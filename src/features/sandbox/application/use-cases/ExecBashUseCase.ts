/**
 * ExecBashUseCase - 沙盒 Bash 命令执行用例
 *
 * 负责在隔离沙盒环境中执行 Bash 命令，并返回执行结果
 */

import {
  SandboxPort,
  ExecResult,
  ExecOptions,
} from '@/shared/ports/SandboxPort';

export interface ExecBashInput {
  /** 要执行的 Bash 命令 */
  command: string;
  /** 执行选项 */
  options?: ExecOptions;
}

export class ExecBashUseCase {
  constructor(private readonly sandboxPort: SandboxPort) {}

  /**
   * 执行 Bash 命令
   * @param input 执行输入（命令和选项）
   * @returns 执行结果
   */
  async execute(input: ExecBashInput): Promise<ExecResult> {
    const { command, options } = input;

    // 验证命令不能为空
    if (!command || command.trim().length === 0) {
      return {
        stdout: '',
        stderr: '错误: 命令不能为空',
        exitCode: 1,
        durationMs: 0,
      };
    }

    // 安全检查：过滤危险命令
    const dangerousPatterns = [
      /rm\s+-rf\s+\//, // rm -rf /
      /:\(\)\{\s*:\|:&\s*\};:/, // fork bomb
      /mkfs/, // 格式化文件系统
      /dd\s+if=.*of=\/dev/, // 覆写磁盘
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(command)) {
        return {
          stdout: '',
          stderr: '错误: 检测到危险命令，已被阻止',
          exitCode: 1,
          durationMs: 0,
        };
      }
    }

    try {
      // 通过 SandboxPort 执行命令
      const result = await this.sandboxPort.execute(command, options);
      return result;
    } catch (error) {
      // 处理执行异常
      return {
        stdout: '',
        stderr: `执行失败: ${(error as Error).message}`,
        exitCode: 1,
        durationMs: 0,
      };
    }
  }
}
