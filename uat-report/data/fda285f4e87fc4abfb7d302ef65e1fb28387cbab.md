# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: uat-07-material-filter.spec.ts >> UAT-07 | 素材筛选与列表 >> AC-001: 空素材列表显示空态提示
- Location: tests/e2e/uat-07-material-filter.spec.ts:11:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('暂无素材，请上传')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText('暂无素材，请上传')

```

```yaml
- text: Internal Server Error
```

# Test source

```ts
  1  | /**
  2  |  * UAT-07: 素材筛选与列表
  3  |  *
  4  |  * 业务场景：已登录用户 → 素材管理页 → 按类型筛选 → 按标签搜索 → 查看素材卡片 → 点击预览
  5  |  * 涉及角色：素材管理员
  6  |  * 验收人：产品经理 + QA
  7  |  */
  8  | import { test, expect } from '@playwright/test'
  9  | 
  10 | test.describe('UAT-07 | 素材筛选与列表', () => {
  11 |   test('AC-001: 空素材列表显示空态提示', async ({ page }) => {
  12 |     await page.goto('/materials')
  13 |     await page.waitForURL(/\/login/, { timeout: 10000 }).catch(() => {})
  14 |     if (page.url().includes('/materials')) {
> 15 |       await expect(page.getByText('暂无素材，请上传')).toBeVisible({ timeout: 5000 })
     |                                                ^ Error: expect(locator).toBeVisible() failed
  16 |     }
  17 |   })
  18 | 
  19 |   test('AC-002: 类型筛选下拉包含全部选项', async ({ page }) => {
  20 |     await page.goto('/materials')
  21 |     await page.waitForURL(/\/login/, { timeout: 10000 }).catch(() => {})
  22 |     if (page.url().includes('/materials')) {
  23 |       const filterSelect = page.getByRole('combobox').nth(1)
  24 |       for (const opt of ['全部类型', '图片', '视频', '文档', '其他']) {
  25 |         await expect(filterSelect.locator('option').filter({ hasText: opt })).toBeVisible()
  26 |       }
  27 |     }
  28 |   })
  29 | 
  30 |   test('AC-003: 空态页面无异常', async ({ page }) => {
  31 |     await page.goto('/materials')
  32 |     await page.waitForURL(/\/login/, { timeout: 10000 }).catch(() => {})
  33 |     if (page.url().includes('/materials')) {
  34 |       await page.waitForLoadState('networkidle').catch(() => {})
  35 |     }
  36 |   })
  37 | })
  38 | 
```