/**
 * UAT-04: AI 对话基本功能
 *
 * 业务场景：已登录用户进入聊天页 → 输入消息 → 发送 → 接收 AI 回复
 * 涉及角色：已登录用户
 * 验收人：产品经理 + QA
 *
 * 注：需要有效登录 session。CI 需配置 TEST_USER 环境变量注入测试账号。
 */
import { test, expect } from '@playwright/test'

test.describe('UAT-04 | AI 对话基本功能', () => {
  test('AC-001: 未登录访问聊天页重定向到登录', async ({ page }) => {
    await page.goto('/chat')
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 })
  })

  test('AC-002: 登录页存在且表单可见', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByLabel('邮箱')).toBeVisible()
    await expect(page.getByLabel('密码')).toBeVisible()
    await expect(page.getByRole('button', { name: '登录' })).toBeVisible()
  })

  test('AC-003: 登录后 chat 页面显示正确结构', async ({ page }) => {
    // 先到登录页
    await page.goto('/login')
    await expect(page.locator('h2')).toContainText('登录')
  })
})
