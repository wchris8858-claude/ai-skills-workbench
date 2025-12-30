# AI Skills Workbench 需求文档

> 版本：v1.0.0 | 更新日期：2025-12-29

---

## 目录

1. [项目概述](#1-项目概述)
2. [用户场景](#2-用户场景)
3. [需求描述](#3-需求描述)
4. [技术架构](#4-技术架构)
5. [数据库设计](#5-数据库设计)
6. [API 设计](#6-api-设计)
7. [代码文件索引](#7-代码文件索引)
8. [关键代码实现](#8-关键代码实现)

---

## 1. 项目概述

### 1.1 项目简介

AI Skills Workbench 是一个面向实体店运营者（瑜伽馆、轻食店等）的 AI 工具箱平台。通过预设的"技能"模块，帮助用户快速完成日常运营中的文案创作、内容分析、会议记录等工作。

### 1.2 核心价值

| 价值点 | 描述 |
|--------|------|
| **降低门槛** | 无需 AI 提示词知识，选择技能即可使用 |
| **场景化** | 预设 8 个实体店高频使用场景 |
| **多模态** | 支持文字、语音、图片多种输入方式 |
| **可扩展** | 支持用户自定义技能和社区分享 |

### 1.3 技术栈

```
前端: Next.js 14 (App Router) + React 18 + TypeScript + Tailwind CSS
后端: Next.js API Routes + Supabase (PostgreSQL)
AI:   Claude (Anthropic) + SiliconFlow + 统一 API 网关
部署: Vercel
```

---

## 2. 用户场景

### 2.1 用户画像

| 角色 | 描述 | 典型场景 |
|------|------|----------|
| **店主** | 瑜伽馆/健身房/轻食店老板 | 日常运营、营销推广、团队管理 |
| **运营人员** | 负责门店线上运营 | 朋友圈文案、活动策划、内容创作 |
| **教练/员工** | 一线服务人员 | 客户沟通、课程介绍、专业分享 |

### 2.2 核心使用场景

#### 场景 1：朋友圈文案生成

```
用户故事：
作为一名瑜伽馆运营，我需要每天发布 3-5 条朋友圈
我希望只需提供素材（图片/文字/语音），就能快速获得多个风格的文案选择

使用流程：
1. 选择「朋友圈文案」技能
2. 上传图片 + 输入简单描述（或语音输入）
3. AI 分析图片内容，生成 3 种风格文案
4. 选择满意的文案，一键复制
```

#### 场景 2：视频文案改写

```
用户故事：
作为内容运营，我需要将网上找到的视频文案改写后使用
我希望去除敏感词、调整表达方式，避免侵权风险

使用流程：
1. 选择「视频文案改写」技能
2. 粘贴原始文案（或语音输入）
3. AI 智能改写，去除敏感词，保留核心信息
4. 获得可直接使用的改写版本
```

#### 场景 3：爆款内容拆解

```
用户故事：
作为内容创作者，我想学习爆款内容的创作方法
我希望快速分析一篇内容的结构、亮点和可复用元素

使用流程：
1. 选择「爆款拆解」技能
2. 输入爆款内容链接或截图
3. AI 拆解标题、结构、情感曲线、传播点
4. 获得可复用的创作模板
```

#### 场景 4：会议语音转文字

```
用户故事：
作为门店管理者，我经常需要记录会议内容
我希望录音后自动生成会议纪要和待办事项

使用流程：
1. 选择「会议语音转文字」技能
2. 上传会议录音（或实时录制）
3. AI 转写文字，提取关键议题和结论
4. 生成结构化会议纪要
```

#### 场景 5：AI 选片修片

```
用户故事：
作为不懂摄影的店主，我拍了很多照片但不知道哪张好
我希望 AI 帮我挑选最佳照片并给出修图建议

使用流程：
1. 选择「AI选片修片」技能
2. 上传多张照片（最多 9 张）
3. AI 分析每张照片的构图、光线、色彩
4. 获得评分排名和具体修图参数建议
```

### 2.3 用户旅程图

```
┌─────────────────────────────────────────────────────────────────────┐
│                         用户完整旅程                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   [首次访问]                                                         │
│       │                                                             │
│       ▼                                                             │
│   ┌───────────┐    ┌───────────┐    ┌───────────┐                  │
│   │  登录页面  │───▶│  技能首页  │───▶│ 选择技能   │                  │
│   └───────────┘    └───────────┘    └───────────┘                  │
│                                           │                         │
│                                           ▼                         │
│                    ┌─────────────────────────────────────┐         │
│                    │           对话界面                    │         │
│                    │  ┌─────────────────────────────┐   │         │
│                    │  │  输入区域                    │   │         │
│                    │  │  - 文字输入                  │   │         │
│                    │  │  - 图片上传（支持压缩）      │   │         │
│                    │  │  - 语音输入                  │   │         │
│                    │  └─────────────────────────────┘   │         │
│                    │               │                     │         │
│                    │               ▼                     │         │
│                    │  ┌─────────────────────────────┐   │         │
│                    │  │  AI 响应                     │   │         │
│                    │  │  - 多方案输出               │   │         │
│                    │  │  - 复制/收藏/重新生成       │   │         │
│                    │  └─────────────────────────────┘   │         │
│                    └─────────────────────────────────────┘         │
│                                           │                         │
│                    ┌──────────────────────┴───────────────┐        │
│                    ▼                                      ▼        │
│            ┌───────────┐                          ┌───────────┐   │
│            │ 历史记录   │                          │  收藏夹    │   │
│            └───────────┘                          └───────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3. 需求描述

### 3.1 功能需求

#### 3.1.1 技能系统

| 功能 | 优先级 | 状态 | 描述 |
|------|--------|------|------|
| 预设技能列表 | P0 | ✅ | 8 个官方预设技能 |
| 技能分类展示 | P0 | ✅ | 按类别分组显示 |
| 技能搜索 | P1 | ✅ | 关键词搜索技能 |
| 自定义技能 | P1 | ✅ | 用户创建私有技能 |
| 技能分享 | P2 | ⏳ | 社区技能分享 |
| 技能 Fork | P2 | ✅ | 复制并修改他人技能 |

**预设技能清单：**

| ID | 名称 | 输入类型 | 输出类型 |
|----|------|----------|----------|
| moments-copywriter | 朋友圈文案 | 文字/语音/图片 | 3 种风格文案 |
| video-rewriter | 视频文案改写 | 文字/语音 | 改写后文案 |
| viral-analyzer | 爆款拆解 | 文字/图片 | 结构化分析报告 |
| meeting-transcriber | 会议语音转文字 | 语音 | 会议纪要 |
| knowledge-query | 知识库查询 | 文字/语音 | 知识回答 |
| official-notice | 官方通知 | 文字 | 正式通知文案 |
| poster-creator | 海报制作 | 文字/图片 | 设计方案+提示词 |
| photo-selector | AI选片修片 | 图片 | 评分+修图建议 |

#### 3.1.2 对话系统

| 功能 | 优先级 | 状态 | 描述 |
|------|--------|------|------|
| 文字对话 | P0 | ✅ | 基础文字输入输出 |
| 图片上传 | P0 | ✅ | 支持多图上传（最多9张） |
| 图片压缩 | P1 | ✅ | 上传前自动压缩 |
| 语音输入 | P1 | ✅ | 录音转文字 |
| 消息复制 | P0 | ✅ | 一键复制回复内容 |
| 消息收藏 | P1 | ✅ | 收藏优质回复 |
| 重新生成 | P1 | ✅ | 不满意可重新生成 |
| 消息分页 | P2 | ✅ | 长对话加载优化 |
| 流式响应 | P2 | ⏳ | 打字机效果输出 |

#### 3.1.3 用户系统

| 功能 | 优先级 | 状态 | 描述 |
|------|--------|------|------|
| 用户注册/登录 | P0 | ✅ | JWT Token 认证 |
| 用户信息管理 | P1 | ✅ | 修改昵称/密码 |
| 角色权限 | P1 | ✅ | admin/member/viewer |
| 用户管理后台 | P2 | ✅ | 管理员管理用户 |

#### 3.1.4 历史与收藏

| 功能 | 优先级 | 状态 | 描述 |
|------|--------|------|------|
| 对话历史列表 | P0 | ✅ | 按时间排序 |
| 对话搜索 | P1 | ✅ | 关键词搜索历史 |
| 收藏夹 | P1 | ✅ | 查看收藏内容 |
| 导出历史 | P3 | ⏳ | 导出为文件 |

### 3.2 非功能需求

| 类别 | 要求 | 实现方案 |
|------|------|----------|
| **性能** | 首屏加载 < 2s | Next.js SSG + 代码分割 |
| **性能** | API 响应 < 500ms (非 AI) | Edge Runtime + 缓存 |
| **安全** | 防 XSS/CSRF | httpOnly Cookie + CORS |
| **安全** | 密码安全 | bcrypt 10 轮哈希 |
| **安全** | 数据隔离 | PostgreSQL RLS |
| **可用性** | 服务可用性 > 99.5% | Vercel 托管 |
| **可维护** | 统一日志 | 分类日志系统 |
| **可维护** | 错误追踪 | 统一错误处理中间件 |

---

## 4. 技术架构

### 4.1 系统架构图

```
┌────────────────────────────────────────────────────────────────────────────┐
│                              客户端层 (Client)                              │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│    ┌──────────────┐   ┌──────────────┐   ┌──────────────┐                │
│    │   Web 浏览器  │   │   移动端 H5  │   │  微信小程序   │                │
│    └──────┬───────┘   └──────┬───────┘   └──────┬───────┘                │
│           │                  │                  │                         │
│           └──────────────────┼──────────────────┘                         │
│                              │                                             │
│                              ▼                                             │
│    ┌─────────────────────────────────────────────────────────────────┐   │
│    │                    Next.js 前端应用                               │   │
│    │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │   │
│    │  │  页面组件    │  │  UI 组件库   │  │  状态管理    │              │   │
│    │  │  - 技能首页  │  │  - Radix UI │  │  - Context  │              │   │
│    │  │  - 对话界面  │  │  - Tailwind │  │  - useState │              │   │
│    │  │  - 历史记录  │  │  - Lucide   │  │             │              │   │
│    │  └─────────────┘  └─────────────┘  └─────────────┘              │   │
│    └─────────────────────────────────────────────────────────────────┘   │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     │ HTTPS
                                     ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                              服务层 (Server)                                │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│    ┌─────────────────────────────────────────────────────────────────┐   │
│    │                    Next.js API Routes                            │   │
│    │                                                                   │   │
│    │  ┌──────────────────────────────────────────────────────────┐  │   │
│    │  │                     中间件层                               │  │   │
│    │  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐     │  │   │
│    │  │  │  CORS   │  │ 错误处理 │  │速率限制  │  │  日志   │     │  │   │
│    │  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘     │  │   │
│    │  └──────────────────────────────────────────────────────────┘  │   │
│    │                              │                                   │   │
│    │  ┌───────────────────────────┼───────────────────────────────┐ │   │
│    │  │                     API 端点                                │ │   │
│    │  │                           │                                 │ │   │
│    │  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐      │ │   │
│    │  │  │  认证   │  │  技能   │  │  对话   │  │  用户   │      │ │   │
│    │  │  │ /auth/* │  │/skills/*│  │/claude/*│  │/users/* │      │ │   │
│    │  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘      │ │   │
│    │  │                                                            │ │   │
│    │  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐      │ │   │
│    │  │  │  历史   │  │  收藏   │  │  上传   │  │  管理   │      │ │   │
│    │  │  │/history │  │/favorite│  │/upload/*│  │/admin/* │      │ │   │
│    │  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘      │ │   │
│    │  └────────────────────────────────────────────────────────────┘ │   │
│    │                              │                                   │   │
│    │  ┌───────────────────────────┼───────────────────────────────┐ │   │
│    │  │                     业务逻辑层                              │ │   │
│    │  │                           │                                 │ │   │
│    │  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐      │ │   │
│    │  │  │  认证   │  │  技能   │  │ 数据库  │  │  缓存   │      │ │   │
│    │  │  │lib/auth │  │lib/skill│  │ lib/db  │  │lib/cache│      │ │   │
│    │  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘      │ │   │
│    │  └────────────────────────────────────────────────────────────┘ │   │
│    └─────────────────────────────────────────────────────────────────┘   │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
                                     │
              ┌──────────────────────┼──────────────────────┐
              │                      │                      │
              ▼                      ▼                      ▼
┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐
│    数据存储层        │  │      AI 服务层       │  │     文件存储层      │
├─────────────────────┤  ├─────────────────────┤  ├─────────────────────┤
│                     │  │                     │  │                     │
│  ┌───────────────┐  │  │  ┌───────────────┐  │  │  ┌───────────────┐  │
│  │   Supabase    │  │  │  │    Claude     │  │  │  │   Supabase    │  │
│  │  PostgreSQL   │  │  │  │   (Anthropic) │  │  │  │   Storage     │  │
│  │               │  │  │  └───────────────┘  │  │  │               │  │
│  │  - users      │  │  │  ┌───────────────┐  │  │  │  - images/    │  │
│  │  - skills     │  │  │  │  SiliconFlow  │  │  │  │  - files/     │  │
│  │  - messages   │  │  │  │  (Qwen/GLM)   │  │  │  │               │  │
│  │  - favorites  │  │  │  └───────────────┘  │  │  └───────────────┘  │
│  │  - stats      │  │  │  ┌───────────────┐  │  │                     │
│  │               │  │  │  │  统一 API     │  │  │                     │
│  └───────────────┘  │  │  │  (多模型网关)  │  │  │                     │
│                     │  │  └───────────────┘  │  │                     │
└─────────────────────┘  └─────────────────────┘  └─────────────────────┘
```

### 4.2 核心流程图

#### 4.2.1 AI 对话流程

```
┌──────────────────────────────────────────────────────────────────────────┐
│                          AI 对话核心流程                                   │
└──────────────────────────────────────────────────────────────────────────┘

     用户输入                                                    AI 响应
        │                                                          ▲
        ▼                                                          │
┌───────────────┐                                          ┌───────────────┐
│  ConversationView  │                                      │  显示 AI 回复  │
│  - 文字输入        │                                      │  - Markdown   │
│  - 图片上传        │                                      │  - 代码高亮   │
│  - 语音录制        │                                      │  - 复制/收藏  │
└───────┬───────────┘                                      └───────┬───────┘
        │                                                          │
        │ 1. 前端处理                                               │
        ▼                                                          │
┌───────────────────────────────────────┐                         │
│  图片压缩 (compressImage)              │                         │
│  - 最大尺寸: 1920x1080                 │                         │
│  - 最大文件: 500KB                     │                         │
│  - 质量: 0.8                           │                         │
└───────────────┬───────────────────────┘                         │
                │                                                  │
                │ 2. API 请求                                       │
                ▼                                                  │
┌───────────────────────────────────────┐                         │
│  POST /api/claude/chat                 │                         │
│  {                                     │                         │
│    skillId: "moments-copywriter",      │                         │
│    message: "用户输入",                 │                         │
│    attachments: [{ base64, url }],     │                         │
│    model: "claude-haiku-4-5"           │                         │
│  }                                     │                         │
└───────────────┬───────────────────────┘                         │
                │                                                  │
                │ 3. 中间件处理                                     │
                ▼                                                  │
┌───────────────────────────────────────┐                         │
│  withErrorHandler                      │                         │
│  ├─ 速率限制检查                        │                         │
│  ├─ 请求参数验证                        │                         │
│  └─ 统一错误处理                        │                         │
└───────────────┬───────────────────────┘                         │
                │                                                  │
                │ 4. AI 调度                                        │
                ▼                                                  │
┌───────────────────────────────────────┐                         │
│  dispatchAI (lib/ai/dispatcher.ts)     │                         │
│                                        │                         │
│  ┌─────────────────────────────────┐  │                         │
│  │ 有图片附件?                      │  │                         │
│  │      │                          │  │                         │
│  │      ├─ Yes ─▶ 调用视觉模型     │  │                         │
│  │      │        分析图片内容       │  │                         │
│  │      │        组合分析结果       │  │                         │
│  │      │                          │  │                         │
│  │      └─ No ──▶ 直接使用输入     │  │                         │
│  └─────────────────────────────────┘  │                         │
│                 │                      │                         │
│                 ▼                      │                         │
│  ┌─────────────────────────────────┐  │                         │
│  │ 调用文本模型                     │  │                         │
│  │ ├─ unified (统一 API)           │  │                         │
│  │ ├─ siliconflow                  │  │                         │
│  │ └─ anthropic                    │  │                         │
│  └─────────────────────────────────┘  │                         │
└───────────────┬───────────────────────┘                         │
                │                                                  │
                │ 5. 保存消息                                       │
                ▼                                                  │
┌───────────────────────────────────────┐                         │
│  saveMessage (lib/db/messages.ts)      │──────────────────────────┘
│  - 保存用户消息                         │
│  - 保存 AI 回复                         │
│  - 记录 token 消耗                      │
└───────────────────────────────────────┘
```

#### 4.2.2 用户认证流程

```
┌──────────────────────────────────────────────────────────────────────────┐
│                          用户认证流程                                      │
└──────────────────────────────────────────────────────────────────────────┘

                    ┌─────────────────────────────────┐
                    │           登录请求              │
                    │  POST /api/auth/login           │
                    │  { username, password }         │
                    └───────────────┬─────────────────┘
                                    │
                                    ▼
                    ┌─────────────────────────────────┐
                    │         速率限制检查             │
                    │   checkRateLimit(ip, 'login')   │
                    └───────────────┬─────────────────┘
                                    │
                           ┌────────┴────────┐
                           │   限制是否超出?  │
                           └────────┬────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │ Yes           │               │ No
                    ▼               │               ▼
        ┌───────────────────┐      │   ┌───────────────────┐
        │  返回 429 错误     │      │   │  查询用户         │
        │  Too Many Requests│      │   │  getUserByUsername │
        └───────────────────┘      │   └─────────┬─────────┘
                                   │             │
                                   │    ┌────────┴────────┐
                                   │    │   用户存在?     │
                                   │    └────────┬────────┘
                                   │             │
                                   │ ┌───────────┼───────────┐
                                   │ │ No        │           │ Yes
                                   │ ▼           │           ▼
                    ┌───────────────────┐      ┌───────────────────┐
                    │  返回 401 错误     │      │  验证密码          │
                    │  用户名或密码错误  │      │  verifyPassword    │
                    └───────────────────┘      └─────────┬─────────┘
                                                         │
                                                ┌────────┴────────┐
                                                │   密码正确?     │
                                                └────────┬────────┘
                                                         │
                                         ┌───────────────┼───────────┐
                                         │ No            │           │ Yes
                                         ▼               │           ▼
                          ┌───────────────────┐        ┌───────────────────┐
                          │  记录失败次数      │        │  生成 JWT Token   │
                          │  返回 401 错误     │        │  signToken(user)  │
                          └───────────────────┘        └─────────┬─────────┘
                                                                 │
                                                                 ▼
                                                ┌───────────────────────────┐
                                                │  设置 Cookie               │
                                                │  - name: auth_token        │
                                                │  - httpOnly: true          │
                                                │  - secure: production      │
                                                │  - sameSite: lax           │
                                                │  - maxAge: 7 days          │
                                                └─────────────┬─────────────┘
                                                              │
                                                              ▼
                                                ┌───────────────────────────┐
                                                │  返回用户信息              │
                                                │  { user, message }         │
                                                └───────────────────────────┘
```

#### 4.2.3 图片上传与分析流程

```
┌──────────────────────────────────────────────────────────────────────────┐
│                        图片上传与分析流程                                   │
└──────────────────────────────────────────────────────────────────────────┘

     用户选择图片
          │
          ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  前端处理 (ConversationView.tsx)                                         │
│                                                                          │
│  ┌────────────────────┐    ┌────────────────────┐                       │
│  │  1. 文件大小检查    │───▶│  2. 图片压缩       │                       │
│  │  最大 10MB         │    │  compressImage()   │                       │
│  └────────────────────┘    └──────────┬─────────┘                       │
│                                       │                                  │
│                                       ▼                                  │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  压缩配置                                                           │ │
│  │  - maxWidth: 1920                                                   │ │
│  │  - maxHeight: 1080                                                  │ │
│  │  - quality: 0.8                                                     │ │
│  │  - maxSizeKB: 500                                                   │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                       │                                  │
│           ┌───────────────────────────┴───────────────────────┐         │
│           │                                                    │         │
│           ▼                                                    ▼         │
│  ┌────────────────────┐                          ┌────────────────────┐ │
│  │  3a. 上传到服务器   │                          │  3b. 转为 Base64   │ │
│  │  POST /api/upload   │                          │  compressToBase64  │ │
│  └──────────┬─────────┘                          └──────────┬─────────┘ │
│             │                                                │          │
│             └────────────────────┬───────────────────────────┘          │
│                                  │                                       │
│                                  ▼                                       │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  4. 保存到状态                                                      │ │
│  │  uploadedImages: [{ url, name, base64 }]                           │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
└──────────────────────────────────────────────────────────────┬──────────┘
                                                               │
                                                               │ 发送消息时
                                                               ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  后端处理 (dispatcher.ts)                                                │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  1. 检测是否有图片附件                                              │ │
│  │  if (attachments?.length > 0 && visionModel)                       │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                           │                                              │
│                           ▼                                              │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  2. 调用视觉模型分析图片                                            │ │
│  │  analyzeImagesWithVision(attachments, visionModel)                 │ │
│  │                                                                     │ │
│  │  分析提示词:                                                        │ │
│  │  "请仔细观察这些图片，从以下几个方面进行分析:                         │ │
│  │   1. 场景/环境：图片拍摄的地点、氛围                                 │ │
│  │   2. 主体内容：主要人物、物品、活动                                  │ │
│  │   3. 情绪氛围：传达的情感、氛围                                     │ │
│  │   4. 视觉亮点：色彩、构图、光线                                     │ │
│  │   5. 适合的文案方向：建议的风格和主题"                               │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                           │                                              │
│                           ▼                                              │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  3. 组合分析结果                                                    │ │
│  │  userMessage = `【图片内容分析】\n${imageAnalysis}\n\n              │ │
│  │                 【用户描述】\n${request.message}`                   │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                           │                                              │
│                           ▼                                              │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  4. 调用文本模型生成最终回复                                        │ │
│  │  callTextModel(model, [systemPrompt, userMessage])                 │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 4.3 目录结构

```
ai-skills-workbench/
│
├── app/                          # Next.js App Router
│   ├── api/                      # API 路由 (18 个端点)
│   │   ├── auth/                 # 认证相关
│   │   │   ├── login/route.ts    # 登录
│   │   │   ├── logout/route.ts   # 登出
│   │   │   └── me/route.ts       # 当前用户信息
│   │   ├── claude/
│   │   │   └── chat/route.ts     # AI 对话核心接口
│   │   ├── skills/
│   │   │   ├── route.ts          # 技能列表
│   │   │   └── [id]/route.ts     # 技能 CRUD
│   │   ├── history/
│   │   │   ├── route.ts          # 历史列表
│   │   │   └── [id]/route.ts     # 历史详情/删除
│   │   ├── favorites/route.ts    # 收藏管理
│   │   ├── users/                # 用户管理
│   │   ├── upload/image/route.ts # 图片上传
│   │   ├── analyze-photo/route.ts # 照片分析
│   │   ├── speech-to-text/route.ts # 语音转文字
│   │   └── admin/                # 管理后台接口
│   │
│   ├── skill/[id]/page.tsx       # 技能对话页面
│   ├── my-skills/page.tsx        # 我的技能
│   ├── history/page.tsx          # 历史记录
│   ├── login/page.tsx            # 登录页面
│   ├── admin/                    # 管理后台页面
│   ├── layout.tsx                # 根布局
│   └── page.tsx                  # 首页
│
├── components/                   # React 组件
│   ├── ui/                       # 基础 UI 组件 (20+)
│   ├── ConversationView.tsx      # 对话主组件 (核心)
│   ├── ModelSelector.tsx         # 模型选择器
│   ├── conversation/             # 对话相关子组件
│   ├── skills/                   # 技能相关组件
│   └── layout/                   # 布局组件
│
├── lib/                          # 核心库
│   ├── ai/                       # AI 模型客户端
│   │   ├── dispatcher.ts         # AI 调度器 (核心)
│   │   ├── unified-client.ts     # 统一 API 客户端
│   │   └── siliconflow-client.ts # SiliconFlow 客户端
│   ├── db/                       # 数据库操作
│   │   ├── users.ts              # 用户 CRUD
│   │   ├── skills.ts             # 技能 CRUD
│   │   ├── conversations.ts      # 对话管理
│   │   ├── messages.ts           # 消息管理
│   │   ├── favorites.ts          # 收藏管理
│   │   └── stats.ts              # 统计管理
│   ├── models/config.ts          # 模型配置
│   ├── skills/config.ts          # 技能配置
│   ├── middleware/               # 中间件
│   │   ├── error-handler.ts      # 错误处理
│   │   └── rateLimit.ts          # 速率限制
│   ├── utils/
│   │   └── image-compression.ts  # 图片压缩工具
│   ├── auth.ts                   # JWT 认证
│   ├── supabase.ts               # Supabase 客户端
│   ├── errors.ts                 # 错误定义
│   └── logger.ts                 # 日志系统
│
├── contexts/
│   └── AuthContext.tsx           # 认证上下文
│
├── types/index.ts                # TypeScript 类型定义
│
├── middleware.ts                 # Next.js 全局中间件 (CORS)
│
├── supabase/
│   ├── migrations/               # 数据库迁移脚本
│   └── schema.sql                # 完整数据库 Schema
│
└── docs/                         # 文档
    ├── REQUIREMENTS.md           # 需求文档 (本文件)
    └── TECHNICAL_DOC.md          # 技术文档
```

---

## 5. 数据库设计

### 5.1 ER 图

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           数据库 ER 图                                   │
└─────────────────────────────────────────────────────────────────────────┘

                              ┌───────────────┐
                              │    users      │
                              ├───────────────┤
                              │ id (PK)       │
                              │ email         │
                              │ username      │
                              │ password_hash │
                              │ name          │
                              │ role          │
                              │ is_active     │
                              │ created_at    │
                              └───────┬───────┘
                                      │
          ┌───────────────────────────┼───────────────────────────┐
          │                           │                           │
          │ 1:N                       │ 1:N                       │ 1:N
          ▼                           ▼                           ▼
┌───────────────────┐       ┌───────────────────┐       ┌───────────────────┐
│      skills       │       │   conversations   │       │   usage_stats     │
├───────────────────┤       ├───────────────────┤       ├───────────────────┤
│ id (PK)           │       │ id (PK)           │       │ id (PK)           │
│ name              │       │ user_id (FK)      │       │ user_id (FK)      │
│ description       │       │ skill_id (FK)     │       │ skill_id (FK)     │
│ icon              │       │ created_at        │       │ tokens_used       │
│ category          │       │ updated_at        │       │ response_time     │
│ input_types       │       └─────────┬─────────┘       │ created_at        │
│ source            │                 │                 └───────────────────┘
│ owner_id (FK)     │                 │ 1:N
│ content           │                 ▼
│ is_public         │       ┌───────────────────┐
│ usage_count       │       │     messages      │
│ created_at        │       ├───────────────────┤
└───────────────────┘       │ id (PK)           │
                            │ conversation_id   │◀──┐
                            │ role              │   │
                            │ content           │   │
                            │ attachments       │   │
                            │ token_count       │   │
                            │ created_at        │   │
                            └───────────────────┘   │
                                                    │
                            ┌───────────────────┐   │
                            │     favorites     │   │
                            ├───────────────────┤   │
                            │ id (PK)           │   │
                            │ user_id (FK)      │   │
                            │ conversation_id   │───┘
                            │ message_id (FK)   │───────▶ messages.id
                            │ created_at        │
                            └───────────────────┘
```

### 5.2 表结构详情

#### users 表

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(100),
  role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('admin', 'member', 'viewer')),
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
```

#### skills 表

```sql
CREATE TABLE skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  category VARCHAR(50),
  input_types TEXT[] DEFAULT '{"text"}',
  placeholder TEXT,
  source VARCHAR(20) DEFAULT 'custom' CHECK (source IN ('official', 'custom', 'community')),
  owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
  content TEXT,  -- 系统提示词
  metadata JSONB DEFAULT '{}',
  is_public BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0,
  rating DECIMAL(2,1) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_skills_category ON skills(category);
CREATE INDEX idx_skills_source ON skills(source);
CREATE INDEX idx_skills_owner_id ON skills(owner_id);
```

#### conversations 表

```sql
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  skill_id UUID REFERENCES skills(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_conversations_skill_id ON conversations(skill_id);
CREATE INDEX idx_conversations_updated_at ON conversations(updated_at DESC);
```

#### messages 表

```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  attachments JSONB,  -- [{type, url, base64}]
  token_count INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
```

#### favorites 表

```sql
CREATE TABLE favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, conversation_id),
  UNIQUE(user_id, message_id),
  CHECK (conversation_id IS NOT NULL OR message_id IS NOT NULL)
);

CREATE INDEX idx_favorites_user_id ON favorites(user_id);
```

### 5.3 RLS 安全策略

```sql
-- 启用 RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- skills: 官方和公开技能所有人可见，私有技能只有拥有者可见
CREATE POLICY "skills_read" ON skills FOR SELECT USING (
  source = 'official' OR is_public = true OR owner_id = auth.uid()
);

-- conversations: 用户只能看到自己的对话
CREATE POLICY "conversations_owner" ON conversations FOR ALL USING (
  user_id = auth.uid()
);

-- messages: 用户只能看到自己对话中的消息
CREATE POLICY "messages_owner" ON messages FOR ALL USING (
  conversation_id IN (SELECT id FROM conversations WHERE user_id = auth.uid())
);

-- favorites: 用户只能管理自己的收藏
CREATE POLICY "favorites_owner" ON favorites FOR ALL USING (
  user_id = auth.uid()
);
```

---

## 6. API 设计

### 6.1 API 概览

| 方法 | 路径 | 描述 | 认证 |
|------|------|------|------|
| POST | /api/auth/login | 用户登录 | 否 |
| POST | /api/auth/logout | 用户登出 | 是 |
| GET | /api/auth/me | 获取当前用户 | 是 |
| POST | /api/claude/chat | AI 对话 | 是 |
| GET | /api/skills | 获取技能列表 | 否 |
| GET | /api/skills/[id] | 获取技能详情 | 否 |
| POST | /api/skills | 创建技能 | 是 |
| PUT | /api/skills/[id] | 更新技能 | 是 |
| DELETE | /api/skills/[id] | 删除技能 | 是 |
| GET | /api/history | 获取历史列表 | 是 |
| GET | /api/history/[id] | 获取历史详情 | 是 |
| DELETE | /api/history/[id] | 删除历史 | 是 |
| GET | /api/favorites | 获取收藏 | 是 |
| POST | /api/favorites | 添加收藏 | 是 |
| DELETE | /api/favorites | 删除收藏 | 是 |
| POST | /api/upload/image | 上传图片 | 是 |
| POST | /api/speech-to-text | 语音转文字 | 是 |

### 6.2 核心 API 详情

#### POST /api/claude/chat

AI 对话核心接口。

**请求：**

```typescript
interface ChatRequest {
  skillId: string           // 技能 ID
  message: string           // 用户消息
  attachments?: Array<{     // 附件（图片）
    type: 'image'
    url?: string            // 图片 URL
    base64?: string         // Base64 编码
  }>
  model?: string            // 模型覆盖（可选）
}
```

**响应：**

```typescript
interface ChatResponse {
  content: string           // AI 回复内容
  model: string             // 使用的模型
  provider: string          // API 提供商
  tokenCount?: number       // Token 消耗
  isMock?: boolean          // 是否为模拟响应
  mockReason?: string       // 模拟原因
}
```

**错误码：**

| 状态码 | 错误码 | 描述 |
|--------|--------|------|
| 400 | VALIDATION_ERROR | 参数验证失败 |
| 401 | UNAUTHORIZED | 未登录 |
| 429 | RATE_LIMIT | 请求过于频繁 |
| 502 | AI_SERVICE_ERROR | AI 服务异常 |

#### POST /api/auth/login

用户登录接口。

**请求：**

```typescript
interface LoginRequest {
  username: string          // 用户名或邮箱
  password: string          // 密码
}
```

**响应：**

```typescript
interface LoginResponse {
  user: {
    id: string
    email: string
    username: string
    name: string
    role: 'admin' | 'member' | 'viewer'
  }
  message: string
}
```

**Cookie 设置：**

```
Set-Cookie: auth_token=<JWT>; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=604800
```

#### GET /api/history

获取对话历史列表。

**查询参数：**

| 参数 | 类型 | 描述 |
|------|------|------|
| q | string | 搜索关键词 |
| skillId | string | 按技能筛选 |
| limit | number | 返回数量（默认 20） |

**响应：**

```typescript
interface HistoryResponse {
  conversations: Array<{
    conversation: {
      id: string
      skillId: string
      createdAt: Date
      updatedAt: Date
    }
    skillName: string
    skillIcon: string
    lastMessagePreview: string
    messageCount: number
  }>
}
```

---

## 7. 代码文件索引

### 7.1 需要修改的文件（待优化功能）

| 功能 | 文件路径 | 修改内容 |
|------|----------|----------|
| 流式响应 | `app/api/claude/chat/route.ts` | 添加 SSE 流式输出 |
| 流式响应 | `lib/ai/dispatcher.ts` | 支持流式调用 |
| 流式响应 | `components/ConversationView.tsx` | 流式显示处理 |
| 重试按钮 | `components/conversation/MessageActions.tsx` | 添加重试功能 |

### 7.2 核心文件功能说明

| 文件 | 行数 | 功能描述 |
|------|------|----------|
| `components/ConversationView.tsx` | ~850 | 对话界面主组件，包含输入、消息显示、图片上传 |
| `lib/ai/dispatcher.ts` | ~250 | AI 模型调度，支持多提供商、视觉模型 |
| `lib/db/messages.ts` | ~400 | 消息 CRUD，分页查询，搜索 |
| `lib/db/conversations.ts` | ~300 | 对话管理，关联查询 |
| `lib/auth.ts` | ~200 | JWT 认证，密码处理 |
| `app/api/claude/chat/route.ts` | ~330 | 对话 API，错误处理，模拟响应 |
| `middleware.ts` | ~80 | CORS，安全头 |

---

## 8. 关键代码实现

### 8.1 AI 调度器 (dispatcher.ts)

```typescript
// lib/ai/dispatcher.ts - 核心调度逻辑

export async function dispatchAI(request: AIRequest): Promise<AIResponse> {
  // 1. 获取技能配置的模型
  const skillModelConfig = getSkillModelConfig(request.skillId)
  let textModel = skillModelConfig.text
  const visionModel = skillModelConfig.vision

  // 2. 支持前端覆盖模型
  if (request.modelOverride) {
    const overrideConfig = getModelConfigById(request.modelOverride)
    if (overrideConfig && overrideConfig.type === 'text') {
      textModel = overrideConfig
    }
  }

  let userMessage = request.message

  // 3. 如果有图片，先用视觉模型分析
  if (request.attachments?.length > 0 && visionModel) {
    try {
      const imageAnalysis = await analyzeImagesWithVision(
        request.attachments,
        visionModel.provider,
        visionModel.model
      )
      // 组合分析结果
      userMessage = `【图片内容分析】\n${imageAnalysis}\n\n【用户描述】\n${request.message}`
    } catch (error) {
      // 分析失败时继续，但提示用户
      userMessage = `${request.message}\n\n[系统提示：图片分析暂时不可用]`
    }
  }

  // 4. 调用文本模型生成回复
  const messages = [
    { role: 'system', content: request.systemPrompt || '' },
    { role: 'user', content: userMessage }
  ]

  let content: string
  if (textModel.provider === 'siliconflow') {
    content = await callSiliconFlowText(textModel.model, messages)
  } else {
    content = await callTextModel(textModel.model, messages)
  }

  return {
    content,
    model: textModel.model,
    provider: textModel.provider,
  }
}
```

### 8.2 图片压缩工具 (image-compression.ts)

```typescript
// lib/utils/image-compression.ts

export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<File> {
  const opts = {
    maxWidth: 1920,
    maxHeight: 1080,
    quality: 0.8,
    maxSizeKB: 500,
    ...options
  }

  // 如果文件已经足够小，直接返回
  if (file.size <= opts.maxSizeKB * 1024) {
    return file
  }

  return new Promise((resolve, reject) => {
    const img = new Image()
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    img.onload = () => {
      // 计算压缩后的尺寸
      let { width, height } = img
      if (width > opts.maxWidth) {
        height = (height * opts.maxWidth) / width
        width = opts.maxWidth
      }
      if (height > opts.maxHeight) {
        width = (width * opts.maxHeight) / height
        height = opts.maxHeight
      }

      canvas.width = width
      canvas.height = height
      ctx.drawImage(img, 0, 0, width, height)

      // 递归压缩直到满足大小要求
      let quality = opts.quality
      const tryCompress = () => {
        canvas.toBlob((blob) => {
          if (blob.size > opts.maxSizeKB * 1024 && quality > 0.3) {
            quality -= 0.1
            tryCompress()
            return
          }
          resolve(new File([blob], file.name.replace(/\.[^/.]+$/, '.jpg'), { type: 'image/jpeg' }))
        }, 'image/jpeg', quality)
      }
      tryCompress()
    }

    img.src = URL.createObjectURL(file)
  })
}
```

### 8.3 消息分页加载 (ConversationView.tsx)

```typescript
// components/ConversationView.tsx - 分页加载逻辑

const INITIAL_MESSAGE_LIMIT = 50
const LOAD_MORE_LIMIT = 20

// 加载更多历史消息
const loadMoreHistory = useCallback(async () => {
  if (!conversationId || loadingMoreHistory || !hasMoreHistory) return

  setLoadingMoreHistory(true)
  try {
    const oldestMessage = messages[0]
    const result = await getMessagesBefore(
      conversationId,
      oldestMessage.timestamp,
      LOAD_MORE_LIMIT
    )

    if (result.messages.length > 0) {
      // 保存滚动位置
      const container = messagesContainerRef.current
      const previousScrollHeight = container?.scrollHeight || 0

      setMessages(prev => [...result.messages, ...prev])
      setHasMoreHistory(result.hasMore)

      // 恢复滚动位置
      requestAnimationFrame(() => {
        if (container) {
          const newScrollHeight = container.scrollHeight
          container.scrollTop = newScrollHeight - previousScrollHeight
        }
      })
    }
  } finally {
    setLoadingMoreHistory(false)
  }
}, [conversationId, loadingMoreHistory, hasMoreHistory, messages])
```

### 8.4 JWT 认证 (auth.ts)

```typescript
// lib/auth.ts - 核心认证逻辑

const JWT_SECRET = process.env.JWT_SECRET || 'development-secret'
const TOKEN_EXPIRY = '7d'

export interface JWTPayload {
  userId: string
  email: string
  username: string
  role: UserRole
  iat: number
  exp: number
}

// 生成 Token
export function signToken(user: User): string {
  const payload = {
    userId: user.id,
    email: user.email,
    username: user.username,
    role: user.role,
  }
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY })
}

// 验证 Token
export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload
  } catch {
    return null
  }
}

// 从请求中获取当前用户
export async function getCurrentUser(): Promise<JWTPayload | null> {
  const cookieStore = cookies()
  const token = cookieStore.get('auth_token')?.value

  if (!token) return null
  return verifyToken(token)
}
```

### 8.5 错误处理中间件 (error-handler.ts)

```typescript
// lib/middleware/error-handler.ts

export function withErrorHandler(
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    try {
      return await handler(req)
    } catch (error) {
      // AppError: 业务错误
      if (error instanceof AppError) {
        return NextResponse.json(
          {
            error: {
              code: error.code,
              message: error.message,
              details: error.details,
            }
          },
          { status: error.statusCode }
        )
      }

      // 未知错误
      logger.error('Unhandled error', error)
      return NextResponse.json(
        {
          error: {
            code: ErrorCodes.INTERNAL_ERROR,
            message: '服务器内部错误',
          }
        },
        { status: 500 }
      )
    }
  }
}
```

---

## 附录

### A. 环境变量配置

```bash
# .env.local

# 数据库
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key

# AI 模型
ANTHROPIC_API_KEY=your_anthropic_key
SILICONFLOW_API_KEY=your_siliconflow_key
UNIFIED_API_KEY=your_unified_api_key
UNIFIED_API_ENDPOINT=https://api4.mygptlife.com/v1

# 认证
JWT_SECRET=your_jwt_secret_at_least_32_chars
```

### B. 待开发功能

| 功能 | 优先级 | 描述 |
|------|--------|------|
| 流式响应 | P2 | AI 回复打字机效果 |
| 重试按钮 | P2 | 回复不满意时重新生成 |
| 导出历史 | P3 | 导出对话为 MD/PDF |
| 技能市场 | P3 | 社区技能分享 |
| 多语言 | P3 | 国际化支持 |

---

*文档更新日期：2025-12-29*
