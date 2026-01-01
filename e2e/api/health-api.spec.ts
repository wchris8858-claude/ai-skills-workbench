import { test, expect } from '@playwright/test';

/**
 * 健康检查 API 测试
 */

test.describe('GET /api/health', () => {
  test('应该返回健康状态', async ({ request }) => {
    const response = await request.get('/api/health');

    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.status).toBeDefined();
    expect(['healthy', 'degraded', 'unhealthy']).toContain(body.status);
  });

  test('应该返回时间戳', async ({ request }) => {
    const response = await request.get('/api/health');

    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.timestamp).toBeDefined();
  });

  test('应该返回各服务的健康状态', async ({ request }) => {
    const response = await request.get('/api/health');

    expect(response.status()).toBe(200);

    const body = await response.json();

    // 检查各项服务状态
    if (body.checks) {
      expect(typeof body.checks).toBe('object');
    }
  });

  test('响应时间应该在合理范围内', async ({ request }) => {
    const startTime = Date.now();
    const response = await request.get('/api/health');
    const duration = Date.now() - startTime;

    expect(response.status()).toBe(200);
    // 健康检查应该在 5 秒内响应
    expect(duration).toBeLessThan(5000);
  });

  test('应该返回正确的 Content-Type', async ({ request }) => {
    const response = await request.get('/api/health');

    const contentType = response.headers()['content-type'];
    expect(contentType).toContain('application/json');
  });
});

test.describe('健康检查详情', () => {
  test('应该包含数据库连接状态', async ({ request }) => {
    const response = await request.get('/api/health');
    const body = await response.json();

    // 如果有 checks 对象，验证数据库状态
    if (body.checks?.database) {
      expect(['ok', 'error', 'degraded']).toContain(body.checks.database.status);
    }
  });

  test('应该包含内存使用情况', async ({ request }) => {
    const response = await request.get('/api/health');
    const body = await response.json();

    if (body.checks?.memory) {
      expect(body.checks.memory.used).toBeDefined();
    }
  });
});
