/**
 * AI 模型调度器 - 根据技能自动选择合适的模型
 * 支持多个 API 端点:
 * - 统一 API: https://api4.mygptlife.com/v1
 * - SiliconFlow API: https://api.siliconflow.cn/v1
 */

import { callTextModel, callImageModel, callVisionModel } from './unified-client'
import { callSiliconFlowText, callSiliconFlowImage, callSiliconFlowVision } from './siliconflow-client'
import { getSkillModelConfig, getModelConfigById, type ModelProvider, type ModelConfig } from '../models/config'

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
}

export interface AIResponse {
  content: string
  model: string
  provider: ModelProvider
  tokenCount?: number
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
      console.log('[AI Dispatch] 使用前端指定的模型:', request.modelOverride)
    } else {
      console.log('[AI Dispatch] 前端指定的模型无效或不是文本模型，使用默认配置:', request.modelOverride)
    }
  }

  const provider = textModel.provider
  const model = textModel.model

  let userMessage = request.message

  // 调试：打印配置信息
  console.log('[AI Dispatch] Config:', {
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

      console.log('[AI Dispatch] 图片分析完成，结合用户输入生成文案')
    } catch (error) {
      // 详细记录错误信息
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error('[AI Dispatch] 图片分析失败:', {
        error: errorMessage,
        skillId: request.skillId,
        visionModel: visionModel?.model,
        visionProvider: visionModel?.provider,
        imageCount: request.attachments?.length,
      })
      // 分析失败时继续使用原始消息，但在响应中提示用户
      userMessage = `${request.message}\n\n[系统提示：图片分析暂时不可用，已跳过图片分析步骤]`
    }
  }

  // 构建消息
  const messages: Array<{ role: string; content: string }> = []

  // 添加系统提示（如果有）
  if (request.systemPrompt) {
    messages.push({
      role: 'system',
      content: request.systemPrompt,
    })
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
        messages as any,
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
    console.error(`AI dispatch failed for model ${model}:`, error)
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

  console.log(`[Vision] 开始分析 ${images.length} 张图片，使用模型: ${model}, provider: ${provider}`)
  console.log(`[Vision] 图片详情:`, images.map((img, i) => ({
    index: i,
    hasUrl: !!img.url,
    urlPrefix: img.url?.substring(0, 80),
    hasBase64: !!img.base64,
    base64Prefix: img.base64?.substring(0, 50),
  })))

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
    console.log(`[Vision] 分析成功，结果长度: ${result.length}`)
    console.log(`[Vision] 分析结果预览: ${result.substring(0, 200)}...`)
    return result
  } catch (error) {
    console.error(`[Vision] 分析失败:`, error)
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
    console.error(`Image generation failed for model ${imageModel.model}:`, error)
    throw error
  }
}
