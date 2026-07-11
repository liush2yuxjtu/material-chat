/**
 * UAT-03: 未登录权限守卫
 *
 * 业务场景：匿名访客访问受保护页面 → 自动重定向到登录页
 * 涉及角色：匿名访客
 * 验收人：QA + 安全审核
 */
import { test, expect } from '@playwright/test'

test.describe('UAT-03 | 未登录权限守卫', () => {
  test('AC-001: 未登录访问 /chat 重定向到 /login', async ({ page }) => {
    await page.goto('/chat')
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 })
  })

  test('AC-002: 未登录访问 /materials 重定向到 /login', async ({ page }) => {
    await page.goto('/materials')
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 })
  })

  test('AC-003: 首页无需登录即可访问', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL('/')
    await expect(page.getByRole('link', { name: '立即登录' })).toBeVisible()
    await expect(page.getByRole('link', { name: '注册账号' })).toBeVisible()
  })

  test('AC-004: 注册页和登录页无需登录即可访问', async ({ page }) => {
    await page.goto('/register')
    await expect(page).toHaveURL('/register')
    await page.goto('/login')
    await expect(page).toHaveURL('/login')
  })

  test('AC-005: 首页功能卡片展示正确', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('AI对话')).toBeVisible()
    await expect(page.getByText('素材管理')).toBeVisible()
    await expect(page.getByText('SQL查询')).toBeVisible()
  })
})
