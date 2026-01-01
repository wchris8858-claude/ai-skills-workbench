/**
 * 豆包（Doubao）大模型客户端
 *
 * 基于火山方舟平台
 * 文档: https://www.volcengine.com/docs/82379
 *
 * 使用 AKSK 签名认证（与即梦共用）
 */

import { logger } from '@/lib/logger'
import crypto from 'crypto'

// 火山方舟 API 配置
const ARK_HOST = 'ark.cn-beijing.volces.com'
const ARK_REGION = 'cn-beijing'
const ARK_SERVICE = 'ml_maas'
const API_VERSION = '2024-01-01'

// 可用的豆包模型
export const DOUBAO_MODELS = {
  // 最新旗舰模型
  'doubao-1.5-pro': 'doubao-1-5-pro-256k-250115',
  'doubao-1.5-lite': 'doubao-1-5-lite-32k-250115',
  // 思考模型
  'doubao-seed-1.6': 'doubao-seed-1-6-thinking-250428',
  'doubao-seed-1.6-lite': 'doubao-seed-1-6-lite-250428',
  // 视觉模型
  'doubao-vision': 'doubao-1-5-vision-pro-250328',
  // 经典模型
  'doubao-pro-32k': 'doubao-pro-32k-241215',
  'doubao-lite-32k': 'doubao-lite-32k-241215',
} as const

export type DoubaoModelKey = keyof typeof DOUBAO_MODELS

export interface DoubaoMessage {
  role: 'system' | 'user' | 'assistant'
  content: string | Array<{
    type: 'text' | 'image_url'
    text?: string
    image_url?: { url: string }
  }>
}

export interface DoubaoRequest {
  model: string
  messages: DoubaoMessage[]
  temperature?: number
  max_tokens?: number
  stream?: boolean
  top_p?: number
}

export interface DoubaoResponse {
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

/**
 * 生成 HMAC-SHA256 签名
 */
function hmacSHA256(key: Buffer | string, data: string): Buffer {
  return crypto.createHmac('sha256', key).update(data, 'utf8').digest()
}

/**
 * 生成 SHA256 哈希
 */
function sha256Hash(data: string): string {
  return crypto.createHash('sha256').update(data, 'utf8').digest('hex')
}

/**
 * 获取签名密钥
 */
function getSigningKey(
  secretKey: string,
  dateStamp: string,
  region: string,
  service: string
): Buffer {
  const kDate = hmacSHA256(secretKey, dateStamp)
  const kRegion = hmacSHA256(kDate, region)
  const kService = hmacSHA256(kRegion, service)
  const kSigning = hmacSHA256(kService, 'request')
  return kSigning
}

/**
 * 生成火山引擎 API 签名
 */
function signRequest(
  method: string,
  path: string,
  headers: Record<string, string>,
  body: string,
  accessKeyId: string,
  secretAccessKey: string
): Record<string, string> {
  const now = new Date()
  const dateStamp = now.toISOString().slice(0, 10).replace(/-/g, '')
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '')

  const algorithm = 'HMAC-SHA256'
  const credentialScope = `${dateStamp}/${ARK_REGION}/${ARK_SERVICE}/request`

  // 设置必要的 headers
  headers['host'] = ARK_HOST
  headers['x-date'] = amzDate
  headers['x-content-sha256'] = sha256Hash(body)
  headers['content-type'] = 'application/json'

  // 签名 headers (按字母顺序排序)
  const signedHeaders = ['content-type', 'host', 'x-content-sha256', 'x-date']

  // 构建规范 headers
  const canonicalHeaders = signedHeaders
    .map(h => `${h.toLowerCase()}:${headers[h].trim()}`)
    .join('\n')

  // 构建规范请求
  const payloadHash = sha256Hash(body)
  const canonicalRequest = [
    method,
    path,
    '', // 无查询字符串
    canonicalHeaders + '\n',
    signedHeaders.join(';'),
    payloadHash,
  ].join('\n')

  // 构建待签名字符串
  const stringToSign = [
    algorithm,
    amzDate,
    credentialScope,
    sha256Hash(canonicalRequest),
  ].join('\n')

  // 计算签名
  const signingKey = getSigningKey(secretAccessKey, dateStamp, ARK_REGION, ARK_SERVICE)
  const signature = hmacSHA256(signingKey, stringToSign).toString('hex')

  // 构建 Authorization header
  const authorization = `${algorithm} Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders.join(';')}, Signature=${signature}`

  return {
    ...headers,
    'Authorization': authorization,
  }
}

/**
 * 调用豆包文本生成 API
 */
export async function callDoubao(
  modelKey: DoubaoModelKey | string,
  messages: DoubaoMessage[],
  options?: {
    temperature?: number
    maxTokens?: number
    topP?: number
  }
): Promise<string> {
  const accessKeyId = process.env.JIMENG_ACCESS_KEY_ID // 共用即梦的 AKSK
  const secretAccessKey = process.env.JIMENG_SECRET_ACCESS_KEY

  if (!accessKeyId || !secretAccessKey) {
    throw new Error('JIMENG_ACCESS_KEY_ID 或 JIMENG_SECRET_ACCESS_KEY 未配置')
  }

  // 获取模型 ID
  const modelId = DOUBAO_MODELS[modelKey as DoubaoModelKey] || modelKey

  const path = '/api/v3/chat/completions'
  const body = JSON.stringify({
    model: modelId,
    messages,
    temperature: options?.temperature ?? 0.7,
    max_tokens: options?.maxTokens ?? 4096,
    top_p: options?.topP ?? 0.9,
  })

  const headers = signRequest(
    'POST',
    path,
    {},
    body,
    accessKeyId,
    secretAccessKey
  )

  const url = `https://${ARK_HOST}${path}`

  logger.debug('[Doubao] 发送请求', { model: modelId, messageCount: messages.length })

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body,
    })

    if (!response.ok) {
      const errorText = await response.text()
      logger.error('[Doubao] API 错误', { status: response.status, error: errorText })
      throw new Error(`Doubao API error: ${response.status} - ${errorText}`)
    }

    const data: DoubaoResponse = await response.json()

    if (data.choices && data.choices.length > 0) {
      const content = data.choices[0].message.content
      logger.debug('[Doubao] 请求成功', {
        model: modelId,
        tokens: data.usage?.total_tokens,
      })
      return content
    }

    throw new Error('No response from Doubao API')
  } catch (error) {
    logger.error('[Doubao] 调用失败', error)
    throw error
  }
}

/**
 * 调用豆包视觉模型分析图片
 */
export async function callDoubaoVision(
  prompt: string,
  images: Array<{ url?: string; base64?: string }>,
  options?: {
    temperature?: number
    maxTokens?: number
  }
): Promise<string> {
  // 构建多模态消息
  const contentParts: Array<{
    type: 'text' | 'image_url'
    text?: string
    image_url?: { url: string }
  }> = [{ type: 'text', text: prompt }]

  for (const image of images) {
    let imageUrl: string | undefined
    if (image.base64) {
      imageUrl = image.base64.startsWith('data:')
        ? image.base64
        : `data:image/jpeg;base64,${image.base64}`
    } else if (image.url) {
      imageUrl = image.url
    }

    if (imageUrl) {
      contentParts.push({
        type: 'image_url',
        image_url: { url: imageUrl },
      })
    }
  }

  const messages: DoubaoMessage[] = [
    { role: 'user', content: contentParts },
  ]

  return callDoubao('doubao-vision', messages, options)
}

/**
 * 检查豆包 API 是否已配置
 */
export function isDoubaoConfigured(): boolean {
  return Boolean(process.env.JIMENG_ACCESS_KEY_ID && process.env.JIMENG_SECRET_ACCESS_KEY)
}
