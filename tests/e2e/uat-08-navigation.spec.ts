/**
 * UAT-08: 页面导航
 *
 * 业务场景：用户在平台各页面间导航 → 验证链接/按钮跳转正确
 * 涉及角色：所有用户
 * 验收人：产品经理 + QA
 */
import { test, expect } from '@playwright/test'

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
})
