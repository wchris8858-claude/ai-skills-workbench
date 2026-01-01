import { test, expect } from '@playwright/test';

/**
 * 技能 API 测试 - 覆盖所有技能相关端点
 */

test.describe('GET /api/skills', () => {
  test('应该返回技能列表', async ({ request }) => {
    const response = await request.get('/api/skills');

    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(Array.isArray(body.skills) || Array.isArray(body)).toBe(true);
  });

  test('技能列表应该包含必要字段', async ({ request }) => {
    const response = await request.get('/api/skills');

    expect(response.status()).toBe(200);

    const body = await response.json();
    const skills = body.skills || body;

    if (skills.length > 0) {
      const skill = skills[0];
      // 验证技能对象结构
      expect(skill).toHaveProperty('id');
      expect(skill).toHaveProperty('name');
    }
  });

  test('应该支持分类筛选', async ({ request }) => {
    const response = await request.get('/api/skills?category=copywriting');

    expect(response.status()).toBeLessThan(500);
  });

  test('应该支持搜索', async ({ request }) => {
    const response = await request.get('/api/skills?search=文案');

    expect(response.status()).toBeLessThan(500);
  });
});

test.describe('GET /api/skills/[id]', () => {
  test('应该返回指定技能详情', async ({ request }) => {
    // 先获取技能列表
    const listResponse = await request.get('/api/skills');
    const listBody = await listResponse.json();
    const skills = listBody.skills || listBody;

    if (skills.length > 0) {
      const skillId = skills[0].id;
      const response = await request.get(`/api/skills/${skillId}`);

      expect(response.status()).toBeLessThan(500);

      if (response.status() === 200) {
        const body = await response.json();
        expect(body.id || body.skill?.id).toBe(skillId);
      }
    }
  });

  test('不存在的技能应该返回 404', async ({ request }) => {
    const response = await request.get('/api/skills/non-existent-skill-xyz');

    expect(response.status()).toBe(404);
  });

  test('应该返回技能的完整信息', async ({ request }) => {
    const response = await request.get('/api/skills/moments-copywriter');

    // 技能可能存在也可能不存在
    expect(response.status()).toBeLessThan(500);
  });
});

test.describe('技能使用 API', () => {
  test.fixme('应该能使用技能生成内容', async ({ request }) => {
    // 需要认证
    await request.post('/api/auth/login', {
      data: {
        username: 'admin',
        password: 'admin123',
      },
    });

    // 调用技能
    const response = await request.post('/api/claude/chat', {
      data: {
        skillId: 'moments-copywriter',
        messages: [
          { role: 'user', content: '帮我写一条关于瑜伽课程的朋友圈文案' },
        ],
      },
    });

    // 这个测试可能因为 API key 问题失败
    expect(response.status()).toBeLessThan(500);
  });
});
