/**
 * 消息数据库操作
 * 使用 Service Role Key 绕过 RLS，支持自定义认证系统
 */

import { getSupabaseAdmin } from '@/lib/supabase'
import { DbMessage } from './index'
import { Message } from '@/types'
import { updateConversationTimestamp } from './conversations'
import { logger } from '@/lib/logger'

// 获取 Supabase 客户端（使用 Service Role Key）
const getDb = () => getSupabaseAdmin()

// Supabase 查询结果类型
type MessageWithConversation = DbMessage & {
  conversation_id: string
  conversations: {
    user_id: string
    skill_id: string
  }
}

// 部分消息数据类型（用于部分字段查询）
type PartialMessageData = {
  id: string
  role: 'user' | 'assistant'
  content: string
  attachments: unknown
  created_at: string
}

// 将数据库记录转换为前端类型
function dbMessageToMessage(dbMsg: DbMessage): Message {
  return {
    id: dbMsg.id,
    role: dbMsg.role,
    content: dbMsg.content,
    timestamp: new Date(dbMsg.created_at),
    attachments: dbMsg.attachments as Message['attachments'],
  }
}

// 将部分数据库记录转换为前端类型
function partialMessageToMessage(dbMsg: PartialMessageData): Message {
  return {
    id: dbMsg.id,
    role: dbMsg.role,
    content: dbMsg.content,
    timestamp: new Date(dbMsg.created_at),
    attachments: dbMsg.attachments as Message['attachments'],
  }
}

/**
 * 保存消息到数据库
 */
export async function saveMessage(
  conversationId: string,
  message: Omit<Message, 'id' | 'timestamp'>,
  tokenCount?: number
): Promise<Message | null> {
  logger.db.query('saveMessage', 'messages', { conversationId, role: message.role, contentLength: message.content.length })

  const { data, error} = await getDb()
    .from('messages')
    .insert({
      conversation_id: conversationId,
      role: message.role,
      content: message.content,
      attachments: message.attachments || null,
      token_count: tokenCount || null,
    })
    .select()
    .single()

  if (error) {
    logger.db.error('saveMessage 失败', {
      code: error.code,
      message: error.message,
      details: error.details
    })
    return null
  }

  logger.db.success('saveMessage 成功', data?.id)

  // 更新对话时间戳
  await updateConversationTimestamp(conversationId)

  return data ? dbMessageToMessage(data) : null
}

/**
 * 批量保存消息
 */
export async function saveMessages(
  conversationId: string,
  messages: Array<Omit<Message, 'id' | 'timestamp'>>
): Promise<Message[]> {
  const { data, error } = await getDb()
    .from('messages')
    .insert(
      messages.map((msg) => ({
        conversation_id: conversationId,
        role: msg.role,
        content: msg.content,
        attachments: msg.attachments || null,
      }))
    )
    .select()

  if (error) {
    logger.db.error('批量保存消息失败', error)
    return []
  }

  // 更新对话时间戳
  await updateConversationTimestamp(conversationId)

  return (data || []).map(dbMessageToMessage)
}

/**
 * 获取对话中的所有消息
 */
export async function getConversationMessages(
  conversationId: string
): Promise<Message[]> {
  const { data, error } = await getDb()
    .from('messages')
    .select('id, role, content, attachments, created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })

  if (error) {
    logger.db.error('获取消息列表失败', error)
    return []
  }

  return (data || []).map(partialMessageToMessage)
}

/**
 * 获取对话中的最近 N 条消息
 */
export async function getRecentMessages(
  conversationId: string,
  limit: number = 50
): Promise<Message[]> {
  const { data, error } = await getDb()
    .from('messages')
    .select('id, role, content, attachments, created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    logger.db.error('获取最近消息失败', error)
    return []
  }

  // 反转顺序，使最早的消息在前
  return (data || []).reverse().map(partialMessageToMessage)
}

/**
 * 获取单条消息
 */
export async function getMessageById(
  messageId: string
): Promise<Message | null> {
  const { data, error } = await getDb()
    .from('messages')
    .select('id, role, content, attachments, created_at')
    .eq('id', messageId)
    .single()

  if (error) {
    logger.db.error('获取消息详情失败', error)
    return null
  }

  return data ? partialMessageToMessage(data) : null
}

/**
 * 删除消息
 */
export async function deleteMessage(messageId: string): Promise<boolean> {
  const { error } = await getDb()
    .from('messages')
    .delete()
    .eq('id', messageId)

  if (error) {
    logger.db.error('删除消息失败', error)
    return false
  }

  return true
}

/**
 * 获取用户的所有消息（用于导出）
 */
export async function getAllUserMessages(
  userId: string
): Promise<Array<Message & { conversationId: string; skillId: string }>> {
  const { data, error } = await getDb()
    .from('messages')
    .select(`
      *,
      conversations!inner (user_id, skill_id)
    `)
    .eq('conversations.user_id', userId)
    .order('created_at', { ascending: true })

  if (error) {
    logger.db.error('获取用户所有消息失败', error)
    return []
  }

  return (data || []).map((item: MessageWithConversation) => ({
    ...dbMessageToMessage(item),
    conversationId: item.conversation_id,
    skillId: item.conversations.skill_id,
  }))
}

/**
 * 统计对话中的消息数量
 */
export async function countConversationMessages(
  conversationId: string
): Promise<number> {
  const { count, error } = await getDb()
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .eq('conversation_id', conversationId)

  if (error) {
    logger.db.error('统计消息数量失败', error)
    return 0
  }

  return count || 0
}

/**
 * 获取对话中的最后一条消息
 */
export async function getLastMessage(
  conversationId: string
): Promise<Message | null> {
  const { data, error } = await getDb()
    .from('messages')
    .select('id, role, content, attachments, created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error && error.code !== 'PGRST116') {
    // PGRST116 = no rows returned
    logger.db.error('获取最后一条消息失败', error)
    return null
  }

  return data ? partialMessageToMessage(data) : null
}

/**
 * 获取对话的 Token 总消耗
 */
export async function getConversationTokenCount(
  conversationId: string
): Promise<number> {
  const { data, error } = await getDb()
    .from('messages')
    .select('token_count')
    .eq('conversation_id', conversationId)

  if (error) {
    logger.db.error('获取 Token 统计失败', error)
    return 0
  }

  return (data || []).reduce(
    (sum, msg) => sum + (msg.token_count || 0),
    0
  )
}

/**
 * 分页获取消息
 * @param conversationId 对话ID
 * @param page 页码（从1开始）
 * @param pageSize 每页数量
 * @returns 消息列表和分页信息
 */
export async function getMessagesPaginated(
  conversationId: string,
  page: number = 1,
  pageSize: number = 20
): Promise<{
  messages: Message[]
  total: number
  hasMore: boolean
  page: number
  pageSize: number
}> {
  // 先获取总数
  const { count, error: countError } = await getDb()
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .eq('conversation_id', conversationId)

  if (countError) {
    logger.db.error('分页统计消息失败', countError)
    return { messages: [], total: 0, hasMore: false, page, pageSize }
  }

  const total = count || 0
  const offset = (page - 1) * pageSize

  // 获取分页数据（按时间升序，最早的在前）
  const { data, error } = await getDb()
    .from('messages')
    .select('id, role, content, attachments, created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .range(offset, offset + pageSize - 1)

  if (error) {
    logger.db.error('获取分页消息失败', error)
    return { messages: [], total, hasMore: false, page, pageSize }
  }

  const messages = (data || []).map(partialMessageToMessage)
  const hasMore = offset + messages.length < total

  return {
    messages,
    total,
    hasMore,
    page,
    pageSize,
  }
}

/**
 * 获取更早的消息（用于无限滚动加载历史）
 * @param conversationId 对话ID
 * @param beforeTimestamp 在此时间之前的消息
 * @param limit 获取数量
 */
export async function getMessagesBefore(
  conversationId: string,
  beforeTimestamp: Date,
  limit: number = 20
): Promise<{
  messages: Message[]
  hasMore: boolean
}> {
  const { data, error } = await getDb()
    .from('messages')
    .select('id, role, content, attachments, created_at')
    .eq('conversation_id', conversationId)
    .lt('created_at', beforeTimestamp.toISOString())
    .order('created_at', { ascending: false })
    .limit(limit + 1) // 多获取一条用于判断是否还有更多

  if (error) {
    logger.db.error('获取历史消息失败', error)
    return { messages: [], hasMore: false }
  }

  const hasMore = (data || []).length > limit
  const messages = (data || [])
    .slice(0, limit)
    .reverse()
    .map(partialMessageToMessage)

  return { messages, hasMore }
}

/**
 * 搜索消息内容
 */
export async function searchMessages(
  userId: string,
  query: string,
  limit: number = 50
): Promise<Array<Message & { conversationId: string }>> {
  const { data, error } = await getDb()
    .from('messages')
    .select(`
      *,
      conversations!inner (user_id)
    `)
    .eq('conversations.user_id', userId)
    .ilike('content', `%${query}%`)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    logger.db.error('搜索消息失败', error)
    return []
  }

  return (data || []).map((item: MessageWithConversation) => ({
    ...dbMessageToMessage(item),
    conversationId: item.conversation_id,
  }))
}
