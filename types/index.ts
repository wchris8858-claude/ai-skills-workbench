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

export const PRESET_SKILLS: Partial<Skill>[] = [
  {
    id: 'moments-copywriter',
    name: '朋友圈文案',
    description: '一键生成有感染力的朋友圈文案，支持多种风格和场景',
    icon: 'MessageCircle',
    category: '文案创作',
    inputTypes: ['text', 'voice', 'image'],
    source: 'official'
  },
  {
    id: 'video-rewriter',
    name: '视频文案改写',
    description: '把视频内容改写成适合不同平台的文案，保留精华去除敏感词',
    icon: 'Video',
    category: '文案创作',
    inputTypes: ['text', 'voice'],
    source: 'official'
  },
  {
    id: 'viral-analyzer',
    name: '爆款拆解',
    description: '拆解短视频/文案爆款的结构，输出可复用元素和改写建议',
    icon: 'TrendingUp',
    category: '内容分析',
    inputTypes: ['text', 'image'],
    source: 'official'
  },
  {
    id: 'meeting-transcriber',
    name: '会议语音转文字',
    description: '语音转文字 + 自动整理成会议纪要格式',
    icon: 'Mic',
    category: '效率工具',
    inputTypes: ['voice'],
    source: 'official'
  },
  {
    id: 'knowledge-query',
    name: '知识库查询',
    description: '从预设知识库中检索答案，支持多轮追问',
    icon: 'Search',
    category: '效率工具',
    inputTypes: ['text', 'voice'],
    source: 'official'
  },
  {
    id: 'official-notice',
    name: '官方通知',
    description: '生成正式的通知、公告、说明文案',
    icon: 'Bell',
    category: '文案创作',
    inputTypes: ['text'],
    source: 'official'
  },
  {
    id: 'poster-creator',
    name: '海报制作',
    description: '根据需求生成海报设计方案和提示词',
    icon: 'Image',
    category: '视觉设计',
    inputTypes: ['text', 'image'],
    source: 'official'
  },
  {
    id: 'photo-selector',
    name: 'AI 选片修片',
    description: '批量上传照片，AI 自动评分筛选最佳照片并提供专业修图建议',
    icon: 'Camera',
    category: '视觉设计',
    inputTypes: ['image'],
    source: 'official'
  }
]