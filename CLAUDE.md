# AI Skills Workbench - 项目规范

> 本文件为 AI 协作规范，帮助 AI 理解项目结构和开发规范。

@constitution.md

## 核心文件

| 文件 | 用途 |
|------|------|
| `constitution.md` | 项目宪法 - 不可违背的核心原则 |
| `.claude/` | AI 开发框架配置目录 |
| `docs/templates/` | SDD 文档模板 |

## 项目概述

**名称**: AI Skills Workbench
**类型**: 多模型 AI 技能工作台
**技术栈**: Next.js 14 (App Router) + TypeScript + Supabase + Tailwind CSS

### 核心功能
- 多技能支持（朋友圈文案、视频改写、爆款拆解等 8+ 技能）
- 多模型集成（Claude、SiliconFlow 等）
- 对话管理与历史记录
- Token 用量追踪
- 收藏功能

---

## 项目结构

```
ai-skills-workbench/
├── app/                    # Next.js App Router
│   ├── api/               # API 路由（必须使用 withErrorHandler）
│   │   ├── claude/       # Claude AI 接口
│   │   ├── upload/       # 文件上传
│   │   └── speech-to-text/ # 语音转文字
│   ├── skill/[id]/       # 技能详情页
│   └── page.tsx          # 首页
├── components/            # React 组件
│   ├── ConversationView.tsx  # 对话界面（核心）
│   ├── ModelSelector.tsx     # 模型选择器
│   └── ...
├── lib/                   # 核心库
│   ├── db/               # 数据库操作（禁止 SELECT *）
│   ├── ai/               # AI 模型集成
│   │   ├── dispatcher.ts # 模型调度器
│   │   ├── unified-client.ts
│   │   └── siliconflow-client.ts
│   ├── middleware/       # 中间件
│   │   ├── error-handler.ts  # 错误处理（必用）
│   │   └── rateLimit.ts
│   ├── errors.ts         # 错误类型定义
│   ├── logger.ts         # 日志系统（必用）
│   └── supabase.ts       # Supabase 客户端
├── __tests__/            # 测试文件
└── types/                # TypeScript 类型定义
```

---

## 开发规范

### 1. API 路由规范

**必须使用 withErrorHandler 包装所有 API 路由**

```typescript
// ✅ 正确
import { withErrorHandler } from '@/lib/middleware/error-handler'
import { createError } from '@/lib/errors'

async function handler(req: NextRequest) {
  if (!req.body.skillId) {
    throw createError.validation('Missing skillId')
  }
  // 业务逻辑
}

export const POST = withErrorHandler(handler)

// ❌ 错误 - 不要直接导出 handler
export async function POST(req: NextRequest) { ... }
```

### 2. 日志规范

**禁止使用 console.log，必须使用 logger**

```typescript
import { logger } from '@/lib/logger'

// ✅ 正确
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

// ❌ 错误
console.log('调试信息')
```

### 3. 数据库规范

**禁止使用 SELECT *，必须明确列名**

```typescript
// ✅ 正确
.select('id, role, content, created_at')

// ❌ 错误
.select('*')
```

**使用 getSupabaseAdmin() 绕过 RLS（仅服务端）**

```typescript
import { getSupabaseAdmin } from '@/lib/supabase'

// 需要绕过 RLS 时使用
const admin = getSupabaseAdmin()
await admin.from('messages').insert(data)
```

### 4. 错误处理规范

```typescript
import { createError } from '@/lib/errors'

// 验证错误
throw createError.validation('Invalid input')

// 认证错误
throw createError.authentication('Not authenticated')

// 授权错误
throw createError.authorization('Not authorized')

// 未找到
throw createError.notFound('Resource not found')

// 速率限制
throw createError.rateLimit('Too many requests')
```

### 5. TypeScript 规范

- 禁止使用 `any` 类型，使用具体类型或 `unknown`
- 所有函数参数和返回值必须有类型注解
- 使用 `types/` 目录定义共享类型

---

## 关键文件说明

| 文件 | 用途 | 修改注意 |
|------|------|----------|
| `lib/ai/dispatcher.ts` | AI 模型调度核心 | 修改会影响所有 AI 调用 |
| `lib/models/config.ts` | 模型配置映射 | 添加新技能需同步更新 |
| `lib/skills/config.ts` | 技能元数据配置 | 技能 ID 必须唯一 |
| `lib/claude/client.ts` | System Prompt 定义 | 影响 AI 输出质量 |
| `components/ConversationView.tsx` | 对话界面 | 复杂组件，谨慎修改 |

---

## 添加新技能流程

1. **添加 System Prompt** (`lib/claude/client.ts`)
```typescript
case 'your-skill-id':
  return `你的技能指令...`
```

2. **添加技能元数据** (`lib/skills/config.ts`)
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

3. **配置模型映射** (`lib/models/config.ts`)
```typescript
'your-skill-id': {
  text: { model: 'claude-opus-4-5-20251101', temperature: 0.7 },
  vision: { model: 'qwen3-vl-a3b', temperature: 0.5 }
}
```

---

## 禁止事项

### 绝对禁止
- 暴露 API 密钥到代码中（使用环境变量）
- 使用 `console.log`（使用 `logger`）
- 使用 `SELECT *`（明确指定列名）
- 直接导出 API handler（使用 `withErrorHandler`）
- 使用 `any` 类型

### 需要确认
- 修改 `dispatcher.ts`（影响所有 AI 调用）
- 修改数据库表结构
- 删除任何文件
- 修改环境变量配置

---

## 测试命令

```bash
# 运行所有测试
npm test

# 监听模式
npm run test:watch

# 覆盖率报告
npm run test:coverage

# E2E 测试
npm run test:e2e
```

---

## 常见问题解决

### 图片分析超时
- 检查 `unified-client.ts` 和 `siliconflow-client.ts` 的超时设置（当前 45s）
- 确认图片大小已压缩（使用 `lib/utils/image-compression.ts`）

### 历史记录保存失败
- 检查是否使用了 `getSupabaseAdmin()` 绕过 RLS
- 确认 `SUPABASE_SERVICE_ROLE_KEY` 已配置

### 模型调用失败
- 检查对应 API 密钥是否配置
- 查看 `lib/ai/config.ts` 中的降级策略

---

## 环境变量

必需配置：
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `ANTHROPIC_API_KEY` 或 `SILICONFLOW_API_KEY`（至少一个）

可选配置：
- `SUPABASE_SERVICE_ROLE_KEY`（绕过 RLS）
- `UNIFIED_API_KEY`（统一 API）

---

---

## SDD 开发流程

本项目采用 Spec-Driven Development（规范驱动开发）：

```
spec.md  → 描述"做什么"（功能规范）
plan.md  → 描述"怎么做"（技术方案）
tasks.md → 描述"分几步"（任务清单）
```

### 新功能开发
1. 创建 `docs/features/<功能名>/spec.md`
2. 生成 `plan.md` 技术方案
3. 分解 `tasks.md` 任务清单
4. 逐个完成任务并验证

### 可用命令
| 命令 | 用途 |
|------|------|
| `/project:new-feature` | 新功能开发流程 |
| `/project:fix-bug` | Bug 修复流程 |
| `/project:add-skill` | 添加新技能 |
| `/project:api-test` | API 测试流程 |

---

v1.1 - 添加 SDD 开发流程和 AI 开发框架
