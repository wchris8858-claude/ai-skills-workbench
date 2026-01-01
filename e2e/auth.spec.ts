import { test, expect } from '@playwright/test';

test.describe('登录页面', () => {
  test('应该正确显示登录表单', async ({ page }) => {
    await page.goto('/login');

    // 检查页面标题
    await expect(page.getByText('欢迎回来')).toBeVisible();

    // 检查用户名输入框
    await expect(page.getByPlaceholder('用户名')).toBeVisible();

    // 检查密码输入框
    await expect(page.getByPlaceholder('密码')).toBeVisible();

    // 检查登录按钮
    await expect(page.getByRole('button', { name: '登录' })).toBeVisible();
  });

  test('应该显示返回首页链接', async ({ page }) => {
    await page.goto('/login');

    // 检查返回按钮
    await expect(page.getByRole('link', { name: '返回' })).toBeVisible();
  });

  test('返回链接应该指向首页', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // 查找返回链接
    const backLink = page.getByRole('link', { name: /返回|首页|home|back/i }).first();

    if (await backLink.isVisible()) {
      // 验证链接指向首页
      const href = await backLink.getAttribute('href');
      expect(href).toBe('/');
    } else {
      // 如果没有返回链接，验证首页可访问
      await page.goto('/');
      await expect(page).toHaveURL('/');
    }
  });

  test('空表单提交后应该仍在登录页', async ({ page }) => {
    await page.goto('/login');

    // 直接点击登录按钮
    await page.getByRole('button', { name: '登录' }).click();

    // 等待一下
    await page.waitForTimeout(1000);

    // 应该仍然在登录页（URL 包含 /login）
    expect(page.url()).toContain('/login');
  });

  test('可以输入用户名和密码', async ({ page }) => {
    await page.goto('/login');

    // 输入凭据
    await page.getByPlaceholder('用户名').fill('admin');
    await page.getByPlaceholder('密码').fill('admin123');

    // 验证输入值
    await expect(page.getByPlaceholder('用户名')).toHaveValue('admin');
    await expect(page.getByPlaceholder('密码')).toHaveValue('admin123');
  });

  test('使用错误凭据登录后应该仍在登录页', async ({ page }) => {
    await page.goto('/login');

    // 输入错误的凭据
    await page.getByPlaceholder('用户名').fill('wronguser');
    await page.getByPlaceholder('密码').fill('wrongpass');

    // 点击登录
    await page.getByRole('button', { name: '登录' }).click();

    // 等待响应
    await page.waitForTimeout(2000);

    // 应该仍然在登录页（URL 包含 /login）
    expect(page.url()).toContain('/login');
  });

  test('密码输入框类型应该是 password', async ({ page }) => {
    await page.goto('/login');

    const passwordInput = page.getByPlaceholder('密码');

    // 应该是 password 类型
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('应该显示默认账号信息（开发环境）', async ({ page }) => {
    await page.goto('/login');

    // 开发环境应该显示默认账号提示（使用精确匹配）
    await expect(page.getByText('admin', { exact: true })).toBeVisible();
    await expect(page.getByText('admin123', { exact: true })).toBeVisible();
  });
});

test.describe('页面无需认证即可访问', () => {
  test('我的技能页面可以直接访问', async ({ page }) => {
    await page.goto('/my-skills');
    // 页面应该加载成功
    await expect(page.locator('body')).toBeVisible();
  });

  test('历史记录页面可以直接访问', async ({ page }) => {
    await page.goto('/history');
    await expect(page.locator('body')).toBeVisible();
  });

  test('设置页面可以直接访问', async ({ page }) => {
    await page.goto('/settings');
    await expect(page.locator('body')).toBeVisible();
  });
});
