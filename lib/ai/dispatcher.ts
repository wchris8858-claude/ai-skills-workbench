/**
 * AI 模型调度器 - 根据技能自动选择合适的模型
 * 支持多个 API 端点:
 * - 统一 API: https://api4.mygptlife.com/v1
 * - SiliconFlow API: https://api.siliconflow.cn/v1
 *
 * v2.0 更新:
 * - 支持多级模型选择 (high/medium/low)
 * - 自动降级策略
 * - RAG 知识检索集成
 */

import { callTextModel, callImageModel, callVisionModel } from './unified-client'
import { callSiliconFlowText, callSiliconFlowImage, callSiliconFlowVision, type SiliconFlowMessage } from './siliconflow-client'
import { getSkillModelConfig, getModelConfigById, type ModelProvider, type ModelConfig } from '../models/config'
import { logger } from '../logger'
import {
  getModelForFeature,
  getModelWithFallbacks,
  getSystemPrompt,
  isProviderConfigured,
  API_KEYS,
  type ModelLevel,
} from './config'
import { retrieveKnowledge } from './rag'

export interface AIRequest {
  skillId: string
  message: string
  systemPrompt?: string
  attachments?: {
    type: 'image'
    url: string
    base64?: string
  }[]
  modelOverride?: string // 前端指定的模型，覆盖默认配置
  // 对话历史，用于多轮对话上下文记忆
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>
  // v2.0 新增字段
  feature?: string       // 功能标识，用于模型选择
  shopId?: string        // 店铺 ID，用于知识检索
  shopContext?: string   // 店铺上下文信息
  knowledgeQuery?: string // 知识检索查询
}

export interface AIResponse {
  content: string
  model: string
  provider: ModelProvider
  tokenCount?: number
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}

/**
 * 调度 AI 请求到合适的模型
 * 根据提供商自动选择合适的 API 端点
 *
 * 特殊处理：
 * - 如果技能配置了 vision 模型且有图片附件，先用视觉模型分析图片
 * - 将分析结果与用户输入结合后再调用文本模型
 */
export async function dispatchAI(request: AIRequest): Promise<AIResponse> {
  const skillModelConfig = getSkillModelConfig(request.skillId)
  const visionModel = skillModelConfig.vision

  // 支持前端模型覆盖：如果提供了 modelOverride，尝试使用它
  let textModel: ModelConfig = skillModelConfig.text
  let usingOverride = false

  if (request.modelOverride) {
    const overrideConfig = getModelConfigById(request.modelOverride)
    if (overrideConfig && overrideConfig.type === 'text') {
      textModel = overrideConfig
      usingOverride = true
      logger.debug('[AI Dispatch] 使用前端指定的模型', { model: request.modelOverride })
    } else {
      logger.debug('[AI Dispatch] 前端指定的模型无效或不是文本模型，使用默认配置', { model: request.modelOverride })
    }
  }

  const provider = textModel.provider
  const model = textModel.model

  let userMessage = request.message

  // 调试：打印配置信息
  logger.debug('[AI Dispatch] Config', {
    skillId: request.skillId,
    modelOverride: request.modelOverride,
    usingOverride,
    actualModel: model,
    hasAttachments: !!(request.attachments && request.attachments.length > 0),
    attachmentsCount: request.attachments?.length || 0,
    hasVisionModel: !!visionModel,
    visionModelName: visionModel?.model,
  })

  // 如果有图片附件且配置了视觉模型，先分析图片
  if (request.attachments && request.attachments.length > 0 && visionModel) {
    try {
      const imageAnalysis = await analyzeImagesWithVision(
        request.attachments,
        visionModel.provider,
        visionModel.model,
        visionModel.temperature,
        visionModel.maxTokens
      )

      // 将图片分析结果与用户输入结合
      userMessage = `【图片内容分析】\n${imageAnalysis}\n\n【用户描述】\n${request.message}`

      logger.debug('[AI Dispatch] 图片分析完成，结合用户输入生成文案')
    } catch (error) {
      // 详细记录错误信息
      logger.error('[AI Dispatch] 图片分析失败', {
        error: error instanceof Error ? error.message : String(error),
        skillId: request.skillId,
        visionModel: visionModel?.model,
        visionProvider: visionModel?.provider,
        imageCount: request.attachments?.length,
      })
      // 分析失败时继续使用原始消息，但在响应中提示用户
      userMessage = `${request.message}\n\n[系统提示：图片分析暂时不可用，已跳过图片分析步骤]`
    }
  }

  // 构建消息 - 使用明确的角色类型
  type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string }
  const messages: ChatMessage[] = []

  // 添加系统提示（如果有）
  if (request.systemPrompt) {
    messages.push({
      role: 'system',
      content: request.systemPrompt,
    })
  }

  // 添加对话历史（如果有），用于多轮对话上下文记忆
  if (request.conversationHistory && request.conversationHistory.length > 0) {
    logger.debug('[AI Dispatch] 添加对话历史', { historyLength: request.conversationHistory.length })
    for (const msg of request.conversationHistory) {
      messages.push({
        role: msg.role,
        content: msg.content,
      })
    }
  }

  // 添加用户消息（可能包含图片分析结果）
  messages.push({
    role: 'user',
    content: userMessage,
  })

  try {
    let content: string

    // 根据提供商选择合适的客户端
    if (provider === 'siliconflow') {
      // 使用 SiliconFlow API
      content = await callSiliconFlowText(
        model,
        messages,
        textModel.temperature,
        textModel.maxTokens
      )
    } else {
      // 使用统一 API (Anthropic, Google 等)
      content = await callTextModel(
        model,
        messages,
        textModel.temperature,
        textModel.maxTokens
      )
    }

    return {
      content,
      model,
      provider,
    }
  } catch (error) {
    logger.error(`AI dispatch failed for model ${model}`, error)
    throw error
  }
}

/**
 * 使用视觉模型分析图片
 * 返回图片内容的详细描述
 */
async function analyzeImagesWithVision(
  attachments: NonNullable<AIRequest['attachments']>,
  provider: ModelProvider,
  model: string,
  temperature?: number,
  maxTokens?: number
): Promise<string> {
  const images = attachments
    .filter(att => att.type === 'image')
    .map(att => ({ url: att.url, base64: att.base64 }))

  if (images.length === 0) {
    throw new Error('No images to analyze')
  }

  const analysisPrompt = `请仔细分析这${images.length > 1 ? '些' : '张'}图片，描述以下内容：

1. **场景/环境**：图片拍摄的地点、氛围
2. **主体内容**：图片中的主要人物、物品、活动
3. **情绪氛围**：图片传达的情感、氛围
4. **视觉亮点**：色彩、构图、光线等特点
5. **适合的文案方向**：基于图片内容，建议的朋友圈文案风格和主题

请用简洁的中文回答，为后续生成朋友圈文案提供参考。`

  logger.debug(`[Vision] 开始分析 ${images.length} 张图片`, {
    model,
    provider,
    images: images.map((img, i) => ({
      index: i,
      hasUrl: !!img.url,
      hasBase64: !!img.base64,
    }))
  })

  try {
    let result: string
    if (provider === 'siliconflow') {
      result = await callSiliconFlowVision(
        model,
        analysisPrompt,
        images,
        temperature,
        maxTokens
      )
    } else {
      result = await callVisionModel(
        model,
        analysisPrompt,
        images,
        temperature,
        maxTokens
      )
    }
    logger.debug(`[Vision] 分析成功`, { resultLength: result.length })
    return result
  } catch (error) {
    logger.error('[Vision] 分析失败', error)
    throw error
  }
}

/**
 * 生成图片（用于海报制作等）
 * 根据提供商选择合适的图像生成 API
 */
export async function generateImage(
  skillId: string,
  prompt: string
): Promise<string[]> {
  const modelConfig = getSkillModelConfig(skillId)
  const imageModel = modelConfig.image

  if (!imageModel) {
    throw new Error(`No image model configured for skill: ${skillId}`)
  }

  try {
    // 根据提供商选择合适的客户端
    if (imageModel.provider === 'siliconflow') {
      // 使用 SiliconFlow API
      return await callSiliconFlowImage(imageModel.model, prompt)
    } else {
      // 使用统一 API
      return await callImageModel(imageModel.model, prompt)
    }
  } catch (error) {
    logger.error(`Image generation failed for model ${imageModel.model}`, error)
    throw error
  }
}

// ============================================
// v2.0 新增功能
// ============================================

/**
 * v2.0 调度器 - 支持功能级别的模型选择和自动降级
 * 与原有 dispatchAI 兼容，通过 feature 参数启用新功能
 */
export async function dispatchV2(request: AIRequest): Promise<AIResponse> {
  // 如果没有 feature，使用原有逻辑
  if (!request.feature) {
    return dispatchAI(request)
  }

  const { feature, message, shopId, shopContext, knowledgeQuery } = request

  logger.info('[AI Dispatcher v2] Starting request', { feature, shopId })

  // 获取功能对应的系统提示词
  let systemPrompt = request.systemPrompt || getSystemPrompt(feature, shopContext)

  // 如果需要知识检索
  if (knowledgeQuery && shopId) {
    try {
      const knowledgeResult = await retrieveKnowledge(shopId, knowledgeQuery, { topK: 5 })
      if (knowledgeResult.context) {
        systemPrompt += '\n\n# 相关知识参考\n' + knowledgeResult.context
        logger.info('[AI Dispatcher v2] Added knowledge context', {
          sourceCount: knowledgeResult.sources.length
        })
      }
    } catch (error) {
      logger.warn('[AI Dispatcher v2] Knowledge search failed', { error })
    }
  }

  // 获取模型配置（含降级链）
  const models = getModelWithFallbacks(feature)

  // 尝试每个模型
  let lastError: Error | null = null

  for (const modelConfig of models) {
    // 跳过未配置的提供商
    if (!isProviderConfigured(modelConfig.provider)) {
      logger.warn('[AI Dispatcher v2] Provider not configured, skipping', {
        provider: modelConfig.provider
      })
      continue
    }

    try {
      logger.info('[AI Dispatcher v2] Trying model', {
        provider: modelConfig.provider,
        model: modelConfig.model
      })

      // 构建消息 - 使用明确的角色类型
      type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string }
      const messages: ChatMessage[] = []
      if (systemPrompt) {
        messages.push({ role: 'system', content: systemPrompt })
      }
      messages.push({ role: 'user', content: message })

      let content: string

      // 根据提供商调用对应的 API
      if (modelConfig.provider === 'siliconflow') {
        content = await callSiliconFlowText(modelConfig.model, messages)
      } else {
        content = await callTextModel(modelConfig.model, messages)
      }

      logger.info('[AI Dispatcher v2] Success', {
        provider: modelConfig.provider,
        model: modelConfig.model,
      })

      return {
        content,
        model: modelConfig.model,
        provider: modelConfig.provider as ModelProvider,
      }
    } catch (error) {
      lastError = error as Error
      logger.error('[AI Dispatcher v2] Model failed, trying fallback', {
        provider: modelConfig.provider,
        model: modelConfig.model,
        error: lastError.message,
      })
    }
  }

  // 所有模型都失败，回退到原有逻辑
  logger.warn('[AI Dispatcher v2] All v2 models failed, falling back to legacy')
  return dispatchAI(request)
}

/**
 * 生成向量嵌入
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  logger.info('[AI Dispatcher] Embedding request', { textLength: text.length })

  const apiKey = API_KEYS.tongyi || API_KEYS.unified.key

  // 使用通义的 embedding API
  if (API_KEYS.tongyi) {
    const response = await fetch(
      'https://dashscope.aliyuncs.com/api/v1/services/embeddings/text-embedding/text-embedding',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'text-embedding-v3',
          input: {
            texts: [text],
          },
          parameters: {
            dimension: 1024,
          },
        }),
      }
    )

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Embedding API error: ${response.status} - ${error}`)
    }

    const data = await response.json()
    return data.output?.embeddings?.[0]?.embedding || []
  }

  // 使用统一 API 的 embedding
  const response = await fetch(`${API_KEYS.unified.endpoint}/embeddings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'text-embedding-ada-002',
      input: text,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Embedding API error: ${response.status} - ${error}`)
  }

  const data = await response.json()
  return data.data?.[0]?.embedding || []
}
