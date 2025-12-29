# 🚀 AI Skills Workbench

一个基于 Next.js 14 和 Supabase 的多模型 AI 技能工作台,提供统一的界面来管理和使用各种 AI 能力。

## ✨ 核心特性

- **🎯 多技能支持**: 朋友圈文案、视频改写、爆款拆解、AI 选片等 8+ 预设技能
- **🤖 多模型集成**: 支持 Claude、SiliconFlow 等多个 AI 模型
- **💬 对话管理**: 完整的对话历史记录和检索功能
- **📊 使用统计**: Token 用量追踪和速率限制
- **⭐ 收藏功能**: 收藏优质回复和对话
- **📱 响应式设计**: Apple 设计风格,支持深色模式
- **🔐 用户认证**: 基于 Supabase 的用户系统

## 🛠 技术栈

- **前端框架**: Next.js 14 (App Router)
- **UI 组件**: React 18, Tailwind CSS
- **数据库**: Supabase (PostgreSQL)
- **AI 模型**: Anthropic Claude, SiliconFlow
- **认证**: Supabase Auth
- **类型安全**: TypeScript 5+
- **日志系统**: 自定义 Logger
- **错误处理**: 统一错误中间件

## 📦 快速开始

### 1. 克隆项目

```bash
git clone <repository-url>
cd ai-skills-workbench
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

```bash
cp .env.example .env.local
```

编辑 `.env.local` 填写以下必需配置:

```bash
# Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# AI 模型配置 (至少配置一个)
ANTHROPIC_API_KEY=your-anthropic-key  # Claude 模型
SILICONFLOW_API_KEY=your-siliconflow-key  # 备用模型
```

### 4. 初始化数据库

在 Supabase 控制台执行 SQL 脚本 (位于 `supabase/migrations/`):

```sql
-- 创建表结构
CREATE TABLE users (...);
CREATE TABLE skills (...);
CREATE TABLE conversations (...);
CREATE TABLE messages (...);
-- 更多表...
```

### 5. 运行开发服务器

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000)

## 📂 项目结构

```
ai-skills-workbench/
├── app/                    # Next.js App Router
│   ├── api/               # API 路由
│   │   ├── claude/       # Claude AI 接口
│   │   └── upload/       # 文件上传
│   ├── skill/[id]/       # 技能详情页
│   └── page.tsx          # 首页
├── components/            # React 组件
│   ├── ConversationView.tsx  # 对话界面
│   ├── ModelSelector.tsx     # 模型选择器
│   └── ...
├── lib/                   # 核心库
│   ├── db/               # 数据库操作
│   │   ├── conversations.ts
│   │   ├── messages.ts
│   │   └── ...
│   ├── ai/               # AI 模型集成
│   │   └── dispatcher.ts
│   ├── errors.ts         # 错误处理
│   ├── logger.ts         # 日志系统
│   └── supabase.ts       # Supabase 客户端
├── __tests__/             # 测试文件
│   ├── components/       # 组件测试
│   ├── lib/              # 工具函数测试
│   └── utils/            # 测试工具
├── types/                 # TypeScript 类型定义
└── public/               # 静态资源
```

## 🎨 预设技能

| 技能 | 描述 | 输入类型 |
|------|------|----------|
| 朋友圈文案 | 生成3个不同风格的朋友圈文案 | 文本/语音/图片 |
| 视频文案改写 | 改写视频内容,去除敏感词 | 文本/语音 |
| 爆款拆解 | 分析爆款内容的可复用元素 | 文本/图片 |
| 会议语音转文字 | 语音转文字+会议纪要 | 语音 |
| 知识库查询 | 检索预设知识库 | 文本/语音 |
| 官方通知 | 生成正式通知文案 | 文本 |
| 海报制作 | 生成设计方案和提示词 | 文本/图片 |
| AI 选片修片 | 照片评分+修图建议 | 图片 |

## 🔧 开发指南

### 添加新技能

1. 在 `lib/claude/client.ts` 添加 system prompt:

```typescript
case 'your-skill-id':
  return `你的技能指令...`
```

2. 在 `lib/skills/config.ts` 的 `PRESET_SKILL_CONFIGS` 添加元数据:

```typescript
{
  id: 'your-skill-id',
  name: '技能名称',
  description: '技能描述',
  icon: 'Icon',
  category: '分类',
  inputTypes: ['text', 'voice', 'image'],
  source: 'official'
}
```

3. 在 `lib/models/config.ts` 配置模型映射:

```typescript
'your-skill-id': {
  text: { model: 'claude-opus-4-5-20251101', temperature: 0.7 },
  vision: { model: 'qwen3-vl-a3b', temperature: 0.5 }
}
```

### 使用 Logger

```typescript
import { logger } from '@/lib/logger'

// 基础日志
logger.debug('调试信息', { data })  // 仅开发环境
logger.info('普通信息', data)
logger.warn('警告信息', warning)
logger.error('错误信息', error)

// 数据库日志
logger.db.query('saveMessage', 'messages', params)
logger.db.success('保存成功', result)
logger.db.error('操作失败', error)

// API 日志
logger.api.request('POST', '/api/chat', data)
logger.api.response('POST', '/api/chat', 200, data)
logger.api.error('POST', '/api/chat', error)
```

### 错误处理

```typescript
import { withErrorHandler } from '@/lib/middleware/error-handler'
import { createError } from '@/lib/errors'

async function handler(req: NextRequest) {
  if (!req.body.skillId) {
    throw createError.validation('Missing skillId')
  }
  // ... 业务逻辑
}

export const POST = withErrorHandler(handler)
```

### 运行测试

```bash
# 运行所有测试
npm test

# 监听模式运行测试
npm run test:watch

# 生成覆盖率报告
npm run test:coverage
```

更多测试信息请查看 [__tests__/README.md](__tests__/README.md)

## 📊 数据库表结构

### 核心表

- `users`: 用户信息
- `skills`: 技能定义
- `conversations`: 对话记录
- `messages`: 消息内容
- `favorites`: 收藏记录
- `usage_stats`: 使用统计

### 查询优化

所有数据库查询都已优化,使用明确的列名而非 `SELECT *`:

```typescript
// ❌ 不推荐
.select('*')

// ✅ 推荐
.select('id, role, content, created_at')
```

## 🚀 部署

### Vercel 部署

1. 推送代码到 GitHub
2. 在 Vercel 导入项目
3. 配置环境变量
4. 部署

### 环境变量配置

在 Vercel 项目设置中添加所有 `.env.example` 中列出的变量。

## 📝 更新日志

查看 [IMPROVEMENTS_COMPLETED.md](IMPROVEMENTS_COMPLETED.md) 了解最新改进。

### 最新改进 (2025-12-28)

- ✅ 创建统一日志系统 (Logger)
- ✅ 移除所有调试 console.log
- ✅ 创建统一错误处理中间件
- ✅ 修复所有 TypeScript any 类型
- ✅ 优化数据库查询性能
- ✅ 添加测试框架配置 (Jest + Testing Library)
- ✅ 添加 ESLint + Prettier 代码规范
- ✅ 更新环境变量配置文档

## 🤝 贡献

欢迎提交 Issue 和 Pull Request!

## 📄 许可证

MIT License

## 🔗 相关链接

- [Supabase 文档](https://supabase.com/docs)
- [Next.js 文档](https://nextjs.org/docs)
- [Anthropic Claude API](https://docs.anthropic.com/)
- [SiliconFlow](https://cloud.siliconflow.cn/)

## ⚠️ 注意事项

1. **API 密钥安全**: 不要将 API 密钥提交到版本控制
2. **数据库安全**: 确保 Supabase RLS (Row Level Security) 已启用
3. **速率限制**: 生产环境建议实现更严格的速率限制
4. **错误监控**: 建议集成 Sentry 等错误追踪服务

## 📞 支持

如有问题,请提交 Issue 或联系维护者。
