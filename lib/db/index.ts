/**
 * 数据库操作模块索引
 * 统一导出所有数据库操作函数
 */

export * from './skills'
export * from './conversations'
export * from './messages'
export * from './stats'
export * from './favorites'

// 数据库类型定义
export interface DbSkill {
  id: string
  name: string
  description: string
  icon: string
  category: string
  input_types: string[]
  placeholder: string | null
  source: 'official' | 'custom' | 'community'
  owner_id: string | null
  content: string
  metadata: Record<string, any> | null
  is_public: boolean
  usage_count: number
  rating: number | null
  created_at: string
  updated_at: string
}

export interface DbConversation {
  id: string
  user_id: string
  skill_id: string
  created_at: string
  updated_at: string
}

export interface DbMessage {
  id: string
  conversation_id: string
  role: 'user' | 'assistant'
  content: string
  attachments: Record<string, any>[] | null
  token_count: number | null
  created_at: string
}

export interface DbUsageStats {
  id: string
  user_id: string
  skill_id: string
  tokens_used: number
  response_time: number | null
  created_at: string
}

export interface DbFavorite {
  id: string
  user_id: string
  conversation_id: string | null
  message_id: string | null
  created_at: string
}

export interface DbUserProfile {
  id: string
  email: string
  role: 'admin' | 'member' | 'viewer'
  name: string | null
  created_at: string
  updated_at: string
}
