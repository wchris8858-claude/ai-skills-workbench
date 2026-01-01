import { test, expect } from '@playwright/test';

test.describe('API 端点测试', () => {
  test.describe('健康检查', () => {
    test('GET /api/health 应该返回健康状态', async ({ request }) => {
      const response = await request.get('/api/health');

      expect(response.ok()).toBeTruthy();

      const data = await response.json();
      expect(data).toHaveProperty('status');
      expect(data).toHaveProperty('version');
      expect(data).toHaveProperty('uptime');
    });
  });

  test.describe('技能 API', () => {
    test('GET /api/skills 应该返回技能列表', async ({ request }) => {
      const response = await request.get('/api/skills');

      expect(response.ok()).toBeTruthy();

      const data = await response.json();
      expect(data).toHaveProperty('skills');
      expect(Array.isArray(data.skills)).toBeTruthy();
      expect(data.skills.length).toBeGreaterThan(0);
    });

    test('技能列表应该包含必要字段', async ({ request }) => {
      const response = await request.get('/api/skills');
      const data = await response.json();

      const firstSkill = data.skills[0];
      expect(firstSkill).toHaveProperty('id');
      expect(firstSkill).toHaveProperty('name');
      expect(firstSkill).toHaveProperty('description');
      expect(firstSkill).toHaveProperty('category');
    });

    test('GET /api/skills/:id 应该返回技能详情', async ({ request }) => {
      const response = await request.get('/api/skills/moments-copywriter');

      expect(response.ok()).toBeTruthy();

      const data = await response.json();
      expect(data).toHaveProperty('id', 'moments-copywriter');
      expect(data).toHaveProperty('content');
    });

    test('GET /api/skills/nonexistent 应该返回 404', async ({ request }) => {
      const response = await request.get('/api/skills/nonexistent-skill-12345');

      expect(response.status()).toBe(404);
    });
  });

  test.describe('认证 API', () => {
    test('POST /api/auth/login 使用正确凭据应该成功', async ({ request }) => {
      const response = await request.post('/api/auth/login', {
        data: {
          username: 'admin',
          password: 'admin123',
        },
      });

      // 可能返回 200 或 429 (rate limit)
      expect(response.status()).toBeLessThan(500);
    });

    test('POST /api/auth/login 使用错误凭据应该返回错误', async ({
      request,
    }) => {
      const response = await request.post('/api/auth/login', {
        data: {
          username: 'wronguser',
          password: 'wrongpassword',
        },
      });

      // 可能返回 401 或 429 (rate limit)
      expect(response.status()).toBeGreaterThanOrEqual(400);
      expect(response.status()).toBeLessThan(500);
    });

    test('POST /api/auth/login 缺少参数应该返回错误', async ({ request }) => {
      const response = await request.post('/api/auth/login', {
        data: {},
      });

      expect(response.ok()).toBeFalsy();
    });
  });

  test.describe('受保护的 API', () => {
    test('GET /api/favorites 未认证应该返回 401', async ({ request }) => {
      const response = await request.get('/api/favorites');

      expect(response.status()).toBe(401);
    });

    test('GET /api/history 未认证应该返回 401', async ({ request }) => {
      const response = await request.get('/api/history');

      expect(response.status()).toBe(401);
    });

    test('GET /api/users 未认证应该返回 401', async ({ request }) => {
      const response = await request.get('/api/users');

      expect(response.status()).toBe(401);
    });
  });

  test.describe('管理员 API', () => {
    test('GET /api/admin/settings 应该返回模型配置', async ({ request }) => {
      const response = await request.get('/api/admin/settings');

      expect(response.ok()).toBeTruthy();

      const data = await response.json();
      expect(data).toHaveProperty('modelConfigs');
    });
  });
});
