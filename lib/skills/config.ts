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
 *
 * v2.0 技能分类：
 * - 自媒体工具库：短视频脚本、小红书笔记、爆款拆解、改写润色
 * - 私域运营助理：朋友圈文案、活动策划、海报文案、数据分析
 * - 品牌知识库：智能问答、AI 对练、考试生成、考试批改
 */
export const PRESET_SKILL_CONFIGS: SkillMetadataConfig[] = [
  // ===== 自媒体工具库 =====
  {
    id: 'video-script',
    name: '短视频脚本',
    description: '生成抖音、视频号等平台的爆款短视频脚本，包含 Hook、内容、CTA',
    icon: 'Video',
    category: '自媒体工具库',
    inputTypes: ['text', 'voice'],
    placeholder: '描述视频主题、产品卖点或想传达的内容...',
    source: 'official',
  },
  {
    id: 'xiaohongshu',
    name: '小红书笔记',
    description: '生成高互动、易种草的小红书笔记，包含标题、正文、标签推荐',
    icon: 'BookOpen',
    category: '自媒体工具库',
    inputTypes: ['text', 'voice', 'image'],
    placeholder: '描述想分享的内容、产品或体验...',
    source: 'official',
  },
  {
    id: 'viral-analyzer',
    name: '爆款拆解',
    description: '拆解短视频/文案爆款的结构，输出可复用元素和改写建议',
    icon: 'TrendingUp',
    category: '自媒体工具库',
    inputTypes: ['text', 'image'],
    placeholder: '粘贴爆款文案或描述视频内容...',
    source: 'official',
  },
  {
    id: 'video-rewriter',
    name: '改写润色',
    description: '把视频内容改写成适合不同平台的文案，保留精华去除敏感词',
    icon: 'RefreshCw',
    category: '自媒体工具库',
    inputTypes: ['text', 'voice'],
    placeholder: '粘贴原视频文案或描述内容...',
    source: 'official',
  },

  // ===== 私域运营助理 =====
  {
    id: 'moments-copywriter',
    name: '朋友圈文案',
    description: '一键生成有感染力的朋友圈文案，支持多种风格和场景',
    icon: 'MessageCircle',
    category: '私域运营助理',
    inputTypes: ['text', 'voice', 'image'],
    placeholder: '描述你想分享的内容、心情或场景...',
    source: 'official',
  },
  {
    id: 'campaign-planner',
    name: '活动策划',
    description: '生成完整的营销活动方案，包含规则、话术、物料清单',
    icon: 'Calendar',
    category: '私域运营助理',
    inputTypes: ['text'],
    placeholder: '描述活动目的、时间、预算等信息...',
    source: 'official',
  },
  {
    id: 'poster-creator',
    name: '海报文案',
    description: '根据需求生成海报设计方案和文案内容',
    icon: 'Image',
    category: '私域运营助理',
    inputTypes: ['text', 'image'],
    placeholder: '描述海报主题、风格和用途...',
    source: 'official',
  },
  {
    id: 'data-analyst',
    name: '数据分析',
    description: '分析运营数据，生成洞察报告和优化建议',
    icon: 'BarChart3',
    category: '私域运营助理',
    inputTypes: ['text'],
    placeholder: '描述数据情况或上传数据截图...',
    source: 'official',
  },

  // ===== 品牌知识库 =====
  {
    id: 'knowledge-query',
    name: '智能问答',
    description: '基于品牌知识库的智能问答，支持多轮追问',
    icon: 'Search',
    category: '品牌知识库',
    inputTypes: ['text', 'voice'],
    placeholder: '输入你的问题...',
    source: 'official',
  },
  {
    id: 'ai-roleplay',
    name: 'AI 对练',
    description: '模拟客户场景进行对话练习，提升销售技能',
    icon: 'Users',
    category: '品牌知识库',
    inputTypes: ['text', 'voice'],
    placeholder: '选择对练场景开始练习...',
    source: 'official',
  },
  {
    id: 'exam-generator',
    name: '考试生成',
    description: '基于知识库自动生成培训考试题目',
    icon: 'FileQuestion',
    category: '品牌知识库',
    inputTypes: ['text'],
    placeholder: '描述考试范围和题目数量...',
    source: 'official',
  },

  // ===== 效率工具 =====
  {
    id: 'meeting-transcriber',
    name: '会议纪要',
    description: '语音转文字 + 自动整理成会议纪要格式',
    icon: 'Mic',
    category: '效率工具',
    inputTypes: ['voice'],
    placeholder: '点击麦克风开始录音...',
    source: 'official',
  },
  {
    id: 'photo-selector',
    name: 'AI 选片修片',
    description: '批量上传照片，AI 自动评分筛选最佳照片并提供专业修图建议',
    icon: 'Camera',
    category: '效率工具',
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
