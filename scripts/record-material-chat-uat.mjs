import { chromium } from 'playwright';
import { mkdir, rename, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:3000';
const OUTPUT_DIR = resolve('uat-media');
const VIDEO_DIR = resolve(OUTPUT_DIR, 'videos');
const SCREENSHOT_DIR = resolve(OUTPUT_DIR, 'screenshots');
const DIAGNOSTIC_DIR = resolve(OUTPUT_DIR, 'diagnostics');
const TEST_EMAIL = process.env.UAT_EMAIL || `uat-recording-${Date.now()}@example.com`;
const TEST_PASSWORD = process.env.UAT_PASSWORD || 'uat-test-123456';
const TEST_NAME = 'UAT 演示用户';

await mkdir(VIDEO_DIR, { recursive: true });
await mkdir(SCREENSHOT_DIR, { recursive: true });
await mkdir(DIAGNOSTIC_DIR, { recursive: true });

const browser = await chromium.launch({
  headless: true,
  slowMo: 180,
  args: ['--no-sandbox'],
});

const diagnostics = [];

function attachDiagnostics(page, scenario) {
  page.on('console', (message) => {
    diagnostics.push(`[${scenario}] console.${message.type()}: ${message.text()}`);
  });
  page.on('pageerror', (error) => {
    diagnostics.push(`[${scenario}] pageerror: ${error.stack || error.message}`);
  });
  page.on('requestfailed', (request) => {
    diagnostics.push(
      `[${scenario}] requestfailed: ${request.method()} ${request.url()} ${request.failure()?.errorText || ''}`,
    );
  });
}

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
        'max-width:560px',
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
  await locator.waitFor({ state: 'visible', timeout: 30_000 });
  await locator.scrollIntoViewIfNeeded();
  await locator.evaluate((element) => {
    element.dataset.uatOriginalOutline = element.style.outline;
    element.dataset.uatOriginalOutlineOffset = element.style.outlineOffset;
    element.style.outline = '4px solid #f59e0b';
    element.style.outlineOffset = '4px';
  });
  await locator.hover().catch(() => undefined);
  await new Promise((resolveDelay) => setTimeout(resolveDelay, 700));
}

async function clearHighlight(locator) {
  await locator
    .evaluate((element) => {
      element.style.outline = element.dataset.uatOriginalOutline || '';
      element.style.outlineOffset = element.dataset.uatOriginalOutlineOffset || '';
    })
    .catch(() => undefined);
}

async function typeVisible(locator, value) {
  await highlight(locator);
  await locator.click();
  await locator.pressSequentially(value, { delay: 55 });
  await clearHighlight(locator);
}

async function ensureChatReady(page) {
  await page.goto(`${BASE_URL}/chat`, {
    waitUntil: 'domcontentloaded',
    timeout: 120_000,
  });
  const input = page.getByPlaceholder('输入消息...');
  await input.waitFor({ state: 'visible', timeout: 30_000 });
  await page.getByRole('button', { name: '发送', exact: true }).waitFor({
    state: 'visible',
    timeout: 30_000,
  });
  return input;
}

async function register(page) {
  await page.goto(`${BASE_URL}/register`, {
    waitUntil: 'domcontentloaded',
    timeout: 120_000,
  });
  await page.getByRole('heading', { name: '注册', exact: true }).waitFor();
  await showStep(
    page,
    'UAT-01｜新用户注册',
    '填写姓名、邮箱和密码，提交注册并建立登录会话',
  );
  await typeVisible(page.getByLabel('姓名'), TEST_NAME);
  await typeVisible(page.getByLabel('邮箱'), TEST_EMAIL);
  await typeVisible(page.getByLabel(/密码/), TEST_PASSWORD);

  const registerResponse = page.waitForResponse(
    (response) =>
      response.url().includes('/api/v1/auth/register') &&
      response.request().method() === 'POST',
    { timeout: 30_000 },
  );
  const credentialsResponse = page
    .waitForResponse(
      (response) =>
        response.url().includes('/api/auth/callback/credentials') &&
        response.request().method() === 'POST',
      { timeout: 30_000 },
    )
    .catch(() => null);

  const registerButton = page.getByRole('button', { name: '注册', exact: true });
  await highlight(registerButton);
  await registerButton.click();

  const response = await registerResponse;
  if (response.status() !== 201) {
    throw new Error(
      `Registration failed with ${response.status()}: ${await response.text()}`,
    );
  }
  const credentials = await credentialsResponse;
  if (credentials && !credentials.ok()) {
    throw new Error(
      `Automatic credential sign-in failed with ${credentials.status()}`,
    );
  }

  await showStep(
    page,
    'UAT-01｜注册通过',
    `账号 ${TEST_EMAIL} 已创建，正在进入聊天工作台`,
    'passed',
  );
  await ensureChatReady(page);
}

async function login(page) {
  await page.goto(`${BASE_URL}/login`, {
    waitUntil: 'domcontentloaded',
    timeout: 120_000,
  });
  await page.getByRole('heading', { name: '登录', exact: true }).waitFor();
  await showStep(
    page,
    'UAT-02｜用户登录',
    '使用刚才注册的账号重新进入受保护工作台',
  );
  await typeVisible(page.getByLabel('邮箱'), TEST_EMAIL);
  await typeVisible(page.getByLabel('密码'), TEST_PASSWORD);

  const credentialsResponse = page.waitForResponse(
    (response) =>
      response.url().includes('/api/auth/callback/credentials') &&
      response.request().method() === 'POST',
    { timeout: 30_000 },
  );
  const loginButton = page.getByRole('button', { name: '登录', exact: true });
  await highlight(loginButton);
  await loginButton.click();
  const response = await credentialsResponse;
  if (!response.ok()) {
    throw new Error(`Credential login failed with ${response.status()}`);
  }

  await ensureChatReady(page);
  await showStep(page, 'UAT-02｜登录通过', `已登录为 ${TEST_EMAIL}`, 'passed');
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

async function recordRegistrationAndChat() {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    recordVideo: { dir: VIDEO_DIR, size: { width: 1280, height: 720 } },
  });
  const page = await context.newPage();
  attachDiagnostics(page, 'register-chat');

  try {
    await register(page);

    const message = '请用三点说明如何整理课程学习资料。';
    await showStep(
      page,
      'UAT-04｜AI 流式对话',
      '输入真实问题，观察 Mock LLM 的 SSE 流式回答逐步显示',
    );
    const input = page.getByPlaceholder('输入消息...');
    await typeVisible(input, message);
    const sendButton = page.getByRole('button', { name: '发送', exact: true });
    await highlight(sendButton);

    const chatResponse = page.waitForResponse(
      (response) =>
        response.url().includes('/api/v1/chat') &&
        response.request().method() === 'POST',
      { timeout: 30_000 },
    );
    await sendButton.click();
    const response = await chatResponse;
    if (!response.ok()) {
      throw new Error(`Chat API failed with ${response.status()}`);
    }

    await page.getByText(message, { exact: true }).waitFor({ timeout: 10_000 });
    const assistantMessage = page.locator('div.bg-white.border p').last();
    await assistantMessage.waitFor({ state: 'visible', timeout: 30_000 });
    await page.waitForFunction(
      () => {
        const messages = Array.from(document.querySelectorAll('div.bg-white.border p'));
        const text = messages.at(-1)?.textContent?.trim() || '';
        return text.includes('按课程主题') && text.length > 60;
      },
      undefined,
      { timeout: 30_000 },
    );
    await page.getByRole('button', { name: '发送', exact: true }).waitFor({
      state: 'visible',
      timeout: 30_000,
    });
    await showStep(
      page,
      'UAT-04｜对话通过',
      '用户消息已保存，AI 三步建议已通过 SSE 完整返回',
      'passed',
    );
    await page.screenshot({
      path: resolve(SCREENSHOT_DIR, 'UAT-01-04-register-chat.png'),
      fullPage: true,
    });
    return await finishRecording(context, page, 'UAT-01-04-register-chat.webm');
  } catch (error) {
    await page
      .screenshot({
        path: resolve(DIAGNOSTIC_DIR, 'register-chat-failure.png'),
        fullPage: true,
      })
      .catch(() => undefined);
    await context.close().catch(() => undefined);
    throw error;
  }
}

async function recordMaterialUploadAndFilter() {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    recordVideo: { dir: VIDEO_DIR, size: { width: 1280, height: 720 } },
  });
  const page = await context.newPage();
  attachDiagnostics(page, 'login-upload-filter');

  try {
    await login(page);
    await page.goto(`${BASE_URL}/materials`, {
      waitUntil: 'domcontentloaded',
      timeout: 120_000,
    });
    await page.getByRole('heading', { name: '素材管理', exact: true }).waitFor({
      state: 'visible',
      timeout: 30_000,
    });

    await showStep(
      page,
      'UAT-06｜上传学习资料',
      '选择文档、设置素材类型和业务标签，然后完成上传',
    );
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'uat-course-brief.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from(
        'Material Chat UAT document\nCourse: AI Product Operations\nStatus: accepted\n',
        'utf8',
      ),
    });

    const uploadType = page.locator('select').first();
    await highlight(uploadType);
    await uploadType.selectOption('document');
    await clearHighlight(uploadType);
    await typeVisible(
      page.getByPlaceholder('例如: 产品, 宣传'),
      'UAT演示,课程资料',
    );

    const uploadButton = page.getByRole('button', { name: '上传', exact: true });
    await highlight(uploadButton);
    page.once('dialog', async (dialog) => dialog.accept());
    const uploadResponse = page.waitForResponse(
      (response) =>
        response.url().includes('/api/v1/materials') &&
        response.request().method() === 'POST',
      { timeout: 30_000 },
    );
    await uploadButton.click();
    const response = await uploadResponse;
    if (response.status() !== 201) {
      throw new Error(
        `Material upload failed with ${response.status()}: ${await response.text()}`,
      );
    }
    await page.getByText('uat-course-brief.txt', { exact: true }).waitFor({
      timeout: 20_000,
    });
    await showStep(
      page,
      'UAT-06｜上传通过',
      '文件名、素材类型和标签已写入素材列表',
      'passed',
    );

    await showStep(
      page,
      'UAT-07｜素材筛选',
      '按“文档”类型和“UAT演示”标签筛选素材列表',
    );
    const filterType = page.locator('select').nth(1);
    await highlight(filterType);
    await filterType.selectOption('document');
    await clearHighlight(filterType);
    const tagFilter = page.getByPlaceholder('按标签筛选');
    await typeVisible(tagFilter, 'UAT演示');
    await page.waitForTimeout(1800);
    await page.getByText('uat-course-brief.txt', { exact: true }).waitFor();
    await showStep(
      page,
      'UAT-07｜筛选通过',
      '列表只保留与类型和标签匹配的 UAT 文档',
      'passed',
    );
    await page.screenshot({
      path: resolve(
        SCREENSHOT_DIR,
        'UAT-02-06-07-login-upload-filter.png',
      ),
      fullPage: true,
    });
    return await finishRecording(
      context,
      page,
      'UAT-02-06-07-login-upload-filter.webm',
    );
  } catch (error) {
    await page
      .screenshot({
        path: resolve(DIAGNOSTIC_DIR, 'login-upload-filter-failure.png'),
        fullPage: true,
      })
      .catch(() => undefined);
    await context.close().catch(() => undefined);
    throw error;
  }
}

const results = [];
let failure;
try {
  results.push(await recordRegistrationAndChat());
  results.push(await recordMaterialUploadAndFilter());
} catch (error) {
  failure = error;
  diagnostics.push(`fatal: ${error.stack || error.message || String(error)}`);
} finally {
  await writeFile(
    resolve(DIAGNOSTIC_DIR, 'browser.log'),
    `${diagnostics.join('\n')}\n`,
    'utf8',
  );
  await writeFile(
    resolve(OUTPUT_DIR, 'summary.json'),
    JSON.stringify(
      {
        recordedAt: new Date().toISOString(),
        baseUrl: BASE_URL,
        user: TEST_EMAIL,
        completed: results.length,
        scenarios: [
          {
            id: 'UAT-01/UAT-04',
            title: '注册与 AI 流式对话',
            video: results[0] || null,
          },
          {
            id: 'UAT-02/UAT-06/UAT-07',
            title: '登录、素材上传与筛选',
            video: results[1] || null,
          },
        ],
        error: failure ? failure.message || String(failure) : null,
      },
      null,
      2,
    ),
    'utf8',
  );
  await browser.close();
}

if (failure) throw failure;

console.log(`Recorded ${results.length} UAT videos:`);
for (const result of results) console.log(`- ${result}`);
