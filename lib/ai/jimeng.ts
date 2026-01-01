/**
 * 即梦（Jimeng）AI 图像生成客户端
 *
 * 基于火山引擎视觉智能 API
 * 文档: https://www.volcengine.com/docs/85621/1817045
 *
 * 使用 AKSK 签名认证
 */

import { logger } from '@/lib/logger'
import crypto from 'crypto'

// 火山引擎 API 配置
const VOLCENGINE_HOST = 'visual.volcengineapi.com'
const VOLCENGINE_REGION = 'cn-north-1'
const VOLCENGINE_SERVICE = 'cv'
const API_VERSION = '2022-08-31'

export interface JimengRequest {
  prompt: string
  negative_prompt?: string
  width?: number
  height?: number
  num_images?: number
  scale?: number // 文本影响程度 0-1
  seed?: number
}

export interface JimengResponse {
  code: number
  message: string
  request_id: string
  task_id?: string
  data?: {
    image_urls?: string[]
    status?: string
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
 * 构建规范请求
 */
function buildCanonicalRequest(
  method: string,
  path: string,
  queryString: string,
  headers: Record<string, string>,
  signedHeaders: string[],
  payloadHash: string
): string {
  const canonicalHeaders = signedHeaders
    .map(h => `${h.toLowerCase()}:${headers[h].trim()}`)
    .join('\n')

  return [
    method,
    path,
    queryString,
    canonicalHeaders + '\n',
    signedHeaders.join(';'),
    payloadHash,
  ].join('\n')
}

/**
 * 构建待签名字符串
 */
function buildStringToSign(
  algorithm: string,
  requestDateTime: string,
  credentialScope: string,
  canonicalRequestHash: string
): string {
  return [
    algorithm,
    requestDateTime,
    credentialScope,
    canonicalRequestHash,
  ].join('\n')
}

/**
 * 生成火山引擎 API 签名
 */
function signRequest(
  method: string,
  path: string,
  queryParams: Record<string, string>,
  headers: Record<string, string>,
  body: string,
  accessKeyId: string,
  secretAccessKey: string
): Record<string, string> {
  const now = new Date()
  const dateStamp = now.toISOString().slice(0, 10).replace(/-/g, '')
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '')

  const algorithm = 'HMAC-SHA256'
  const credentialScope = `${dateStamp}/${VOLCENGINE_REGION}/${VOLCENGINE_SERVICE}/request`

  // 设置必要的 headers
  headers['host'] = VOLCENGINE_HOST
  headers['x-date'] = amzDate
  headers['x-content-sha256'] = sha256Hash(body)
  headers['content-type'] = 'application/json'

  // 构建查询字符串
  const sortedParams = Object.keys(queryParams).sort()
  const queryString = sortedParams
    .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(queryParams[k])}`)
    .join('&')

  // 签名 headers
  const signedHeaders = ['content-type', 'host', 'x-content-sha256', 'x-date']

  // 构建规范请求
  const payloadHash = sha256Hash(body)
  const canonicalRequest = buildCanonicalRequest(
    method,
    path,
    queryString,
    headers,
    signedHeaders,
    payloadHash
  )

  // 构建待签名字符串
  const stringToSign = buildStringToSign(
    algorithm,
    amzDate,
    credentialScope,
    sha256Hash(canonicalRequest)
  )

  // 计算签名
  const signingKey = getSigningKey(secretAccessKey, dateStamp, VOLCENGINE_REGION, VOLCENGINE_SERVICE)
  const signature = hmacSHA256(signingKey, stringToSign).toString('hex')

  // 构建 Authorization header
  const authorization = `${algorithm} Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders.join(';')}, Signature=${signature}`

  return {
    ...headers,
    'Authorization': authorization,
  }
}

/**
 * 提交图像生成任务
 */
async function submitTask(
  accessKeyId: string,
  secretAccessKey: string,
  request: JimengRequest
): Promise<{ taskId: string; requestId: string }> {
  const queryParams = {
    Action: 'CVSync2AsyncSubmitTask',
    Version: API_VERSION,
  }

  const body = JSON.stringify({
    req_key: 'jimeng_t2i_v40',
    prompt: request.prompt,
    negative_prompt: request.negative_prompt || '',
    size: (request.width || 1024) * (request.height || 1024),
    scale: request.scale ?? 0.5,
    seed: request.seed ?? -1,
    req_json: JSON.stringify({
      logo_info: {
        add_logo: false,
      },
      return_url: true,
    }),
  })

  const headers = signRequest(
    'POST',
    '/',
    queryParams,
    {},
    body,
    accessKeyId,
    secretAccessKey
  )

  const queryString = Object.entries(queryParams)
    .map(([k, v]) => `${k}=${v}`)
    .join('&')

  const url = `https://${VOLCENGINE_HOST}/?${queryString}`

  logger.debug('[Jimeng] 提交任务', { url, prompt: request.prompt.slice(0, 50) })

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body,
  })

  if (!response.ok) {
    const errorText = await response.text()
    logger.error('[Jimeng] 提交任务失败', { status: response.status, error: errorText })
    throw new Error(`Jimeng API error: ${response.status} - ${errorText}`)
  }

  const data: JimengResponse = await response.json()

  if (data.code !== 10000) {
    throw new Error(`Jimeng API error: ${data.code} - ${data.message}`)
  }

  if (!data.task_id) {
    throw new Error('No task_id returned from Jimeng API')
  }

  return {
    taskId: data.task_id,
    requestId: data.request_id,
  }
}

/**
 * 查询任务结果
 */
async function getTaskResult(
  accessKeyId: string,
  secretAccessKey: string,
  taskId: string
): Promise<{ status: string; imageUrls?: string[] }> {
  const queryParams = {
    Action: 'CVSync2AsyncGetResult',
    Version: API_VERSION,
  }

  const body = JSON.stringify({
    req_key: 'jimeng_t2i_v40',
    task_id: taskId,
  })

  const headers = signRequest(
    'POST',
    '/',
    queryParams,
    {},
    body,
    accessKeyId,
    secretAccessKey
  )

  const queryString = Object.entries(queryParams)
    .map(([k, v]) => `${k}=${v}`)
    .join('&')

  const url = `https://${VOLCENGINE_HOST}/?${queryString}`

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body,
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Jimeng API error: ${response.status} - ${errorText}`)
  }

  const data: JimengResponse = await response.json()

  if (data.code !== 10000) {
    throw new Error(`Jimeng API error: ${data.code} - ${data.message}`)
  }

  return {
    status: data.data?.status || 'unknown',
    imageUrls: data.data?.image_urls,
  }
}

/**
 * 等待任务完成并返回图片 URL
 */
async function waitForResult(
  accessKeyId: string,
  secretAccessKey: string,
  taskId: string,
  maxRetries: number = 30,
  interval: number = 2000
): Promise<string[]> {
  for (let i = 0; i < maxRetries; i++) {
    const result = await getTaskResult(accessKeyId, secretAccessKey, taskId)

    logger.debug('[Jimeng] 查询任务状态', { taskId, status: result.status, attempt: i + 1 })

    if (result.status === 'done' && result.imageUrls && result.imageUrls.length > 0) {
      return result.imageUrls
    }

    if (result.status === 'failed') {
      throw new Error('Image generation failed')
    }

    // 等待后重试
    await new Promise(resolve => setTimeout(resolve, interval))
  }

  throw new Error('Image generation timeout')
}

/**
 * 调用即梦图像生成 API
 */
export async function callJimeng(request: JimengRequest): Promise<string[]> {
  const accessKeyId = process.env.JIMENG_ACCESS_KEY_ID
  const secretAccessKey = process.env.JIMENG_SECRET_ACCESS_KEY

  if (!accessKeyId || !secretAccessKey) {
    throw new Error('JIMENG_ACCESS_KEY_ID 或 JIMENG_SECRET_ACCESS_KEY 未配置')
  }

  try {
    logger.info('[Jimeng] 开始生成图像', { prompt: request.prompt.slice(0, 50) })

    // 1. 提交任务
    const { taskId, requestId } = await submitTask(accessKeyId, secretAccessKey, request)
    logger.debug('[Jimeng] 任务已提交', { taskId, requestId })

    // 2. 轮询等待结果
    const imageUrls = await waitForResult(accessKeyId, secretAccessKey, taskId)

    logger.info('[Jimeng] 图像生成完成', { count: imageUrls.length })

    return imageUrls
  } catch (error) {
    logger.error('[Jimeng] 图像生成失败', error)
    throw error
  }
}

/**
 * 检查即梦 API 是否已配置
 */
export function isJimengConfigured(): boolean {
  return Boolean(process.env.JIMENG_ACCESS_KEY_ID && process.env.JIMENG_SECRET_ACCESS_KEY)
}
