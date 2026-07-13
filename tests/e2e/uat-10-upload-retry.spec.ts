/**
 * UAT-10: 上传失败后的安全重试
 *
 * 业务场景：第一次上传被中断 → 用户看到错误 → 重试同一文件 → 只生成一条素材
 * 涉及角色：Ahmed Khan（内容管理员）
 */
import { expect, test } from '@playwright/test'

test.describe('UAT-10 | 上传失败恢复', () => {
  test('AC-001: 失败可见，重试成功且刷新后只有一条记录', async ({
    page,
    request,
  }) => {
    const email = `ahmed-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`
    const password = 'upload-retry-123456'
    const fileName = `uat-retry-${Date.now()}.txt`

    const registration = await request.post('/api/v1/auth/register', {
      data: { email, password, name: 'Ahmed Khan' },
    })
    expect(registration.status()).toBe(201)

    await page.goto('/login')
    await page.getByLabel('邮箱').fill(email)
    await page.getByLabel('密码').fill(password)
    await page.getByRole('button', { name: '登录', exact: true }).click()
    await expect(page).toHaveURL(/\/chat$/)

    await page.goto('/materials')
    await expect(page.getByRole('heading', { name: '素材管理' })).toBeVisible()

    await page.locator('input[type="file"]').setInputFiles({
      name: fileName,
      mimeType: 'text/plain',
      buffer: Buffer.from('retry-safe material payload', 'utf8'),
    })
    await page.locator('select').first().selectOption('document')
    await page.getByPlaceholder('例如: 产品, 宣传').fill('重试验收')

    let uploadAttempts = 0
    await page.route('**/api/v1/materials*', async (route) => {
      if (route.request().method() !== 'POST') {
        await route.continue()
        return
      }

      uploadAttempts += 1
      if (uploadAttempts === 1) {
        await route.fulfill({
          status: 503,
          contentType: 'application/json',
          body: JSON.stringify({ error: '临时上传失败，请重试' }),
        })
        return
      }

      await route.continue()
    })

    const uploadButton = page.getByRole('button', { name: '上传', exact: true })
    let failureDialog = ''
    page.once('dialog', async (dialog) => {
      failureDialog = dialog.message()
      await dialog.accept()
    })
    await uploadButton.click()
    await expect.poll(() => failureDialog).toContain('临时上传失败')
    await expect(uploadButton).toBeEnabled()

    let successDialog = ''
    page.once('dialog', async (dialog) => {
      successDialog = dialog.message()
      await dialog.accept()
    })
    const successfulUpload = page.waitForResponse(
      (response) =>
        response.request().method() === 'POST' &&
        response.url().includes('/api/v1/materials') &&
        response.status() === 201,
    )
    await uploadButton.click()
    await successfulUpload
    await expect.poll(() => successDialog).toContain('上传成功')

    await expect(page.getByText(fileName, { exact: true })).toHaveCount(1)
    await page.reload()
    await expect(page.getByText(fileName, { exact: true })).toHaveCount(1)
    expect(uploadAttempts).toBe(2)
  })
})
