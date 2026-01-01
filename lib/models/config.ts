/**
 * 多模型配置
 *
 * 模型分工策略：
 * - 文字创作类：Claude (Anthropic)
 * - 计划和想法类：Gemini (Google) / 豆包 (Doubao)
 * - 图像生成：即梦 (Jimeng) / Nano Banana
 * - 视频生成：Veo (Google)
 * - 语音识别：讯飞 (iFlytek) / SiliconFlow
 *
 * 火山引擎服务（即梦、豆包）共用 AKSK 认证
 */

import { logger } from '@/lib/logger'

// 模型提供商
export type ModelProvider =
  | 'anthropic'   // Claude
  | 'google'      // Gemini
  | 'siliconflow' // SiliconFlow
  | 'doubao'      // 豆包 (火山方舟)
  | 'image'       // 图像生成模型

// 模型类型
export type ModelType = 'text' | 'image' | 'video' | 'speech' | 'vision'

// 模型配置接口
export interface ModelConfig {
  provider: ModelProvider
  model: string
  type: ModelType
  temperature?: number
  maxTokens?: number
  description: string
}

// 技能模型映射
export interface SkillModelMapping {
  // 主要文本模型
  text: ModelConfig
  // 图像生成模型（可选）
  image?: ModelConfig
  // 视频生成模型（可选）
  video?: ModelConfig
  // 语音识别模型（可选）
  speech?: ModelConfig
  // 视觉理解模型（可选，用于图片分析）
  vision?: ModelConfig
}

// 可用模型列表
// 所有模型通过统一 API 端点访问: https://api4.mygptlife.com/v1
export const AVAILABLE_MODELS = {
  // Claude 系列 - 文字创作
  anthropic: {
    'claude-haiku': {
      provider: 'anthropic' as const,
      model: 'claude-haiku-4-5-20251001',
      type: 'text' as const,
      temperature: 0.7,
      maxTokens: 4096,
      description: 'Claude Haiku 4.5 - 快速响应，性价比高',
    },
    'claude-opus': {
      provider: 'anthropic' as const,
      model: 'claude-opus-4-5-20251101',
      type: 'text' as const,
      temperature: 0.7,
      maxTokens: 4096,
      description: 'Claude Opus 4.5 - 最强推理和创作能力',
    },
  },

  // Gemini 系列 - 视觉和规划
  google: {
    'gemini-pro-vision': {
      provider: 'google' as const,
      model: 'gemini-pro-vision',
      type: 'text' as const,
      temperature: 0.7,
      maxTokens: 4096,
      description: 'Gemini Pro Vision - 支持视觉理解',
    },
  },

  // SiliconFlow 系列 - 高性能多模态模型
  siliconflow: {
    'qwen-max': {
      provider: 'siliconflow' as const,
      model: 'Qwen/Qwen2.5-7B-Instruct',
      type: 'text' as const,
      temperature: 0.7,
      maxTokens: 4096,
      description: 'Qwen2.5 7B - 高性能中文模型',
    },
    'deepseek-chat': {
      provider: 'siliconflow' as const,
      model: 'deepseek-ai/DeepSeek-V2.5',
      type: 'text' as const,
      temperature: 0.7,
      maxTokens: 4096,
      description: 'DeepSeek V2.5 - 深度推理模型',
    },
    'glm-4-pro': {
      provider: 'siliconflow' as const,
      model: 'Pro/zai-org/GLM-4.7',
      type: 'text' as const,
      temperature: 0.7,
      maxTokens: 4096,
      description: 'GLM-4.7 Pro - 智谱AI大模型专业版',
    },
    'glm-4-vision': {
      provider: 'siliconflow' as const,
      model: 'zai-org/GLM-4.6V',
      type: 'text' as const,
      temperature: 0.7,
      maxTokens: 4096,
      description: 'GLM-4.6V - 支持视觉理解的多模态模型',
    },
    'minimax-m2': {
      provider: 'siliconflow' as const,
      model: 'MiniMaxAI/MiniMax-M2',
      type: 'text' as const,
      temperature: 0.7,
      maxTokens: 4096,
      description: 'MiniMax-M2 - MiniMax最新语言模型',
    },
    'minimax-m1': {
      provider: 'siliconflow' as const,
      model: 'MiniMaxAI/MiniMax-M1-80k',
      type: 'text' as const,
      temperature: 0.7,
      maxTokens: 80000,
      description: 'MiniMax-M1-80k - 超长上下文语言模型',
    },
    'qwen3-vl-32b': {
      provider: 'siliconflow' as const,
      model: 'Qwen/Qwen3-VL-32B-Instruct',
      type: 'text' as const,
      temperature: 0.7,
      maxTokens: 4096,
      description: 'Qwen3-VL-32B - 多模态视觉语言模型',
    },
    'qwen3-vl-thinking': {
      provider: 'siliconflow' as const,
      model: 'Qwen/Qwen3-VL-32B-Thinking',
      type: 'text' as const,
      temperature: 0.7,
      maxTokens: 4096,
      description: 'Qwen3-VL-Thinking - 深度思考多模态模型',
    },
    'qwen3-vl-a3b': {
      provider: 'siliconflow' as const,
      model: 'Qwen/Qwen3-VL-30B-A3B-Instruct',
      type: 'text' as const,
      temperature: 0.7,
      maxTokens: 4096,
      description: 'Qwen3-VL-A3B - 高效多模态理解模型',
    },
    'telespeech-asr': {
      provider: 'siliconflow' as const,
      model: 'TeleAI/TeleSpeechASR',
      type: 'speech' as const,
      description: 'TeleSpeech ASR - 高精度语音识别模型',
    },
    'flux-schnell': {
      provider: 'siliconflow' as const,
      model: 'black-forest-labs/FLUX.1-schnell',
      type: 'image' as const,
      description: 'FLUX.1 Schnell - 快速图像生成',
    },
    'stable-diffusion': {
      provider: 'siliconflow' as const,
      model: 'stabilityai/stable-diffusion-3-5-large',
      type: 'image' as const,
      description: 'Stable Diffusion 3.5 Large - 高质量图像生成',
    },
  },

  // 豆包系列 - 火山方舟大模型（与即梦共用AKSK）
  doubao: {
    'doubao-1.5-pro': {
      provider: 'doubao' as const,
      model: 'doubao-1-5-pro-256k-250115',
      type: 'text' as const,
      temperature: 0.7,
      maxTokens: 4096,
      description: '豆包 1.5 Pro - 最新旗舰模型，256K上下文',
    },
    'doubao-1.5-lite': {
      provider: 'doubao' as const,
      model: 'doubao-1-5-lite-32k-250115',
      type: 'text' as const,
      temperature: 0.7,
      maxTokens: 4096,
      description: '豆包 1.5 Lite - 轻量快速模型',
    },
    'doubao-seed-1.6': {
      provider: 'doubao' as const,
      model: 'doubao-seed-1-6-thinking-250428',
      type: 'text' as const,
      temperature: 0.7,
      maxTokens: 4096,
      description: '豆包 Seed 1.6 - 深度思考模型',
    },
    'doubao-vision': {
      provider: 'doubao' as const,
      model: 'doubao-1-5-vision-pro-250328',
      type: 'vision' as const,
      temperature: 0.7,
      maxTokens: 4096,
      description: '豆包 Vision - 多模态视觉理解',
    },
  },

  // 图像生成模型
  image: {
    'gpt-image': {
      provider: 'image' as const,
      model: 'gpt-image-1.5',
      type: 'image' as const,
      description: 'GPT Image 1.5 - AI 图像生成',
    },
    'nano-banana': {
      provider: 'image' as const,
      model: 'nano-banana-pro',
      type: 'image' as const,
      description: 'Nano Banana Pro - 创意图像生成',
    },
    'jimeng': {
      provider: 'image' as const,
      model: 'jimeng-2.1',
      type: 'image' as const,
      description: '即梦 2.1 - 火山引擎图像生成',
    },
  },
}

/**
 * 每个技能的模型配置
 * 预设技能和扩展技能的模型配置都在这里
 */
export const SKILL_MODEL_CONFIG: Record<string, SkillModelMapping> = {
  // =========== 预设技能 ===========
  // 朋友圈文案 - Claude Opus 创作 + SiliconFlow 视觉理解
  'moments-copywriter': {
    text: {
      ...AVAILABLE_MODELS.anthropic['claude-opus'],
      temperature: 0.8, // 提高创意性
    },
    vision: {
      ...AVAILABLE_MODELS.siliconflow['qwen3-vl-a3b'],
      type: 'vision' as const,
      temperature: 0.5,
    },
  },

  // 视频文案改写 - Claude Opus 创作
  'video-rewriter': {
    text: {
      ...AVAILABLE_MODELS.anthropic['claude-opus'],
      temperature: 0.5,
    },
  },

  // 爆款拆解 - Claude Opus 分析
  'viral-analyzer': {
    text: {
      ...AVAILABLE_MODELS.anthropic['claude-opus'],
      temperature: 0.3, // 客观分析
    },
  },

  // 会议语音转文字 - Claude Haiku
  'meeting-transcriber': {
    text: {
      ...AVAILABLE_MODELS.anthropic['claude-haiku'],
      temperature: 0.2,
    },
  },

  // 知识库查询 - Claude Haiku
  'knowledge-query': {
    text: {
      ...AVAILABLE_MODELS.anthropic['claude-haiku'],
      temperature: 0.1, // 最大准确性
    },
  },

  // 官方通知 - Claude Haiku
  'official-notice': {
    text: {
      ...AVAILABLE_MODELS.anthropic['claude-haiku'],
      temperature: 0.2, // 严谨正式
    },
  },

  // 小红书笔记 - Claude Opus 创作
  'xiaohongshu': {
    text: {
      ...AVAILABLE_MODELS.anthropic['claude-opus'],
      temperature: 0.8, // 高创意性
    },
  },

  // 活动策划 - Claude Opus 策划
  'campaign-planner': {
    text: {
      ...AVAILABLE_MODELS.anthropic['claude-opus'],
      temperature: 0.7,
    },
  },

  // 海报文案 - Claude Opus + 即梦图像生成
  'poster-creator': {
    text: {
      ...AVAILABLE_MODELS.anthropic['claude-opus'],
      temperature: 0.6,
    },
    image: AVAILABLE_MODELS.image['jimeng'],
  },

  // 数据分析 - Claude Opus 分析
  'data-analyst': {
    text: {
      ...AVAILABLE_MODELS.anthropic['claude-opus'],
      temperature: 0.3, // 客观分析
    },
  },

  // AI 选片修片 - Claude + SiliconFlow Vision 分析 + 即梦图像生成
  'photo-selector': {
    text: {
      ...AVAILABLE_MODELS.anthropic['claude-opus'],
      temperature: 0.3,
    },
    vision: {
      ...AVAILABLE_MODELS.siliconflow['qwen3-vl-a3b'],
      type: 'vision' as const,
      temperature: 0.3,
    },
    image: AVAILABLE_MODELS.image['jimeng'],
  },

  // =========== 扩展技能 ===========
  // 计划制定 - Gemini Vision
  'plan-maker': {
    text: {
      ...AVAILABLE_MODELS.google['gemini-pro-vision'],
      temperature: 0.7,
    },
  },

  // 创意头脑风暴 - Claude Opus
  'brainstorm': {
    text: {
      ...AVAILABLE_MODELS.anthropic['claude-opus'],
      temperature: 0.9, // 高创意
    },
  },

  // 视频脚本生成 - Claude Opus
  'video-script': {
    text: {
      ...AVAILABLE_MODELS.anthropic['claude-opus'],
      temperature: 0.7,
    },
  },

  // 使用 SiliconFlow 的技能示例
  // 知识问答 - Qwen2.5 (中文优化)
  'qa-assistant': {
    text: {
      ...AVAILABLE_MODELS.siliconflow['qwen-max'],
      temperature: 0.3,
    },
  },

  // 代码助手 - DeepSeek V2.5 (代码优化)
  'code-assistant': {
    text: {
      ...AVAILABLE_MODELS.siliconflow['deepseek-chat'],
      temperature: 0.2,
    },
  },

  // AI 绘画 - FLUX.1 Schnell (快速图像生成)
  'ai-painting': {
    text: {
      ...AVAILABLE_MODELS.siliconflow['qwen-max'],
      temperature: 0.6,
    },
    image: AVAILABLE_MODELS.siliconflow['flux-schnell'],
  },

  // 高质量海报 - Stable Diffusion 3.5
  'hq-poster': {
    text: {
      ...AVAILABLE_MODELS.siliconflow['qwen-max'],
      temperature: 0.5,
    },
    image: AVAILABLE_MODELS.siliconflow['stable-diffusion'],
  },
}

// 动态模型配置(从数据库或 localStorage 加载)
let dynamicModelConfig: Record<string, SkillModelMapping> = {}

/**
 * 加载动态模型配置
 * 优先级: 数据库 > localStorage > 默认配置
 */
export async function loadDynamicModelConfig(): Promise<void> {
  try {
    // 尝试从 localStorage 加载
    if (typeof window !== 'undefined') {
      const savedConfig = localStorage.getItem('model_configs')
      if (savedConfig) {
        dynamicModelConfig = JSON.parse(savedConfig)
      }
    }

    // 尝试从数据库加载(服务器端)
    if (typeof window === 'undefined') {
      const { supabase } = await import('@/lib/supabase')
      const { data } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'model_configs')
        .single()

      if (data?.value) {
        dynamicModelConfig = data.value as Record<string, SkillModelMapping>
      }
    }
  } catch (error) {
    logger.error('Failed to load dynamic model config', error)
  }
}

// 获取技能的模型配置
export function getSkillModelConfig(skillId: string): SkillModelMapping {
  // 优先使用动态配置
  if (dynamicModelConfig[skillId]) {
    return dynamicModelConfig[skillId]
  }

  // 使用默认配置
  return SKILL_MODEL_CONFIG[skillId] || {
    // 默认配置：Claude Haiku
    text: AVAILABLE_MODELS.anthropic['claude-haiku'],
  }
}

// 获取指定类型的模型
export function getModelForType(skillId: string, type: ModelType): ModelConfig | undefined {
  const config = getSkillModelConfig(skillId)
  switch (type) {
    case 'text':
      return config.text
    case 'image':
      return config.image
    case 'video':
      return config.video
    case 'speech':
      return config.speech
    case 'vision':
      return config.vision
    default:
      return config.text
  }
}

// 统一 API 端点
// 所有模型通过这个端点访问
export const UNIFIED_API_ENDPOINT = 'https://api4.mygptlife.com/v1'

// 检查是否配置了统一 API
export function isAPIConfigured(): boolean {
  return Boolean(process.env.UNIFIED_API_KEY)
}

/**
 * 根据模型 ID 获取模型配置
 * 用于支持前端模型选择器覆盖默认模型
 */
export function getModelConfigById(modelId: string): ModelConfig | null {
  // 遍历所有提供商的模型
  for (const provider of Object.values(AVAILABLE_MODELS)) {
    for (const config of Object.values(provider)) {
      if (config.model === modelId) {
        return config as ModelConfig
      }
    }
  }
  return null
}
