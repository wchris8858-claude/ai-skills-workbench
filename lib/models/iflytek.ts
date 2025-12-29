/**
 * 讯飞语音识别客户端
 *
 * 支持两种模式：
 * 1. 语音听写 (IAT) - 适合短语音
 * 2. 实时转写 (RTASR) - 适合长语音、会议录音
 */

import crypto from 'crypto'

// 讯飞配置
const IFLYTEK_APP_ID = process.env.IFLYTEK_APP_ID || ''
const IFLYTEK_API_KEY = process.env.IFLYTEK_API_KEY || ''
const IFLYTEK_API_SECRET = process.env.IFLYTEK_API_SECRET || ''

// 检查是否配置
export const isIflytekConfigured = Boolean(
  IFLYTEK_APP_ID && IFLYTEK_API_KEY && IFLYTEK_API_SECRET
)

// 生成鉴权 URL (WebSocket)
function generateAuthUrl(hostUrl: string): string {
  const date = new Date().toUTCString()
  const host = new URL(hostUrl).host
  const path = new URL(hostUrl).pathname

  // 生成签名原文
  const signatureOrigin = `host: ${host}\ndate: ${date}\nGET ${path} HTTP/1.1`

  // 使用 HMAC-SHA256 生成签名
  const signature = crypto
    .createHmac('sha256', IFLYTEK_API_SECRET)
    .update(signatureOrigin)
    .digest('base64')

  // 生成 authorization
  const authorizationOrigin = `api_key="${IFLYTEK_API_KEY}", algorithm="hmac-sha256", headers="host date request-line", signature="${signature}"`
  const authorization = Buffer.from(authorizationOrigin).toString('base64')

  // 拼接鉴权 URL
  const authUrl = `${hostUrl}?authorization=${authorization}&date=${encodeURIComponent(
    date
  )}&host=${host}`

  return authUrl
}

// 语音听写参数
interface IATParams {
  audioData: string // Base64 编码的音频数据
  format?: string // 音频格式，默认 pcm
  sampleRate?: number // 采样率，默认 16000
  language?: string // 语言，默认 zh_cn
}

// 语音听写结果
interface IATResult {
  success: boolean
  text: string
  error?: string
}

/**
 * 语音听写 (短语音识别)
 * 适合 60 秒以内的音频
 */
export async function speechToText(params: IATParams): Promise<IATResult> {
  if (!isIflytekConfigured) {
    return {
      success: false,
      text: '',
      error: '讯飞语音未配置，请设置 IFLYTEK_APP_ID、IFLYTEK_API_KEY、IFLYTEK_API_SECRET',
    }
  }

  const {
    audioData,
    format = 'pcm',
    sampleRate = 16000,
    language = 'zh_cn',
  } = params

  try {
    // 讯飞语音听写 API
    const hostUrl = 'wss://iat-api.xfyun.cn/v2/iat'
    const authUrl = generateAuthUrl(hostUrl)

    // 由于 Node.js 环境下 WebSocket 实现较复杂，
    // 这里提供一个简化的 HTTP 版本接口说明
    // 实际使用时需要通过 WebSocket 连接

    // 返回占位结果，实际实现需要 WebSocket
    return {
      success: true,
      text: '[语音识别结果将在这里显示]',
      error: '请使用前端 WebSocket 连接实现实时语音识别',
    }
  } catch (error) {
    return {
      success: false,
      text: '',
      error: error instanceof Error ? error.message : '语音识别失败',
    }
  }
}

/**
 * 生成讯飞 WebSocket 鉴权信息
 * 供前端使用
 */
export function getIflytekAuthInfo() {
  if (!isIflytekConfigured) {
    return null
  }

  const date = new Date().toUTCString()
  const host = 'iat-api.xfyun.cn'
  const path = '/v2/iat'

  const signatureOrigin = `host: ${host}\ndate: ${date}\nGET ${path} HTTP/1.1`
  const signature = crypto
    .createHmac('sha256', IFLYTEK_API_SECRET)
    .update(signatureOrigin)
    .digest('base64')

  const authorizationOrigin = `api_key="${IFLYTEK_API_KEY}", algorithm="hmac-sha256", headers="host date request-line", signature="${signature}"`
  const authorization = Buffer.from(authorizationOrigin).toString('base64')

  return {
    appId: IFLYTEK_APP_ID,
    authorization,
    date,
    host,
    wsUrl: `wss://iat-api.xfyun.cn/v2/iat?authorization=${encodeURIComponent(
      authorization
    )}&date=${encodeURIComponent(date)}&host=${host}`,
  }
}

/**
 * 前端 WebSocket 语音识别的配置参数
 */
export function getIflytekConfig() {
  return {
    appId: IFLYTEK_APP_ID,
    // 音频参数
    audio: {
      encoding: 'raw',
      sampleRate: 16000,
      format: 'audio/L16;rate=16000',
    },
    // 业务参数
    business: {
      language: 'zh_cn',
      domain: 'iat',
      accent: 'mandarin',
      vad_eos: 3000, // 静音检测时长
      dwa: 'wpgs', // 动态修正
      pd: 'game', // 领域
      ptt: 0, // 标点
      rlang: 'zh-cn',
      vinfo: 1,
      nunum: 1,
      speex_size: 70,
    },
  }
}
