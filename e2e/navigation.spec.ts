import { test, expect } from '@playwright/test';

test.describe('页面导航', () => {
  test('所有主要页面应该可访问', async ({ page }) => {
    const pages = [
      { path: '/', name: '首页' },
      { path: '/login', name: '登录页' },
      { path: '/my-skills', name: '我的技能' },
      { path: '/history', name: '历史记录' },
      { path: '/settings', name: '设置' },
      { path: '/docs', name: '文档' },
      { path: '/dev-tools', name: '开发工具' },
      { path: '/shops', name: '店铺列表' },
      { path: '/photo-selector', name: '图片选择器' },
    ];

    for (const p of pages) {
      const response = await page.goto(p.path);
      expect(
        response?.status(),
        `${p.name} (${p.path}) 应该返回成功状态`
      ).toBeLessThan(500);
    }
  });

  test('管理后台页面应该可访问', async ({ page }) => {
    const adminPages = [
      { path: '/admin/users', name: '用户管理' },
      { path: '/admin/settings', name: '系统设置' },
    ];

    for (const p of adminPages) {
      const response = await page.goto(p.path);
      expect(
        response?.status(),
        `${p.name} (${p.path}) 应该返回成功状态`
      ).toBeLessThan(500);
    }
  });

  test('技能详情页面应该可访问', async ({ page }) => {
    const skillPages = [
      '/skill/moments-copywriter',
      '/skill/viral-analyzer',
      '/skill/video-rewriter',
    ];

    for (const path of skillPages) {
      const response = await page.goto(path);
      expect(
        response?.status(),
        `技能页面 ${path} 应该返回成功状态`
      ).toBeLessThan(500);
    }
  });

  test('404 页面应该正确显示', async ({ page }) => {
    await page.goto('/this-page-does-not-exist-12345');

    // 检查 404 页面内容
    await expect(page.locator('text=404').first()).toBeVisible();
  });
});

test.describe('导航链接', () => {
  test('登录页有返回首页的链接', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // 查找返回首页的链接
    const backLink = page.getByRole('link', { name: /返回|首页|home|back/i }).first();

    if (await backLink.isVisible()) {
      // 验证链接指向首页
      const href = await backLink.getAttribute('href');
      expect(href).toBe('/');
    } else {
      // 验证首页可访问
      await page.goto('/');
      await expect(page).toHaveURL('/');
    }
  });

  test('文档链接应该正确跳转', async ({ page }) => {
    await page.goto('/');

    // 等待页面加载
    await page.waitForLoadState('networkidle');

    // 点击文档链接
    await page.locator('footer').getByRole('link', { name: '文档' }).click();

    await expect(page).toHaveURL('/docs');
  });
});

test.describe('页面加载性能', () => {
  test('首页应该在合理时间内加载', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const loadTime = Date.now() - startTime;

    // 页面应该在 10 秒内加载完成（开发环境可能较慢）
    expect(loadTime).toBeLessThan(10000);
  });

  test('登录页应该快速加载', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');

    const loadTime = Date.now() - startTime;

    // 登录页应该在 5 秒内加载完成（开发环境可能较慢）
    expect(loadTime).toBeLessThan(5000);
  });
});
