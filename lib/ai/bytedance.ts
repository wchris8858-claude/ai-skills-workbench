/**
 * 豆包（ByteDance）AI 客户端
 */

export interface ByteDanceRequest {
  model: string
  messages: {
    role: 'user' | 'assistant' | 'system'
    content:
      | string
      | Array<
          | { type: 'text'; text: string }
          | { type: 'image_url'; image_url: { url: string } }
        >
  }[]
  temperature?: number
  max_tokens?: number
}

export interface ByteDanceResponse {
  choices: {
    message: {
      role: string
      content: string
    }
    finish_reason: string
  }[]
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

export async function callByteDance(request: ByteDanceRequest): Promise<string> {
  const apiKey = process.env.BYTEDANCE_API_KEY

  if (!apiKey) {
    throw new Error('BYTEDANCE_API_KEY is not configured')
  }

  const endpoint = process.env.BYTEDANCE_ENDPOINT || 'https://ark.cn-beijing.volces.com/api/v3'

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
      const error = await response.text()
      throw new Error(`ByteDance API error: ${response.status} - ${error}`)
    }

    const data: ByteDanceResponse = await response.json()

    if (!data.choices || data.choices.length === 0) {
      throw new Error('No response from ByteDance API')
    }

    return data.choices[0].message.content
  } catch (error) {
    console.error('ByteDance API call failed:', error)
    throw error
  }
}
