/**
 * SiliconFlow API 客户端
 * 文档: https://docs.siliconflow.cn
 *
 * 支持的功能:
 * - 文本生成 (Chat Completions)
 * - 图像生成 (Image Generation)
 * - 文本转语音 (Text-to-Speech)
 * - 语音转文本 (Speech-to-Text)
 * - 视频生成 (Video Generation)
 * - 多模态视觉 (Multimodal Vision)
 */

export interface SiliconFlowMessage {
  role: 'system' | 'user' | 'assistant'
  content: string | Array<{
    type: 'text' | 'image_url'
    text?: string
    image_url?: {
      url: string
    }
  }>
}

export interface SiliconFlowChatRequest {
  model: string
  messages: SiliconFlowMessage[]
  temperature?: number
  max_tokens?: number
  stream?: boolean
  response_format?: {
    type: 'json_object'
  }
}

export interface SiliconFlowChatResponse {
  id: string
  object: string
  created: number
  model: string
  choices: Array<{
    index: number
    message: {
      role: string
      content: string
    }
    finish_reason: string
  }>
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

export interface SiliconFlowImageRequest {
  model: string
  prompt: string
  negative_prompt?: string
  image_size?: '512x512' | '768x512' | '768x1024' | '1024x576' | '1024x1024' | '576x1024'
  batch_size?: number
  num_inference_steps?: number
  guidance_scale?: number
  seed?: number
}

export interface SiliconFlowImageResponse {
  images: Array<{
    url: string
    seed: number
  }>
  timings: {
    inference: number
  }
}

export interface SiliconFlowTTSRequest {
  model: string
  input: string
  voice: string // 通过 GET /v1/audio/voices 获取可用声音列表
  response_format?: 'mp3' | 'wav' | 'flac'
  speed?: number // 0.25 - 4.0
}

export interface SiliconFlowSTTRequest {
  model: string
  file: File | Blob
  language?: string
  response_format?: 'json' | 'text' | 'srt' | 'vtt'
}

/**
 * SiliconFlow API 客户端类
 */
export class SiliconFlowClient {
  private apiKey: string
  private baseURL: string

  constructor(apiKey?: string, baseURL?: string) {
    this.apiKey = apiKey || process.env.SILICONFLOW_API_KEY || ''
    this.baseURL = baseURL || process.env.SILICONFLOW_API_ENDPOINT || 'https://api.siliconflow.cn/v1'

    if (!this.apiKey) {
      throw new Error('SiliconFlow API key is not configured')
    }
  }

  /**
   * 文本生成 - Chat Completions
   * 文档: https://docs.siliconflow.cn/cn/api-reference/chat-completions/chat-completions
   */
  async chatCompletions(request: SiliconFlowChatRequest): Promise<SiliconFlowChatResponse> {
    const response = await fetch(`${this.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(request),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`SiliconFlow API error: ${response.status} - ${errorText}`)
    }

    return await response.json()
  }

  /**
   * 图像生成
   * 文档: https://docs.siliconflow.cn/cn/api-reference/images/images-generations
   */
  async generateImage(request: SiliconFlowImageRequest): Promise<SiliconFlowImageResponse> {
    const response = await fetch(`${this.baseURL}/images/generations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(request),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`SiliconFlow image generation error: ${response.status} - ${errorText}`)
    }

    return await response.json()
  }

  /**
   * 文本转语音
   * 文档: https://docs.siliconflow.cn/cn/api-reference/audio/create-speech
   */
  async textToSpeech(request: SiliconFlowTTSRequest): Promise<Blob> {
    const response = await fetch(`${this.baseURL}/audio/speech`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(request),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`SiliconFlow TTS error: ${response.status} - ${errorText}`)
    }

    return await response.blob()
  }

  /**
   * 语音转文本
   * 文档: https://docs.siliconflow.cn/cn/api-reference/audio/create-audio-transcriptions
   */
  async speechToText(request: SiliconFlowSTTRequest): Promise<any> {
    const formData = new FormData()
    formData.append('file', request.file)
    formData.append('model', request.model)

    if (request.language) {
      formData.append('language', request.language)
    }

    if (request.response_format) {
      formData.append('response_format', request.response_format)
    }

    const response = await fetch(`${this.baseURL}/audio/transcriptions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: formData,
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`SiliconFlow STT error: ${response.status} - ${errorText}`)
    }

    return await response.json()
  }

  /**
   * 获取可用的声音列表
   * 文档: https://docs.siliconflow.cn/cn/api-reference/audio/voice-list
   */
  async getVoiceList(): Promise<any> {
    const response = await fetch(`${this.baseURL}/audio/voices`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`SiliconFlow voice list error: ${response.status} - ${errorText}`)
    }

    return await response.json()
  }

  /**
   * 获取可用的模型列表
   * 文档: https://docs.siliconflow.cn/cn/api-reference/models/get-model-list
   */
  async getModelList(): Promise<any> {
    const response = await fetch(`${this.baseURL}/models`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`SiliconFlow model list error: ${response.status} - ${errorText}`)
    }

    return await response.json()
  }
}

/**
 * 辅助函数：调用文本生成模型
 */
export async function callSiliconFlowText(
  model: string,
  messages: SiliconFlowMessage[],
  temperature?: number,
  maxTokens?: number
): Promise<string> {
  const client = new SiliconFlowClient()

  const response = await client.chatCompletions({
    model,
    messages,
    temperature: temperature ?? 0.7,
    max_tokens: maxTokens ?? 4096,
  })

  if (response.choices && response.choices.length > 0) {
    return response.choices[0].message.content
  }

  throw new Error('No response from SiliconFlow API')
}

/**
 * 辅助函数：调用图像生成模型
 */
export async function callSiliconFlowImage(
  model: string,
  prompt: string,
  options?: {
    negativePrompt?: string
    imageSize?: SiliconFlowImageRequest['image_size']
    batchSize?: number
  }
): Promise<string[]> {
  const client = new SiliconFlowClient()

  const response = await client.generateImage({
    model,
    prompt,
    negative_prompt: options?.negativePrompt,
    image_size: options?.imageSize ?? '1024x1024',
    batch_size: options?.batchSize ?? 1,
  })

  return response.images.map(img => img.url)
}

/**
 * 辅助函数：文本转语音
 */
export async function callSiliconFlowTTS(
  model: string,
  text: string,
  voice: string,
  options?: {
    speed?: number
    format?: 'mp3' | 'wav' | 'flac'
  }
): Promise<Blob> {
  const client = new SiliconFlowClient()

  return await client.textToSpeech({
    model,
    input: text,
    voice,
    speed: options?.speed ?? 1.0,
    response_format: options?.format ?? 'mp3',
  })
}

/**
 * 辅助函数：语音转文本
 */
export async function callSiliconFlowSTT(
  model: string,
  audioFile: File | Blob,
  options?: {
    language?: string
    format?: 'json' | 'text' | 'srt' | 'vtt'
  }
): Promise<any> {
  const client = new SiliconFlowClient()

  return await client.speechToText({
    model,
    file: audioFile,
    language: options?.language,
    response_format: options?.format ?? 'json',
  })
}

/**
 * 辅助函数：调用视觉模型分析图片
 * 支持 Qwen-VL、GLM-4V 等多模态模型
 */
export async function callSiliconFlowVision(
  model: string,
  prompt: string,
  images: Array<{ url?: string; base64?: string }>,
  temperature?: number,
  maxTokens?: number
): Promise<string> {
  const client = new SiliconFlowClient()

  // 构建多模态消息内容
  const contentParts: Array<{
    type: 'text' | 'image_url'
    text?: string
    image_url?: { url: string }
  }> = [
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

  const response = await client.chatCompletions({
    model,
    messages: [
      {
        role: 'user',
        content: contentParts
      }
    ],
    temperature: temperature ?? 0.7,
    max_tokens: maxTokens ?? 4096,
  })

  if (response.choices && response.choices.length > 0) {
    return response.choices[0].message.content
  }

  throw new Error('No response from SiliconFlow Vision API')
}
