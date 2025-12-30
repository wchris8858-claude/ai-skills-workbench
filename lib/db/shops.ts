/**
 * 店铺数据库操作
 * 使用 Service Role Key 绕过 RLS
 */

import { getSupabaseAdmin } from '@/lib/supabase'
import { logger } from '@/lib/logger'

// 获取 Supabase 客户端
const getDb = () => getSupabaseAdmin()

// 店铺类型定义
export interface Shop {
  id: string
  ownerId: string
  name: string
  industry: string
  address?: string
  description?: string
  targetCustomer?: string
  brandStyle?: string
  slogan?: string
  contactInfo?: {
    phone?: string
    wechat?: string
    email?: string
  }
  logoUrl?: string
  settings?: ShopSettings
  createdAt: Date
  updatedAt: Date
}

export interface ShopSettings {
  // 风格偏好
  style?: 'professional' | 'friendly' | 'playful'
  emojiLevel?: 'none' | 'light' | 'moderate' | 'heavy'
  signature?: string
  // 功能开关
  enableKnowledgeBase?: boolean
  enableTraining?: boolean
  enableAnalytics?: boolean
}

export interface ShopMember {
  id: string
  shopId: string
  userId: string
  role: 'admin' | 'operator' | 'staff'
  permissions?: Record<string, boolean>
  joinedAt: Date
}

// 数据库记录类型
interface DbShop {
  id: string
  owner_id: string
  name: string
  industry: string
  address: string | null
  description: string | null
  target_customer: string | null
  brand_style: string | null
  slogan: string | null
  contact_info: Record<string, string> | null
  logo_url: string | null
  settings: ShopSettings | null
  created_at: string
  updated_at: string
}

interface DbShopMember {
  id: string
  shop_id: string
  user_id: string
  role: string
  permissions: Record<string, boolean> | null
  joined_at: string
}

// 转换函数
function dbShopToShop(dbShop: DbShop): Shop {
  return {
    id: dbShop.id,
    ownerId: dbShop.owner_id,
    name: dbShop.name,
    industry: dbShop.industry,
    address: dbShop.address ?? undefined,
    description: dbShop.description ?? undefined,
    targetCustomer: dbShop.target_customer ?? undefined,
    brandStyle: dbShop.brand_style ?? undefined,
    slogan: dbShop.slogan ?? undefined,
    contactInfo: dbShop.contact_info ?? undefined,
    logoUrl: dbShop.logo_url ?? undefined,
    settings: dbShop.settings ?? undefined,
    createdAt: new Date(dbShop.created_at),
    updatedAt: new Date(dbShop.updated_at),
  }
}

function dbMemberToMember(dbMember: DbShopMember): ShopMember {
  return {
    id: dbMember.id,
    shopId: dbMember.shop_id,
    userId: dbMember.user_id,
    role: dbMember.role as ShopMember['role'],
    permissions: dbMember.permissions ?? undefined,
    joinedAt: new Date(dbMember.joined_at),
  }
}

/**
 * 创建店铺
 */
export async function createShop(
  ownerId: string,
  data: Omit<Shop, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>
): Promise<Shop | null> {
  logger.db.query('createShop', 'shops', { ownerId, name: data.name })

  const { data: shop, error } = await getDb()
    .from('shops')
    .insert({
      owner_id: ownerId,
      name: data.name,
      industry: data.industry,
      address: data.address || null,
      description: data.description || null,
      target_customer: data.targetCustomer || null,
      brand_style: data.brandStyle || null,
      slogan: data.slogan || null,
      contact_info: data.contactInfo || null,
      logo_url: data.logoUrl || null,
      settings: data.settings || null,
    })
    .select()
    .single()

  if (error) {
    logger.db.error('createShop 失败', { code: error.code, message: error.message })
    return null
  }

  logger.db.success('createShop 成功', shop?.id)
  return shop ? dbShopToShop(shop) : null
}

/**
 * 获取用户拥有的店铺
 */
export async function getUserShops(userId: string): Promise<Shop[]> {
  const { data, error } = await getDb()
    .from('shops')
    .select('*')
    .eq('owner_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    logger.db.error('getUserShops 失败', { code: error.code, message: error.message })
    return []
  }

  return (data || []).map(dbShopToShop)
}

/**
 * 获取用户可访问的所有店铺（包括作为成员加入的）
 */
export async function getAccessibleShops(userId: string): Promise<Shop[]> {
  // 获取拥有的店铺
  const { data: ownedShops, error: ownedError } = await getDb()
    .from('shops')
    .select('*')
    .eq('owner_id', userId)

  if (ownedError) {
    logger.db.error('getAccessibleShops - owned 失败', { code: ownedError.code })
    return []
  }

  // 获取作为成员加入的店铺
  const { data: memberShops, error: memberError } = await getDb()
    .from('shop_members')
    .select('shops(*)')
    .eq('user_id', userId)

  if (memberError) {
    logger.db.error('getAccessibleShops - member 失败', { code: memberError.code })
    return (ownedShops || []).map(dbShopToShop)
  }

  // 合并结果
  const allShops = [...(ownedShops || [])]
  for (const item of memberShops || []) {
    const shopData = item.shops as unknown as DbShop | null
    if (shopData && !allShops.find(s => s.id === shopData.id)) {
      allShops.push(shopData)
    }
  }

  return allShops.map(dbShopToShop)
}

/**
 * 获取单个店铺
 */
export async function getShopById(shopId: string): Promise<Shop | null> {
  const { data, error } = await getDb()
    .from('shops')
    .select('*')
    .eq('id', shopId)
    .single()

  if (error) {
    if (error.code !== 'PGRST116') {
      logger.db.error('getShopById 失败', { code: error.code, message: error.message })
    }
    return null
  }

  return data ? dbShopToShop(data) : null
}

/**
 * 更新店铺
 */
export async function updateShop(
  shopId: string,
  data: Partial<Omit<Shop, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>>
): Promise<Shop | null> {
  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }

  if (data.name !== undefined) updateData.name = data.name
  if (data.industry !== undefined) updateData.industry = data.industry
  if (data.address !== undefined) updateData.address = data.address
  if (data.description !== undefined) updateData.description = data.description
  if (data.targetCustomer !== undefined) updateData.target_customer = data.targetCustomer
  if (data.brandStyle !== undefined) updateData.brand_style = data.brandStyle
  if (data.slogan !== undefined) updateData.slogan = data.slogan
  if (data.contactInfo !== undefined) updateData.contact_info = data.contactInfo
  if (data.logoUrl !== undefined) updateData.logo_url = data.logoUrl
  if (data.settings !== undefined) updateData.settings = data.settings

  const { data: shop, error } = await getDb()
    .from('shops')
    .update(updateData)
    .eq('id', shopId)
    .select()
    .single()

  if (error) {
    logger.db.error('updateShop 失败', { code: error.code, message: error.message })
    return null
  }

  return shop ? dbShopToShop(shop) : null
}

/**
 * 删除店铺
 */
export async function deleteShop(shopId: string): Promise<boolean> {
  const { error } = await getDb()
    .from('shops')
    .delete()
    .eq('id', shopId)

  if (error) {
    logger.db.error('deleteShop 失败', { code: error.code, message: error.message })
    return false
  }

  return true
}

/**
 * 添加店铺成员
 */
export async function addShopMember(
  shopId: string,
  userId: string,
  role: ShopMember['role'] = 'staff',
  permissions?: Record<string, boolean>
): Promise<ShopMember | null> {
  const { data, error } = await getDb()
    .from('shop_members')
    .insert({
      shop_id: shopId,
      user_id: userId,
      role,
      permissions: permissions || null,
    })
    .select()
    .single()

  if (error) {
    logger.db.error('addShopMember 失败', { code: error.code, message: error.message })
    return null
  }

  return data ? dbMemberToMember(data) : null
}

/**
 * 获取店铺成员列表
 */
export async function getShopMembers(shopId: string): Promise<ShopMember[]> {
  const { data, error } = await getDb()
    .from('shop_members')
    .select('*')
    .eq('shop_id', shopId)
    .order('joined_at', { ascending: true })

  if (error) {
    logger.db.error('getShopMembers 失败', { code: error.code, message: error.message })
    return []
  }

  return (data || []).map(dbMemberToMember)
}

/**
 * 更新成员角色
 */
export async function updateMemberRole(
  shopId: string,
  userId: string,
  role: ShopMember['role'],
  permissions?: Record<string, boolean>
): Promise<boolean> {
  const updateData: Record<string, unknown> = { role }
  if (permissions !== undefined) {
    updateData.permissions = permissions
  }

  const { error } = await getDb()
    .from('shop_members')
    .update(updateData)
    .eq('shop_id', shopId)
    .eq('user_id', userId)

  if (error) {
    logger.db.error('updateMemberRole 失败', { code: error.code, message: error.message })
    return false
  }

  return true
}

/**
 * 移除店铺成员
 */
export async function removeShopMember(
  shopId: string,
  userId: string
): Promise<boolean> {
  const { error } = await getDb()
    .from('shop_members')
    .delete()
    .eq('shop_id', shopId)
    .eq('user_id', userId)

  if (error) {
    logger.db.error('removeShopMember 失败', { code: error.code, message: error.message })
    return false
  }

  return true
}

/**
 * 检查用户是否有店铺访问权限
 */
export async function hasShopAccess(
  userId: string,
  shopId: string
): Promise<boolean> {
  // 检查是否是所有者
  const { data: shop } = await getDb()
    .from('shops')
    .select('id')
    .eq('id', shopId)
    .eq('owner_id', userId)
    .single()

  if (shop) return true

  // 检查是否是成员
  const { data: member } = await getDb()
    .from('shop_members')
    .select('id')
    .eq('shop_id', shopId)
    .eq('user_id', userId)
    .single()

  return !!member
}

/**
 * 获取用户在店铺中的角色
 */
export async function getUserShopRole(
  userId: string,
  shopId: string
): Promise<'owner' | ShopMember['role'] | null> {
  // 检查是否是所有者
  const { data: shop } = await getDb()
    .from('shops')
    .select('id')
    .eq('id', shopId)
    .eq('owner_id', userId)
    .single()

  if (shop) return 'owner'

  // 检查成员角色
  const { data: member } = await getDb()
    .from('shop_members')
    .select('role')
    .eq('shop_id', shopId)
    .eq('user_id', userId)
    .single()

  return member ? (member.role as ShopMember['role']) : null
}

/**
 * 获取店铺上下文（用于 AI 调用）
 */
export async function getShopContext(shopId: string): Promise<string | null> {
  const shop = await getShopById(shopId)
  if (!shop) return null

  const contextParts: string[] = [
    `店铺名称：${shop.name}`,
    `所属行业：${shop.industry}`,
  ]

  if (shop.description) {
    contextParts.push(`店铺简介：${shop.description}`)
  }
  if (shop.targetCustomer) {
    contextParts.push(`目标客户：${shop.targetCustomer}`)
  }
  if (shop.brandStyle) {
    contextParts.push(`品牌调性：${shop.brandStyle}`)
  }
  if (shop.slogan) {
    contextParts.push(`品牌口号：${shop.slogan}`)
  }
  if (shop.address) {
    contextParts.push(`店铺地址：${shop.address}`)
  }

  return contextParts.join('\n')
}
