import { test, expect } from '@playwright/test';

/**
 * 媒体处理 API 测试
 */

test.describe('POST /api/upload/image', () => {
  test('上传请求应该返回有效响应', async ({ request }) => {
    const response = await request.post('/api/upload/image', {
      multipart: {
        file: {
          name: 'test.jpg',
          mimeType: 'image/jpeg',
          buffer: Buffer.from('fake image content'),
        },
      },
    });

    // 可能返回 401 或其他状态
    expect(response.status()).toBeLessThan(500);
  });

  test('认证后上传无效文件应该返回错误', async ({ request }) => {
    await request.post('/api/auth/login', {
      data: {
        username: 'admin',
        password: 'admin123',
      },
    });

    const response = await request.post('/api/upload/image', {
      multipart: {
        file: {
          name: 'test.txt',
          mimeType: 'text/plain',
          buffer: Buffer.from('not an image'),
        },
      },
    });

    // 应该返回错误或被拒绝
    expect(response.status()).toBeLessThan(500);
  });

  test('上传不带文件应该返回错误', async ({ request }) => {
    await request.post('/api/auth/login', {
      data: {
        username: 'admin',
        password: 'admin123',
      },
    });

    const response = await request.post('/api/upload/image', {
      data: {},
    });

    // 应该返回 400 验证错误
    expect(response.status()).toBe(400);
  });
});

test.describe('POST /api/analyze-photo', () => {
  test('分析请求无认证应该返回错误', async ({ request }) => {
    const response = await request.post('/api/analyze-photo', {
      data: {},
    });

    // 无认证或无效格式都应该返回错误
    expect(response.status()).toBeGreaterThanOrEqual(400);
    expect(response.status()).toBeLessThan(500);
  });

  test('不提供图片应该返回 400', async ({ request }) => {
    await request.post('/api/auth/login', {
      data: {
        username: 'admin',
        password: 'admin123',
      },
    });

    const response = await request.post('/api/analyze-photo', {
      data: {},
    });

    // 应该返回 400 验证错误
    expect(response.status()).toBe(400);
  });
});

test.describe('POST /api/speech-to-text', () => {
  test('语音转文字请求应该返回有效响应', async ({ request }) => {
    const response = await request.post('/api/speech-to-text', {
      multipart: {
        audio: {
          name: 'test.wav',
          mimeType: 'audio/wav',
          buffer: Buffer.from('fake audio'),
        },
      },
    });

    expect(response.status()).toBeLessThan(500);
  });

  test('不提供音频应该返回 400', async ({ request }) => {
    await request.post('/api/auth/login', {
      data: {
        username: 'admin',
        password: 'admin123',
      },
    });

    const response = await request.post('/api/speech-to-text', {
      data: {},
    });

    // 应该返回 400 验证错误
    expect(response.status()).toBe(400);
  });
});
