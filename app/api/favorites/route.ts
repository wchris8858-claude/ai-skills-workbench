/**
 * 收藏 API
 * GET: 获取用户收藏列表
 * POST: 添加收藏
 * DELETE: 清空所有收藏
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  getFavoriteMessages,
  getFavoriteConversations,
  toggleMessageFavorite,
  toggleConversationFavorite,
  clearAllFavorites
} from '@/lib/db/favorites'
import { isSupabaseConfigured } from '@/lib/supabase'
import { withErrorHandler } from '@/lib/middleware/error-handler'
import { createError } from '@/lib/errors'
import { z } from 'zod'

// 临时用户ID（后续接入真实认证）
const TEMP_USER_ID = 'temp-user-001'

// 收藏操作验证 schema
const FavoriteActionSchema = z.object({
  type: z.enum(['message', 'conversation'], {
    message: '收藏类型必须是 message 或 conversation'
  }),
  id: z.string().min(1, 'ID 不能为空')
})

async function getHandler(request: NextRequest) {
  if (!isSupabaseConfigured) {
    throw createError.serviceUnavailable('Supabase 未配置')
  }

  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') || 'all'

  const result: {
    messages?: Awaited<ReturnType<typeof getFavoriteMessages>>
    conversations?: Awaited<ReturnType<typeof getFavoriteConversations>>
  } = {}

  if (type === 'all' || type === 'messages') {
    result.messages = await getFavoriteMessages(TEMP_USER_ID)
  }

  if (type === 'all' || type === 'conversations') {
    result.conversations = await getFavoriteConversations(TEMP_USER_ID)
  }

  return NextResponse.json(result)
}

async function postHandler(request: NextRequest) {
  if (!isSupabaseConfigured) {
    throw createError.serviceUnavailable('Supabase 未配置')
  }

  const body = await request.json()

  // 验证输入
  const result = FavoriteActionSchema.safeParse(body)
  if (!result.success) {
    throw createError.validation(result.error.issues[0]?.message || '输入验证失败')
  }

  const { type, id } = result.data

  let favoriteResult
  if (type === 'message') {
    favoriteResult = await toggleMessageFavorite(TEMP_USER_ID, id)
  } else {
    favoriteResult = await toggleConversationFavorite(TEMP_USER_ID, id)
  }

  return NextResponse.json(favoriteResult)
}

async function deleteHandler() {
  if (!isSupabaseConfigured) {
    throw createError.serviceUnavailable('Supabase 未配置')
  }

  const success = await clearAllFavorites(TEMP_USER_ID)

  if (!success) {
    throw createError.database('清空收藏失败')
  }

  return NextResponse.json({ success: true })
}

export const GET = withErrorHandler(getHandler)
export const POST = withErrorHandler(postHandler)
export const DELETE = withErrorHandler(deleteHandler)
