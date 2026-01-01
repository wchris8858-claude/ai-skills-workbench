/**
 * 登录 API
 * POST /api/auth/login
 */

import { NextRequest, NextResponse } from 'next/server'
import { authenticateUser, isSupabaseAdminConfigured } from '@/lib/db/users'
import { generateToken, setAuthCookie } from '@/lib/auth'
import { withErrorHandler } from '@/lib/middleware/error-handler'
import { createError } from '@/lib/errors'
import { checkRateLimit, getClientIP, rateLimitExceededResponse } from '@/lib/middleware/rateLimit'
import { z } from 'zod'

const LoginSchema = z.object({
  username: z.string().min(1, '请输入用户名'),
  password: z.string().min(1, '请输入密码'),
})

async function handler(request: NextRequest) {
  // 临时禁用限流（调试用）
  // const clientIP = getClientIP(request)
  // const rateLimitResult = checkRateLimit(clientIP, 'api/auth/login')
  // if (!rateLimitResult.allowed) {
  //   const retryAfter = Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)
  //   throw createError.tooManyRequests(`登录尝试过于频繁，请 ${retryAfter} 秒后再试`)
  // }

  if (!isSupabaseAdminConfigured) {
    throw createError.serviceUnavailable('系统配置未完成')
  }

  const body = await request.json()

  // 验证输入
  const result = LoginSchema.safeParse(body)
  if (!result.success) {
    throw createError.validation(result.error.issues[0]?.message || '输入验证失败')
  }

  const { username, password } = result.data

  // 验证用户
  const user = await authenticateUser(username, password)

  if (!user) {
    // 临时禁用限流（调试用）
    // const failedRateLimit = checkRateLimit(clientIP, 'api/auth/login:failed')
    // if (!failedRateLimit.allowed) {
    //   const retryAfter = Math.ceil((failedRateLimit.resetTime - Date.now()) / 1000)
    //   throw createError.tooManyRequests(`登录失败次数过多，请 ${Math.ceil(retryAfter / 60)} 分钟后再试`)
    // }
    throw createError.unauthorized('用户名或密码错误')
  }

  // 生成 token
  const token = generateToken({
    userId: user.id,
    username: user.username,
    role: user.role,
  })

  // 设置 cookie
  await setAuthCookie(token)

  return NextResponse.json({
    success: true,
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
    },
  })
}

export const POST = withErrorHandler(handler)
