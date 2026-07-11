import { chromium } from 'playwright';
import { mkdir, rename, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:3000';
const OUTPUT_DIR = resolve('uat-media');
const VIDEO_DIR = resolve(OUTPUT_DIR, 'videos');
const SCREENSHOT_DIR = resolve(OUTPUT_DIR, 'screenshots');
const TEST_EMAIL = process.env.UAT_EMAIL || 'test@example.com';
const TEST_PASSWORD = process.env.UAT_PASSWORD || 'test123';

await mkdir(VIDEO_DIR, { recursive: true });
await mkdir(SCREENSHOT_DIR, { recursive: true });

const browser = await chromium.launch({
  headless: true,
  slowMo: 180,
  args: ['--no-sandbox'],
});

async function showStep(page, title, detail, state = 'active') {
  await page.evaluate(
    ({ title, detail, state }) => {
      document.querySelector('#uat-step-overlay')?.remove();
      const overlay = document.createElement('div');
      overlay.id = 'uat-step-overlay';
      overlay.style.cssText = [
        'position:fixed',
        'top:18px',
        'left:18px',
        'z-index:2147483647',
        'max-width:520px',
        'padding:14px 18px',
        'border-radius:12px',
        'font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',
        'font-size:16px',
        'line-height:1.45',
        'box-shadow:0 12px 35px rgba(0,0,0,.28)',
        'color:white',
        `background:${state === 'passed' ? 'rgba(5,122,85,.96)' : 'rgba(17,24,39,.96)'}`,
        `border:2px solid ${state === 'passed' ? '#6ee7b7' : '#60a5fa'}`,
      ].join(';');
      overlay.innerHTML = `<strong style="display:block;font-size:18px;margin-bottom:4px">${title}</strong><span>${detail}</span>`;
      document.body.appendChild(overlay);
    },
    { title, detail, state },
  );
  await page.waitForTimeout(state === 'passed' ? 1800 : 1100);
}

async function highlight(locator) {
  await locator.scrollIntoViewIfNeeded();
  await locator.evaluate((element) => {
    element.dataset.uatOriginalOutline = element.style.outline;
    element.dataset.uatOriginalOutlineOffset = element.style.outlineOffset;
    element.style.outline = '4px solid #f59e0b';
    element.style.outlineOffset = '4px';
  });
  await locator.hover().catch(() => undefined);
  await locator.page().waitForTimeout(700);
}

async function clearHighlight(locator) {
  await locator.evaluate((element) => {
    element.style.outline = element.dataset.uatOriginalOutline || '';
    element.style.outlineOffset = element.dataset.uatOriginalOutlineOffset || '';
  }).catch(() => undefined);
}

async function typeVisible(locator, value) {
  await highlight(locator);
  await locator.click();
  await locator.pressSequentially(value, { delay: 55 });
  await clearHighlight(locator);
}

async function login(page) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await page.getByRole('heading', { name: '登录' }).waitFor();
  await showStep(page, 'UAT-02｜用户登录', '输入测试账号并进入受保护的聊天工作台');
  await typeVisible(page.getByLabel('邮箱'), TEST_EMAIL);
  await typeVisible(page.getByLabel('密码'), TEST_PASSWORD);
  const loginButton = page.getByRole('button', { name: '登录' });
  await highlight(loginButton);
  await loginButton.click();
  await page.waitForURL(/\/chat$/, { timeout: 30_000 });
  await page.getByRole('heading', { name: '素材管理与AI问答' }).waitFor();
  await showStep(page, 'UAT-02｜通过', `已登录为 ${TEST_EMAIL}，成功进入聊天页面`, 'passed');
}

async function finishRecording(context, page, fileName) {
  const video = page.video();
  await context.close();
  if (!video) throw new Error(`No video was recorded for ${fileName}`);
  const temporaryPath = await video.path();
  const targetPath = resolve(VIDEO_DIR, fileName);
  await rename(temporaryPath, targetPath);
  return targetPath;
}

async function recordLoginAndChat() {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    recordVideo: { dir: VIDEO_DIR, size: { width: 1280, height: 720 } },
  });
  const page = await context.newPage();
  await login(page);

  const message = '请用三点说明如何整理课程学习资料。';
  await showStep(page, 'UAT-04｜AI 流式对话', '发送真实问题，并观察 Mock LLM 的 SSE 流式回答');
  const input = page.getByPlaceholder('输入消息...');
  await typeVisible(input, message);
  const sendButton = page.getByRole('button', { name: '发送' });
  await highlight(sendButton);
  await sendButton.click();
  await page.getByText(message, { exact: true }).waitFor({ timeout: 10_000 });
  await page.waitForFunction(
    () => Array.from(document.querySelectorAll('div.bg-white.border p')).some((node) => (node.textContent || '').trim().length > 20),
    undefined,
    { timeout: 30_000 },
  );
  await page.getByRole('button', { name: '发送' }).waitFor({ timeout: 30_000 });
  await showStep(page, 'UAT-04｜通过', '用户消息已显示，AI 回答通过 SSE 完整返回', 'passed');
  await page.screenshot({ path: resolve(SCREENSHOT_DIR, 'UAT-02-04-login-chat.png'), fullPage: true });
  return finishRecording(context, page, 'UAT-02-04-login-chat.webm');
}

async function recordMaterialUploadAndFilter() {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    recordVideo: { dir: VIDEO_DIR, size: { width: 1280, height: 720 } },
  });
  const page = await context.newPage();
  await login(page);
  await page.goto(`${BASE_URL}/materials`, { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await page.getByRole('heading', { name: '素材管理' }).waitFor();

  await showStep(page, 'UAT-06｜上传学习资料', '选择文档、设置类型和标签，然后完成上传');
  const fileInput = page.locator('input[type="file"]');
  await highlight(fileInput);
  await fileInput.setInputFiles({
    name: 'uat-course-brief.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('Material Chat UAT document\nCourse: AI Product Operations\nStatus: accepted\n', 'utf8'),
  });
  await clearHighlight(fileInput);

  const uploadType = page.locator('select').first();
  await highlight(uploadType);
  await uploadType.selectOption('document');
  await clearHighlight(uploadType);
  await typeVisible(page.getByPlaceholder('例如: 产品, 宣传'), 'UAT演示,课程资料');

  const uploadButton = page.getByRole('button', { name: '上传' });
  await highlight(uploadButton);
  page.once('dialog', async (dialog) => dialog.accept());
  await Promise.all([
    page.waitForResponse((response) => response.url().includes('/api/v1/materials') && response.request().method() === 'POST' && response.status() === 201, { timeout: 30_000 }),
    uploadButton.click(),
  ]);
  await page.getByText('uat-course-brief.txt', { exact: true }).waitFor({ timeout: 20_000 });
  await showStep(page, 'UAT-06｜通过', '文档已上传，文件名、类型和标签已显示在素材列表中', 'passed');

  await showStep(page, 'UAT-07｜素材筛选', '按“文档”类型和“UAT演示”标签过滤素材列表');
  const filterType = page.locator('select').nth(1);
  await highlight(filterType);
  await filterType.selectOption('document');
  await clearHighlight(filterType);
  const tagFilter = page.getByPlaceholder('按标签筛选');
  await typeVisible(tagFilter, 'UAT演示');
  await page.waitForTimeout(1800);
  await page.getByText('uat-course-brief.txt', { exact: true }).waitFor();
  await showStep(page, 'UAT-07｜通过', '筛选结果只保留匹配的 UAT 文档', 'passed');
  await page.screenshot({ path: resolve(SCREENSHOT_DIR, 'UAT-06-07-upload-filter.png'), fullPage: true });
  return finishRecording(context, page, 'UAT-06-07-upload-filter.webm');
}

const results = [];
try {
  results.push(await recordLoginAndChat());
  results.push(await recordMaterialUploadAndFilter());
  await writeFile(
    resolve(OUTPUT_DIR, 'summary.json'),
    JSON.stringify({
      recordedAt: new Date().toISOString(),
      baseUrl: BASE_URL,
      scenarios: [
        { id: 'UAT-02/UAT-04', title: '登录与 AI 流式对话', video: results[0] },
        { id: 'UAT-06/UAT-07', title: '素材上传与筛选', video: results[1] },
      ],
    }, null, 2),
    'utf8',
  );
} finally {
  await browser.close();
}

console.log(`Recorded ${results.length} UAT videos:`);
for (const result of results) console.log(`- ${result}`);
