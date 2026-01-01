# 添加新技能命令

为工作台添加新的 AI 技能。

## 使用方式
```
/project:add-skill <技能名称>
```

## 执行步骤

### 1. 技能规划
- 确定技能用途和目标用户
- 设计对话流程
- 定义输入输出格式

### 2. 创建技能配置

在 `lib/skills/presets/` 目录下创建技能文件：

```typescript
// lib/skills/presets/<skill-id>.ts
export const skillConfig = {
  id: 'skill-id',
  name: '技能名称',
  description: '技能描述',
  icon: 'IconName',
  category: 'category-name',
  systemPrompt: `
    你的角色设定...
  `,
  suggestedQuestions: [
    '示例问题1',
    '示例问题2',
  ],
}
```

### 3. 注册技能

在 `lib/skills/config.ts` 中添加：

```typescript
// 添加到预设技能列表
export const PRESET_SKILLS = {
  // ... 其他技能
  'skill-id': skillConfig,
}
```

### 4. 测试验证
- 在开发环境测试对话
- 检查响应质量
- 优化 system prompt

### 5. 更新文档
- 在 README 中添加技能说明
- 更新技能列表

## 技能分类
- `content`: 内容创作类
- `data`: 数据分析类
- `business`: 商业运营类
- `utility`: 工具类
