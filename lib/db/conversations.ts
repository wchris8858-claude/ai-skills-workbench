/**
 * 对话数据库操作
 * 使用 Service Role Key 绕过 RLS，支持自定义认证系统
 */

import { getSupabaseAdmin } from '@/lib/supabase'
import { DbConversation } from './index'
import { Conversation } from '@/types'
import { logger } from '@/lib/logger'

// 获取 Supabase 客户端（使用 Service Role Key）
const getDb = () => getSupabaseAdmin()

// Supabase 查询结果类型
type ConversationWithSkillAndMessages = DbConversation & {
  skills: {
    name: string
    icon: string
  } | null
  messages: Array<{
    content: string
    created_at: string
  }>
}

// 将数据库记录转换为前端类型
function dbConversationToConversation(dbConv: DbConversation): Omit<Conversation, 'messages'> {
  return {
    id: dbConv.id,
    userId: dbConv.user_id,
    skillId: dbConv.skill_id,
    createdAt: new Date(dbConv.created_at),
    updatedAt: new Date(dbConv.updated_at),
  }
}

/**
 * 创建新对话
 */
export async function createConversation(
  userId: string,
  skillId: string
): Promise<string | null> {
  const { data, error } = await getDb()
    .from('conversations')
    .insert({
      user_id: userId,
      skill_id: skillId,
    })
    .select('id')
    .single()

  if (error) {
    console.error('Error creating conversation:', error)
    return null
  }

  return data?.id || null
}

/**
 * 获取用户的所有对话
 */
export async function getUserConversations(
  userId: string
): Promise<Omit<Conversation, 'messages'>[]> {
  const { data, error } = await getDb()
    .from('conversations')
    .select('id, user_id, skill_id, created_at, updated_at')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })

  if (error) {
    console.error('Error fetching conversations:', error)
    return []
  }

  return (data || []).map(dbConversationToConversation)
}

/**
 * 获取用户在特定技能下的对话
 */
export async function getUserConversationsBySkill(
  userId: string,
  skillId: string
): Promise<Omit<Conversation, 'messages'>[]> {
  const { data, error } = await getDb()
    .from('conversations')
    .select('id, user_id, skill_id, created_at, updated_at')
    .eq('user_id', userId)
    .eq('skill_id', skillId)
    .order('updated_at', { ascending: false })

  if (error) {
    console.error('Error fetching conversations by skill:', error)
    return []
  }

  return (data || []).map(dbConversationToConversation)
}

/**
 * 获取单个对话
 */
export async function getConversationById(
  conversationId: string
): Promise<Omit<Conversation, 'messages'> | null> {
  const { data, error } = await getDb()
    .from('conversations')
    .select('id, user_id, skill_id, created_at, updated_at')
    .eq('id', conversationId)
    .single()

  if (error) {
    console.error('Error fetching conversation:', error)
    return null
  }

  return data ? dbConversationToConversation(data) : null
}

/**
 * 更新对话时间戳
 */
export async function updateConversationTimestamp(
  conversationId: string
): Promise<void> {
  const { error } = await getDb()
    .from('conversations')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', conversationId)

  if (error) {
    console.error('Error updating conversation timestamp:', error)
  }
}

/**
 * 删除对话（同时会删除关联的消息，因为有 ON DELETE CASCADE）
 */
export async function deleteConversation(
  conversationId: string
): Promise<boolean> {
  const { error } = await getDb()
    .from('conversations')
    .delete()
    .eq('id', conversationId)

  if (error) {
    console.error('Error deleting conversation:', error)
    return false
  }

  return true
}

/**
 * 删除用户的所有对话
 */
export async function deleteAllUserConversations(
  userId: string
): Promise<boolean> {
  const { error } = await getDb()
    .from('conversations')
    .delete()
    .eq('user_id', userId)

  if (error) {
    console.error('Error deleting all conversations:', error)
    return false
  }

  return true
}

/**
 * 获取或创建对话
 * 如果用户在该技能下已有活跃对话，返回最近的；否则创建新对话
 */
export async function getOrCreateConversation(
  userId: string,
  skillId: string,
  createNew: boolean = false
): Promise<string | null> {
  logger.db.query('getOrCreateConversation', 'conversations', { userId, skillId, createNew })

  if (!createNew) {
    // 查找最近的对话
    const { data, error } = await getDb()
      .from('conversations')
      .select('id')
      .eq('user_id', userId)
      .eq('skill_id', skillId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned,这不是错误
      logger.db.error('查询对话失败', error)
    }

    if (data?.id) {
      logger.db.success('找到已存在的对话', data.id)
      return data.id
    }

    logger.debug('未找到已存在对话，准备创建新对话')
  }

  // 创建新对话
  const newConvId = await createConversation(userId, skillId)
  logger.db.success('新对话已创建', newConvId)
  return newConvId
}

/**
 * 获取用户最近的对话列表（带技能信息）
 * 只返回有消息的对话
 */
export async function getRecentConversationsWithSkills(
  userId: string,
  limit: number = 20
): Promise<Array<{
  conversation: Omit<Conversation, 'messages'>
  skillName: string
  skillIcon: string
  lastMessagePreview: string | null
}>> {
  logger.db.query('getRecentConversationsWithSkills', 'conversations', { userId, limit })

  const { data, error } = await getDb()
    .from('conversations')
    .select(`
      *,
      skills:skill_id (name, icon),
      messages (content, created_at)
    `)
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(limit)

  if (error) {
    logger.db.error('获取历史对话失败', error)
    return []
  }

  logger.debug(`查询到 ${data?.length || 0} 条对话记录`)

  // 只返回有消息的对话
  const conversationsWithMessages = (data || [])
    .filter((item: ConversationWithSkillAndMessages) => {
      const hasMessages = item.messages && item.messages.length > 0
      if (!hasMessages) {
        logger.debug(`对话 ${item.id} 没有消息，跳过`)
      }
      return hasMessages
    })
    .map((item: ConversationWithSkillAndMessages) => {
      const messages = item.messages || []
      const lastMessage = messages.sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )[0]

      return {
        conversation: dbConversationToConversation(item),
        skillName: item.skills?.name || '未知技能',
        skillIcon: item.skills?.icon || 'MessageCircle',
        lastMessagePreview: lastMessage?.content?.slice(0, 50) || null,
      }
    })

  logger.db.success(`返回 ${conversationsWithMessages.length} 条有消息的对话`)
  return conversationsWithMessages
}

/**
 * 搜索对话（通过消息内容）
 */
export async function searchConversations(
  userId: string,
  query: string
): Promise<Omit<Conversation, 'messages'>[]> {
  const { data, error } = await getDb()
    .from('messages')
    .select(`
      conversation_id,
      conversations!inner (*)
    `)
    .eq('conversations.user_id', userId)
    .ilike('content', `%${query}%`)
    .limit(50)

  if (error) {
    console.error('Error searching conversations:', error)
    return []
  }

  // 去重并转换
  const uniqueConversations = new Map()
  for (const item of data || []) {
    const conv = (item as any).conversations
    if (conv && !uniqueConversations.has(conv.id)) {
      uniqueConversations.set(conv.id, dbConversationToConversation(conv))
    }
  }

  return Array.from(uniqueConversations.values())
}
