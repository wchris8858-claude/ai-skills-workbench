/**
 * AI 掌柜 v2.0 模型配置
 *
 * 按复杂度分级，支持降级策略
 *
 * 模型等级:
 * - high: 复杂任务（深度分析、活动策划、RAG问答）
 * - medium: 中等任务（文案生成、爆款拆解）
 * - low: 简单任务（改写、质量评分、违禁词检测）
 */

export type ModelLevel = 'high' | 'medium' | 'low'
export type ModelProvider = 'anthropic' | 'tongyi' | 'siliconflow' | 'jimeng' | 'xunfei'

// 单个模型配置
export interface ModelConfig {
  provider: ModelProvider
  model: string
  fallback?: ModelConfig
}

// 完整模型配置
export interface AIModelConfig {
  text: Record<ModelLevel, ModelConfig>
  image: {
    primary: ModelConfig
    fallback?: ModelConfig
  }
  vision: {
    primary: ModelConfig
    fallback?: ModelConfig
  }
  speech: {
    primary: ModelConfig
    fallback?: ModelConfig
  }
  embedding: {
    provider: ModelProvider
    model: string
    dimension: number
  }
}

/**
 * 默认模型配置
 * 按需求文档配置
 */
export const MODEL_CONFIG: AIModelConfig = {
  // 文本生成模型（分级）
  text: {
    high: {
      provider: 'anthropic',
      model: 'claude-3-5-sonnet-20241022',
      fallback: {
        provider: 'tongyi',
        model: 'qwen-max',
      },
    },
    medium: {
      provider: 'anthropic',
      model: 'claude-3-5-haiku-20241022',
      fallback: {
        provider: 'tongyi',
        model: 'qwen-turbo',
      },
    },
    low: {
      provider: 'tongyi',
      model: 'qwen-turbo',
      fallback: {
        provider: 'siliconflow',
        model: 'glm-4-flash',
      },
    },
  },

  // 图像生成模型
  image: {
    primary: {
      provider: 'jimeng',
      model: 'jimeng-2.1',
    },
    fallback: {
      provider: 'tongyi',
      model: 'wanx-v1',
    },
  },

  // 视觉理解模型
  vision: {
    primary: {
      provider: 'anthropic',
      model: 'claude-3-5-sonnet-20241022',
    },
    fallback: {
      provider: 'tongyi',
      model: 'qwen-vl-max',
    },
  },

  // 语音识别模型
  speech: {
    primary: {
      provider: 'siliconflow',
      model: 'whisper-large-v3',
    },
    fallback: {
      provider: 'xunfei',
      model: 'iat',
    },
  },

  // 向量模型
  embedding: {
    provider: 'tongyi',
    model: 'text-embedding-v3',
    dimension: 1024,
  },
}

/**
 * 功能到模型等级的映射
 */
export const FEATURE_MODEL_MAP: Record<string, ModelLevel> = {
  // 自媒体工具库
  'video_script': 'medium',
  'xiaohongshu': 'medium',
  'viral_analyze': 'high',
  'rewrite': 'low',

  // 私域运营助理
  'moments': 'medium',
  'campaign': 'high',
  'poster_copy': 'low',
  'analytics': 'high',

  // 品牌知识库
  'knowledge_qa': 'high',
  'ai_practice': 'high',
  'exam_generate': 'low',
  'exam_grade': 'medium',
  'doc_summary': 'low',

  // 通用功能
  'quality_score': 'low',
  'forbidden_check': 'low',
}

/**
 * 获取功能对应的模型配置
 */
export function getModelForFeature(feature: string): ModelConfig {
  const level = FEATURE_MODEL_MAP[feature] || 'medium'
  return MODEL_CONFIG.text[level]
}

/**
 * 获取带降级的模型配置
 * 返回主模型和备选模型列表
 */
export function getModelWithFallbacks(feature: string): ModelConfig[] {
  const primary = getModelForFeature(feature)
  const models: ModelConfig[] = [primary]

  let current = primary
  while (current.fallback) {
    models.push(current.fallback)
    current = current.fallback
  }

  return models
}

/**
 * 模型提示词模板
 */
export const SYSTEM_PROMPTS = {
  // 短视频脚本
  video_script: `# 角色设定
你是一位专业的短视频脚本创作专家，专门为实体店创作适合抖音、视频号等平台的营销短视频脚本。

# 输出格式
请生成 3 个不同风格的版本，每个版本包含：
1. 风格标签（如：专业干货版/亲切日常版/热点结合版）
2. 脚本类型（口播/混剪/情景）
3. 预估时长
4. 完整脚本内容：
   - 🎣 开场 Hook（前3秒抓住注意力）
   - 📝 内容主体（核心价值点）
   - 📢 结尾 CTA（引导关注/评论/私信）
5. 拍摄建议（场景、道具、表情）
6. BGM 风格建议

# 创作原则
1. Hook 必须在 3 秒内抓住注意力
2. 内容要有价值感，不能纯广告
3. 语言要口语化，像朋友聊天
4. 结尾要有明确的行动指引

# 禁止内容
- 不要使用绝对化用语（最好、第一、顶级等）
- 不要虚假承诺效果
- 不要贬低竞争对手`,

  // 小红书笔记
  xiaohongshu: `# 角色设定
你是一位资深小红书运营专家，擅长创作高互动、易种草的小红书笔记。

# 输出格式
请生成 3 个版本，每个版本包含：
1. 标题（3 个可选标题）
2. 正文（带 emoji、分段、口语化）
3. 标签推荐（5-8 个相关热门标签）
4. 配图建议

# 小红书爆款公式
- 标题：数字 + 痛点/好奇心 + 解决方案
- 开头：共情/提问/反常识
- 内容：真实体验 + 干货价值
- 结尾：互动引导`,

  // 爆款拆解
  viral_analyze: `# 角色设定
你是一位资深内容分析专家，擅长拆解爆款内容的底层逻辑和可复用套路。

# 分析维度
1. **基本信息判断** - 内容类型、所属领域、目标受众
2. **Hook 分析** - 使用的技巧、可复用的模板
3. **结构拆解** - 内容框架、各部分占比、节奏把控
4. **爆款元素识别** - 选题角度、人设塑造、表达技巧、情感共鸣点
5. **可复用模板** - 标题模板、结构模板、话术模板
6. **本地化改编建议**`,

  // 朋友圈助手
  moments: `# 角色设定
你是一位专业的私域运营专家，擅长撰写高质量的朋友圈文案。

# 输出格式
请生成 3 个不同风格的版本，每个版本包含：
1. 文案正文（适合朋友圈的长度）
2. 配图建议
3. 发布时间建议

# 内容类型参考
- 日常分享：展示真实经营状态，拉近与客户的距离
- 专业内容：知识科普，建立专业形象
- 客户见证：案例展示，增强信任感
- 促销活动：突出优惠，制造紧迫感
- 人设塑造：展示个人生活，建立情感连接`,

  // 活动策划
  campaign: `# 角色设定
你是一位资深的门店营销策划专家，擅长为实体店策划各类营销活动。

# 输出方案
1. **活动概览** - 名称、主题、时间、目标人群、预期效果
2. **活动规则** - 参与方式、优惠内容、限制条件
3. **执行 SOP** - 活动前准备、活动中执行、活动后跟进
4. **话术包** - 预热话术、邀约话术、接待话术、促单话术
5. **物料清单** - 海报需求、门店布置、赠品建议
6. **复盘模板** - 数据记录表、复盘问题清单`,

  // 智能问答
  knowledge_qa: `你是店铺的智能客服助手。请基于提供的知识库内容回答用户问题。
如果知识库中没有相关信息，请如实说明。
回答时请引用来源。`,

  // AI 对练
  ai_practice: `# 角色设定
你现在扮演一位顾客，正在与店铺员工进行对话。

# 扮演规则
1. 保持角色一致性，像真实顾客一样说话
2. 根据员工的回答决定你的态度变化
3. 如果员工处理得好，可以逐渐被说服
4. 如果员工处理不好，可以表现出不满或失去兴趣
5. 对话控制在 5-10 轮左右
6. 当场景自然结束时，在回复末尾加上 [对话结束]`,

  // 对练评分
  roleplay_score: `# 角色设定
你是一位专业的销售培训教练，需要对员工的对话表现进行评分和反馈。

# 评分维度
1. **话术准确度** (25%) - 是否符合标准话术、关键信息是否准确
2. **响应速度** (10%) - 回复是否及时
3. **情绪管理** (20%) - 面对刁难时的态度、是否保持耐心友好
4. **转化能力** (25%) - 是否成功引导客户、推进销售进程
5. **知识掌握** (20%) - 产品知识运用、价格政策理解

# 输出格式
请输出 JSON 格式的评分结果，包含各维度分数、亮点、改进建议。`,
}

/**
 * 获取功能的系统提示词
 */
export function getSystemPrompt(feature: string, shopContext?: string): string {
  const basePrompt = SYSTEM_PROMPTS[feature as keyof typeof SYSTEM_PROMPTS] || ''

  if (shopContext) {
    return `${basePrompt}

# 店铺信息
${shopContext}`
  }

  return basePrompt
}

/**
 * 环境变量配置
 */
export const API_KEYS = {
  anthropic: process.env.ANTHROPIC_API_KEY,
  tongyi: process.env.TONGYI_API_KEY,
  siliconflow: process.env.SILICONFLOW_API_KEY,
  jimeng: process.env.JIMENG_API_KEY,
  xunfei: {
    appId: process.env.XUNFEI_APP_ID,
    apiKey: process.env.XUNFEI_API_KEY,
  },
  unified: {
    key: process.env.UNIFIED_API_KEY,
    endpoint: process.env.UNIFIED_API_ENDPOINT || 'https://api4.mygptlife.com/v1',
  },
}

/**
 * 检查 API 是否配置
 */
export function isProviderConfigured(provider: ModelProvider): boolean {
  switch (provider) {
    case 'anthropic':
      return Boolean(API_KEYS.anthropic || API_KEYS.unified.key)
    case 'tongyi':
      return Boolean(API_KEYS.tongyi || API_KEYS.unified.key)
    case 'siliconflow':
      return Boolean(API_KEYS.siliconflow || API_KEYS.unified.key)
    case 'jimeng':
      return Boolean(API_KEYS.jimeng)
    case 'xunfei':
      return Boolean(API_KEYS.xunfei.appId && API_KEYS.xunfei.apiKey)
    default:
      return false
  }
}
