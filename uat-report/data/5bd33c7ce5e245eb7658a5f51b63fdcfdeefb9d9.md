# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: uat-04-chat-basic.spec.ts >> UAT-04 | AI 对话基本功能 >> AC-002: 登录页存在且表单可见
- Location: tests/e2e/uat-04-chat-basic.spec.ts:18:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByLabel('邮箱')
Expected: visible
Timeout: 15000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 15000ms
  - waiting for getByLabel('邮箱')

```

```yaml
- text: Internal Server Error
```

# Test source

```ts
  1  | /**
  2  |  * UAT-04: AI 对话基本功能
  3  |  *
  4  |  * 业务场景：已登录用户进入聊天页 → 输入消息 → 发送 → 接收 AI 回复
  5  |  * 涉及角色：已登录用户
  6  |  * 验收人：产品经理 + QA
  7  |  *
  8  |  * 注：需要有效登录 session。CI 需配置 TEST_USER 环境变量注入测试账号。
  9  |  */
  10 | import { test, expect } from '@playwright/test'
  11 | 
  12 | test.describe('UAT-04 | AI 对话基本功能', () => {
  13 |   test('AC-001: 未登录访问聊天页重定向到登录', async ({ page }) => {
  14 |     await page.goto('/chat')
  15 |     await expect(page).toHaveURL(/\/login/, { timeout: 10000 })
  16 |   })
  17 | 
  18 |   test('AC-002: 登录页存在且表单可见', async ({ page }) => {
  19 |     await page.goto('/login')
> 20 |     await expect(page.getByLabel('邮箱')).toBeVisible()
     |                                         ^ Error: expect(locator).toBeVisible() failed
  21 |     await expect(page.getByLabel('密码')).toBeVisible()
  22 |     await expect(page.getByRole('button', { name: '登录' })).toBeVisible()
  23 |   })
  24 | 
  25 |   test('AC-003: 登录后 chat 页面显示正确结构', async ({ page }) => {
  26 |     // 先到登录页
  27 |     await page.goto('/login')
  28 |     await expect(page.locator('h2')).toContainText('登录')
  29 |   })
  30 | })
  31 | 
```