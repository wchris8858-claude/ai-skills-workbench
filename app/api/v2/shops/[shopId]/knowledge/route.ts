/**
 * 知识库 API
 * POST /api/v2/shops/[shopId]/knowledge - 上传知识文档
 * GET /api/v2/shops/[shopId]/knowledge - 获取知识文档列表
 */

import { NextRequest, NextResponse } from 'next/server'
import { getUserFromToken } from '@/lib/auth'
import { getUserShopRole } from '@/lib/db/shops'
import { getShopKnowledgeDocuments } from '@/lib/db/knowledge'
import { processAndStoreDocument } from '@/lib/ai/rag'
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
    return NextResponse.json({ error: '无权上传知识文档' }, { status: 403 })
  }

  // 解析请求体
  const body = await request.json()
  const { title, content, category, tags, source } = body

  // 验证必填字段
  if (!title || !content) {
    return NextResponse.json({ error: '标题和内容不能为空' }, { status: 400 })
  }

  // 处理并存储文档
  const result = await processAndStoreDocument(
    shopId,
    title,
    content,
    { category, tags, source }
  )

  if (!result.success) {
    return NextResponse.json(
      { error: result.error || '文档处理失败' },
      { status: 500 }
    )
  }

  logger.info('[API] Knowledge document created', {
    shopId,
    documentId: result.document?.id,
    chunkCount: result.chunkCount,
  })

  return NextResponse.json({
    document: result.document,
    chunkCount: result.chunkCount,
  })
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
  const category = searchParams.get('category') || undefined

  // 获取知识文档列表
  const documents = await getShopKnowledgeDocuments(shopId, category ? { category } : undefined)

  return NextResponse.json({ documents })
})
