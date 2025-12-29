/**
 * 收藏数据库操作
 * 使用 Service Role Key 绕过 RLS，支持自定义认证系统
 */

import { getSupabaseAdmin } from '@/lib/supabase'
import { DbFavorite } from './index'
import { Message } from '@/types'

// 获取 Supabase 客户端（使用 Service Role Key）
const getDb = () => getSupabaseAdmin()

interface Favorite {
  id: string
  userId: string
  conversationId: string | null
  messageId: string | null
  createdAt: Date
}

// Supabase 查询结果类型
type MessageData = {
  id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
  attachments?: unknown
}

type FavoriteWithMessage = DbFavorite & {
  messages: MessageData | null
}

type FavoriteWithMessageNonNull = DbFavorite & {
  messages: MessageData
}

type ConversationData = {
  id: string
  skill_id: string
  created_at: string
  updated_at: string
}

type FavoriteWithConversation = DbFavorite & {
  conversations: ConversationData | null
}

type FavoriteWithConversationNonNull = DbFavorite & {
  conversations: ConversationData
}

// 将数据库记录转换为前端类型
function dbFavoriteToFavorite(dbFav: DbFavorite): Favorite {
  return {
    id: dbFav.id,
    userId: dbFav.user_id,
    conversationId: dbFav.conversation_id,
    messageId: dbFav.message_id,
    createdAt: new Date(dbFav.created_at),
  }
}

/**
 * 批量检查消息是否已收藏
 * 性能优化：避免 N+1 查询问题
 *
 * @param userId - 用户 ID
 * @param messageIds - 消息 ID 数组
 * @returns 已收藏的消息 ID Set
 *
 * @example
 * const messageIds = ['msg1', 'msg2', 'msg3']
 * const favorited = await batchCheckFavorites(userId, messageIds)
 * // favorited = Set(['msg1', 'msg3']) if msg1 and msg3 are favorited
 */
export async function batchCheckFavorites(
  userId: string,
  messageIds: string[]
): Promise<Set<string>> {
  // 空数组直接返回空 Set
  if (messageIds.length === 0) {
    return new Set()
  }

  const { data, error } = await getDb()
    .from('favorites')
    .select('message_id')
    .eq('user_id', userId)
    .in('message_id', messageIds)

  if (error) {
    console.error('Error batch checking favorites:', error)
    return new Set()
  }

  // 返回已收藏的消息 ID Set
  return new Set(
    (data || [])
      .map(item => item.message_id)
      .filter((id): id is string => id !== null)
  )
}

/**
 * 收藏消息
 */
export async function addMessageToFavorites(
  userId: string,
  messageId: string
): Promise<Favorite | null> {
  const { data, error } = await getDb()
    .from('favorites')
    .insert({
      user_id: userId,
      message_id: messageId,
    })
    .select()
    .single()

  if (error) {
    // 如果是重复收藏，返回已存在的收藏
    if (error.code === '23505') {
      const { data: existing } = await getDb()
        .from('favorites')
        .select('*')
        .eq('user_id', userId)
        .eq('message_id', messageId)
        .single()

      return existing ? dbFavoriteToFavorite(existing) : null
    }
    console.error('Error adding message to favorites:', error)
    return null
  }

  return data ? dbFavoriteToFavorite(data) : null
}

/**
 * 收藏对话
 */
export async function addConversationToFavorites(
  userId: string,
  conversationId: string
): Promise<Favorite | null> {
  const { data, error } = await getDb()
    .from('favorites')
    .insert({
      user_id: userId,
      conversation_id: conversationId,
    })
    .select()
    .single()

  if (error) {
    // 如果是重复收藏，返回已存在的收藏
    if (error.code === '23505') {
      const { data: existing } = await getDb()
        .from('favorites')
        .select('*')
        .eq('user_id', userId)
        .eq('conversation_id', conversationId)
        .single()

      return existing ? dbFavoriteToFavorite(existing) : null
    }
    console.error('Error adding conversation to favorites:', error)
    return null
  }

  return data ? dbFavoriteToFavorite(data) : null
}

/**
 * 取消收藏消息
 */
export async function removeMessageFromFavorites(
  userId: string,
  messageId: string
): Promise<boolean> {
  const { error } = await getDb()
    .from('favorites')
    .delete()
    .eq('user_id', userId)
    .eq('message_id', messageId)

  if (error) {
    console.error('Error removing message from favorites:', error)
    return false
  }

  return true
}

/**
 * 取消收藏对话
 */
export async function removeConversationFromFavorites(
  userId: string,
  conversationId: string
): Promise<boolean> {
  const { error } = await getDb()
    .from('favorites')
    .delete()
    .eq('user_id', userId)
    .eq('conversation_id', conversationId)

  if (error) {
    console.error('Error removing conversation from favorites:', error)
    return false
  }

  return true
}

/**
 * 检查消息是否已收藏
 */
export async function isMessageFavorited(
  userId: string,
  messageId: string
): Promise<boolean> {
  const { data, error } = await getDb()
    .from('favorites')
    .select('id')
    .eq('user_id', userId)
    .eq('message_id', messageId)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('Error checking message favorite:', error)
  }

  return !!data
}

/**
 * 检查对话是否已收藏
 */
export async function isConversationFavorited(
  userId: string,
  conversationId: string
): Promise<boolean> {
  const { data, error } = await getDb()
    .from('favorites')
    .select('id')
    .eq('user_id', userId)
    .eq('conversation_id', conversationId)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('Error checking conversation favorite:', error)
  }

  return !!data
}

/**
 * 获取用户收藏的消息列表
 */
export async function getFavoriteMessages(
  userId: string
): Promise<Array<{ favorite: Favorite; message: Message }>> {
  const { data, error } = await getDb()
    .from('favorites')
    .select(`
      *,
      messages:message_id (*)
    `)
    .eq('user_id', userId)
    .not('message_id', 'is', null)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching favorite messages:', error)
    return []
  }

  return (data || [])
    .filter((item: FavoriteWithMessage): item is FavoriteWithMessageNonNull => item.messages !== null)
    .map((item) => ({
      favorite: dbFavoriteToFavorite(item),
      message: {
        id: item.messages.id,
        role: item.messages.role,
        content: item.messages.content,
        timestamp: new Date(item.messages.created_at),
        attachments: item.messages.attachments as Message['attachments'],
      },
    }))
}

/**
 * 获取用户收藏的对话列表
 */
export async function getFavoriteConversations(
  userId: string
): Promise<
  Array<{
    favorite: Favorite
    conversation: { id: string; skillId: string; createdAt: Date }
    skillName: string
  }>
> {
  const { data, error } = await getDb()
    .from('favorites')
    .select(`
      *,
      conversations:conversation_id (
        id,
        skill_id,
        created_at,
        skills:skill_id (name)
      )
    `)
    .eq('user_id', userId)
    .not('conversation_id', 'is', null)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching favorite conversations:', error)
    return []
  }

  return (data || [])
    .filter((item: FavoriteWithConversation): item is FavoriteWithConversationNonNull => item.conversations !== null)
    .map((item) => ({
      favorite: dbFavoriteToFavorite(item),
      conversation: {
        id: item.conversations.id,
        skillId: item.conversations.skill_id,
        createdAt: new Date(item.conversations.created_at),
      },
      skillName: (item.conversations as FavoriteWithConversation['conversations'] & { skills?: { name: string } })?.skills?.name || '未知技能',
    }))
}

/**
 * 获取用户所有收藏
 */
export async function getUserFavorites(userId: string): Promise<Favorite[]> {
  const { data, error } = await getDb()
    .from('favorites')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching user favorites:', error)
    return []
  }

  return (data || []).map(dbFavoriteToFavorite)
}

/**
 * 清空用户所有收藏
 */
export async function clearAllFavorites(userId: string): Promise<boolean> {
  const { error } = await getDb()
    .from('favorites')
    .delete()
    .eq('user_id', userId)

  if (error) {
    console.error('Error clearing favorites:', error)
    return false
  }

  return true
}

/**
 * 获取收藏数量统计
 */
export async function getFavoritesCount(
  userId: string
): Promise<{ messages: number; conversations: number }> {
  const { data: messages, error: msgError } = await getDb()
    .from('favorites')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .not('message_id', 'is', null)

  const { data: conversations, error: convError } = await getDb()
    .from('favorites')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .not('conversation_id', 'is', null)

  if (msgError || convError) {
    console.error('Error fetching favorites count:', msgError || convError)
    return { messages: 0, conversations: 0 }
  }

  return {
    messages: (messages as any)?.count || 0,
    conversations: (conversations as any)?.count || 0,
  }
}

/**
 * 切换消息收藏状态
 */
export async function toggleMessageFavorite(
  userId: string,
  messageId: string
): Promise<{ favorited: boolean; favorite: Favorite | null }> {
  const isFavorited = await isMessageFavorited(userId, messageId)

  if (isFavorited) {
    await removeMessageFromFavorites(userId, messageId)
    return { favorited: false, favorite: null }
  } else {
    const favorite = await addMessageToFavorites(userId, messageId)
    return { favorited: true, favorite }
  }
}

/**
 * 切换对话收藏状态
 */
export async function toggleConversationFavorite(
  userId: string,
  conversationId: string
): Promise<{ favorited: boolean; favorite: Favorite | null }> {
  const isFavorited = await isConversationFavorited(userId, conversationId)

  if (isFavorited) {
    await removeConversationFromFavorites(userId, conversationId)
    return { favorited: false, favorite: null }
  } else {
    const favorite = await addConversationToFavorites(userId, conversationId)
    return { favorited: true, favorite }
  }
}
