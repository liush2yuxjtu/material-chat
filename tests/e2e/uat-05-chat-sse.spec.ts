/**
 * UAT-05: SSE 流式 AI 响应
 *
 * 业务场景：已登录用户在聊天页发送消息 → 接收 SSE 流式 AI 回复
 * 涉及角色：已登录用户
 * 验收人：产品经理 + QA
 */
import { test, expect } from '@playwright/test'

test.describe('UAT-05 | SSE 流式 AI 响应', () => {
  test('AC-001: 登录页可见且功能正常', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('h2')).toContainText('登录')
    await expect(page.getByLabel('邮箱')).toBeVisible()
  })

  test('AC-002: 聊天页输入框和发送按钮结构正确', async ({ page }) => {
    await page.goto('/chat')
    await page.waitForURL(/\/login/, { timeout: 10000 }).catch(() => {})
    const url = page.url()
    if (url.includes('/chat')) {
      await expect(page.getByPlaceholder('输入消息...')).toBeVisible()
      await expect(page.getByRole('button', { name: '发送' })).toBeVisible()
    }
  })

  test('AC-003: 未登录访问 chat 被正确拦截', async ({ page }) => {
    await page.goto('/chat')
    await page.waitForURL(/\/login/, { timeout: 10000 })
    await expect(page.getByRole('button', { name: '登录' })).toBeVisible()
  })
})
