import { test, expect } from '@playwright/test';

/**
 * 全面页面路由测试 - 覆盖所有 14 个页面
 */

test.describe('核心页面路由', () => {
  const corePages = [
    { path: '/', name: '首页', expectedText: ['AI 掌柜', '技能'] },
    { path: '/login', name: '登录页', expectedText: ['欢迎回来', '登录'] },
    { path: '/my-skills', name: '我的技能', expectedText: ['技能'] },
    { path: '/history', name: '历史记录', expectedText: ['历史'] },
    { path: '/settings', name: '设置', expectedText: ['设置'] },
    { path: '/docs', name: '文档', expectedText: ['文档'] },
    { path: '/dev-tools', name: '开发工具', expectedText: ['开发'] },
    { path: '/test-config', name: '测试配置', expectedText: ['测试', '配置'] },
    { path: '/photo-selector', name: '图片选择器', expectedText: ['图片', '选择'] },
    { path: '/shops', name: '店铺列表', expectedText: ['店铺'] },
  ];

  for (const page of corePages) {
    test(`${page.name} (${page.path}) 应该可访问`, async ({ page: browserPage }) => {
      const response = await browserPage.goto(page.path);

      // 验证 HTTP 状态码
      expect(
        response?.status(),
        `${page.name} 应该返回非 500 状态码`
      ).toBeLessThan(500);

      // 页面应该有内容
      await expect(browserPage.locator('body')).toBeVisible();
    });
  }
});

test.describe('管理后台页面', () => {
  const adminPages = [
    { path: '/admin/users', name: '用户管理' },
    { path: '/admin/settings', name: '系统设置' },
  ];

  for (const page of adminPages) {
    test(`${page.name} (${page.path}) 应该可访问`, async ({ page: browserPage }) => {
      const response = await browserPage.goto(page.path);

      expect(
        response?.status(),
        `${page.name} 应该返回成功状态`
      ).toBeLessThan(500);
    });
  }
});

test.describe('动态路由页面', () => {
  // 技能详情页 - 使用已知的技能 ID
  const skillIds = [
    'moments-copywriter',
    'viral-analyzer',
    'video-rewriter',
    'pyq-copywriter',
    'photo-selector',
  ];

  for (const skillId of skillIds) {
    test(`技能详情页 /skill/${skillId} 应该可访问`, async ({ page }) => {
      const response = await page.goto(`/skill/${skillId}`);

      expect(
        response?.status(),
        `技能 ${skillId} 页面应该返回成功状态`
      ).toBeLessThan(500);
    });
  }

  test('不存在的技能应该显示错误信息', async ({ page }) => {
    await page.goto('/skill/non-existent-skill-12345');

    // 应该显示错误提示
    const content = await page.textContent('body');
    expect(
      content?.includes('404') || content?.includes('找不到') || content?.includes('未找到') || content?.includes('错误')
    ).toBeTruthy();
  });
});

test.describe('店铺详情页', () => {
  test('访问不存在的店铺应该显示 404', async ({ page }) => {
    await page.goto('/shops/non-existent-shop-xyz');

    // 页面应该显示 404 信息
    const content = await page.textContent('body');
    expect(content).toBeTruthy();

    // 开发环境可能返回 500（Next.js SSR 错误）或 404 页面
    // 检查是否显示了 404 相关信息
    expect(
      content?.includes('404') ||
      content?.includes('未找到') ||
      content?.includes('找不到') ||
      content?.includes('不存在')
    ).toBe(true);
  });
});

test.describe('404 页面', () => {
  test('不存在的页面应该显示 404', async ({ page }) => {
    await page.goto('/this-page-definitely-does-not-exist-xyz123');

    // 检查 404 指示
    const content = await page.textContent('body');
    expect(content?.toLowerCase()).toContain('404');
  });

  test('404 页面应该有返回首页的链接', async ({ page }) => {
    await page.goto('/non-existent-page');

    // 查找返回首页的链接
    const homeLink = page.getByRole('link', { name: /首页|返回|home/i });
    await expect(homeLink.first()).toBeVisible();
  });
});

test.describe('页面加载性能', () => {
  // 开发环境加载时间可能较长，设置宽松的阈值
  const performancePages = [
    { path: '/', maxTime: 10000, name: '首页' },
    { path: '/login', maxTime: 8000, name: '登录页' },
    { path: '/my-skills', maxTime: 10000, name: '我的技能' },
    { path: '/settings', maxTime: 10000, name: '设置页' },
  ];

  for (const page of performancePages) {
    test(`${page.name} 应该在 ${page.maxTime}ms 内加载`, async ({ page: browserPage }) => {
      const startTime = Date.now();

      await browserPage.goto(page.path);
      await browserPage.waitForLoadState('domcontentloaded');

      const loadTime = Date.now() - startTime;

      expect(
        loadTime,
        `${page.name} 加载时间 ${loadTime}ms 超过限制 ${page.maxTime}ms`
      ).toBeLessThan(page.maxTime);
    });
  }
});

test.describe('页面响应式设计', () => {
  const viewports = [
    { width: 375, height: 667, name: 'iPhone SE' },
    { width: 768, height: 1024, name: 'iPad' },
    { width: 1920, height: 1080, name: 'Desktop' },
  ];

  for (const viewport of viewports) {
    test(`首页在 ${viewport.name} (${viewport.width}x${viewport.height}) 应该正常显示`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/');

      // 页面内容应该可见
      await expect(page.locator('body')).toBeVisible();

      // 没有水平滚动条（内容不溢出）
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);

      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 20); // 允许小误差
    });
  }
});

test.describe('页面元数据', () => {
  test('首页应该有正确的 title', async ({ page }) => {
    await page.goto('/');

    const title = await page.title();
    expect(title).toBeTruthy();
    expect(title.length).toBeGreaterThan(0);
  });

  test('页面应该有 viewport meta 标签', async ({ page }) => {
    await page.goto('/');

    const viewport = await page.locator('meta[name="viewport"]');
    await expect(viewport).toHaveCount(1);
  });
});
