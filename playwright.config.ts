import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright E2E 测试配置 — UAT 专用
 *
 * 两种运行模式：
 * 1. CI 模式（GitHub Actions）：全量截图 + 视频 + trace，串行执行
 * 2. 本地模式：仅失败时截图，并行执行，复用 dev server
 */
const CI = !!process.env.CI

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: !CI,
  forbidOnly: CI,
  retries: CI ? 2 : 0,
  workers: CI ? 1 : undefined,

  /* 测试报告：HTML（可视化）+ JSON（机器可读）+ list（终端输出） */
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['json', { outputFile: 'test-results/test-results.json' }],
    ['list'],
  ],

  /* 全局超时 */
  timeout: 60_000,
  expect: { timeout: 15_000 },

  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',

    /* CI 模式：始终录制视频和截图，保留 trace 用于事后排查 */
    video: CI ? 'on' : 'retain-on-failure',
    screenshot: CI ? 'on' : 'only-on-failure',
    trace: CI ? 'on' : 'on-first-retry',
  },

  /* 输出目录统一管理 */
  outputDir: 'test-results/artifacts',

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  /* CI 模式下自己启动 production build；本地模式复用 dev server */
  webServer: CI
    ? {
        command: 'npm run build && npm run start',
        url: 'http://localhost:3000',
        reuseExistingServer: false,
        timeout: 180_000,
      }
    : {
        command: 'npm run dev',
        url: 'http://localhost:3000',
        reuseExistingServer: true,
        timeout: 120_000,
      },
})
