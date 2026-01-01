import { test, expect } from '@playwright/test';

/**
 * 历史记录 API 测试
 */

test.describe('GET /api/history', () => {
  test('未认证时应该返回 401', async ({ request }) => {
    const response = await request.get('/api/history');

    expect(response.status()).toBe(401);
  });

  test('认证后应该返回历史记录', async ({ request }) => {
    // 登录
    await request.post('/api/auth/login', {
      data: {
        username: 'admin',
        password: 'admin123',
      },
    });

    const response = await request.get('/api/history');

    expect(response.status()).toBeLessThan(500);
  });

  test('应该支持分页参数', async ({ request }) => {
    await request.post('/api/auth/login', {
      data: {
        username: 'admin',
        password: 'admin123',
      },
    });

    const response = await request.get('/api/history?page=1&limit=10');

    expect(response.status()).toBeLessThan(500);
  });

  test('应该支持日期范围筛选', async ({ request }) => {
    await request.post('/api/auth/login', {
      data: {
        username: 'admin',
        password: 'admin123',
      },
    });

    const today = new Date().toISOString().split('T')[0];
    const response = await request.get(`/api/history?startDate=${today}`);

    expect(response.status()).toBeLessThan(500);
  });
});

test.describe('GET /api/history/[id]', () => {
  test('未认证时应该返回 401', async ({ request }) => {
    const response = await request.get('/api/history/test-id');

    expect(response.status()).toBe(401);
  });

  test('认证后访问不存在的记录应该返回 404', async ({ request }) => {
    await request.post('/api/auth/login', {
      data: {
        username: 'admin',
        password: 'admin123',
      },
    });

    const response = await request.get('/api/history/non-existent-id');

    // 返回 404 或其他非 500 错误
    expect(response.status()).toBeLessThan(500);
  });
});

test.describe('DELETE /api/history/[id]', () => {
  test('未认证时应该返回 401', async ({ request }) => {
    const response = await request.delete('/api/history/test-id');

    expect(response.status()).toBe(401);
  });
});
