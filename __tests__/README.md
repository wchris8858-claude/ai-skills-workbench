# 测试文档

## 测试框架

本项目使用以下测试工具:

- **Jest**: 测试运行器和断言库
- **Testing Library**: React 组件测试
- **jest-dom**: 额外的 DOM 断言

## 运行测试

```bash
# 运行所有测试
npm test

# 监听模式运行测试
npm run test:watch

# 生成覆盖率报告
npm run test:coverage
```

## 测试结构

```
__tests__/
├── components/        # 组件测试
│   └── ModelSelector.test.tsx
├── lib/              # 工具函数测试
│   ├── logger.test.ts
│   └── errors.test.ts
├── utils/            # 测试工具
│   └── test-utils.tsx
└── README.md         # 测试文档
```

## 编写测试

### 组件测试示例

```tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { MyComponent } from '@/components/MyComponent'

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />)
    expect(screen.getByText('Hello')).toBeInTheDocument()
  })

  it('should handle user interaction', () => {
    const handleClick = jest.fn()
    render(<MyComponent onClick={handleClick} />)

    fireEvent.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalled()
  })
})
```

### 工具函数测试示例

```typescript
import { myUtilFunction } from '@/lib/utils'

describe('myUtilFunction', () => {
  it('should return expected result', () => {
    const result = myUtilFunction('input')
    expect(result).toBe('expected output')
  })
})
```

### 使用测试工具

```tsx
import { render, mockSupabaseClient, mockMessage } from '@/__tests__/utils/test-utils'

describe('MyComponent', () => {
  it('should work with mock data', () => {
    const { container } = render(<MyComponent message={mockMessage} />)
    expect(container).toBeInTheDocument()
  })
})
```

## Mock 说明

### 自动 Mock

以下内容在 `jest.setup.ts` 中自动 Mock:

- `next/navigation` - Next.js 路由相关 hooks
- `window.matchMedia` - 媒体查询
- 环境变量 - Supabase 和 API 密钥

### 手动 Mock

需要 mock 外部依赖时:

```typescript
jest.mock('@/lib/supabase', () => ({
  supabase: mockSupabaseClient,
}))
```

## 测试覆盖率

当前覆盖率目标:

- Branches: 0% (初始配置)
- Functions: 0% (初始配置)
- Lines: 0% (初始配置)
- Statements: 0% (初始配置)

**注意**: 覆盖率目标设置为 0% 以便项目初期不阻塞构建,随着测试增加逐步提高目标。

## 最佳实践

### 1. 测试文件命名

- 使用 `.test.ts` 或 `.test.tsx` 后缀
- 与被测试文件保持相同的路径结构

### 2. 测试组织

- 使用 `describe` 分组相关测试
- 每个 `it` 只测试一个功能点
- 使用清晰的测试描述

### 3. 断言

- 使用具体的断言而非泛型断言
- 优先使用 Testing Library 查询而非 DOM 查询

```typescript
// ✅ 推荐
expect(screen.getByRole('button')).toBeInTheDocument()

// ❌ 不推荐
expect(container.querySelector('button')).toBeTruthy()
```

### 4. 异步测试

```typescript
it('should handle async operations', async () => {
  render(<MyComponent />)

  // 等待元素出现
  const element = await screen.findByText('Loaded')
  expect(element).toBeInTheDocument()
})
```

### 5. 清理

```typescript
beforeEach(() => {
  jest.clearAllMocks()
})

afterEach(() => {
  cleanup()
})
```

## 常见问题

### 问题: 测试无法找到模块

**解决**: 检查 `jest.config.ts` 中的 `moduleNameMapper` 配置

### 问题: React hooks 错误

**解决**: 确保组件在测试环境中正确渲染,使用 `@testing-library/react-hooks` 测试自定义 hooks

### 问题: 环境变量未定义

**解决**: 在 `jest.setup.ts` 中添加环境变量 mock

## 参考资源

- [Jest 文档](https://jestjs.io/docs/getting-started)
- [Testing Library 文档](https://testing-library.com/docs/react-testing-library/intro/)
- [Jest DOM 匹配器](https://github.com/testing-library/jest-dom)
