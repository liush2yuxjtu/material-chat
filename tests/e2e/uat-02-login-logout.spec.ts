/**
 * UAT-02: 用户登录/登出流程
 *
 * 业务场景：已有账号用户 → 输入凭证登录 → 进入聊天页 → 退出登录 → 回到登录页
 * 涉及角色：已注册用户
 * 验收人：产品经理 + QA
 */
import { test, expect } from '@playwright/test'

test.describe('UAT-02 | 用户登录/登出', () => {
  test('AC-001: 从首页点击"立即登录"进入登录页', async ({ page }) => {
    await page.goto('/')
    const loginLink = page.getByRole('link', { name: '立即登录' })
    await expect(loginLink).toBeVisible()
    await loginLink.click()
    await expect(page).toHaveURL('/login')
  })

  test('AC-002: 登录表单所有字段可见', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByLabel('邮箱')).toBeVisible()
    await expect(page.getByLabel('密码')).toBeVisible()
    await expect(page.getByRole('button', { name: '登录' })).toBeVisible()
  })

  test('AC-003: 邮箱和密码均为必填', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByLabel('邮箱')).toHaveAttribute('required', '')
    await expect(page.getByLabel('密码')).toHaveAttribute('required', '')
  })

  test('AC-004: 空表单提交不跳转', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('button', { name: '登录' }).click()
    await expect(page).toHaveURL('/login')
  })

  test('AC-005: 错误凭证显示错误提示', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('邮箱').fill('wrong@example.com')
    await page.getByLabel('密码').fill('wrongpassword')
    await page.getByRole('button', { name: '登录' }).click()

    const errorBox = page.locator('.bg-red-50')
    await expect(errorBox).toBeVisible({ timeout: 10000 })
    await expect(page).not.toHaveURL('/chat')
  })

  test('AC-006: "还没有账号？立即注册"链接跳转正确', async ({ page }) => {
    await page.goto('/login')
    const registerLink = page.getByRole('link', { name: /还没有账号.*注册/ })
    await expect(registerLink).toBeVisible()
    await registerLink.click()
    await expect(page).toHaveURL('/register')
  })

  test('AC-007: 登录页标题正确', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('h2')).toContainText('登录')
  })
})
