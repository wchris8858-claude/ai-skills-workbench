# SiliconFlow API 集成文档

## 概述

SiliconFlow 是一个高性能的 AI 模型服务平台,提供多种先进的 AI 模型,包括:

- **文本生成**: Qwen2.5, DeepSeek V2.5 等
- **图像生成**: FLUX.1, Stable Diffusion 3.5 等
- **语音处理**: TTS (文本转语音), STT (语音转文本)
- **视频生成**: 多种视频生成模型
- **多模态**: 视觉理解和处理

## 配置

### 1. 环境变量

在 `.env.local` 文件中添加以下配置:

```bash
# SiliconFlow API 配置
SILICONFLOW_API_KEY=your_api_key_here
SILICONFLOW_API_ENDPOINT=https://api.siliconflow.cn/v1
```

### 2. 获取 API 密钥

1. 访问 [SiliconFlow 官网](https://siliconflow.cn)
2. 注册账号并登录
3. 在控制台中创建 API 密钥
4. 将密钥复制到 `.env.local` 文件中

## 支持的模型

### 文本生成模型

| 模型 ID | 描述 | 推荐用途 |
|--------|------|---------|
| `Qwen/Qwen2.5-7B-Instruct` | Qwen2.5 7B 模型 | 中文对话、问答 |
| `deepseek-ai/DeepSeek-V2.5` | DeepSeek V2.5 | 代码生成、深度推理 |

### 图像生成模型

| 模型 ID | 描述 | 特点 |
|--------|------|------|
| `black-forest-labs/FLUX.1-schnell` | FLUX.1 Schnell | 快速生成,质量高 |
| `stabilityai/stable-diffusion-3-5-large` | Stable Diffusion 3.5 Large | 超高质量,细节丰富 |

## 使用方式

### 1. 文本生成

```typescript
import { callSiliconFlowText } from '@/lib/ai/siliconflow-client'

const response = await callSiliconFlowText(
  'Qwen/Qwen2.5-7B-Instruct',
  [
    { role: 'system', content: '你是一个有帮助的助手。' },
    { role: 'user', content: '你好!' }
  ],
  0.7,  // temperature
  2000  // max_tokens
)

console.log(response)
```

### 2. 图像生成

```typescript
import { callSiliconFlowImage } from '@/lib/ai/siliconflow-client'

const imageUrls = await callSiliconFlowImage(
  'black-forest-labs/FLUX.1-schnell',
  'A beautiful sunset over mountains',
  {
    imageSize: '1024x1024',
    batchSize: 1
  }
)

console.log('生成的图片:', imageUrls[0])
```

### 3. 文本转语音

```typescript
import { callSiliconFlowTTS } from '@/lib/ai/siliconflow-client'

const audioBlob = await callSiliconFlowTTS(
  'FishSpeech',
  '你好,这是一段测试语音。',
  'voice_id_here',
  {
    speed: 1.0,
    format: 'mp3'
  }
)

// 下载或播放音频
const url = URL.createObjectURL(audioBlob)
```

### 4. 语音转文本

```typescript
import { callSiliconFlowSTT } from '@/lib/ai/siliconflow-client'

// audioFile 是一个 File 或 Blob 对象
const result = await callSiliconFlowSTT(
  'FunAudioLLM/SenseVoiceSmall',
  audioFile,
  {
    language: 'zh',
    format: 'json'
  }
)

console.log('识别结果:', result.text)
```

## 在技能中使用

### 配置技能使用 SiliconFlow 模型

在 `lib/models/config.ts` 中配置技能:

```typescript
export const SKILL_MODEL_CONFIG: Record<string, SkillModelMapping> = {
  'my-skill': {
    text: {
      ...AVAILABLE_MODELS.siliconflow['qwen-max'],
      temperature: 0.7,
    },
    image: AVAILABLE_MODELS.siliconflow['flux-schnell'],
  },
}
```

### 自动调度

系统会根据模型的 `provider` 字段自动选择合适的 API 端点:

- `provider: 'siliconflow'` → 使用 SiliconFlow API
- `provider: 'anthropic'` → 使用统一 API (Claude)
- `provider: 'google'` → 使用统一 API (Gemini)

## 测试

运行集成测试脚本:

```bash
npx tsx scripts/test-siliconflow.ts
```

测试内容包括:
- ✅ 文本生成 (Qwen2.5)
- ✅ 获取模型列表
- ✅ 代码生成 (DeepSeek)
- ✅ 图像生成 (FLUX.1)
- ✅ 获取语音列表

## API 文档

完整的 API 文档请参考:

- [Chat Completions](https://docs.siliconflow.cn/cn/api-reference/chat-completions/chat-completions)
- [Image Generation](https://docs.siliconflow.cn/cn/api-reference/images/images-generations)
- [Text-to-Speech](https://docs.siliconflow.cn/cn/api-reference/audio/create-speech)
- [Speech-to-Text](https://docs.siliconflow.cn/cn/api-reference/audio/create-audio-transcriptions)
- [Model List](https://docs.siliconflow.cn/cn/api-reference/models/get-model-list)

## 最佳实践

### 1. 模型选择

- **中文对话**: 使用 Qwen2.5 系列,中文性能优秀
- **代码生成**: 使用 DeepSeek V2.5,专注于代码和推理
- **快速图像**: 使用 FLUX.1 Schnell,速度快
- **高质量图像**: 使用 Stable Diffusion 3.5 Large

### 2. 参数调优

- **temperature**:
  - 0.1-0.3: 准确、稳定的输出 (知识问答、代码生成)
  - 0.5-0.7: 平衡创意和准确性 (日常对话)
  - 0.8-1.0: 高创意性 (文案创作、头脑风暴)

- **max_tokens**:
  - 简短回复: 500-1000
  - 中等长度: 2000-4000
  - 长文章: 4000-8000

### 3. 错误处理

```typescript
try {
  const response = await callSiliconFlowText(...)
} catch (error) {
  if (error.message.includes('rate limit')) {
    // 处理速率限制
  } else if (error.message.includes('401')) {
    // API 密钥无效
  } else {
    // 其他错误
  }
}
```

### 4. 成本优化

- 使用合适的模型规模 (不总是使用最大模型)
- 设置合理的 max_tokens 限制
- 对于简单任务使用较小的模型
- 利用缓存减少重复请求

## 常见问题

### Q1: API 调用失败怎么办?

1. 检查 `.env.local` 中的 API 密钥是否正确
2. 确认 API 端点 URL 正确
3. 查看控制台错误信息
4. 运行测试脚本诊断问题

### Q2: 如何查看可用的模型?

```typescript
const client = new SiliconFlowClient()
const models = await client.getModelList()
console.log(models)
```

### Q3: 图像生成速度慢?

- 使用 FLUX.1 Schnell 而不是 Stable Diffusion
- 降低图像尺寸
- 减少 `batch_size`

### Q4: 如何切换不同的模型?

在 `lib/models/config.ts` 中修改技能的模型配置,系统会自动使用新模型。

## 更新日志

- **2024-12-28**: 初始集成,支持文本生成、图像生成、TTS、STT
- 添加了 4 个预配置模型 (Qwen2.5, DeepSeek V2.5, FLUX.1, SD3.5)
- 创建了完整的客户端库和测试脚本

## 支持

如有问题,请参考:
- [SiliconFlow 官方文档](https://docs.siliconflow.cn)
- [GitHub Issues](https://github.com/your-repo/issues)
