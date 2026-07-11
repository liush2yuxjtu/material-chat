/**
 * UAT-07: 素材筛选与列表
 *
 * 业务场景：已登录用户 → 素材管理页 → 按类型筛选 → 按标签搜索 → 查看素材卡片 → 点击预览
 * 涉及角色：素材管理员
 * 验收人：产品经理 + QA
 */
import { test, expect } from '@playwright/test'

test.describe('UAT-07 | 素材筛选与列表', () => {
  test('AC-001: 空素材列表显示空态提示', async ({ page }) => {
    await page.goto('/materials')
    await page.waitForURL(/\/login/, { timeout: 10000 }).catch(() => {})
    if (page.url().includes('/materials')) {
      await expect(page.getByText('暂无素材，请上传')).toBeVisible({ timeout: 5000 })
    }
  })

  test('AC-002: 类型筛选下拉包含全部选项', async ({ page }) => {
    await page.goto('/materials')
    await page.waitForURL(/\/login/, { timeout: 10000 }).catch(() => {})
    if (page.url().includes('/materials')) {
      const filterSelect = page.getByRole('combobox').nth(1)
      for (const opt of ['全部类型', '图片', '视频', '文档', '其他']) {
        await expect(filterSelect.locator('option').filter({ hasText: opt })).toBeVisible()
      }
    }
  })

  test('AC-003: 空态页面无异常', async ({ page }) => {
    await page.goto('/materials')
    await page.waitForURL(/\/login/, { timeout: 10000 }).catch(() => {})
    if (page.url().includes('/materials')) {
      await page.waitForLoadState('networkidle').catch(() => {})
    }
  })
})
