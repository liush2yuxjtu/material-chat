import { test, expect } from '@playwright/test'

test.describe('主页测试', () => {
  test('应该成功加载主页', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/Material Chat/)
  })

  test('应该能够截图', async ({ page }) => {
    await page.goto('/')
    await page.screenshot({ path: 'test-results/home-screenshot.png', fullPage: true })
  })
})
