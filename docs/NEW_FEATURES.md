# 新功能说明文档

## 📋 更新概览

本次更新为 AI Skills Workbench 添加了以下重要功能:

### 1. ✨ 模型选择器
- 在对话界面中实时切换 AI 模型
- 支持多个提供商的模型 (Claude, Gemini, SiliconFlow)
- 按类别分组显示模型

### 2. 📖 模型详情介绍
- 点击模型信息按钮查看详细介绍
- 显示模型特性、应用场景、性能参数
- 提供官方文档链接

### 3. 🖼️ 图片上传功能
- 支持上传图片到对话中
- 图片预览和移除
- 自动处理图片存储

### 4. 🎤 语音输入功能
- 实时语音转文字
- 使用 TeleSpeech ASR 高精度识别
- 支持中文和多语言

### 5. 🔄 新增 SiliconFlow 模型
- GLM-4.7 Pro - 智谱AI大模型专业版
- GLM-4.6V - 视觉多模态模型
- MiniMax-M2 - MiniMax最新语言模型
- MiniMax-M1-80k - 超长上下文(80K)
- Qwen3-VL-32B - 多模态视觉语言模型
- Qwen3-VL-Thinking - 深度思考多模态模型
- Qwen3-VL-A3B - 高效多模态理解模型
- TeleSpeech ASR - 高精度语音识别

---

## 🎯 功能详解

### 模型选择器

**位置**: 对话界面顶部 / 空状态中央

**使用方法**:
1. 点击模型选择器按钮
2. 从下拉菜单中选择想要使用的模型
3. 模型立即生效,下一次对话将使用新模型

**模型分类**:
- **Claude (Anthropic)**: 文字创作、推理、对话
- **Gemini (Google)**: 视觉理解、多模态任务
- **SiliconFlow**: 中文优化、高性能、多模态

**特色功能**:
- 实时切换,无需重新加载页面
- 显示模型简介和描述
- 按提供商分组,方便查找

### 模型详情弹窗

**触发方式**: 点击模型选项右侧的 "i" 信息按钮

**展示内容**:
- **基本信息**
  - 模型类型 (文本/图像/语音)
  - 提供商
  - 上下文长度
  - 响应速度

- **核心特性**
  - 模型的主要能力
  - 技术特点
  - 优势说明

- **应用场景**
  - 推荐用途
  - 适用任务类型
  - 最佳实践

- **了解更多**
  - 官方文档链接
  - 详细技术文档

**示例** (GLM-4.7 Pro):
```
基本信息:
- 类型: 文本生成
- 提供商: SiliconFlow
- 上下文: 128K tokens
- 速度: 快

核心特性:
- 智谱AI
- 专业版本
- 多任务处理
- 高精度

应用场景:
- 专业咨询
- 知识问答
- 内容生成
- 数据分析
```

### 图片上传功能

**支持格式**: JPEG, PNG, GIF, WebP

**大小限制**: 最大 10MB

**使用流程**:
1. 点击输入框右侧的图片图标
2. 选择要上传的图片文件
3. 图片上传后会显示预览
4. 可以点击预览右上角的 X 移除图片
5. 发送消息时,图片会一并发送给 AI

**技术实现**:
- 文件上传到 `/public/uploads` 目录
- 生成唯一文件名防止冲突
- 返回图片 URL 供 AI 处理
- 支持多模态模型(如 Gemini Vision, GLM-4.6V)

**API 端点**: `POST /api/upload/image`

**请求格式**:
```typescript
FormData {
  file: File
}
```

**响应格式**:
```json
{
  "success": true,
  "url": "/uploads/abc123.jpg",
  "filename": "abc123.jpg",
  "size": 1024000,
  "type": "image/jpeg"
}
```

### 语音输入功能

**使用方法**:
1. 点击输入框右侧的麦克风图标开始录音
2. 录音时图标变为红色,显示停止按钮
3. 再次点击停止录音
4. 自动将语音转换为文字并填入输入框
5. 可以编辑识别结果后发送

**技术特点**:
- 使用 MediaRecorder API 录制音频
- 调用 TeleSpeech ASR 进行语音识别
- 支持中文和多语言识别
- 高精度识别引擎

**API 端点**: `POST /api/speech-to-text`

**请求格式**:
```typescript
FormData {
  file: File (audio/webm, audio/wav, etc.)
  language: string (default: 'zh')
}
```

**响应格式**:
```json
{
  "success": true,
  "text": "识别出的文字内容",
  "language": "zh"
}
```

**注意事项**:
- 需要浏览器麦克风权限
- 首次使用会弹出权限请求
- 支持的音频格式: WAV, MP3, M4A, WebM, OGG
- 最大文件大小: 25MB

---

## 🔧 技术架构

### 文件结构

```
components/
├── ModelSelector.tsx          # 模型选择器组件
├── ModelInfoDialog.tsx        # 模型详情弹窗
└── ConversationView.tsx       # 增强版对话组件

app/api/
├── upload/
│   └── image/
│       └── route.ts          # 图片上传API
└── speech-to-text/
    └── route.ts              # 语音识别API

lib/
├── ai/
│   └── siliconflow-client.ts # SiliconFlow客户端
└── models/
    └── config.ts             # 模型配置(新增模型)

public/
└── uploads/                  # 图片上传目录
```

### 组件依赖

```
ConversationView
├── ModelSelector
│   └── ModelInfoDialog
├── Image Upload Handler
└── Voice Input Handler
    └── Speech-to-Text API
```

### API 流程

#### 图片上传流程
```
用户选择图片
  ↓
FormData 上传
  ↓
服务器验证 (类型、大小)
  ↓
保存到 public/uploads
  ↓
返回 URL
  ↓
显示预览
  ↓
发送给 AI 模型
```

#### 语音识别流程
```
用户点击录音
  ↓
MediaRecorder 开始录制
  ↓
用户停止录音
  ↓
生成 Audio Blob
  ↓
上传到语音识别 API
  ↓
SiliconFlow TeleSpeech ASR 处理
  ↓
返回识别文字
  ↓
填入输入框
```

---

## 📊 支持的模型列表

### 文本生成模型

| 模型 ID | 名称 | 提供商 | 上下文 | 特点 |
|--------|------|--------|--------|------|
| `claude-haiku-4-5-20251001` | Claude Haiku 4.5 | Anthropic | 200K | 快速、高性价比 |
| `claude-opus-4-5-20251101` | Claude Opus 4.5 | Anthropic | 200K | 最强推理 |
| `gemini-pro-vision` | Gemini Pro Vision | Google | 32K | 视觉理解 |
| `Qwen/Qwen2.5-7B-Instruct` | Qwen2.5 7B | SiliconFlow | 32K | 中文优化 |
| `deepseek-ai/DeepSeek-V2.5` | DeepSeek V2.5 | SiliconFlow | 64K | 代码专家 |
| `Pro/zai-org/GLM-4.7` | GLM-4.7 Pro | SiliconFlow | 128K | 智谱AI专业版 |
| `zai-org/GLM-4.6V` | GLM-4.6V | SiliconFlow | 128K | 视觉多模态 |
| `MiniMaxAI/MiniMax-M2` | MiniMax-M2 | SiliconFlow | 32K | 最新语言模型 |
| `MiniMaxAI/MiniMax-M1-80k` | MiniMax-M1-80k | SiliconFlow | 80K | 超长上下文 |
| `Qwen/Qwen3-VL-32B-Instruct` | Qwen3-VL-32B | SiliconFlow | 32K | 多模态视觉 |
| `Qwen/Qwen3-VL-32B-Thinking` | Qwen3-VL-Thinking | SiliconFlow | 32K | 深度思考 |
| `Qwen/Qwen3-VL-30B-A3B-Instruct` | Qwen3-VL-A3B | SiliconFlow | 32K | 高效多模态 |

### 图像生成模型

| 模型 ID | 名称 | 提供商 | 特点 |
|--------|------|--------|------|
| `black-forest-labs/FLUX.1-schnell` | FLUX.1 Schnell | SiliconFlow | 快速生成 |
| `stabilityai/stable-diffusion-3-5-large` | SD 3.5 Large | SiliconFlow | 超高质量 |

### 语音识别模型

| 模型 ID | 名称 | 提供商 | 特点 |
|--------|------|--------|------|
| `TeleAI/TeleSpeechASR` | TeleSpeech ASR | SiliconFlow | 高精度多语言 |

---

## 🚀 使用示例

### 示例 1: 使用 GLM-4.6V 分析图片

1. 打开任意技能对话
2. 点击模型选择器,选择 "GLM-4.6V"
3. 点击图片上传按钮,选择一张图片
4. 输入: "请详细分析这张图片的内容"
5. 发送消息
6. AI 将结合视觉理解能力分析图片

### 示例 2: 使用语音输入创作文案

1. 打开"朋友圈文案"技能
2. 点击麦克风按钮开始录音
3. 说: "今天去爬山,看到了美丽的日出"
4. 停止录音,文字自动填入
5. 发送,AI 生成朋友圈文案

### 示例 3: 切换模型获得不同风格

1. 使用 Claude Opus 生成正式文档
2. 切换到 MiniMax-M2 生成创意内容
3. 切换到 Qwen3-VL-Thinking 进行深度分析
4. 对比不同模型的输出风格

---

## ⚙️ 配置说明

### 环境变量

确保 `.env.local` 包含以下配置:

```bash
# SiliconFlow API 配置
SILICONFLOW_API_KEY=your_api_key_here
SILICONFLOW_API_ENDPOINT=https://api.siliconflow.cn/v1

# 统一 API 配置
UNIFIED_API_KEY=your_unified_api_key
UNIFIED_API_ENDPOINT=https://api4.mygptlife.com/v1
```

### 目录权限

确保 `public/uploads` 目录存在且可写:

```bash
mkdir -p public/uploads
chmod 755 public/uploads
```

---

## 🐛 故障排除

### 问题 1: 模型选择器不显示

**原因**: 组件导入错误

**解决方案**:
```bash
# 检查组件文件是否存在
ls components/ModelSelector.tsx
ls components/ModelInfoDialog.tsx

# 重启开发服务器
npm run dev
```

### 问题 2: 图片上传失败

**可能原因**:
- 文件大小超过 10MB
- 文件格式不支持
- 目录权限不足

**解决方案**:
```bash
# 检查上传目录
ls -la public/uploads

# 修复权限
chmod 755 public/uploads

# 检查文件大小和格式
```

### 问题 3: 语音识别不工作

**可能原因**:
- 浏览器未授予麦克风权限
- API 密钥未配置
- 音频格式不支持

**解决方案**:
1. 检查浏览器权限设置
2. 确认 `SILICONFLOW_API_KEY` 已配置
3. 使用支持的音频格式

### 问题 4: 模型切换后仍使用旧模型

**原因**: API 调用未传递新模型 ID

**解决方案**:
检查 ConversationView.tsx 中的 `handleSend` 函数是否正确传递 `selectedModelId`

---

## 📝 更新日志

### 2024-12-28

**新增**:
- ✅ 模型选择器组件
- ✅ 模型详情弹窗
- ✅ 图片上传功能
- ✅ 语音输入功能
- ✅ 9 个新的 SiliconFlow 模型

**优化**:
- 🔧 ConversationView 组件重构
- 🎨 UI/UX 改进
- 📚 完善文档

**修复**:
- 🐛 修复白天模式文字可见性
- 🐛 修复历史记录和文档 404
- 🐛 统一卡片样式

---

## 🎉 总结

本次更新大幅提升了 AI Skills Workbench 的功能性和用户体验:

1. **模型灵活性**: 支持 15+ 个 AI 模型,可随时切换
2. **多模态支持**: 图片上传、语音输入,丰富交互方式
3. **信息透明**: 详细的模型介绍,帮助用户选择合适的模型
4. **用户体验**: 流畅的交互、直观的界面设计

开始使用这些新功能,探索 AI 的无限可能! 🚀
