/**
 * 运营数据分析 API
 * POST /api/v2/shops/[shopId]/analytics - 录入运营数据
 * GET /api/v2/shops/[shopId]/analytics - 获取运营数据
 */

import { NextRequest, NextResponse } from 'next/server'
import { getUserFromToken } from '@/lib/auth'
import { getUserShopRole } from '@/lib/db/shops'
import {
  createOperationData,
  getShopOperationData,
  calculatePeriodComparison,
  getTrendData,
  importOperationData,
} from '@/lib/db/analytics'
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
    return NextResponse.json({ error: '无权录入数据' }, { status: 403 })
  }

  // 解析请求体
  const body = await request.json()
  const { date, metrics, batch } = body

  // 批量导入
  if (batch && Array.isArray(batch)) {
    const count = await importOperationData(
      shopId,
      batch.map((item: { date: string; metrics: unknown }) => ({
        date: new Date(item.date),
        metrics: item.metrics as Parameters<typeof createOperationData>[2],
      })),
      user.id
    )

    logger.info('[API] Batch analytics import', { shopId, count })

    return NextResponse.json({ imported: count })
  }

  // 单条录入
  if (!date || !metrics) {
    return NextResponse.json(
      { error: '日期和指标数据不能为空' },
      { status: 400 }
    )
  }

  const data = await createOperationData(
    shopId,
    new Date(date),
    metrics,
    user.id
  )

  if (!data) {
    return NextResponse.json({ error: '录入数据失败' }, { status: 500 })
  }

  logger.info('[API] Analytics data created', { shopId, date })

  return NextResponse.json({ data })
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
  const type = searchParams.get('type') || 'list'
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')

  if (!startDate || !endDate) {
    return NextResponse.json(
      { error: '开始日期和结束日期不能为空' },
      { status: 400 }
    )
  }

  const start = new Date(startDate)
  const end = new Date(endDate)

  if (type === 'comparison') {
    // 周期对比
    const previousStartDate = searchParams.get('previousStartDate')
    const previousEndDate = searchParams.get('previousEndDate')

    if (!previousStartDate || !previousEndDate) {
      return NextResponse.json(
        { error: '对比周期的开始和结束日期不能为空' },
        { status: 400 }
      )
    }

    const comparison = await calculatePeriodComparison(
      shopId,
      start,
      end,
      new Date(previousStartDate),
      new Date(previousEndDate)
    )

    return NextResponse.json(comparison)
  } else if (type === 'trend') {
    // 趋势数据
    const metric = searchParams.get('metric') || 'exposure'

    const trend = await getTrendData(
      shopId,
      start,
      end,
      metric as 'exposure' | 'engagement' | 'inquiries' | 'visits' | 'sales'
    )

    return NextResponse.json({ trend })
  } else {
    // 列表数据
    const data = await getShopOperationData(shopId, start, end)

    return NextResponse.json({ data })
  }
})
