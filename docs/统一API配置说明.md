# AI Skills Workbench 统一 API 配置说明

## 概述

本项目已升级为使用统一 API 端点架构,通过单一接入点访问多个 AI 模型,简化了配置和管理。

## 统一 API 端点

**接入点**: `https://api4.mygptlife.com/v1`

**API 密钥**: 在 `.env.local` 文件中配置 `UNIFIED_API_KEY`

## 支持的模型

### 文本生成模型

| 模型名称 | 模型 ID | 用途 | 特点 |
|---------|---------|------|------|
| Claude Haiku 4.5 | `claude-haiku-4-5-20251001` | 快速响应任务 | 性价比高,响应快 |
| Claude Opus 4.5 | `claude-opus-4-5-20251101` | 高质量创作 | 最强推理和创作能力 |
| Gemini Pro Vision | `gemini-pro-vision` | 视觉理解 | 支持图像分析 |

### 图像生成模型

| 模型名称 | 模型 ID | 用途 | 特点 |
|---------|---------|------|------|
| GPT Image 1.5 | `gpt-image-1.5` | AI 图像生成 | 高质量图像生成 |
| Nano Banana Pro | `nano-banana-pro` | 创意图像 | 创意设计风格 |

## 技能与模型映射

| 技能名称 | 文本模型 | 图像模型 | 说明 |
|---------|---------|---------|------|
| 朋友圈文案 | Claude Opus 4.5 | - | 高质量创意文案 |
| 视频文案改写 | Claude Opus 4.5 | - | 保持质量的内容改写 |
| 爆款拆解 | Claude Opus 4.5 | - | 深度分析推理 |
| 会议语音转文字 | Claude Haiku 4.5 | - | 快速准确整理 |
| 知识库查询 | Claude Haiku 4.5 | - | 快速响应 |
| 官方通知 | Claude Haiku 4.5 | - | 正式文体 |
| 海报制作 | Gemini Pro Vision | GPT Image 1.5 | 创意设计+图像生成 |
| AI 选片修片 | Gemini Pro Vision | Nano Banana Pro | 图像分析+创意生成 |

## 配置步骤

### 1. 创建环境变量文件

复制 `.env.example` 到 `.env.local`:

```bash
cp .env.example .env.local
```

### 2. 配置 API 密钥

编辑 `.env.local` 文件:

```env
# 统一 AI API 配置
UNIFIED_API_KEY=your_api_key_here
UNIFIED_API_ENDPOINT=https://api4.mygptlife.com/v1
```

将 `your_api_key_here` 替换为您的实际 API 密钥。

### 3. 配置 Supabase (可选)

如果需要使用数据库功能,配置 Supabase:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. 启动应用

```bash
npm run dev
```

## 技术架构

### 统一客户端 (Unified Client)

位置: `lib/ai/unified-client.ts`

功能:
- 统一的请求接口
- 自动处理不同模型的 API 格式
- 支持文本生成和图像生成

### 调度器 (Dispatcher)

位置: `lib/ai/dispatcher.ts`

功能:
- 根据技能 ID 自动选择合适的模型
- 路由请求到统一客户端
- 处理错误和降级

### 模型配置

位置: `lib/models/config.ts`

包含:
- 所有可用模型的定义
- 技能与模型的映射关系
- 模型参数配置(温度、最大 tokens 等)

## 使用示例

### 调用文本生成

```typescript
import { dispatchAI } from '@/lib/ai/dispatcher'

const response = await dispatchAI({
  skillId: 'moments-copywriter', // 会自动使用 Claude Opus 4.5
  message: '今天天气真好',
  systemPrompt: '你是朋友圈文案专家',
})

console.log(response.content) // AI 生成的内容
console.log(response.model) // 使用的模型名称
```

### 调用图像生成

```typescript
import { generateImage } from '@/lib/ai/dispatcher'

const imageUrls = await generateImage(
  'poster-creator', // 会自动使用 GPT Image 1.5
  '一个现代简约风格的海报设计'
)

console.log(imageUrls) // 生成的图片 URL 数组
```

## 优势

### 1. 简化配置
- 只需配置一个 API 密钥
- 统一的端点管理
- 无需为每个提供商单独配置

### 2. 自动路由
- 根据技能自动选择最合适的模型
- 透明的模型切换
- 优化的成本控制

### 3. 易于维护
- 集中的模型配置
- 统一的错误处理
- 简化的代码结构

### 4. 灵活扩展
- 轻松添加新模型
- 支持 A/B 测试
- 可配置的降级策略

## 性能优化

1. **模型选择**: 根据任务特点选择最合适的模型
   - 简单任务使用 Claude Haiku(快速、便宜)
   - 复杂创作使用 Claude Opus(高质量)

2. **参数调优**: 不同任务使用不同的温度和 max_tokens
   - 创意任务: temperature = 0.8-0.9
   - 分析任务: temperature = 0.1-0.3

3. **降级策略**: API 失败时自动返回 Mock 响应

## 成本控制

- Claude Opus: 用于需要最高质量的创作任务
- Claude Haiku: 用于日常对话和快速响应
- Gemini Pro Vision: 用于需要视觉理解的任务
- 图像生成: 仅在需要时使用

## 故障排查

### 1. API 密钥未配置

**错误**: `UNIFIED_API_KEY is not configured`

**解决**: 在 `.env.local` 中配置 `UNIFIED_API_KEY`

### 2. API 调用失败

**错误**: `Unified API error: 401/403`

**解决**:
- 检查 API 密钥是否正确
- 确认 API 密钥有效期
- 检查是否有足够的额度

### 3. 返回 Mock 响应

**原因**: API 密钥未配置或调用失败

**解决**: 配置正确的 API 密钥即可获得真实响应

### 4. 构建错误

**错误**: Supabase URL 验证失败

**解决**: 在 `.env.local` 中配置有效的 Supabase URL,或使用占位符:
```env
NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder_key
```

## 监控与日志

所有 AI 调用都会记录:
- 使用的模型
- 请求参数
- 响应时间
- 错误信息

查看位置: 浏览器控制台或服务器日志

## 未来计划

- [ ] 添加响应缓存
- [ ] 实现成本分析仪表板
- [ ] 支持用户自定义模型配置
- [ ] 添加模型性能监控
- [ ] 实现智能模型选择(根据负载自动切换)

## 常见问题

### Q: 可以同时使用多个 API 提供商吗?

A: 当前架构使用统一 API 端点,所有模型通过同一个接入点访问。如果需要使用其他提供商,可以在 `lib/ai/` 目录下添加新的客户端实现。

### Q: 如何添加新的模型?

A: 在 `lib/models/config.ts` 中的 `AVAILABLE_MODELS` 添加新模型配置,然后在 `SKILL_MODEL_CONFIG` 中为技能分配该模型。

### Q: 如何更换技能使用的模型?

A: 修改 `lib/models/config.ts` 中 `SKILL_MODEL_CONFIG` 的相应技能配置即可。

### Q: API 调用有速率限制吗?

A: 速率限制取决于您的 API 提供商。建议查看 API 提供商的文档了解具体限制。
