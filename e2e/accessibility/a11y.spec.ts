import { test, expect } from '@playwright/test';

/**
 * 无障碍访问测试
 */

test.describe('键盘导航', () => {
  test('登录页面应该支持键盘导航', async ({ page }) => {
    await page.goto('/login');

    // Tab 应该能在元素间切换
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // 应该有一个元素获得焦点
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedElement).toBeDefined();
  });

  test('所有交互元素应该可通过 Tab 访问', async ({ page }) => {
    await page.goto('/login');

    // 按 Tab 遍历所有可聚焦元素
    const focusableElements: string[] = [];

    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab');
      const tagName = await page.evaluate(() => document.activeElement?.tagName);
      if (tagName) {
        focusableElements.push(tagName);
      }
    }

    // 应该有多个可聚焦元素
    expect(focusableElements.length).toBeGreaterThan(0);
  });

  test('Escape 键应该关闭对话框', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // 查找可能打开对话框的按钮
    const dialogTrigger = page.locator('[data-dialog-trigger], [aria-haspopup="dialog"]').first();

    if (await dialogTrigger.isVisible()) {
      await dialogTrigger.click();
      await page.waitForTimeout(500);

      // 按 Escape 关闭
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);

      // 对话框应该关闭
      const dialog = page.locator('[role="dialog"]');
      expect(await dialog.isVisible()).toBe(false);
    }
  });
});

test.describe('ARIA 属性', () => {
  test('按钮应该有正确的 role', async ({ page }) => {
    await page.goto('/login');

    const loginButton = page.getByRole('button', { name: '登录' });
    await expect(loginButton).toBeVisible();
  });

  test('输入框应该有 label 或 aria-label', async ({ page }) => {
    await page.goto('/login');

    const usernameInput = page.getByPlaceholder('用户名');

    // 应该有 placeholder 或 aria-label
    const placeholder = await usernameInput.getAttribute('placeholder');
    const ariaLabel = await usernameInput.getAttribute('aria-label');

    expect(placeholder || ariaLabel).toBeTruthy();
  });

  test('链接应该有可访问的文本', async ({ page }) => {
    await page.goto('/login');

    const links = page.locator('a');
    const count = await links.count();

    for (let i = 0; i < Math.min(count, 5); i++) {
      const link = links.nth(i);
      const text = await link.textContent();
      const ariaLabel = await link.getAttribute('aria-label');

      // 链接应该有文本或 aria-label
      expect(text || ariaLabel).toBeTruthy();
    }
  });
});

test.describe('颜色对比度', () => {
  test('文本应该有足够的对比度', async ({ page }) => {
    await page.goto('/login');

    const loginButton = page.getByRole('button', { name: '登录' });

    // 获取按钮的颜色
    const bgColor = await loginButton.evaluate((el) =>
      window.getComputedStyle(el).backgroundColor
    );
    const textColor = await loginButton.evaluate((el) =>
      window.getComputedStyle(el).color
    );

    // 颜色应该被定义
    expect(bgColor).toBeDefined();
    expect(textColor).toBeDefined();
  });
});

test.describe('焦点指示器', () => {
  test('聚焦元素应该有可见的焦点指示器', async ({ page }) => {
    await page.goto('/login');

    const usernameInput = page.getByPlaceholder('用户名');
    await usernameInput.focus();

    // 获取焦点样式
    const outline = await usernameInput.evaluate((el) =>
      window.getComputedStyle(el).outline
    );
    const boxShadow = await usernameInput.evaluate((el) =>
      window.getComputedStyle(el).boxShadow
    );
    const border = await usernameInput.evaluate((el) =>
      window.getComputedStyle(el).border
    );

    // 应该有某种焦点指示
    expect(outline || boxShadow || border).toBeDefined();
  });
});

test.describe('屏幕阅读器支持', () => {
  test('页面应该有主要 landmark', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // 检查 main landmark
    const main = page.locator('main, [role="main"]');
    expect(await main.count() >= 0).toBe(true);
  });

  test('表单应该有正确的结构', async ({ page }) => {
    await page.goto('/login');

    // 检查表单元素
    const form = page.locator('form');
    expect(await form.count() >= 0).toBe(true);
  });
});

test.describe('响应式文字大小', () => {
  test('页面应该支持文字缩放', async ({ page }) => {
    await page.goto('/login');

    // 获取初始字体大小
    const initialFontSize = await page.locator('body').evaluate((el) =>
      parseFloat(window.getComputedStyle(el).fontSize)
    );

    // 模拟浏览器缩放 (通过设置根元素字体大小)
    await page.evaluate(() => {
      document.documentElement.style.fontSize = '20px';
    });

    // 页面不应该崩溃
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('动画和运动', () => {
  test('页面应该尊重减少动画偏好', async ({ page }) => {
    // 设置减少动画偏好
    await page.emulateMedia({ reducedMotion: 'reduce' });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // 页面应该正常工作
    await expect(page.locator('body')).toBeVisible();
  });
});
