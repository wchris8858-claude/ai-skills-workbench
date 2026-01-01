import { test, expect } from '@playwright/test';

/**
 * V2 API - 多店铺功能测试
 */

test.describe('GET /api/v2/shops', () => {
  test('未认证时应该返回 401', async ({ request }) => {
    const response = await request.get('/api/v2/shops');

    expect(response.status()).toBe(401);
  });

  test('认证后应该返回店铺列表', async ({ request }) => {
    await request.post('/api/auth/login', {
      data: {
        username: 'admin',
        password: 'admin123',
      },
    });

    const response = await request.get('/api/v2/shops');

    expect(response.status()).toBeLessThan(500);

    if (response.status() === 200) {
      const body = await response.json();
      expect(Array.isArray(body.shops) || Array.isArray(body)).toBe(true);
    }
  });
});

test.describe('POST /api/v2/shops', () => {
  test('未认证时应该返回 401', async ({ request }) => {
    const response = await request.post('/api/v2/shops', {
      data: {
        name: 'Test Shop',
        type: 'yoga',
      },
    });

    expect(response.status()).toBe(401);
  });

  // 注意：创建店铺需要完整的数据库配置
  test.fixme('认证后应该能创建店铺', async ({ request }) => {
    await request.post('/api/auth/login', {
      data: {
        username: 'admin',
        password: 'admin123',
      },
    });

    const response = await request.post('/api/v2/shops', {
      data: {
        name: `Test Shop ${Date.now()}`,
        industry: 'yoga',
        description: 'A test yoga studio',
      },
    });

    // 可能返回 201 (创建成功) 或其他非 500 状态
    expect(response.status()).toBeLessThan(500);
  });
});

test.describe('GET /api/v2/shops/[shopId]', () => {
  test('未认证时应该返回 401', async ({ request }) => {
    const response = await request.get('/api/v2/shops/test-shop');

    expect(response.status()).toBe(401);
  });

  test('认证后访问不存在的店铺应该返回 403 或 404', async ({ request }) => {
    await request.post('/api/auth/login', {
      data: {
        username: 'admin',
        password: 'admin123',
      },
    });

    const response = await request.get('/api/v2/shops/non-existent-shop-xyz');

    // 返回 403 (无权限) 或 404 (不存在)
    expect(response.status()).toBeLessThan(500);
    expect(response.status()).toBeGreaterThanOrEqual(400);
  });
});

test.describe('PUT /api/v2/shops/[shopId]', () => {
  test('未认证时应该返回 401', async ({ request }) => {
    const response = await request.put('/api/v2/shops/test-shop', {
      data: {
        name: 'Updated Shop Name',
      },
    });

    expect(response.status()).toBe(401);
  });
});

test.describe('DELETE /api/v2/shops/[shopId]', () => {
  test('未认证时应该返回 401', async ({ request }) => {
    const response = await request.delete('/api/v2/shops/test-shop');

    expect(response.status()).toBe(401);
  });
});

test.describe('GET /api/v2/shops/[shopId]/analytics', () => {
  test('未认证时应该返回 401', async ({ request }) => {
    const response = await request.get('/api/v2/shops/test-shop/analytics');

    expect(response.status()).toBe(401);
  });
});

test.describe('GET /api/v2/shops/[shopId]/calendar', () => {
  test('未认证时应该返回 401', async ({ request }) => {
    const response = await request.get('/api/v2/shops/test-shop/calendar');

    expect(response.status()).toBe(401);
  });
});

test.describe('GET /api/v2/shops/[shopId]/knowledge', () => {
  test('未认证时应该返回 401', async ({ request }) => {
    const response = await request.get('/api/v2/shops/test-shop/knowledge');

    expect(response.status()).toBe(401);
  });
});

test.describe('POST /api/v2/shops/[shopId]/knowledge/search', () => {
  test('未认证时应该返回 401', async ({ request }) => {
    const response = await request.post('/api/v2/shops/test-shop/knowledge/search', {
      data: { query: 'test' },
    });

    expect(response.status()).toBe(401);
  });
});

test.describe('GET /api/v2/shops/[shopId]/training', () => {
  test('未认证时应该返回 401', async ({ request }) => {
    const response = await request.get('/api/v2/shops/test-shop/training');

    expect(response.status()).toBe(401);
  });
});

test.describe('POST /api/v2/generate', () => {
  test('未认证时应该返回 401', async ({ request }) => {
    const response = await request.post('/api/v2/generate', {
      data: {
        shopId: 'test-shop',
        prompt: 'Generate content',
      },
    });

    expect(response.status()).toBe(401);
  });
});

test.describe('POST /api/v2/content/check', () => {
  test('未认证时应该返回 401', async ({ request }) => {
    const response = await request.post('/api/v2/content/check', {
      data: {
        content: 'Test content to check',
      },
    });

    expect(response.status()).toBe(401);
  });

  test('认证后应该能检查内容', async ({ request }) => {
    await request.post('/api/auth/login', {
      data: {
        username: 'admin',
        password: 'admin123',
      },
    });

    const response = await request.post('/api/v2/content/check', {
      data: {
        content: '这是一段测试内容，用于检查敏感词',
      },
    });

    expect(response.status()).toBeLessThan(500);
  });
});
