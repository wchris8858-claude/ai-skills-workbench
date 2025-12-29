# AI Skills Workbench 技术文档

> 版本: 0.1.0 | 更新时间: 2024-12-29

## 目录

1. [项目概述](#1-项目概述)
2. [技术栈](#2-技术栈)
3. [项目结构](#3-项目结构)
4. [数据库设计](#4-数据库设计)
5. [API 接口](#5-api-接口)
6. [页面路由](#6-页面路由)
7. [组件架构](#7-组件架构)
8. [AI 模型集成](#8-ai-模型集成)
9. [技能系统](#9-技能系统)
10. [认证与权限](#10-认证与权限)
11. [环境配置](#11-环境配置)
12. [部署指南](#12-部署指南)

---

## 1. 项目概述

AI Skills Workbench 是一个基于 Next.js 14 构建的 AI 技能平台，提供多种预设 AI 技能，支持多模型切换和对话管理。

### 核心功能

- **8+ 预设 AI 技能** - 文案创作、内容分析、视觉设计等
- **多模型支持** - Claude、SiliconFlow、Gemini 等
- **对话历史** - 完整的对话记录和收藏
- **用户系统** - 认证、权限、使用统计
- **响应式设计** - Apple 风格 UI，深色模式

---

## 2. 技术栈

### 前端

| 技术 | 版本 | 用途 |
|------|------|------|
| Next.js | 14.2.4 | React 框架 (App Router) |
| React | 18.3.1 | UI 库 |
| TypeScript | 5.9.3 | 类型安全 |
| Tailwind CSS | 3.4.4 | 样式框架 |
| Radix UI | 1.0+ | 无障碍组件 |
| Lucide React | 0.396.0 | 图标库 |

### 后端

| 技术 | 版本 | 用途 |
|------|------|------|
| Next.js API Routes | - | API 服务 |
| Supabase | 2.89.0 | 数据库 + 认证 |
| JWT | 9.0.3 | Token 认证 |
| Zod | 4.2.1 | 数据验证 |

### AI 服务

| 服务商 | SDK/API | 用途 |
|--------|---------|------|
| Anthropic | @anthropic-ai/sdk 0.24.3 | Claude 模型 |
| SiliconFlow | REST API | 国产模型集合 |
| Google | REST API | Gemini 模型 |

---

## 3. 项目结构

```
ai-skills-workbench/
├── app/                    # Next.js App Router
│   ├── api/               # API 路由 (18 个端点)
│   │   ├── auth/          # 认证 API
│   │   ├── claude/        # AI 对话 API
│   │   ├── skills/        # 技能管理 API
│   │   ├── history/       # 历史记录 API
│   │   ├── favorites/     # 收藏 API
│   │   ├── users/         # 用户管理 API
│   │   ├── upload/        # 文件上传
│   │   ├── speech-to-text/# 语音转文字
│   │   └── admin/         # 管理接口
│   ├── admin/             # 管理后台页面
│   ├── skill/[id]/        # 技能详情 (动态路由)
│   ├── my-skills/         # 我的技能
│   ├── history/           # 对话历史
│   ├── dev-tools/         # 开发工具
│   ├── login/             # 登录页
│   ├── layout.tsx         # 根布局
│   └── page.tsx           # 首页
│
├── components/             # React 组件
│   ├── ui/                # UI 基础组件 (20+)
│   ├── chat/              # 对话组件
│   ├── conversation/      # 对话子组件
│   ├── skills/            # 技能组件
│   ├── layout/            # 布局组件
│   └── ...                # 功能组件
│
├── lib/                    # 核心库
│   ├── ai/                # AI 模型客户端
│   ├── db/                # 数据库操作
│   ├── models/            # 模型配置
│   ├── skills/            # 技能管理
│   ├── middleware/        # 中间件
│   └── ...                # 工具函数
│
├── contexts/              # React Context
├── hooks/                 # 自定义 Hooks
├── types/                 # TypeScript 类型
├── skills/                # 技能文件
├── supabase/              # 数据库配置
│   ├── migrations/        # 迁移文件
│   └── schema.sql         # 完整 Schema
└── public/                # 静态资源
```

---

## 4. 数据库设计

### 表结构

#### skills - 技能表
```sql
CREATE TABLE skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT '效率工具',
  icon TEXT DEFAULT 'Sparkles',
  input_types TEXT[] DEFAULT ARRAY['text'],
  placeholder TEXT,
  source TEXT DEFAULT 'custom',  -- official|custom|community
  owner_id UUID REFERENCES user_profiles(id),
  content TEXT,
  is_public BOOLEAN DEFAULT false,
  rating DECIMAL(3,2) DEFAULT 0,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### user_profiles - 用户表
```sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT,
  role TEXT DEFAULT 'member',  -- admin|member|viewer
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### conversations - 对话表
```sql
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  skill_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### messages - 消息表
```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL,          -- user|assistant
  content TEXT NOT NULL,
  attachments JSONB,           -- 图片等附件
  token_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### usage_stats - 使用统计表
```sql
CREATE TABLE usage_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES user_profiles(id),
  skill_id TEXT NOT NULL,
  tokens_used INTEGER DEFAULT 0,
  response_time INTEGER,       -- 毫秒
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### favorites - 收藏表
```sql
CREATE TABLE favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES conversations(id),
  message_id UUID REFERENCES messages(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, message_id)
);
```

### 索引

```sql
CREATE INDEX idx_skills_category ON skills(category);
CREATE INDEX idx_skills_owner ON skills(owner_id);
CREATE INDEX idx_conversations_user ON conversations(user_id);
CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_usage_stats_user ON usage_stats(user_id);
```

### RLS 安全策略

```sql
-- 公开技能对所有人可见
CREATE POLICY "Public skills visible" ON skills
  FOR SELECT USING (is_public = true OR owner_id = auth.uid());

-- 用户只能查看自己的对话
CREATE POLICY "User conversations" ON conversations
  FOR ALL USING (user_id = auth.uid());

-- 用户只能查看自己的消息
CREATE POLICY "User messages" ON messages
  FOR SELECT USING (
    conversation_id IN (
      SELECT id FROM conversations WHERE user_id = auth.uid()
    )
  );
```

---

## 5. API 接口

### 认证 API

| 端点 | 方法 | 说明 | 请求体 |
|------|------|------|--------|
| `/api/auth/login` | POST | 用户登录 | `{ email, password }` |
| `/api/auth/logout` | POST | 用户登出 | - |
| `/api/auth/me` | GET | 获取当前用户 | - |

### 技能 API

| 端点 | 方法 | 说明 | 请求体 |
|------|------|------|--------|
| `/api/skills` | GET | 获取技能列表 | - |
| `/api/skills` | POST | 创建技能 | `{ name, description, ... }` |
| `/api/skills/[id]` | GET | 获取技能详情 | - |
| `/api/skills/[id]` | PUT | 更新技能 | `{ name, description, ... }` |
| `/api/skills/[id]` | DELETE | 删除技能 | - |

### AI 对话 API

| 端点 | 方法 | 说明 | 请求体 |
|------|------|------|--------|
| `/api/claude/chat` | POST | AI 对话 | `{ skillId, message, model?, attachments? }` |

**请求示例:**
```json
{
  "skillId": "moments-copywriter",
  "message": "帮我写一条朋友圈文案",
  "model": "claude-opus-4-5-20251101",
  "attachments": [
    { "type": "image", "url": "...", "base64": "..." }
  ]
}
```

**响应示例:**
```json
{
  "content": "生成的内容...",
  "model": "claude-opus-4-5-20251101",
  "provider": "anthropic",
  "tokenCount": 150
}
```

### 历史记录 API

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/history` | GET | 获取对话历史列表 |
| `/api/history/[id]` | GET | 获取对话详情 |
| `/api/history/[id]` | DELETE | 删除对话 |

### 其他 API

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/favorites` | GET/POST/DELETE | 收藏管理 |
| `/api/upload/image` | POST | 图片上传 |
| `/api/speech-to-text` | POST | 语音转文字 |
| `/api/users` | GET | 用户列表 (管理员) |
| `/api/admin/settings/*` | GET/POST | 系统设置 |

---

## 6. 页面路由

| 路径 | 页面 | 权限 |
|------|------|------|
| `/` | 首页 - 技能库 | 公开 |
| `/login` | 登录页 | 公开 |
| `/skill/[id]` | 技能对话页 | 登录 |
| `/my-skills` | 我的技能 | 登录 |
| `/history` | 对话历史 | 登录 |
| `/photo-selector` | AI 选片工具 | 登录 |
| `/dev-tools` | 开发工具 | 登录 |
| `/docs` | 文档页 | 公开 |
| `/admin/users` | 用户管理 | 管理员 |
| `/admin/settings` | 系统设置 | 管理员 |

---

## 7. 组件架构

### UI 基础组件 (components/ui/)

```
button.tsx       - 按钮 (多种变体)
dialog.tsx       - 模态对话框
input.tsx        - 输入框
select.tsx       - 下拉选择
textarea.tsx     - 多行文本
tabs.tsx         - 标签页
card.tsx         - 卡片容器
badge.tsx        - 标签徽章
table.tsx        - 数据表格
toast.tsx        - 提示通知
loading-spinner.tsx - 加载动画
error-display.tsx   - 错误显示
```

### 功能组件

```typescript
// 对话视图 - 核心组件
<ConversationView
  skillId="moments-copywriter"
  skillName="朋友圈文案"
  placeholder="输入素材..."
  inputTypes={['text', 'voice', 'image']}
  modelInfo="claude-opus"
/>

// 模型选择器
<ModelSelector
  selectedModel={modelId}
  onModelChange={handleModelChange}
  onShowModelInfo={handleShowInfo}
/>

// 消息操作
<MessageActions
  messageId={id}
  content={content}
  copied={copiedId}
  favorited={isFavorited}
  onCopy={handleCopy}
  onRegenerate={handleRegenerate}
  onFavorite={handleFavorite}
/>
```

### 组件层级

```
App
├── SiteHeader
├── ThemeProvider
│   └── AuthProvider
│       └── Page
│           ├── ConversationView
│           │   ├── EmptyState
│           │   ├── MessageBubble
│           │   │   ├── CopywriterMessage
│           │   │   └── MessageActions
│           │   ├── ImageUploadPreview
│           │   └── ModelSelector
│           └── ModelInfoDialog
└── SiteFooter
```

---

## 8. AI 模型集成

### 模型分发器 (lib/ai/dispatcher.ts)

```typescript
// 统一的 AI 调用接口
export async function dispatchAI(request: AIRequest): Promise<AIResponse> {
  const { skillId, message, model, attachments } = request

  // 1. 获取技能的模型配置
  const modelConfig = getSkillModelConfig(skillId)

  // 2. 判断是否需要视觉模型
  const hasImages = attachments?.some(a => a.type === 'image')
  const targetModel = hasImages ? modelConfig.vision : modelConfig.text

  // 3. 根据模型路由到对应客户端
  return callModel(targetModel, message, attachments)
}
```

### 支持的模型

#### Anthropic Claude
| 模型 ID | 用途 | 特点 |
|---------|------|------|
| claude-haiku-4-5-20251001 | 快速响应 | 低延迟 |
| claude-opus-4-5-20251101 | 复杂推理 | 最强能力 |

#### SiliconFlow 模型
| 模型 ID | 用途 |
|---------|------|
| Qwen2.5-7B-Instruct | 中文对话 |
| DeepSeek-V2.5 | 代码/推理 |
| GLM-4.7 Pro | 专业版 |
| Qwen3-VL-A3B | 多模态视觉 |
| FLUX.1 Schnell | 图像生成 |

#### 图像生成
| 模型 | 用途 |
|------|------|
| GPT Image 1.5 | 通用图像 |
| Nano Banana Pro | 高质量图像 |
| Stable Diffusion 3.5 | 艺术风格 |

### 客户端实现

```typescript
// lib/ai/unified-client.ts
export async function callUnifiedAPI(
  model: string,
  messages: Message[],
  options?: { temperature?: number }
): Promise<string> {
  const response = await fetch(UNIFIED_API_ENDPOINT, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      messages,
      ...options
    })
  })
  return response.json()
}
```

---

## 9. 技能系统

### 预设技能 (lib/skills/config.ts)

| 技能 ID | 名称 | 输入类型 | 模型配置 |
|---------|------|----------|----------|
| moments-copywriter | 朋友圈文案 | text, voice, image | Claude Opus (0.8) |
| video-rewriter | 视频文案改写 | text, voice | Claude Opus (0.5) |
| viral-analyzer | 爆款拆解 | text, image | Claude Opus (0.3) |
| meeting-transcriber | 会议转录 | voice | Claude Haiku (0.2) |
| knowledge-query | 知识库查询 | text, voice | Claude Haiku (0.1) |
| official-notice | 官方通知 | text | Claude Haiku (0.2) |
| poster-creator | 海报制作 | text, image | Gemini + GPT Image |
| photo-selector | AI 选片 | image | Claude + Qwen-VL |

### 技能配置结构

```typescript
interface SkillConfig {
  id: string                    // 唯一标识
  name: string                  // 显示名称
  description: string           // 描述
  icon: string                  // Lucide 图标名
  category: SkillCategory       // 分类
  inputTypes: InputType[]       // 支持的输入
  placeholder?: string          // 输入提示
  source: 'official' | 'custom' // 来源
}

// 模型映射配置
interface SkillModelMapping {
  text: ModelConfig             // 文本模型
  vision?: ModelConfig          // 视觉模型
  image?: ModelConfig           // 图像生成模型
}
```

### 自定义技能

用户可以通过「我的技能」页面创建自定义技能：

1. 上传 `.skill` 文件
2. 或在线编辑创建
3. 技能保存到数据库
4. 可设置公开/私有

---

## 10. 认证与权限

### 认证流程

```typescript
// lib/auth.ts
export async function signIn(email: string, password: string) {
  // 1. 验证用户
  const user = await getUserByEmail(email)
  if (!user) throw new Error('用户不存在')

  // 2. 验证密码
  const valid = await bcrypt.compare(password, user.password)
  if (!valid) throw new Error('密码错误')

  // 3. 生成 JWT
  const token = jwt.sign(
    { userId: user.id, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  )

  return { user, token }
}
```

### 权限角色

| 角色 | 权限 |
|------|------|
| admin | 全部权限 + 用户管理 + 系统设置 |
| member | 使用技能 + 管理自己的数据 |
| viewer | 只读访问 |

### 中间件保护

```typescript
// lib/middleware/auth.ts
export function withAuth(handler: ApiHandler) {
  return async (req: NextRequest) => {
    const token = req.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET)
      return handler(req, decoded)
    } catch {
      return NextResponse.json({ error: 'Token 无效' }, { status: 401 })
    }
  }
}
```

### 速率限制

```typescript
// lib/middleware/rateLimit.ts
export const RATE_LIMIT_CONFIG = {
  'api/auth/login': { requests: 5, windowMs: 60000 },    // 5次/分钟
  'api/claude/chat': { requests: 20, windowMs: 60000 }, // 20次/分钟
  'default': { requests: 60, windowMs: 60000 }          // 60次/分钟
}
```

---

## 11. 环境配置

### 必需环境变量

```bash
# .env.local

# Supabase 配置 (必需)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...  # 服务端使用

# AI 模型 API (至少配置一个)
ANTHROPIC_API_KEY=sk-ant-...

# JWT 密钥 (必需)
JWT_SECRET=your-32-char-secret-key
```

### 可选环境变量

```bash
# 统一 AI API (推荐)
UNIFIED_API_KEY=your-api-key
UNIFIED_API_ENDPOINT=https://api.example.com/v1

# SiliconFlow
SILICONFLOW_API_KEY=sk-...

# 其他模型
GOOGLE_API_KEY=...
OPENAI_API_KEY=sk-...

# 开发配置
NODE_ENV=development
PORT=3000
```

### 环境变量说明

| 变量 | 必需 | 说明 |
|------|------|------|
| NEXT_PUBLIC_SUPABASE_URL | ✅ | Supabase 项目 URL |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | ✅ | Supabase 公开密钥 |
| SUPABASE_SERVICE_ROLE_KEY | ✅ | Supabase 服务密钥 |
| ANTHROPIC_API_KEY | ⚠️ | Claude API 密钥 |
| JWT_SECRET | ✅ | JWT 签名密钥 (≥32字符) |
| UNIFIED_API_KEY | ❌ | 统一 API 密钥 |

---

## 12. 部署指南

### Vercel 部署 (推荐)

```bash
# 1. 安装 Vercel CLI
npm i -g vercel

# 2. 登录
vercel login

# 3. 部署
vercel --prod

# 4. 配置环境变量
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add ANTHROPIC_API_KEY
# ... 其他变量
```

### 本地开发

```bash
# 1. 克隆项目
git clone <repo-url>
cd ai-skills-workbench

# 2. 安装依赖
npm install

# 3. 配置环境变量
cp .env.example .env.local
# 编辑 .env.local

# 4. 启动开发服务器
npm run dev
# 访问 http://localhost:3000
```

### 数据库设置

```bash
# 1. 创建 Supabase 项目
# https://supabase.com/dashboard

# 2. 执行迁移脚本
# 按顺序执行 supabase/migrations/ 中的 SQL 文件

# 3. 配置 RLS 策略
# 执行 supabase/schema.sql 中的策略部分
```

### 构建生产版本

```bash
# 构建
npm run build

# 启动
npm run start

# 或使用 PM2
pm2 start npm --name "ai-skills" -- start
```

---

## 附录

### A. 常用命令

```bash
npm run dev          # 启动开发服务器
npm run build        # 构建生产版本
npm run start        # 启动生产服务器
npm run lint         # 代码检查
npm run test         # 运行测试
npm run test:coverage # 测试覆盖率
```

### B. 目录约定

| 目录 | 用途 |
|------|------|
| app/api/ | API 路由 |
| app/[page]/ | 页面路由 |
| components/ui/ | 基础 UI 组件 |
| components/[feature]/ | 功能组件 |
| lib/db/ | 数据库操作 |
| lib/ai/ | AI 模型客户端 |
| types/ | TypeScript 类型 |

### C. 代码规范

- 使用 TypeScript 严格模式
- 组件使用函数式 + Hooks
- 样式使用 Tailwind CSS
- 状态管理使用 React Context
- API 使用 RESTful 规范

### D. 相关链接

- [Next.js 文档](https://nextjs.org/docs)
- [Supabase 文档](https://supabase.com/docs)
- [Anthropic API](https://docs.anthropic.com)
- [Tailwind CSS](https://tailwindcss.com/docs)

---

*文档更新: 2024-12-29*
