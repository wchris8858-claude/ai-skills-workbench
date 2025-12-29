/**
 * Google Gemini AI 客户端
 */

export interface GeminiRequest {
  model: string
  contents: {
    role: 'user' | 'model'
    parts: {
      text: string
    }[]
  }[]
  generationConfig?: {
    temperature?: number
    maxOutputTokens?: number
    topP?: number
  }
}

export interface GeminiResponse {
  candidates: {
    content: {
      parts: {
        text: string
      }[]
      role: string
    }
    finishReason: string
  }[]
  usageMetadata: {
    promptTokenCount: number
    candidatesTokenCount: number
    totalTokenCount: number
  }
}

export async function callGemini(request: GeminiRequest): Promise<string> {
  const apiKey = process.env.GOOGLE_API_KEY

  if (!apiKey) {
    throw new Error('GOOGLE_API_KEY is not configured')
  }

  const endpoint = process.env.GOOGLE_ENDPOINT ||
    'https://generativelanguage.googleapis.com/v1beta'

  try {
    const response = await fetch(
      `${endpoint}/models/${request.model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: request.contents,
          generationConfig: {
            temperature: request.generationConfig?.temperature ?? 0.7,
            maxOutputTokens: request.generationConfig?.maxOutputTokens ?? 8192,
            topP: request.generationConfig?.topP ?? 0.95,
          },
        }),
      }
    )

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Google API error: ${response.status} - ${error}`)
    }

    const data: GeminiResponse = await response.json()

    if (!data.candidates || data.candidates.length === 0) {
      throw new Error('No response from Google API')
    }

    const candidate = data.candidates[0]
    if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
      throw new Error('Invalid response structure from Google API')
    }

    return candidate.content.parts[0].text
  } catch (error) {
    console.error('Google API call failed:', error)
    throw error
  }
}
