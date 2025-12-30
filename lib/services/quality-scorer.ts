/**
 * 内容质量评分服务
 * 基于多维度评估生成内容的质量
 */

import { logger } from '@/lib/logger'
import { checkForbiddenWords, Platform } from './forbidden-words'

// 评分维度
export interface QualityDimensions {
  // 原创性 (0-100)
  originality: number
  // 可读性 (0-100)
  readability: number
  // 完整性 (0-100)
  completeness: number
  // 吸引力 (0-100)
  engagement: number
  // 合规性 (0-100)
  compliance: number
}

// 评分结果
export interface QualityScore {
  // 总分 (0-100)
  overall: number
  // 各维度得分
  dimensions: QualityDimensions
  // 评分等级
  grade: 'A' | 'B' | 'C' | 'D' | 'F'
  // 具体反馈
  feedback: QualityFeedback[]
  // 改进建议
  suggestions: string[]
}

export interface QualityFeedback {
  dimension: keyof QualityDimensions
  score: number
  message: string
  severity: 'info' | 'warning' | 'error'
}

// 内容类型
export type ContentType =
  | 'video_script'      // 短视频脚本
  | 'xiaohongshu'       // 小红书笔记
  | 'moments'           // 朋友圈文案
  | 'article'           // 文章
  | 'campaign'          // 活动方案
  | 'reply'             // 回复话术
  | 'general'           // 通用内容

// 各内容类型的评分权重
const DIMENSION_WEIGHTS: Record<ContentType, Record<keyof QualityDimensions, number>> = {
  video_script: {
    originality: 0.25,
    readability: 0.20,
    completeness: 0.25,
    engagement: 0.20,
    compliance: 0.10,
  },
  xiaohongshu: {
    originality: 0.20,
    readability: 0.25,
    completeness: 0.15,
    engagement: 0.30,
    compliance: 0.10,
  },
  moments: {
    originality: 0.15,
    readability: 0.30,
    completeness: 0.10,
    engagement: 0.35,
    compliance: 0.10,
  },
  article: {
    originality: 0.30,
    readability: 0.25,
    completeness: 0.25,
    engagement: 0.10,
    compliance: 0.10,
  },
  campaign: {
    originality: 0.20,
    readability: 0.20,
    completeness: 0.35,
    engagement: 0.15,
    compliance: 0.10,
  },
  reply: {
    originality: 0.10,
    readability: 0.30,
    completeness: 0.20,
    engagement: 0.30,
    compliance: 0.10,
  },
  general: {
    originality: 0.20,
    readability: 0.25,
    completeness: 0.20,
    engagement: 0.20,
    compliance: 0.15,
  },
}

/**
 * 评估内容原创性
 */
function scoreOriginality(text: string, contentType: ContentType): { score: number; feedback: QualityFeedback[] } {
  const feedback: QualityFeedback[] = []
  let score = 80 // 基础分

  // 检查是否使用了过于通用的开头
  const genericStarts = [
    '大家好', '今天', '首先', '作为', '众所周知',
    '相信大家', '想必大家', '不知道大家',
  ]
  const startsWithGeneric = genericStarts.some(s => text.startsWith(s))
  if (startsWithGeneric) {
    score -= 15
    feedback.push({
      dimension: 'originality',
      score: -15,
      message: '开头过于平淡，建议使用更有创意的引入方式',
      severity: 'warning',
    })
  }

  // 检查是否使用了过多的模板化表达
  const templatePhrases = [
    '值得一提的是', '需要注意的是', '总而言之',
    '综上所述', '不得不说', '必须承认',
    '一言难尽', '毋庸置疑', '不可否认',
  ]
  const templateCount = templatePhrases.filter(p => text.includes(p)).length
  if (templateCount > 2) {
    score -= templateCount * 5
    feedback.push({
      dimension: 'originality',
      score: -templateCount * 5,
      message: `使用了 ${templateCount} 处模板化表达，建议用更自然的语言替换`,
      severity: 'warning',
    })
  }

  // 检查内容独特性（通过词汇丰富度）
  const words = text.split(/\s+/)
  const uniqueWords = new Set(words)
  const vocabularyRichness = words.length > 0 ? uniqueWords.size / words.length : 0

  if (vocabularyRichness < 0.3) {
    score -= 10
    feedback.push({
      dimension: 'originality',
      score: -10,
      message: '词汇重复度较高，建议丰富用词',
      severity: 'info',
    })
  } else if (vocabularyRichness > 0.7) {
    score += 10
    feedback.push({
      dimension: 'originality',
      score: 10,
      message: '词汇丰富度高',
      severity: 'info',
    })
  }

  // 根据内容类型调整
  if (contentType === 'video_script') {
    // 短视频需要有"钩子"
    const hasHook = /^[【\[「].+[】\]」]/.test(text) ||
                    text.substring(0, 50).includes('?') ||
                    text.substring(0, 50).includes('？')
    if (!hasHook) {
      score -= 5
      feedback.push({
        dimension: 'originality',
        score: -5,
        message: '短视频开头缺少"钩子"，建议添加吸引注意力的元素',
        severity: 'info',
      })
    }
  }

  return { score: Math.max(0, Math.min(100, score)), feedback }
}

/**
 * 评估内容可读性
 */
function scoreReadability(text: string, contentType: ContentType): { score: number; feedback: QualityFeedback[] } {
  const feedback: QualityFeedback[] = []
  let score = 85 // 基础分

  // 检查句子长度
  const sentences = text.split(/[。！？.!?]+/).filter(s => s.trim().length > 0)
  const avgSentenceLength = sentences.reduce((sum, s) => sum + s.length, 0) / (sentences.length || 1)

  if (avgSentenceLength > 50) {
    score -= 15
    feedback.push({
      dimension: 'readability',
      score: -15,
      message: `平均句子长度 ${Math.round(avgSentenceLength)} 字，建议控制在 30-40 字以内`,
      severity: 'warning',
    })
  } else if (avgSentenceLength > 40) {
    score -= 5
    feedback.push({
      dimension: 'readability',
      score: -5,
      message: '部分句子偏长，可适当拆分',
      severity: 'info',
    })
  }

  // 检查段落结构
  const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0)
  if (paragraphs.length === 1 && text.length > 300) {
    score -= 10
    feedback.push({
      dimension: 'readability',
      score: -10,
      message: '内容缺少分段，建议适当分段提升可读性',
      severity: 'warning',
    })
  }

  // 检查是否有过多的专业术语（针对面向普通消费者的内容）
  if (['moments', 'xiaohongshu'].includes(contentType)) {
    const jargonPatterns = [
      /ROI/i, /GMV/i, /DAU/i, /MAU/i, /SKU/i,
      /转化率/, /复购率/, /客单价/, /坪效/,
    ]
    const jargonCount = jargonPatterns.filter(p => p.test(text)).length
    if (jargonCount > 2) {
      score -= jargonCount * 5
      feedback.push({
        dimension: 'readability',
        score: -jargonCount * 5,
        message: '包含较多专业术语，可能影响普通用户理解',
        severity: 'warning',
      })
    }
  }

  // 检查标点符号使用
  const consecutivePunctuation = /[！？!?]{3,}/.test(text)
  if (consecutivePunctuation) {
    score -= 5
    feedback.push({
      dimension: 'readability',
      score: -5,
      message: '避免使用连续多个感叹号或问号',
      severity: 'info',
    })
  }

  return { score: Math.max(0, Math.min(100, score)), feedback }
}

/**
 * 评估内容完整性
 */
function scoreCompleteness(text: string, contentType: ContentType): { score: number; feedback: QualityFeedback[] } {
  const feedback: QualityFeedback[] = []
  let score = 90 // 基础分

  // 根据内容类型检查必要元素
  switch (contentType) {
    case 'video_script':
      // 检查是否有开场、正文、结尾
      if (text.length < 200) {
        score -= 20
        feedback.push({
          dimension: 'completeness',
          score: -20,
          message: '短视频脚本过短，建议扩充内容',
          severity: 'warning',
        })
      }
      // 检查是否有引导行动
      const hasCTA = /关注|点赞|收藏|评论|转发|私信/.test(text)
      if (!hasCTA) {
        score -= 10
        feedback.push({
          dimension: 'completeness',
          score: -10,
          message: '缺少引导用户行动的内容（如关注、点赞等）',
          severity: 'info',
        })
      }
      break

    case 'xiaohongshu':
      // 检查是否有标题、正文、标签
      // 使用简化的表情检测（常见表情符号范围）
      const hasEmoji = /[\uD83C-\uDBFF][\uDC00-\uDFFF]|[\u2600-\u27BF]/.test(text)
      if (!hasEmoji) {
        score -= 5
        feedback.push({
          dimension: 'completeness',
          score: -5,
          message: '小红书笔记建议添加适当的表情符号',
          severity: 'info',
        })
      }
      const hasHashtag = /#\S+/.test(text)
      if (!hasHashtag) {
        score -= 10
        feedback.push({
          dimension: 'completeness',
          score: -10,
          message: '缺少话题标签，建议添加相关话题',
          severity: 'warning',
        })
      }
      break

    case 'moments':
      // 朋友圈文案不宜过长
      if (text.length > 500) {
        score -= 10
        feedback.push({
          dimension: 'completeness',
          score: -10,
          message: '朋友圈文案偏长，建议精简到 300 字以内',
          severity: 'info',
        })
      }
      break

    case 'campaign':
      // 活动方案需要完整结构
      const campaignElements = ['背景', '目标', '时间', '内容', '预算', '效果']
      const missingElements = campaignElements.filter(e => !text.includes(e))
      if (missingElements.length > 2) {
        score -= missingElements.length * 5
        feedback.push({
          dimension: 'completeness',
          score: -missingElements.length * 5,
          message: `活动方案缺少部分要素：${missingElements.join('、')}`,
          severity: 'warning',
        })
      }
      break
  }

  // 通用检查：是否有明显的截断
  if (text.endsWith('...') || text.endsWith('……')) {
    score -= 15
    feedback.push({
      dimension: 'completeness',
      score: -15,
      message: '内容似乎未完成，请检查是否有截断',
      severity: 'error',
    })
  }

  return { score: Math.max(0, Math.min(100, score)), feedback }
}

/**
 * 评估内容吸引力
 */
function scoreEngagement(text: string, contentType: ContentType): { score: number; feedback: QualityFeedback[] } {
  const feedback: QualityFeedback[] = []
  let score = 75 // 基础分

  // 检查是否有情感词汇
  const emotionalWords = [
    '惊喜', '震撼', '感动', '开心', '难过', '激动',
    '太棒了', '绝了', '爱了', '哭了', '笑死',
    '超级', '非常', '特别', '真的', '太',
  ]
  const emotionalCount = emotionalWords.filter(w => text.includes(w)).length
  if (emotionalCount > 0) {
    score += Math.min(emotionalCount * 3, 15)
    feedback.push({
      dimension: 'engagement',
      score: Math.min(emotionalCount * 3, 15),
      message: '内容包含情感表达，有利于引发共鸣',
      severity: 'info',
    })
  }

  // 检查是否有互动元素
  const interactionPatterns = [
    /你觉得/, /你认为/, /大家觉得/, /有没有人/,
    /评论区/, /告诉我/, /分享一下/,
    /\?|\？/,  // 问句
  ]
  const hasInteraction = interactionPatterns.some(p => p.test(text))
  if (hasInteraction) {
    score += 10
    feedback.push({
      dimension: 'engagement',
      score: 10,
      message: '包含互动引导，有助于提升评论数',
      severity: 'info',
    })
  }

  // 检查是否有故事性
  const storyIndicators = [
    /有一次/, /那天/, /记得/, /当时/, /后来/,
    /突然/, /没想到/, /结果/, /最后/,
  ]
  const hasStory = storyIndicators.filter(p => p.test(text)).length >= 2
  if (hasStory) {
    score += 10
    feedback.push({
      dimension: 'engagement',
      score: 10,
      message: '内容有故事性，更容易吸引读者',
      severity: 'info',
    })
  }

  // 检查开头是否吸引人
  const first50Chars = text.substring(0, 50)
  const attentionGrabbers = [
    /^[\d一二三四五六七八九十]/, // 以数字开头
    /[！!？?]/, // 包含感叹或疑问
    /【|「|\[/, // 特殊标记
    /^不|别|千万/, // 否定开头
  ]
  const hasGrabber = attentionGrabbers.some(p => p.test(first50Chars))
  if (hasGrabber) {
    score += 5
    feedback.push({
      dimension: 'engagement',
      score: 5,
      message: '开头具有吸引力',
      severity: 'info',
    })
  }

  // 针对不同内容类型的特殊检查
  if (contentType === 'xiaohongshu') {
    // 小红书需要"种草感"
    const seedingWords = ['安利', '推荐', '入手', '回购', '必买', '宝藏', '神器']
    const hasSeedingWords = seedingWords.some(w => text.includes(w))
    if (hasSeedingWords) {
      score += 5
    }
  }

  return { score: Math.max(0, Math.min(100, score)), feedback }
}

/**
 * 评估内容合规性
 */
function scoreCompliance(text: string, platform: Platform): { score: number; feedback: QualityFeedback[] } {
  const feedback: QualityFeedback[] = []
  let score = 100 // 合规性从满分开始扣

  // 使用违禁词检测服务
  const forbiddenResult = checkForbiddenWords(text, platform)

  if (forbiddenResult.hasForbidden) {
    // 根据违禁词数量和类型扣分
    for (const match of forbiddenResult.matches) {
      let deduction = 0
      switch (match.category) {
        case 'medical':
        case 'sensitive':
          deduction = 15
          break
        case 'falsePromise':
        case 'absolute':
          deduction = 10
          break
        case 'exaggeration':
          deduction = 8
          break
        default:
          deduction = 5
      }

      score -= deduction
      feedback.push({
        dimension: 'compliance',
        score: -deduction,
        message: `发现违规词"${match.word}"（${match.category}），建议替换为：${match.suggestion}`,
        severity: match.category === 'medical' || match.category === 'sensitive' ? 'error' : 'warning',
      })
    }
  }

  // 检查是否有引导私下交易的内容
  const privateTradePatterns = [
    /私信|私聊|加我|联系方式|微信|wx|vx|薇信/i,
  ]
  if (platform !== 'weixin' && privateTradePatterns.some(p => p.test(text))) {
    score -= 10
    feedback.push({
      dimension: 'compliance',
      score: -10,
      message: '检测到引导私下交易的内容，可能违反平台规则',
      severity: 'warning',
    })
  }

  return { score: Math.max(0, Math.min(100, score)), feedback }
}

/**
 * 计算总体评分和等级
 */
function calculateOverallScore(
  dimensions: QualityDimensions,
  contentType: ContentType
): { overall: number; grade: QualityScore['grade'] } {
  const weights = DIMENSION_WEIGHTS[contentType]

  const overall = Math.round(
    dimensions.originality * weights.originality +
    dimensions.readability * weights.readability +
    dimensions.completeness * weights.completeness +
    dimensions.engagement * weights.engagement +
    dimensions.compliance * weights.compliance
  )

  let grade: QualityScore['grade']
  if (overall >= 90) {
    grade = 'A'
  } else if (overall >= 80) {
    grade = 'B'
  } else if (overall >= 70) {
    grade = 'C'
  } else if (overall >= 60) {
    grade = 'D'
  } else {
    grade = 'F'
  }

  return { overall, grade }
}

/**
 * 生成改进建议
 */
function generateSuggestions(
  dimensions: QualityDimensions,
  feedback: QualityFeedback[],
  contentType: ContentType
): string[] {
  const suggestions: string[] = []

  // 根据各维度得分生成建议
  if (dimensions.originality < 70) {
    suggestions.push('提升原创性：尝试使用更独特的视角或表达方式，避免模板化写作')
  }

  if (dimensions.readability < 70) {
    suggestions.push('改善可读性：缩短句子长度，增加段落分隔，使用更通俗的语言')
  }

  if (dimensions.completeness < 70) {
    suggestions.push('增强完整性：确保内容包含所有必要元素，检查是否有遗漏')
  }

  if (dimensions.engagement < 70) {
    suggestions.push('提升吸引力：增加情感表达、互动元素或故事性内容')
  }

  if (dimensions.compliance < 70) {
    suggestions.push('注意合规性：根据反馈修改违规词汇，确保符合平台规范')
  }

  // 根据具体反馈生成建议
  const errorFeedback = feedback.filter(f => f.severity === 'error')
  if (errorFeedback.length > 0) {
    suggestions.unshift('【重要】请优先处理标记为错误的问题')
  }

  // 内容类型特定建议
  switch (contentType) {
    case 'video_script':
      if (!suggestions.some(s => s.includes('开头'))) {
        suggestions.push('短视频技巧：前 3 秒至关重要，确保有吸引眼球的"钩子"')
      }
      break
    case 'xiaohongshu':
      suggestions.push('小红书技巧：图文结合效果更好，注意话题选择和关键词布局')
      break
    case 'moments':
      suggestions.push('朋友圈技巧：配合 9 宫格图片效果更佳，发布时间选择早中晚三个高峰期')
      break
  }

  return suggestions.slice(0, 5) // 最多返回 5 条建议
}

/**
 * 对内容进行质量评分
 */
export function scoreContent(
  text: string,
  contentType: ContentType = 'general',
  platform: Platform = 'general'
): QualityScore {
  logger.info('[QualityScorer] Scoring content', { contentType, platform, textLength: text.length })

  // 评估各维度
  const originalityResult = scoreOriginality(text, contentType)
  const readabilityResult = scoreReadability(text, contentType)
  const completenessResult = scoreCompleteness(text, contentType)
  const engagementResult = scoreEngagement(text, contentType)
  const complianceResult = scoreCompliance(text, platform)

  // 汇总维度分数
  const dimensions: QualityDimensions = {
    originality: originalityResult.score,
    readability: readabilityResult.score,
    completeness: completenessResult.score,
    engagement: engagementResult.score,
    compliance: complianceResult.score,
  }

  // 汇总反馈
  const feedback: QualityFeedback[] = [
    ...originalityResult.feedback,
    ...readabilityResult.feedback,
    ...completenessResult.feedback,
    ...engagementResult.feedback,
    ...complianceResult.feedback,
  ]

  // 计算总分和等级
  const { overall, grade } = calculateOverallScore(dimensions, contentType)

  // 生成改进建议
  const suggestions = generateSuggestions(dimensions, feedback, contentType)

  const result: QualityScore = {
    overall,
    dimensions,
    grade,
    feedback,
    suggestions,
  }

  logger.info('[QualityScorer] Scoring complete', { overall, grade })

  return result
}

/**
 * 批量评分
 */
export function batchScoreContent(
  contents: Array<{ text: string; contentType?: ContentType; platform?: Platform }>
): QualityScore[] {
  return contents.map(({ text, contentType = 'general', platform = 'general' }) =>
    scoreContent(text, contentType, platform)
  )
}

/**
 * 获取维度名称
 */
export function getDimensionName(dimension: keyof QualityDimensions): string {
  const names: Record<keyof QualityDimensions, string> = {
    originality: '原创性',
    readability: '可读性',
    completeness: '完整性',
    engagement: '吸引力',
    compliance: '合规性',
  }
  return names[dimension]
}

/**
 * 获取等级描述
 */
export function getGradeDescription(grade: QualityScore['grade']): string {
  const descriptions: Record<QualityScore['grade'], string> = {
    A: '优秀 - 内容质量上乘，可直接发布',
    B: '良好 - 内容整体不错，小幅调整即可',
    C: '一般 - 内容及格，建议优化后发布',
    D: '较差 - 内容存在明显问题，需要较大改进',
    F: '不合格 - 内容需要重写或大幅修改',
  }
  return descriptions[grade]
}
