/**
 * 单个店铺操作 API
 * GET /api/v2/shops/[shopId] - 获取店铺详情
 * PUT /api/v2/shops/[shopId] - 更新店铺
 * DELETE /api/v2/shops/[shopId] - 删除店铺
 */

import { NextRequest, NextResponse } from 'next/server'
import { getUserFromToken } from '@/lib/auth'
import { getShopById, updateShop, deleteShop, getUserShopRole } from '@/lib/db/shops'
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

  // 获取店铺详情
  const shop = await getShopById(shopId)
  if (!shop) {
    return NextResponse.json({ error: '店铺不存在' }, { status: 404 })
  }

  return NextResponse.json({ shop, role })
})

export const PUT = withErrorHandler(async (
  request: NextRequest,
  { params }: RouteParams
) => {
  const { shopId } = await params

  // 获取当前用户
  const user = await getUserFromToken(request)
  if (!user) {
    return NextResponse.json({ error: '未登录' }, { status: 401 })
  }

  // 检查权限（只有 owner 和 admin 可以更新）
  const role = await getUserShopRole(user.id, shopId)
  if (!role || !['owner', 'admin'].includes(role)) {
    return NextResponse.json({ error: '无权更新该店铺' }, { status: 403 })
  }

  // 解析请求体
  const body = await request.json()
  const { name, industry, description, address, targetCustomer, brandStyle, slogan, contactInfo, logoUrl, settings } = body

  // 更新店铺
  const shop = await updateShop(shopId, {
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
    return NextResponse.json({ error: '更新店铺失败' }, { status: 500 })
  }

  logger.info('[API] Shop updated', { shopId, userId: user.id })

  return NextResponse.json({ shop })
})

export const DELETE = withErrorHandler(async (
  request: NextRequest,
  { params }: RouteParams
) => {
  const { shopId } = await params

  // 获取当前用户
  const user = await getUserFromToken(request)
  if (!user) {
    return NextResponse.json({ error: '未登录' }, { status: 401 })
  }

  // 检查权限（只有 owner 可以删除）
  const role = await getUserShopRole(user.id, shopId)
  if (role !== 'owner') {
    return NextResponse.json({ error: '只有店铺所有者可以删除店铺' }, { status: 403 })
  }

  // 删除店铺
  const success = await deleteShop(shopId)
  if (!success) {
    return NextResponse.json({ error: '删除店铺失败' }, { status: 500 })
  }

  logger.info('[API] Shop deleted', { shopId, userId: user.id })

  return NextResponse.json({ success: true })
})
