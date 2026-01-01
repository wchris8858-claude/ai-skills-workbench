# API 测试命令

测试项目的 API 端点。

## 使用方式
```
/project:api-test <端点路径>
```

## 测试流程

### 1. 确认端点信息
- 请求方法（GET/POST/PUT/DELETE）
- 请求路径
- 请求参数
- 认证要求

### 2. 编写测试用例

```typescript
// __tests__/api/<endpoint>.test.ts
describe('API: /api/<endpoint>', () => {
  it('should return success for valid request', async () => {
    const response = await fetch('/api/<endpoint>', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ /* params */ }),
    })

    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.success).toBe(true)
  })

  it('should return error for invalid request', async () => {
    // 测试错误情况
  })
})
```

### 3. 运行测试
```bash
npm run test -- --grep "API: /api/<endpoint>"
```

### 4. 检查项目
- [ ] 正常请求返回正确响应
- [ ] 错误请求返回合适错误码
- [ ] 认证验证正常工作
- [ ] 边界情况处理正确

## 常用 API 端点
| 端点 | 方法 | 用途 |
|------|------|------|
| /api/auth/me | GET | 获取当前用户 |
| /api/chat | POST | 发送聊天消息 |
| /api/conversations | GET | 获取对话列表 |
| /api/skills | GET | 获取技能列表 |
