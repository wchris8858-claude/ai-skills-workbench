/**
 * 统一 API 客户端
 * 使用单一 API 端点访问多个模型
 *
 * API 端点: https://api4.mygptlife.com/v1
 * 支持的模型:
 * - claude-haiku-4-5-20251001
 * - claude-opus-4-5-20251101
 * - gemini-pro-vision
 * - gpt-image-1.5
 * - nano-banana-pro
 */

export interface UnifiedAPIRequest {
  model: string
  messages: Array<{
    role: 'system' | 'user' | 'assistant'
    content: string | any[]
  }>
  temperature?: number
  max_tokens?: number
}

export interface UnifiedAPIResponse {
  content: string
  model: string
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

/**
 * 调用统一 API 端点
 */
export async function callUnifiedAPI(
  request: UnifiedAPIRequest
): Promise<UnifiedAPIResponse> {
  const apiKey = process.env.UNIFIED_API_KEY
  const endpoint = process.env.UNIFIED_API_ENDPOINT || 'https://api4.mygptlife.com/v1'

  if (!apiKey) {
    throw new Error('UNIFIED_API_KEY is not configured')
  }

  try {
    const response = await fetch(`${endpoint}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: request.model,
        messages: request.messages,
        temperature: request.temperature ?? 0.7,
        max_tokens: request.max_tokens ?? 4096,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Unified API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()

    // 提取响应内容
    let content = ''
    if (data.choices && data.choices.length > 0) {
      const firstChoice = data.choices[0]
      content = firstChoice.message?.content || firstChoice.text || ''
    }

    return {
      content,
      model: data.model || request.model,
      usage: data.usage,
    }
  } catch (error) {
    console.error('Unified API call failed:', error)
    throw error
  }
}

/**
 * 调用文本生成模型
 */
export async function callTextModel(
  model: string,
  messages: Array<{ role: string; content: string }>,
  temperature?: number,
  maxTokens?: number
): Promise<string> {
  const response = await callUnifiedAPI({
    model,
    messages: messages as any,
    temperature,
    max_tokens: maxTokens,
  })

  return response.content
}

/**
 * 调用视觉模型分析图片
 * 支持 OpenAI 兼容的多模态 API 格式
 */
export async function callVisionModel(
  model: string,
  prompt: string,
  images: Array<{ url?: string; base64?: string }>,
  temperature?: number,
  maxTokens?: number
): Promise<string> {
  const apiKey = process.env.UNIFIED_API_KEY
  const endpoint = process.env.UNIFIED_API_ENDPOINT || 'https://api4.mygptlife.com/v1'

  if (!apiKey) {
    throw new Error('UNIFIED_API_KEY is not configured')
  }

  // 构建多模态消息内容
  const contentParts: any[] = [
    { type: 'text', text: prompt }
  ]

  // 添加图片
  for (const image of images) {
    let imageUrl: string | undefined

    if (image.base64) {
      // 检查 base64 是否已经包含 data URL 前缀
      if (image.base64.startsWith('data:')) {
        imageUrl = image.base64
      } else {
        imageUrl = `data:image/jpeg;base64,${image.base64}`
      }
    } else if (image.url) {
      imageUrl = image.url
    }

    if (imageUrl) {
      contentParts.push({
        type: 'image_url',
        image_url: {
          url: imageUrl
        }
      })
    }
  }

  try {
    const response = await fetch(`${endpoint}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'user',
            content: contentParts
          }
        ],
        temperature: temperature ?? 0.7,
        max_tokens: maxTokens ?? 4096,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Vision API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()

    // 提取响应内容
    let content = ''
    if (data.choices && data.choices.length > 0) {
      const firstChoice = data.choices[0]
      content = firstChoice.message?.content || firstChoice.text || ''
    }

    return content
  } catch (error) {
    console.error('Vision API call failed:', error)
    throw error
  }
}

/**
 * 调用图像生成模型
 */
export async function callImageModel(
  model: string,
  prompt: string
): Promise<string[]> {
  const apiKey = process.env.UNIFIED_API_KEY
  const endpoint = process.env.UNIFIED_API_ENDPOINT || 'https://api4.mygptlife.com/v1'

  if (!apiKey) {
    throw new Error('UNIFIED_API_KEY is not configured')
  }

  try {
    const response = await fetch(`${endpoint}/images/generations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        prompt,
        n: 1, // 生成1张图片
        size: '1024x1024', // 默认尺寸
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Image generation error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()

    // 提取图片 URL
    const imageUrls: string[] = []
    if (data.data && Array.isArray(data.data)) {
      for (const item of data.data) {
        if (item.url) {
          imageUrls.push(item.url)
        }
      }
    }

    return imageUrls
  } catch (error) {
    console.error('Image generation failed:', error)
    throw error
  }
}
