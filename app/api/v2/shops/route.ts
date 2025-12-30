/**
 * 店铺管理 API
 * POST /api/v2/shops - 创建店铺
 * GET /api/v2/shops - 获取用户店铺列表
 */

import { NextRequest, NextResponse } from 'next/server'
import { getUserFromToken } from '@/lib/auth'
import { createShop, getUserShops, getAccessibleShops } from '@/lib/db/shops'
import { logger } from '@/lib/logger'
import { withErrorHandler } from '@/lib/api/error-handler'

export const POST = withErrorHandler(async (request: NextRequest) => {
  // 获取当前用户
  const user = await getUserFromToken(request)
  if (!user) {
    return NextResponse.json({ error: '未登录' }, { status: 401 })
  }

  // 解析请求体
  const body = await request.json()
  const { name, industry, description, address, targetCustomer, brandStyle, slogan, contactInfo, logoUrl, settings } = body

  // 验证必填字段
  if (!name) {
    return NextResponse.json({ error: '店铺名称不能为空' }, { status: 400 })
  }

  // 创建店铺
  const shop = await createShop(user.id, {
    name,
    industry,
    description,
    address,
    targetCustomer,
    brandStyle,
    slogan,
    contactInfo,
    logoUrl,
    settings,
  })

  if (!shop) {
    return NextResponse.json({ error: '创建店铺失败' }, { status: 500 })
  }

  logger.info('[API] Shop created', { shopId: shop.id, userId: user.id })

  return NextResponse.json({ shop })
})

export const GET = withErrorHandler(async (request: NextRequest) => {
  // 获取当前用户
  const user = await getUserFromToken(request)
  if (!user) {
    return NextResponse.json({ error: '未登录' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const includeShared = searchParams.get('includeShared') === 'true'

  // 获取店铺列表
  const shops = includeShared
    ? await getAccessibleShops(user.id)
    : await getUserShops(user.id)

  return NextResponse.json({ shops })
})
