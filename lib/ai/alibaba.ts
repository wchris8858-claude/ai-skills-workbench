/**
 * 通义千问（Alibaba Qwen）AI 客户端
 */

import { logger } from '@/lib/logger'

export interface AlibabaRequest {
  model: string
  input: {
    messages: {
      role: 'user' | 'assistant' | 'system'
      content: string
    }[]
  }
  parameters?: {
    temperature?: number
    max_tokens?: number
    top_p?: number
  }
}

export interface AlibabaResponse {
  output: {
    text: string
    finish_reason: string
  }
  usage: {
    input_tokens: number
    output_tokens: number
    total_tokens: number
  }
}

export async function callAlibaba(request: AlibabaRequest): Promise<string> {
  const apiKey = process.env.ALIBABA_API_KEY

  if (!apiKey) {
    throw new Error('ALIBABA_API_KEY is not configured')
  }

  const endpoint = process.env.ALIBABA_ENDPOINT ||
    'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation'

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: request.model,
        input: request.input,
        parameters: {
          temperature: request.parameters?.temperature ?? 0.7,
          max_tokens: request.parameters?.max_tokens ?? 6000,
          top_p: request.parameters?.top_p ?? 0.8,
        },
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Alibaba API error: ${response.status} - ${error}`)
    }

    const data: AlibabaResponse = await response.json()

    if (!data.output || !data.output.text) {
      throw new Error('No response from Alibaba API')
    }

    return data.output.text
  } catch (error) {
    logger.error('Alibaba API call failed', error)
    throw error
  }
}
