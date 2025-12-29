export type UserRole = 'admin' | 'member' | 'viewer'
export type SkillSource = 'official' | 'custom' | 'community'
export type InputType = 'text' | 'voice' | 'image'

export interface User {
  id: string
  email: string
  username: string
  name?: string
  role: UserRole
  isActive: boolean
  lastLoginAt?: Date
  createdAt: Date
}

/**
 * 模型配置 - 支持单模型或多模型（如语音+LLM）
 */
export interface ModelConfig {
  primary: string
  fallback?: string
  temperature?: number
  maxTokens?: number
}

export interface SkillModelConfig {
  // 单模型配置
  primary?: string
  fallback?: string
  temperature?: number
  maxTokens?: number
  // 多模型配置（如语音转文字场景）
  stt?: string
  llm?: ModelConfig
  image?: ModelConfig
}

export interface SkillMetadata {
  name: string
  description: string
  icon: string
  category: string
  inputTypes: InputType[]
  placeholder?: string
  version?: string
  model?: SkillModelConfig
}

export interface Skill {
  id: string
  name: string
  description: string
  icon: string
  category: string
  inputTypes: InputType[]
  placeholder?: string
  source: SkillSource
  ownerId?: string
  content: string
  metadata: SkillMetadata
  isPublic: boolean
  usageCount: number
  rating?: number
  createdAt: Date
  updatedAt: Date
  // 新增：版本和模型配置
  version?: string
  model?: SkillModelConfig
  // 新增：关联的参考文档路径
  references?: string[]
}

/**
 * 技能加载状态 - 用于渐进式加载
 */
export interface SkillLoadState {
  // 第1层：元数据（启动时加载）
  metadata: boolean
  // 第2层：核心指令（使用时加载）
  content: boolean
  // 第3层：参考文档（按需加载）
  references: boolean
}

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  attachments?: {
    type: 'image'
    url: string
    base64?: string
  }[]
}

export interface Conversation {
  id: string
  userId: string
  skillId: string
  messages: Message[]
  createdAt: Date
  updatedAt: Date
}

export interface UsageStats {
  id: string
  userId: string
  skillId: string
  tokensUsed: number
  responseTime: number
  createdAt: Date
}

export const SKILL_CATEGORIES = [
  '文案创作',
  '内容分析',
  '效率工具',
  '视觉设计',
  '我的技能'
] as const

export type SkillCategory = typeof SKILL_CATEGORIES[number]

// PRESET_SKILLS 已移至 lib/skills/config.ts
// 请使用: import { PRESET_SKILLS } from '@/lib/skills/config'