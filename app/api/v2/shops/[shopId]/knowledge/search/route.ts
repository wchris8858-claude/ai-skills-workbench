/**
 * 知识检索 API
 * POST /api/v2/shops/[shopId]/knowledge/search - 搜索知识库
 */

import { NextRequest, NextResponse } from 'next/server'
import { getUserFromToken } from '@/lib/auth'
import { getUserShopRole } from '@/lib/db/shops'
import { retrieveKnowledge } from '@/lib/ai/rag'
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
  if (!role) {
    return NextResponse.json({ error: '无权访问该店铺' }, { status: 403 })
  }

  // 解析请求体
  const body = await request.json()
  const { query, topK, minSimilarity, category } = body

  // 验证必填字段
  if (!query) {
    return NextResponse.json({ error: '查询内容不能为空' }, { status: 400 })
  }

  // 执行检索
  const result = await retrieveKnowledge(shopId, query, {
    topK: topK || 5,
    minSimilarity: minSimilarity || 0.7,
    category,
  })

  logger.info('[API] Knowledge search completed', {
    shopId,
    query: query.substring(0, 50),
    resultCount: result.sources.length,
  })

  return NextResponse.json(result)
})
