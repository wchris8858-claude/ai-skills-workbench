/**
 * 统一技能配置
 * 技能元数据配置，用于首页展示和历史记录显示
 */

import { InputType, SkillSource } from '@/types'

/**
 * 技能元数据接口
 */
export interface SkillMetadataConfig {
  id: string
  name: string
  description: string
  icon: string
  category: string
  inputTypes: InputType[]
  placeholder?: string
  source: SkillSource
}

/**
 * 预设技能元数据配置
 * 这里只包含展示用的元数据，模型配置在 lib/models/config.ts
 */
export const PRESET_SKILL_CONFIGS: SkillMetadataConfig[] = [
  {
    id: 'moments-copywriter',
    name: '朋友圈文案',
    description: '一键生成有感染力的朋友圈文案，支持多种风格和场景',
    icon: 'MessageCircle',
    category: '文案创作',
    inputTypes: ['text', 'voice', 'image'],
    placeholder: '描述你想分享的内容、心情或场景...',
    source: 'official',
  },
  {
    id: 'video-rewriter',
    name: '视频文案改写',
    description: '把视频内容改写成适合不同平台的文案，保留精华去除敏感词',
    icon: 'Video',
    category: '文案创作',
    inputTypes: ['text', 'voice'],
    placeholder: '粘贴原视频文案或描述内容...',
    source: 'official',
  },
  {
    id: 'viral-analyzer',
    name: '爆款拆解',
    description: '拆解短视频/文案爆款的结构，输出可复用元素和改写建议',
    icon: 'TrendingUp',
    category: '内容分析',
    inputTypes: ['text', 'image'],
    placeholder: '粘贴爆款文案或描述视频内容...',
    source: 'official',
  },
  {
    id: 'meeting-transcriber',
    name: '会议语音转文字',
    description: '语音转文字 + 自动整理成会议纪要格式',
    icon: 'Mic',
    category: '效率工具',
    inputTypes: ['voice'],
    placeholder: '点击麦克风开始录音...',
    source: 'official',
  },
  {
    id: 'knowledge-query',
    name: '知识库查询',
    description: '从预设知识库中检索答案，支持多轮追问',
    icon: 'Search',
    category: '效率工具',
    inputTypes: ['text', 'voice'],
    placeholder: '输入你的问题...',
    source: 'official',
  },
  {
    id: 'official-notice',
    name: '官方通知',
    description: '生成正式的通知、公告、说明文案',
    icon: 'Bell',
    category: '文案创作',
    inputTypes: ['text'],
    placeholder: '描述通知的主题和要点...',
    source: 'official',
  },
  {
    id: 'poster-creator',
    name: '海报制作',
    description: '根据需求生成海报设计方案和提示词',
    icon: 'Image',
    category: '视觉设计',
    inputTypes: ['text', 'image'],
    placeholder: '描述海报主题、风格和用途...',
    source: 'official',
  },
  {
    id: 'photo-selector',
    name: 'AI 选片修片',
    description: '批量上传照片，AI 自动评分筛选最佳照片并提供专业修图建议',
    icon: 'Camera',
    category: '视觉设计',
    inputTypes: ['image'],
    placeholder: '上传照片开始分析...',
    source: 'official',
  },
]

/**
 * 根据技能 ID 获取技能元数据
 */
export function getSkillMetadata(skillId: string): SkillMetadataConfig | null {
  return PRESET_SKILL_CONFIGS.find(s => s.id === skillId) || null
}

/**
 * 预设技能 ID 到名称的映射（用于快速查找）
 */
export const PRESET_SKILL_NAMES: Record<string, string> = Object.fromEntries(
  PRESET_SKILL_CONFIGS.map(s => [s.id, s.name])
)

/**
 * 预设技能 ID 到图标的映射（用于快速查找）
 */
export const PRESET_SKILL_ICONS: Record<string, string> = Object.fromEntries(
  PRESET_SKILL_CONFIGS.map(s => [s.id, s.icon])
)

/**
 * 检查是否是预设技能
 */
export function isPresetSkill(skillId: string): boolean {
  return PRESET_SKILL_CONFIGS.some(s => s.id === skillId)
}

/**
 * 导出 PRESET_SKILLS 别名（向后兼容）
 * 所有新代码应使用 PRESET_SKILL_CONFIGS
 */
export const PRESET_SKILLS = PRESET_SKILL_CONFIGS
