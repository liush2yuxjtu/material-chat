/**
 * UAT-01: 用户注册流程
 *
 * 业务场景：新用户访问平台 → 填写注册信息 → 完成注册 → 自动登录跳转到聊天页
 * 涉及角色：新用户（未注册）
 * 验收人：产品经理 + QA
 */
import { test, expect } from '@playwright/test'

const TEST_USER = {
  name: 'UAT测试用户',
  email: `uat-test-${Date.now()}@example.com`,
  password: 'test123456',
}

test.describe('UAT-01 | 用户注册', () => {
  test('AC-001: 从首页点击"注册账号"进入注册页', async ({ page }) => {
    await page.goto('/')
    const registerLink = page.getByRole('link', { name: '注册账号' })
    await expect(registerLink).toBeVisible()
    await registerLink.click()
    await expect(page).toHaveURL('/register')
  })

  test('AC-002: 注册表单所有字段可见', async ({ page }) => {
    await page.goto('/register')
    await expect(page.getByLabel('姓名')).toBeVisible()
    await expect(page.getByLabel('邮箱')).toBeVisible()
    await expect(page.getByLabel(/密码/)).toBeVisible()
    await expect(page.getByRole('button', { name: '注册' })).toBeVisible()
  })

  test('AC-003: 邮箱为必填字段', async ({ page }) => {
    await page.goto('/register')
    const emailInput = page.getByLabel('邮箱')
    await expect(emailInput).toHaveAttribute('required', '')
  })

  test('AC-004: 密码最少6位', async ({ page }) => {
    await page.goto('/register')
    const passwordInput = page.getByLabel(/密码/)
    await expect(passwordInput).toHaveAttribute('minLength', '6')
  })

  test('AC-005: 填写完整表单点击注册进入 loading 状态', async ({ page }) => {
    await page.goto('/register')
    await page.getByLabel('姓名').fill(TEST_USER.name)
    await page.getByLabel('邮箱').fill(TEST_USER.email)
    await page.getByLabel(/密码/).fill(TEST_USER.password)

    const registerBtn = page.getByRole('button', { name: '注册' })
    await registerBtn.click()
    // 按钮变为"注册中..."
    await expect(page.getByRole('button', { name: '注册中...' })).toBeVisible({ timeout: 5000 })
  })

  test('AC-006: "已有账号？立即登录"链接跳转正确', async ({ page }) => {
    await page.goto('/register')
    const loginLink = page.getByRole('link', { name: /已有账号.*登录/ })
    await expect(loginLink).toBeVisible()
    await loginLink.click()
    await expect(page).toHaveURL('/login')
  })

  test('AC-007: 注册页标题正确', async ({ page }) => {
    await page.goto('/register')
    await expect(page.locator('h2')).toContainText('注册')
  })
})
