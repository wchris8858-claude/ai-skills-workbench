/**
 * 内容日历数据库操作
 */

import { getSupabaseAdmin } from '@/lib/supabase'
import { logger } from '@/lib/logger'

const getDb = () => getSupabaseAdmin()

// 内容日历类型
export interface CalendarItem {
  id: string
  shopId: string
  userId: string
  channel: 'douyin' | 'xiaohongshu' | 'moments' | 'video_account'
  scheduledAt: Date
  content: string
  attachments?: {
    type: 'image' | 'video'
    url: string
  }[]
  status: 'draft' | 'scheduled' | 'published' | 'cancelled'
  conversationId?: string
  createdAt: Date
  updatedAt: Date
}

// 数据库记录类型
interface DbCalendarItem {
  id: string
  shop_id: string
  user_id: string
  channel: string
  scheduled_at: string
  content: string
  attachments: unknown[] | null
  status: string
  conversation_id: string | null
  created_at: string
  updated_at: string
}

// 转换函数
function dbItemToItem(dbItem: DbCalendarItem): CalendarItem {
  return {
    id: dbItem.id,
    shopId: dbItem.shop_id,
    userId: dbItem.user_id,
    channel: dbItem.channel as CalendarItem['channel'],
    scheduledAt: new Date(dbItem.scheduled_at),
    content: dbItem.content,
    attachments: dbItem.attachments as CalendarItem['attachments'],
    status: dbItem.status as CalendarItem['status'],
    conversationId: dbItem.conversation_id ?? undefined,
    createdAt: new Date(dbItem.created_at),
    updatedAt: new Date(dbItem.updated_at),
  }
}

/**
 * 创建日历项
 */
export async function createCalendarItem(
  data: Omit<CalendarItem, 'id' | 'createdAt' | 'updatedAt'>
): Promise<CalendarItem | null> {
  logger.db.query('createCalendarItem', 'content_calendar', { shopId: data.shopId })

  const { data: item, error } = await getDb()
    .from('content_calendar')
    .insert({
      shop_id: data.shopId,
      user_id: data.userId,
      channel: data.channel,
      scheduled_at: data.scheduledAt.toISOString(),
      content: data.content,
      attachments: data.attachments || null,
      status: data.status,
      conversation_id: data.conversationId || null,
    })
    .select()
    .single()

  if (error) {
    logger.db.error('createCalendarItem 失败', { code: error.code, message: error.message })
    return null
  }

  return item ? dbItemToItem(item) : null
}

/**
 * 获取店铺的日历内容
 */
export async function getShopCalendarItems(
  shopId: string,
  options?: {
    startDate?: Date
    endDate?: Date
    channel?: CalendarItem['channel']
    status?: CalendarItem['status']
  }
): Promise<CalendarItem[]> {
  let query = getDb()
    .from('content_calendar')
    .select('*')
    .eq('shop_id', shopId)
    .order('scheduled_at', { ascending: true })

  if (options?.startDate) {
    query = query.gte('scheduled_at', options.startDate.toISOString())
  }

  if (options?.endDate) {
    query = query.lte('scheduled_at', options.endDate.toISOString())
  }

  if (options?.channel) {
    query = query.eq('channel', options.channel)
  }

  if (options?.status) {
    query = query.eq('status', options.status)
  }

  const { data, error } = await query

  if (error) {
    logger.db.error('getShopCalendarItems 失败', { code: error.code })
    return []
  }

  return (data || []).map(dbItemToItem)
}

/**
 * 获取用户的日历内容
 */
export async function getUserCalendarItems(
  userId: string,
  shopId: string,
  options?: {
    startDate?: Date
    endDate?: Date
  }
): Promise<CalendarItem[]> {
  let query = getDb()
    .from('content_calendar')
    .select('*')
    .eq('user_id', userId)
    .eq('shop_id', shopId)
    .order('scheduled_at', { ascending: true })

  if (options?.startDate) {
    query = query.gte('scheduled_at', options.startDate.toISOString())
  }

  if (options?.endDate) {
    query = query.lte('scheduled_at', options.endDate.toISOString())
  }

  const { data, error } = await query

  if (error) {
    logger.db.error('getUserCalendarItems 失败', { code: error.code })
    return []
  }

  return (data || []).map(dbItemToItem)
}

/**
 * 更新日历项
 */
export async function updateCalendarItem(
  itemId: string,
  data: Partial<Pick<CalendarItem, 'content' | 'scheduledAt' | 'status' | 'attachments'>>
): Promise<CalendarItem | null> {
  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }

  if (data.content !== undefined) updateData.content = data.content
  if (data.scheduledAt !== undefined) updateData.scheduled_at = data.scheduledAt.toISOString()
  if (data.status !== undefined) updateData.status = data.status
  if (data.attachments !== undefined) updateData.attachments = data.attachments

  const { data: item, error } = await getDb()
    .from('content_calendar')
    .update(updateData)
    .eq('id', itemId)
    .select()
    .single()

  if (error) {
    logger.db.error('updateCalendarItem 失败', { code: error.code })
    return null
  }

  return item ? dbItemToItem(item) : null
}

/**
 * 删除日历项
 */
export async function deleteCalendarItem(itemId: string): Promise<boolean> {
  const { error } = await getDb()
    .from('content_calendar')
    .delete()
    .eq('id', itemId)

  if (error) {
    logger.db.error('deleteCalendarItem 失败', { code: error.code })
    return false
  }

  return true
}

/**
 * 批量创建日历项（一周计划）
 */
export async function createWeeklyPlan(
  shopId: string,
  userId: string,
  items: Array<{
    channel: CalendarItem['channel']
    scheduledAt: Date
    content: string
    attachments?: CalendarItem['attachments']
  }>
): Promise<CalendarItem[]> {
  const { data, error } = await getDb()
    .from('content_calendar')
    .insert(
      items.map(item => ({
        shop_id: shopId,
        user_id: userId,
        channel: item.channel,
        scheduled_at: item.scheduledAt.toISOString(),
        content: item.content,
        attachments: item.attachments || null,
        status: 'draft',
      }))
    )
    .select()

  if (error) {
    logger.db.error('createWeeklyPlan 失败', { code: error.code })
    return []
  }

  return (data || []).map(dbItemToItem)
}

/**
 * 获取今日待发布内容
 */
export async function getTodayScheduledItems(
  shopId: string
): Promise<CalendarItem[]> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const { data, error } = await getDb()
    .from('content_calendar')
    .select('*')
    .eq('shop_id', shopId)
    .eq('status', 'scheduled')
    .gte('scheduled_at', today.toISOString())
    .lt('scheduled_at', tomorrow.toISOString())
    .order('scheduled_at', { ascending: true })

  if (error) {
    logger.db.error('getTodayScheduledItems 失败', { code: error.code })
    return []
  }

  return (data || []).map(dbItemToItem)
}

/**
 * 标记内容为已发布
 */
export async function markAsPublished(itemId: string): Promise<boolean> {
  const { error } = await getDb()
    .from('content_calendar')
    .update({
      status: 'published',
      updated_at: new Date().toISOString(),
    })
    .eq('id', itemId)

  if (error) {
    logger.db.error('markAsPublished 失败', { code: error.code })
    return false
  }

  return true
}
