/**
 * 历史记录 API
 * GET: 获取用户历史对话列表
 * DELETE: 清空用户所有历史
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  getRecentConversationsWithSkills,
  searchConversations,
  deleteAllUserConversations
} from '@/lib/db/conversations'
import { isSupabaseConfigured } from '@/lib/supabase'
import { withErrorHandler } from '@/lib/middleware/error-handler'
import { createError } from '@/lib/errors'
import { getCurrentUser } from '@/lib/auth'

async function getHandler(request: NextRequest) {
  if (!isSupabaseConfigured) {
    throw createError.serviceUnavailable('Supabase 未配置')
  }

  // 获取当前登录用户
  const currentUser = await getCurrentUser()
  if (!currentUser) {
    throw createError.unauthorized('请先登录')
  }
  const userId = currentUser.userId

  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')
  const skillId = searchParams.get('skillId')
  const limit = parseInt(searchParams.get('limit') || '20', 10)

  // 如果有搜索关键词
  if (query) {
    const conversations = await searchConversations(userId, query)
    return NextResponse.json({ conversations })
  }

  // 获取带技能信息的对话列表
  const conversationsWithSkills = await getRecentConversationsWithSkills(
    userId,
    limit
  )

  // 如果指定了技能ID，过滤结果
  let filtered = conversationsWithSkills
  if (skillId) {
    filtered = conversationsWithSkills.filter(
      item => item.conversation.skillId === skillId
    )
  }

  return NextResponse.json({
    conversations: filtered,
    total: filtered.length
  })
}

async function deleteHandler() {
  if (!isSupabaseConfigured) {
    throw createError.serviceUnavailable('Supabase 未配置')
  }

  // 获取当前登录用户
  const currentUser = await getCurrentUser()
  if (!currentUser) {
    throw createError.unauthorized('请先登录')
  }

  const success = await deleteAllUserConversations(currentUser.userId)

  if (!success) {
    throw createError.database('清空历史记录失败')
  }

  return NextResponse.json({ success: true })
}

export const GET = withErrorHandler(getHandler)
export const DELETE = withErrorHandler(deleteHandler)
