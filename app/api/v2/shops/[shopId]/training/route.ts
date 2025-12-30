/**
 * 培训系统 API
 * GET /api/v2/shops/[shopId]/training/progress - 获取学习进度
 * POST /api/v2/shops/[shopId]/training/roleplay - 创建对练会话
 */

import { NextRequest, NextResponse } from 'next/server'
import { getUserFromToken } from '@/lib/auth'
import { getUserShopRole } from '@/lib/db/shops'
import {
  getUserLearningProgress,
  getLearningStats,
  createRoleplaySession,
  getRoleplayStats,
} from '@/lib/db/training'
import { logger } from '@/lib/logger'
import { withErrorHandler } from '@/lib/api/error-handler'

interface RouteParams {
  params: Promise<{ shopId: string }>
}

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
  const type = searchParams.get('type') || 'progress'

  if (type === 'stats') {
    // 获取学习统计
    const stats = await getLearningStats(shopId, user.id)
    return NextResponse.json({ stats })
  } else if (type === 'roleplay-stats') {
    // 获取对练统计
    const stats = await getRoleplayStats(shopId, user.id)
    return NextResponse.json({ stats })
  } else {
    // 获取学习进度列表
    const progress = await getUserLearningProgress(shopId, user.id)
    return NextResponse.json({ progress })
  }
})

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
  if (!role) {
    return NextResponse.json({ error: '无权访问该店铺' }, { status: 403 })
  }

  // 解析请求体
  const body = await request.json()
  const { scenarioId, scenarioName, customerProfile, difficulty } = body

  // 验证必填字段
  if (!scenarioId || !scenarioName) {
    return NextResponse.json(
      { error: '场景 ID 和名称不能为空' },
      { status: 400 }
    )
  }

  // 创建对练会话
  const session = await createRoleplaySession({
    shopId,
    userId: user.id,
    scenario: scenarioName,
    messages: [], // 初始空消息列表
  })

  if (!session) {
    return NextResponse.json({ error: '创建对练会话失败' }, { status: 500 })
  }

  logger.info('[API] Roleplay session created', {
    shopId,
    sessionId: session.id,
    scenarioId,
  })

  return NextResponse.json({ session })
})
