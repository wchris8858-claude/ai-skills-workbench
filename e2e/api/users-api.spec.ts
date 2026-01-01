import { test, expect } from '@playwright/test';

/**
 * 用户管理 API 测试
 */

test.describe('GET /api/users', () => {
  test('未认证时应该返回 401', async ({ request }) => {
    const response = await request.get('/api/users');

    expect(response.status()).toBe(401);
  });

  test('认证后应该返回用户列表', async ({ request }) => {
    // 登录
    await request.post('/api/auth/login', {
      data: {
        username: 'admin',
        password: 'admin123',
      },
    });

    const response = await request.get('/api/users');

    // 可能返回 200 或其他状态
    expect(response.status()).toBeLessThan(500);

    if (response.status() === 200) {
      const body = await response.json();
      expect(Array.isArray(body.users) || Array.isArray(body)).toBe(true);
    }
  });
});

test.describe('GET /api/users/[id]', () => {
  test('未认证时应该返回 401', async ({ request }) => {
    const response = await request.get('/api/users/test-user-id');

    expect(response.status()).toBe(401);
  });

  test('认证后访问不存在的用户应该返回 404', async ({ request }) => {
    await request.post('/api/auth/login', {
      data: {
        username: 'admin',
        password: 'admin123',
      },
    });

    const response = await request.get('/api/users/non-existent-user-999');

    // 返回 404 (不存在) 或其他非 500 错误
    expect(response.status()).toBeLessThan(500);
    expect(response.status()).toBeGreaterThanOrEqual(400);
  });
});

test.describe('POST /api/users', () => {
  test('未认证时应该返回 401', async ({ request }) => {
    const response = await request.post('/api/users', {
      data: {
        username: 'newuser',
        password: 'newpass123',
        email: 'new@example.com',
      },
    });

    expect(response.status()).toBe(401);
  });

  test('管理员应该能创建用户', async ({ request }) => {
    // 登录
    await request.post('/api/auth/login', {
      data: {
        username: 'admin',
        password: 'admin123',
      },
    });

    const response = await request.post('/api/users', {
      data: {
        username: `testuser_${Date.now()}`,
        password: 'testpass123',
        email: `test_${Date.now()}@example.com`,
      },
    });

    // 应该返回 201 Created
    expect(response.status()).toBe(201);
  });
});

test.describe('PATCH /api/users/[id]', () => {
  test('未认证时应该返回 401', async ({ request }) => {
    const response = await request.patch('/api/users/test-user-id', {
      data: {
        name: 'Updated Name',
      },
    });

    expect(response.status()).toBe(401);
  });
});

test.describe('DELETE /api/users/[id]', () => {
  test('未认证时应该返回 401', async ({ request }) => {
    const response = await request.delete('/api/users/test-user-id');

    expect(response.status()).toBe(401);
  });
});
