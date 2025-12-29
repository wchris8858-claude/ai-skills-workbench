/**
 * 单个历史对话 API
 * GET: 获取对话详情及消息
 * DELETE: 删除单个对话
 */

import { NextRequest, NextResponse } from 'next/server'
import { getConversationById, deleteConversation } from '@/lib/db/conversations'
import { getConversationMessages } from '@/lib/db/messages'
import { isSupabaseConfigured } from '@/lib/supabase'
import { withErrorHandler } from '@/lib/middleware/error-handler'
import { createError } from '@/lib/errors'

async function getHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isSupabaseConfigured) {
    throw createError.serviceUnavailable('Supabase 未配置')
  }

  const { id } = await params

  const conversation = await getConversationById(id)

  if (!conversation) {
    throw createError.notFound('对话')
  }

  const messages = await getConversationMessages(id)

  return NextResponse.json({
    conversation: {
      ...conversation,
      messages
    }
  })
}

async function deleteHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isSupabaseConfigured) {
    throw createError.serviceUnavailable('Supabase 未配置')
  }

  const { id } = await params

  const success = await deleteConversation(id)

  if (!success) {
    throw createError.database('删除对话失败')
  }

  return NextResponse.json({ success: true })
}

export const GET = withErrorHandler(getHandler)
export const DELETE = withErrorHandler(deleteHandler)
