/**
 * 内容日历 API
 * POST /api/v2/shops/[shopId]/calendar - 创建日历条目
 * GET /api/v2/shops/[shopId]/calendar - 获取日历列表
 */

import { NextRequest, NextResponse } from 'next/server'
import { getUserFromToken } from '@/lib/auth'
import { getUserShopRole } from '@/lib/db/shops'
import { createCalendarItem, getShopCalendarItems } from '@/lib/db/calendar'
import { logger } from '@/lib/logger'
import { withErrorHandler } from '@/lib/api/error-handler'

interface RouteParams {
  params: Promise<{ shopId: string }>
}

export const POST = withErrorHandler(async (
  request: NextRequest,
  { params }: RouteParams
) => {
  const { shopId } = await params

  // 获取当前用户
  const user = await getUserFromToken(request)
  if (!user) {
    return NextResponse.json({ error: '未登录' }, { status: 401 })
  }

  // 检查权限
  const role = await getUserShopRole(user.id, shopId)
  if (!role || !['owner', 'admin', 'editor'].includes(role)) {
    return NextResponse.json({ error: '无权创建日历条目' }, { status: 403 })
  }

  // 解析请求体
  const body = await request.json()
  const {
    title,
    contentType,
    platform,
    scheduledDate,
    scheduledTime,
    content,
    mediaUrls,
  } = body

  // 验证必填字段
  if (!title || !contentType || !platform || !scheduledDate) {
    return NextResponse.json(
      { error: '标题、内容类型、平台和计划日期不能为空' },
      { status: 400 }
    )
  }

  // 创建日历条目
  const item = await createCalendarItem({
    shopId,
    userId: user.id,
    channel: platform as 'douyin' | 'xiaohongshu' | 'moments' | 'video_account',
    scheduledAt: new Date(scheduledDate + (scheduledTime ? ` ${scheduledTime}` : '')),
    content: content || title,
    attachments: mediaUrls ? mediaUrls.map((url: string) => ({ type: 'image' as const, url })) : undefined,
    status: 'scheduled',
  })

  if (!item) {
    return NextResponse.json({ error: '创建日历条目失败' }, { status: 500 })
  }

  logger.info('[API] Calendar item created', {
    shopId,
    itemId: item.id,
    scheduledDate,
  })

  return NextResponse.json({ item })
})

export const GET = withErrorHandler(async (
  request: NextRequest,
  { params }: RouteParams
) => {
  const { shopId } = await params

  // 获取当前用户
  const user = await getUserFromToken(request)
  if (!user) {
    return NextResponse.json({ error: '未登录' }, { status: 401 })
  }

  // 检查权限
  const role = await getUserShopRole(user.id, shopId)
  if (!role) {
    return NextResponse.json({ error: '无权访问该店铺' }, { status: 403 })
  }

  // 获取查询参数
  const { searchParams } = new URL(request.url)
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')
  const platform = searchParams.get('platform') || undefined

  if (!startDate || !endDate) {
    return NextResponse.json(
      { error: '开始日期和结束日期不能为空' },
      { status: 400 }
    )
  }

  // 获取日历条目
  const items = await getShopCalendarItems(shopId, {
    startDate: new Date(startDate),
    endDate: new Date(endDate),
    channel: platform as 'douyin' | 'xiaohongshu' | 'moments' | 'video_account' | undefined,
  })

  return NextResponse.json({ items })
})
