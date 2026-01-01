import { test, expect } from '@playwright/test';

test.describe('技能页面', () => {
  test('应该能访问朋友圈文案技能页', async ({ page }) => {
    const response = await page.goto('/skill/moments-copywriter');

    // 页面应该加载成功（2xx 或 3xx）
    expect(response?.status()).toBeLessThan(400);

    // 应该显示技能相关内容
    await expect(page.locator('body')).toBeVisible();
  });

  test('应该能访问图片选择器页面', async ({ page }) => {
    const response = await page.goto('/photo-selector');

    expect(response?.status()).toBeLessThan(400);
  });

  test('访问不存在的技能页面应该显示错误信息', async ({ page }) => {
    const response = await page.goto('/skill/nonexistent-skill-12345');

    // 页面可能返回 200 (带错误消息) 或 404
    expect(response?.status()).toBeLessThan(500);

    // 页面应该显示技能不存在的信息
    const content = await page.textContent('body');
    expect(
      content?.includes('404') ||
      content?.includes('找不到') ||
      content?.includes('未找到') ||
      content?.includes('不存在') ||
      content?.includes('错误')
    ).toBeTruthy();
  });
});

test.describe('技能列表', () => {
  test('首页技能广场应该存在', async ({ page }) => {
    await page.goto('/');

    // 等待页面加载
    await page.waitForLoadState('networkidle');

    // 检查技能广场标题存在
    await expect(page.locator('text=技能广场').first()).toBeVisible();
  });
});

test.describe('我的技能页面', () => {
  test('应该能访问我的技能页面', async ({ page }) => {
    const response = await page.goto('/my-skills');

    expect(response?.status()).toBeLessThan(400);
    await expect(page.locator('body')).toBeVisible();
  });
});
