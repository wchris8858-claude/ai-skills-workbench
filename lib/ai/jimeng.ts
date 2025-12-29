/**
 * 即梦（Jimeng）AI 图像生成客户端
 */

export interface JimengRequest {
  model: string
  prompt: string
  negative_prompt?: string
  width?: number
  height?: number
  num_images?: number
  guidance_scale?: number
  num_inference_steps?: number
}

export interface JimengResponse {
  images: {
    url: string
    width: number
    height: number
  }[]
  task_id: string
  status: string
}

export async function callJimeng(request: JimengRequest): Promise<string[]> {
  const apiKey = process.env.JIMENG_API_KEY

  if (!apiKey) {
    throw new Error('JIMENG_API_KEY is not configured')
  }

  const endpoint = process.env.JIMENG_ENDPOINT || 'https://api.jimeng.ai/v1'

  try {
    const response = await fetch(`${endpoint}/images/generations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: request.model,
        prompt: request.prompt,
        negative_prompt: request.negative_prompt || '',
        width: request.width || 1024,
        height: request.height || 1024,
        num_images: request.num_images || 1,
        guidance_scale: request.guidance_scale || 7.5,
        num_inference_steps: request.num_inference_steps || 50,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Jimeng API error: ${response.status} - ${error}`)
    }

    const data: JimengResponse = await response.json()

    if (!data.images || data.images.length === 0) {
      throw new Error('No images generated from Jimeng API')
    }

    return data.images.map(img => img.url)
  } catch (error) {
    console.error('Jimeng API call failed:', error)
    throw error
  }
}
