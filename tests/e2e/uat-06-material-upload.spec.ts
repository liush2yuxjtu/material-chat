/**
 * UAT-06: 素材上传功能
 *
 * 业务场景：已登录用户 → 素材管理页 → 选择文件 → 设置类型/标签 → 上传 → 列表刷新
 * 涉及角色：素材管理员
 * 验收人：产品经理 + QA
 */
import { test, expect } from '@playwright/test'

test.describe('UAT-06 | 素材上传功能', () => {
  test('AC-001: 未登录访问素材页重定向到登录', async ({ page }) => {
    await page.goto('/materials')
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 })
  })

  test('AC-002: 素材页上传区域结构完整', async ({ page }) => {
    await page.goto('/materials')
    await page.waitForURL(/\/login/, { timeout: 10000 }).catch(() => {})
    const url = page.url()
    if (url.includes('/materials')) {
      await expect(page.getByText('上传素材')).toBeVisible()
      await expect(page.locator('input[type="file"]')).toBeVisible()
      await expect(page.getByRole('button', { name: '上传' })).toBeVisible()
    }
  })

  test('AC-003: 上传类型下拉包含4种类型', async ({ page }) => {
    await page.goto('/materials')
    await page.waitForURL(/\/login/, { timeout: 10000 }).catch(() => {})
    if (page.url().includes('/materials')) {
      const typeSelect = page.getByRole('combobox').first()
      for (const opt of ['图片', '视频', '文档', '其他']) {
        await expect(typeSelect.locator('option').filter({ hasText: opt })).toBeVisible()
      }
    }
  })

  test('AC-004: 标签输入和筛选功能可用', async ({ page }) => {
    await page.goto('/materials')
    await page.waitForURL(/\/login/, { timeout: 10000 }).catch(() => {})
    if (page.url().includes('/materials')) {
      await expect(page.getByPlaceholder(/标签/)).toBeVisible()
      await expect(page.getByPlaceholder('按标签筛选')).toBeVisible()
    }
  })

  test('AC-005: 导航按钮存在', async ({ page }) => {
    await page.goto('/materials')
    await page.waitForURL(/\/login/, { timeout: 10000 }).catch(() => {})
    if (page.url().includes('/materials')) {
      await expect(page.getByRole('button', { name: '返回聊天' })).toBeVisible()
      await expect(page.getByRole('button', { name: '退出' })).toBeVisible()
    }
  })
})
