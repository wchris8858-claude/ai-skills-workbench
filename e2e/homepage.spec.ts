import { test, expect } from '@playwright/test';

test.describe('首页', () => {
  test('应该正确加载首页', async ({ page }) => {
    await page.goto('/');

    // 检查页面标题
    await expect(page).toHaveTitle(/AI 掌柜/);

    // 检查主标题存在
    await expect(page.locator('h1')).toBeVisible();
  });

  test('应该显示导航栏', async ({ page }) => {
    await page.goto('/');

    // 检查导航栏存在
    await expect(page.locator('header')).toBeVisible();

    // 检查 logo（使用更精确的选择器）
    await expect(page.locator('header').getByText('AI 掌柜').first()).toBeVisible();
  });

  test('应该显示技能广场区域', async ({ page }) => {
    await page.goto('/');

    // 等待页面加载
    await page.waitForLoadState('networkidle');

    // 检查技能广场标题
    const skillsSection = page.locator('text=技能广场').first();
    await expect(skillsSection).toBeVisible();
  });

  test('应该有登录按钮', async ({ page }) => {
    await page.goto('/');

    // 检查登录链接
    await expect(page.getByRole('link', { name: '登录' })).toBeVisible();
  });

  test('点击登录按钮应跳转到登录页', async ({ page }) => {
    await page.goto('/');

    // 点击登录按钮
    await page.getByRole('link', { name: '登录' }).first().click();

    // 验证跳转到登录页
    await expect(page).toHaveURL('/login');
  });

  test('应该显示功能特性区域', async ({ page }) => {
    await page.goto('/');

    // 检查功能特性标题
    await expect(page.locator('text=功能特性').first()).toBeVisible();

    // 检查特性卡片
    await expect(page.locator('text=文案创作').first()).toBeVisible();
  });

  test('页脚应该正确显示', async ({ page }) => {
    await page.goto('/');

    // 检查页脚存在
    await expect(page.locator('footer')).toBeVisible();

    // 检查页脚中的品牌信息
    await expect(page.locator('footer').getByText('AI 掌柜').first()).toBeVisible();
  });
});

test.describe('响应式设计', () => {
  test('移动端应该显示汉堡菜单', async ({ page }) => {
    // 设置移动端视口
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // 检查移动端菜单按钮
    await expect(page.getByLabel('打开菜单')).toBeVisible();
  });
});
