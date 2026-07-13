/**
 * UAT-08: 页面导航
 *
 * 业务场景：用户在平台各页面间导航 → 验证公开链接与受保护工作台跳转
 * 涉及角色：访客与已登录学员
 * 验收人：产品经理 + QA
 */
import { expect, test } from '@playwright/test'

test.describe('UAT-08 | 页面导航', () => {
  test('AC-001: 首页 → 登录页', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('link', { name: '立即登录' }).click()
    await expect(page).toHaveURL('/login')
  })

  test('AC-002: 首页 → 注册页', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('link', { name: '注册账号' }).click()
    await expect(page).toHaveURL('/register')
  })

  test('AC-003: 登录页 ↔ 注册页 双向导航', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('link', { name: /还没有账号.*注册/ }).click()
    await expect(page).toHaveURL('/register')

    await page.getByRole('link', { name: /已有账号.*登录/ }).click()
    await expect(page).toHaveURL('/login')
  })

  test('AC-004: 所有公开页面 200', async ({ page }) => {
    for (const path of ['/', '/login', '/register']) {
      const response = await page.goto(path)
      expect(response?.ok()).toBeTruthy()
    }
  })

  test('AC-005: 首页标题正确', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('h1')).toContainText('素材管理与AI问答平台')
  })

  test('AC-006: 首页有3个功能卡片', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('AI对话', { exact: true })).toBeVisible()
    await expect(page.getByText('素材管理', { exact: true })).toBeVisible()
    await expect(page.getByText('SQL查询', { exact: true })).toBeVisible()
  })

  test('AC-007: 登录用户可在聊天与素材工作台往返并继续聊天', async ({
    page,
    request,
  }) => {
    const email = `oliver-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`
    const password = 'navigation-test-123456'
    const registration = await request.post('/api/v1/auth/register', {
      data: { email, password, name: 'Oliver Brown' },
    })
    expect(registration.status()).toBe(201)

    await page.goto('/login')
    await page.getByLabel('邮箱').fill(email)
    await page.getByLabel('密码').fill(password)
    await page.getByRole('button', { name: '登录', exact: true }).click()
    await expect(page).toHaveURL(/\/chat$/)
    await expect(page.getByPlaceholder('输入消息...')).toBeVisible()

    await page.getByRole('button', { name: '素材管理', exact: true }).click()
    await expect(page).toHaveURL(/\/materials$/)
    await expect(page.getByRole('heading', { name: '素材管理' })).toBeVisible()

    await page.getByRole('button', { name: '返回聊天', exact: true }).click()
    await expect(page).toHaveURL(/\/chat$/)

    const question = '返回聊天后还能继续提问吗？'
    await page.getByPlaceholder('输入消息...').fill(question)
    await page.getByRole('button', { name: '发送', exact: true }).click()
    await expect(page.getByText(question, { exact: true })).toBeVisible()
    await expect(page.getByText(/按课程主题建立清晰目录/)).toBeVisible()
  })
})
