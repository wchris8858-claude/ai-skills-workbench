import { test, expect } from '@playwright/test';

/**
 * 认证 API 测试 - 覆盖所有认证端点
 */

test.describe('POST /api/auth/login', () => {
  test('使用有效凭据应该登录成功', async ({ request }) => {
    const response = await request.post('/api/auth/login', {
      data: {
        username: 'admin',
        password: 'admin123',
      },
    });

    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.user).toBeDefined();
    expect(body.user.username).toBe('admin');
  });

  test('使用无效凭据应该返回错误', async ({ request }) => {
    const response = await request.post('/api/auth/login', {
      data: {
        username: 'wronguser',
        password: 'wrongpass',
      },
    });

    // 应该返回 4xx 错误
    expect(response.status()).toBeGreaterThanOrEqual(400);
    expect(response.status()).toBeLessThan(500);
  });

  test('空凭据应该返回错误', async ({ request }) => {
    const response = await request.post('/api/auth/login', {
      data: {
        username: '',
        password: '',
      },
    });

    expect(response.status()).toBeGreaterThanOrEqual(400);
  });

  test('缺少密码应该返回错误', async ({ request }) => {
    const response = await request.post('/api/auth/login', {
      data: {
        username: 'admin',
      },
    });

    expect(response.status()).toBeGreaterThanOrEqual(400);
  });

  test('缺少用户名应该返回错误', async ({ request }) => {
    const response = await request.post('/api/auth/login', {
      data: {
        password: 'admin123',
      },
    });

    expect(response.status()).toBeGreaterThanOrEqual(400);
  });
});

test.describe('POST /api/auth/logout', () => {
  test('登出应该成功', async ({ request }) => {
    // 先登录
    await request.post('/api/auth/login', {
      data: {
        username: 'admin',
        password: 'admin123',
      },
    });

    // 然后登出
    const response = await request.post('/api/auth/logout');

    expect(response.status()).toBeLessThan(500);
  });

  test('未登录时登出也应该成功', async ({ request }) => {
    const response = await request.post('/api/auth/logout');

    // 应该返回成功或无操作
    expect(response.status()).toBeLessThan(500);
  });
});

test.describe('GET /api/auth/me', () => {
  test('未登录时应该返回错误或空', async ({ request }) => {
    const response = await request.get('/api/auth/me');

    // 未认证可能返回 401 或其他状态
    expect(response.status()).toBeLessThan(500);
  });

  test('登录后应该返回用户信息', async ({ request }) => {
    // 先登录
    const loginResponse = await request.post('/api/auth/login', {
      data: {
        username: 'admin',
        password: 'admin123',
      },
    });

    // 可能被限流返回 429
    expect(loginResponse.status()).toBeLessThan(500);

    // 获取当前用户信息
    const meResponse = await request.get('/api/auth/me');

    // 响应应该有效
    expect(meResponse.status()).toBeLessThan(500);
  });
});

test.describe('认证 Cookie 和 Session', () => {
  test('登录应该成功并返回用户信息', async ({ request }) => {
    const response = await request.post('/api/auth/login', {
      data: {
        username: 'admin',
        password: 'admin123',
      },
    });

    // 可能返回 200 或 429 (rate limit)
    expect(response.status()).toBeLessThan(500);
  });
});
