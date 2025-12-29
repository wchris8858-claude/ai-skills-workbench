/**
 * 图像生成客户端
 *
 * 支持：
 * - 即梦 (Jimeng) - 字节跳动的图像生成
 * - Nano Banana - 创意图像生成
 */

// 即梦配置
const JIMENG_API_KEY = process.env.JIMENG_API_KEY || ''
const JIMENG_API_BASE = process.env.JIMENG_API_BASE || 'https://api.jimeng.ai/v1'

// Nano Banana 配置
const NANOBANANA_API_KEY = process.env.NANOBANANA_API_KEY || ''
const NANOBANANA_API_BASE = process.env.NANOBANANA_API_BASE || 'https://api.nanobanana.com/v1'

// 检查配置
export const isJimengConfigured = Boolean(JIMENG_API_KEY)
export const isNanoBananaConfigured = Boolean(NANOBANANA_API_KEY)

// 图像生成请求
interface ImageGenerationRequest {
  prompt: string
  negativePrompt?: string
  width?: number
  height?: number
  style?: string
  count?: number
}

// 图像生成结果
interface ImageGenerationResult {
  success: boolean
  images: string[] // Base64 或 URL
  error?: string
}

/**
 * 使用即梦生成图像
 */
export async function generateWithJimeng(
  request: ImageGenerationRequest
): Promise<ImageGenerationResult> {
  if (!isJimengConfigured) {
    return {
      success: false,
      images: [],
      error: '即梦 API 未配置，请设置 JIMENG_API_KEY 环境变量',
    }
  }

  const {
    prompt,
    negativePrompt = '',
    width = 1024,
    height = 1024,
    style = 'general',
    count = 1,
  } = request

  try {
    const response = await fetch(`${JIMENG_API_BASE}/images/generations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${JIMENG_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'jimeng-2.1-pro',
        prompt,
        negative_prompt: negativePrompt,
        width,
        height,
        style,
        n: count,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error?.message || `HTTP ${response.status}`)
    }

    const data = await response.json() as {
      data?: Array<{ url?: string; b64_json?: string }>
    }

    return {
      success: true,
      images: data.data?.map((img) => img.url || img.b64_json || '') || [],
    }
  } catch (error) {
    console.error('Jimeng API error:', error)
    return {
      success: false,
      images: [],
      error: error instanceof Error ? error.message : '即梦图像生成失败',
    }
  }
}

/**
 * 使用 Nano Banana 生成图像
 */
export async function generateWithNanoBanana(
  request: ImageGenerationRequest
): Promise<ImageGenerationResult> {
  if (!isNanoBananaConfigured) {
    return {
      success: false,
      images: [],
      error: 'Nano Banana API 未配置，请设置 NANOBANANA_API_KEY 环境变量',
    }
  }

  const {
    prompt,
    negativePrompt = '',
    width = 1024,
    height = 1024,
    style = 'creative',
    count = 1,
  } = request

  try {
    const response = await fetch(`${NANOBANANA_API_BASE}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': NANOBANANA_API_KEY,
      },
      body: JSON.stringify({
        prompt,
        negative_prompt: negativePrompt,
        width,
        height,
        style,
        num_images: count,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || `HTTP ${response.status}`)
    }

    const data = await response.json()

    return {
      success: true,
      images: data.images || [],
    }
  } catch (error) {
    console.error('Nano Banana API error:', error)
    return {
      success: false,
      images: [],
      error: error instanceof Error ? error.message : 'Nano Banana 图像生成失败',
    }
  }
}

/**
 * 统一的图像生成接口
 * 优先使用即梦，降级到 Nano Banana
 */
export async function generateImage(
  request: ImageGenerationRequest
): Promise<ImageGenerationResult> {
  // 优先使用即梦
  if (isJimengConfigured) {
    const result = await generateWithJimeng(request)
    if (result.success) {
      return result
    }
  }

  // 降级到 Nano Banana
  if (isNanoBananaConfigured) {
    return generateWithNanoBanana(request)
  }

  return {
    success: false,
    images: [],
    error: '未配置任何图像生成服务，请设置 JIMENG_API_KEY 或 NANOBANANA_API_KEY',
  }
}

/**
 * 为海报生成优化的提示词
 */
export function optimizePosterPrompt(
  description: string,
  style?: string
): string {
  const stylePrompts: Record<string, string> = {
    modern: 'modern minimalist design, clean layout, professional',
    vintage: 'vintage retro style, classic typography, warm colors',
    tech: 'futuristic tech style, neon colors, digital aesthetic',
    natural: 'organic natural style, earthy colors, botanical elements',
    artistic: 'artistic creative style, bold colors, unique composition',
  }

  const basePrompt = `professional poster design, high quality, ${description}`
  const styleAddition = style && stylePrompts[style] ? `, ${stylePrompts[style]}` : ''

  return basePrompt + styleAddition
}

/**
 * 海报尺寸预设
 */
export const POSTER_SIZES = {
  instagram: { width: 1080, height: 1080 },
  instagramStory: { width: 1080, height: 1920 },
  wechatMoments: { width: 1080, height: 1440 },
  a4Portrait: { width: 2480, height: 3508 },
  a4Landscape: { width: 3508, height: 2480 },
  banner: { width: 1920, height: 640 },
}
