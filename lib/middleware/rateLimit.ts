/**
 * API Rate Limiting 中间件
 * 基于内存的简单速率限制实现
 * 生产环境建议使用 Redis
 */

import { NextResponse } from 'next/server'

interface RateLimitConfig {
  requests: number    // 允许的请求数
  windowMs: number   // 时间窗口（毫秒）
}

interface RateLimitEntry {
  count: number
  resetTime: number
}

// 内存存储（生产环境建议使用 Redis）
const rateLimitStore = new Map<string, RateLimitEntry>()

// 定期清理过期条目
const CLEANUP_INTERVAL = 60 * 1000 // 1分钟
let lastCleanup = Date.now()

function cleanup() {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL) return

  lastCleanup = now
  const entries = Array.from(rateLimitStore.entries())
  for (const [key, entry] of entries) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key)
    }
  }
}

// 默认配置
export const RATE_LIMIT_CONFIG: Record<string, RateLimitConfig> = {
  // 登录接口 - 非常严格（防止暴力破解）
  'api/auth/login': {
    requests: 5,
    windowMs: 60 * 1000, // 每分钟最多 5 次尝试
  },
  // 登录失败专用（更严格）
  'api/auth/login:failed': {
    requests: 3,
    windowMs: 5 * 60 * 1000, // 5 分钟内最多 3 次失败
  },
  // AI 聊天接口 - 较严格
  'api/claude/chat': {
    requests: 20,
    windowMs: 60 * 1000, // 每分钟 20 次
  },
  // 技能列表接口 - 较宽松
  'api/skills': {
    requests: 100,
    windowMs: 60 * 1000, // 每分钟 100 次
  },
  // 技能详情接口
  'api/skills/[id]': {
    requests: 60,
    windowMs: 60 * 1000, // 每分钟 60 次
  },
  // 默认限制
  'default': {
    requests: 60,
    windowMs: 60 * 1000,
  },
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetTime: number
  limit: number
}

/**
 * 检查速率限制
 * @param identifier 用户标识（IP 或用户 ID）
 * @param route 路由路径
 * @returns 速率限制结果
 */
export function checkRateLimit(
  identifier: string,
  route: string
): RateLimitResult {
  // 定期清理
  cleanup()
  
  // 获取配置
  const config = RATE_LIMIT_CONFIG[route] || RATE_LIMIT_CONFIG['default']
  const key = `${route}:${identifier}`
  const now = Date.now()
  
  // 获取或创建条目
  let entry = rateLimitStore.get(key)
  
  if (!entry || entry.resetTime < now) {
    // 新窗口
    entry = {
      count: 1,
      resetTime: now + config.windowMs,
    }
    rateLimitStore.set(key, entry)
    
    return {
      allowed: true,
      remaining: config.requests - 1,
      resetTime: entry.resetTime,
      limit: config.requests,
    }
  }
  
  // 检查是否超限
  if (entry.count >= config.requests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
      limit: config.requests,
    }
  }
  
  // 增加计数
  entry.count++
  rateLimitStore.set(key, entry)
  
  return {
    allowed: true,
    remaining: config.requests - entry.count,
    resetTime: entry.resetTime,
    limit: config.requests,
  }
}

/**
 * 获取客户端 IP
 */
export function getClientIP(request: Request): string {
  // 从各种头部尝试获取真实 IP
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  const realIP = request.headers.get('x-real-ip')
  if (realIP) {
    return realIP
  }
  
  // 默认返回
  return 'unknown'
}

/**
 * 创建速率限制响应头
 */
export function createRateLimitHeaders(result: RateLimitResult): Headers {
  const headers = new Headers()
  headers.set('X-RateLimit-Limit', result.limit.toString())
  headers.set('X-RateLimit-Remaining', result.remaining.toString())
  headers.set('X-RateLimit-Reset', result.resetTime.toString())
  return headers
}

/**
 * 速率限制错误响应
 */
export function rateLimitExceededResponse(result: RateLimitResult): NextResponse {
  const retryAfter = Math.ceil((result.resetTime - Date.now()) / 1000)

  return NextResponse.json(
    {
      error: '请求过于频繁，请稍后再试',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter,
    },
    {
      status: 429,
      headers: {
        'Retry-After': retryAfter.toString(),
        'X-RateLimit-Limit': result.limit.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': result.resetTime.toString(),
      },
    }
  )
}
