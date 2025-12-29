/**
 * AI 模型调度器 - 根据技能自动选择合适的模型
 * 支持多个 API 端点:
 * - 统一 API: https://api4.mygptlife.com/v1
 * - SiliconFlow API: https://api.siliconflow.cn/v1
 */

import { callTextModel, callImageModel, callVisionModel } from './unified-client'
import { callSiliconFlowText, callSiliconFlowImage, callSiliconFlowVision } from './siliconflow-client'
import { getSkillModelConfig, type ModelProvider } from '../models/config'

export interface AIRequest {
  skillId: string
  message: string
  systemPrompt?: string
  attachments?: {
    type: 'image'
    url: string
    base64?: string
  }[]
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
  const modelConfig = getSkillModelConfig(request.skillId)
  const textModel = modelConfig.text
  const visionModel = modelConfig.vision

  const provider = textModel.provider
  const model = textModel.model

  let userMessage = request.message

  // 调试：打印配置信息
  console.log('[AI Dispatch] Config:', {
    skillId: request.skillId,
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
      console.error('[AI Dispatch] 图片分析失败，继续使用原始输入:', error)
      // 分析失败时继续使用原始消息
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

  console.log(`[Vision] 开始分析 ${images.length} 张图片，使用模型: ${model}`)

  if (provider === 'siliconflow') {
    return await callSiliconFlowVision(
      model,
      analysisPrompt,
      images,
      temperature,
      maxTokens
    )
  } else {
    return await callVisionModel(
      model,
      analysisPrompt,
      images,
      temperature,
      maxTokens
    )
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
