/**
 * 获取当前用户 API
 * GET /api/auth/me
 *
 * 自动刷新即将过期的 Token
 */

import { NextResponse } from 'next/server'
import { getCurrentUser, shouldRefreshToken, refreshToken } from '@/lib/auth'
import { getUserById, isSupabaseAdminConfigured } from '@/lib/db/users'
import { withErrorHandler } from '@/lib/middleware/error-handler'
import { createError } from '@/lib/errors'

async function handler() {
  if (!isSupabaseAdminConfigured) {
    throw createError.serviceUnavailable('系统配置未完成')
  }

  const payload = await getCurrentUser()

  if (!payload) {
    return NextResponse.json({ user: null }, { status: 200 })
  }

  // 获取完整用户信息
  const user = await getUserById(payload.userId)

  if (!user) {
    return NextResponse.json({ user: null }, { status: 200 })
  }

  // 检查是否需要刷新 Token（剩余时间不到1天）
  let tokenRefreshed = false
  if (shouldRefreshToken(payload)) {
    await refreshToken(payload)
    tokenRefreshed = true
  }

  return NextResponse.json({
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
      role: user.role,
      isActive: user.isActive,
    },
    tokenRefreshed, // 告知前端 token 已刷新
  })
}

export const GET = withErrorHandler(handler)
