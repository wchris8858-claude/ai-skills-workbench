# Bug 修复命令

按照 TDD 流程修复 Bug。

## 使用方式
```
/project:fix-bug <问题描述>
```

## 执行步骤

### 1. 问题复现
- 确认问题现象
- 定位问题代码
- 理解问题根因

### 2. 编写失败测试（Red）
```typescript
// 先写一个会失败的测试，证明 bug 存在
test('should not have this bug', () => {
  // 触发 bug 的测试代码
  expect(buggyBehavior()).toBe(expectedBehavior)
})
```

### 3. 修复代码（Green）
- 修改代码使测试通过
- 最小化改动范围
- 不引入新问题

### 4. 重构优化（Refactor）
- 检查代码质量
- 确保符合规范
- 运行完整测试

### 5. 提交验证
```bash
npm run test
npm run build
```

## 注意事项
- 不要一次修改太多代码
- 优先修复根因，而非表象
- 考虑是否需要添加防护性代码
