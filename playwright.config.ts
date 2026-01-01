import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E 测试配置
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  // 测试目录
  testDir: './e2e',

  // 完全并行运行测试
  fullyParallel: true,

  // CI 环境下禁止 test.only
  forbidOnly: !!process.env.CI,

  // 重试次数：CI 环境 2 次，本地 0 次
  retries: process.env.CI ? 2 : 0,

  // 并行 worker 数量
  workers: process.env.CI ? 1 : undefined,

  // 报告器配置
  reporter: [
    ['html', { open: 'never' }],
    ['list'],
  ],

  // 全局测试配置
  use: {
    // 基础 URL
    baseURL: 'http://localhost:3000',

    // 失败时收集 trace
    trace: 'on-first-retry',

    // 截图策略
    screenshot: 'only-on-failure',

    // 视频录制
    video: 'on-first-retry',
  },

  // 项目配置（浏览器）
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // 如需测试更多浏览器，取消下面的注释
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
    // 移动端测试
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
  ],

  // 开发服务器配置
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
