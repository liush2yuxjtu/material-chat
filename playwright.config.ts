import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright E2E 测试配置 — UAT 专用
 *
 * Every UAT spec is isolated by unique users and fresh browser contexts, so CI can
 * run a bounded parallel worker pool while retaining screenshots, videos, and trace.
 */
const CI = !!process.env.CI
const useDevServer = process.env.PLAYWRIGHT_USE_DEV_SERVER === '1'
const serverUrl = 'http://127.0.0.1:3000'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: CI,
  retries: CI ? 1 : 0,
  workers: CI ? 4 : undefined,

  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['json', { outputFile: 'test-results/test-results.json' }],
    ['list'],
  ],

  timeout: 60_000,
  expect: { timeout: 15_000 },

  use: {
    baseURL: serverUrl,
    video: CI ? 'on' : 'retain-on-failure',
    screenshot: CI ? 'on' : 'only-on-failure',
    trace: CI ? 'on' : 'on-first-retry',
  },

  outputDir: 'test-results/artifacts',

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: useDevServer
    ? {
        command: 'npm run dev -- --hostname 127.0.0.1 --port 3000',
        url: serverUrl,
        reuseExistingServer: false,
        timeout: 180_000,
      }
    : CI
      ? {
          command: 'npm run build && npm run start -- --hostname 127.0.0.1 --port 3000',
          url: serverUrl,
          reuseExistingServer: false,
          timeout: 180_000,
        }
      : {
          command: 'npm run dev -- --hostname 127.0.0.1 --port 3000',
          url: serverUrl,
          reuseExistingServer: true,
          timeout: 120_000,
        },
})
