/**
 * UAT-09: 重复邮箱注册
 *
 * 业务场景：已有用户再次使用相同邮箱注册 → 明确拒绝且原账号仍可登录
 * 涉及角色：Hana Suzuki（已有学员）
 */
import { expect, test } from '@playwright/test'

test.describe('UAT-09 | 重复邮箱注册', () => {
  test('AC-001: 相同邮箱只能创建一个账号，原凭据保持有效', async ({
    page,
    request,
  }) => {
    const email = `hana-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`
    const originalPassword = 'original-password-123456'

    const first = await request.post('/api/v1/auth/register', {
      data: { email, password: originalPassword, name: 'Hana Suzuki' },
    })
    expect(first.status()).toBe(201)

    const duplicate = await request.post('/api/v1/auth/register', {
      data: {
        email,
        password: 'replacement-password-123456',
        name: 'Duplicate Hana',
      },
    })
    expect(duplicate.status()).toBe(400)
    const duplicateBody = (await duplicate.json()) as { error?: string }
    expect(duplicateBody.error).toContain('已被注册')
    expect(JSON.stringify(duplicateBody)).not.toMatch(/prisma|unique constraint|database/i)

    await page.goto('/login')
    await page.getByLabel('邮箱').fill(email)
    await page.getByLabel('密码').fill(originalPassword)
    await page.getByRole('button', { name: '登录', exact: true }).click()
    await expect(page).toHaveURL(/\/chat$/)
    await expect(page.getByText(email, { exact: true })).toBeVisible()
  })
})
