/**
 * 登出 API
 * POST /api/auth/logout
 */

import { NextResponse } from 'next/server'
import { clearAuthCookie } from '@/lib/auth'
import { withErrorHandler } from '@/lib/middleware/error-handler'

async function handler() {
  await clearAuthCookie()

  return NextResponse.json({
    success: true,
    message: '已退出登录',
  })
}

export const POST = withErrorHandler(handler)
