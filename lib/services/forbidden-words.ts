/**
 * 违禁词检测服务
 * 规则引擎优先，LLM 兜底
 */

import { logger } from '@/lib/logger'

// 平台类型
export type Platform = 'douyin' | 'xiaohongshu' | 'weixin' | 'general'

// 检测结果
export interface ForbiddenCheckResult {
  hasForbidden: boolean
  matches: ForbiddenMatch[]
}

export interface ForbiddenMatch {
  word: string
  category: string
  position: number
  context: string
  suggestion: string
}

// 预置违禁词库
const FORBIDDEN_WORDS: Record<string, string[]> = {
  // 广告法绝对化用语
  absolute: [
    '最', '第一', '顶级', '极致', '绝对', '100%', '永久',
    '万能', '祖传', '特效', '无敌', '冠军', '独一无二',
    '唯一', '首选', '最佳', '最优', '最好', '最强',
    '国家级', '世界级', '全球首发', '全网最低',
    '史上最', '前所未有', '绝无仅有',
  ],

  // 医疗相关
  medical: [
    '治疗', '治愈', '疗效', '药效', '康复', '根治',
    '特效药', '医治', '处方', '疾病', '病症', '药物',
    '临床', '诊断', '处方', '医疗器械',
    '抗癌', '防癌', '抗病毒', '杀菌消毒',
  ],

  // 虚假承诺
  falsePromise: [
    '包治', '包好', '保证', '承诺', '一定', '肯定',
    '必须', '绝对有效', '100%有效', '无效退款',
    '立竿见影', '立即见效', '马上见效',
    '永不反弹', '一次根治', '药到病除',
  ],

  // 夸大宣传
  exaggeration: [
    '神奇', '奇迹', '秘方', '祖传秘方', '独家秘方',
    '纯天然', '零添加', '无副作用', '无任何副作用',
    '改变命运', '改变人生', '逆天', '神器',
  ],

  // 敏感词汇
  sensitive: [
    '国家机关', '领导人', '党和国家', '政府',
    '违法', '违规', '走私', '假冒', '仿冒',
  ],

  // 平台特定词（抖音）
  douyin: [
    '点击下方', '私信', '微信', '加我', '联系方式',
    '免费领取', '扫码', 'vx', 'wei信', '薇信',
    '小黄车', '橱窗', '链接在', '评论区见',
  ],

  // 平台特定词（小红书）
  xiaohongshu: [
    '最便宜', '全网最低', '闺蜜价', '内部价',
    '买它', '必买', '无脑入', '冲冲冲',
    '代购', '正品保证', '假一赔十',
  ],
}

// 替换建议
const SUGGESTIONS: Record<string, Record<string, string>> = {
  absolute: {
    '最': '非常/特别',
    '第一': '领先的/优质的',
    '顶级': '高端的/优质的',
    '极致': '精心打造的',
    '100%': '高达/接近',
    '永久': '长期/持久',
    '万能': '多功能',
    '无敌': '出色的',
    '最好': '优质的',
    '最强': '强大的',
    '唯一': '稀有的',
    '首选': '推荐的',
    '最佳': '优秀的',
  },
  medical: {
    '治疗': '调理/改善',
    '治愈': '好转/恢复',
    '疗效': '效果/作用',
    '康复': '恢复',
    '根治': '改善',
  },
  falsePromise: {
    '保证': '期待/希望',
    '承诺': '致力于',
    '一定': '努力做到',
    '肯定': '相信会',
  },
  exaggeration: {
    '神奇': '独特的',
    '奇迹': '惊喜',
    '纯天然': '天然成分',
    '零添加': '少添加',
  },
}

/**
 * 获取替换建议
 */
function getSuggestion(word: string, category: string): string {
  return SUGGESTIONS[category]?.[word] || '建议删除或替换'
}

/**
 * 检测违禁词
 */
export function checkForbiddenWords(
  text: string,
  platform: Platform = 'general'
): ForbiddenCheckResult {
  const matches: ForbiddenMatch[] = []

  // 获取适用的词库
  const categories = ['absolute', 'medical', 'falsePromise', 'exaggeration', 'sensitive']

  // 添加平台特定词库
  if (platform === 'douyin') {
    categories.push('douyin')
  }
  if (platform === 'xiaohongshu') {
    categories.push('xiaohongshu')
  }

  // 遍历检测
  for (const category of categories) {
    const words = FORBIDDEN_WORDS[category]
    if (!words) continue

    for (const word of words) {
      const regex = new RegExp(word, 'gi')
      let match

      while ((match = regex.exec(text)) !== null) {
        // 获取上下文（前后各10个字符）
        const start = Math.max(0, match.index - 10)
        const end = Math.min(text.length, match.index + word.length + 10)
        const context = text.slice(start, end)

        matches.push({
          word: match[0],
          category,
          position: match.index,
          context,
          suggestion: getSuggestion(word, category),
        })
      }
    }
  }

  // 按位置排序
  matches.sort((a, b) => a.position - b.position)

  return {
    hasForbidden: matches.length > 0,
    matches,
  }
}

/**
 * 获取违禁词分类的中文名称
 */
export function getCategoryName(category: string): string {
  const names: Record<string, string> = {
    absolute: '绝对化用语',
    medical: '医疗相关',
    falsePromise: '虚假承诺',
    exaggeration: '夸大宣传',
    sensitive: '敏感词汇',
    douyin: '抖音违规词',
    xiaohongshu: '小红书违规词',
  }
  return names[category] || category
}

/**
 * 自动替换违禁词
 */
export function replaceForbiddenWords(
  text: string,
  platform: Platform = 'general'
): { result: string; replacements: Array<{ original: string; replacement: string }> } {
  const result = checkForbiddenWords(text, platform)

  if (!result.hasForbidden) {
    return { result: text, replacements: [] }
  }

  const replacements: Array<{ original: string; replacement: string }> = []
  let newText = text

  // 按位置倒序替换，避免位置偏移
  const sortedMatches = [...result.matches].sort((a, b) => b.position - a.position)

  for (const match of sortedMatches) {
    const suggestion = match.suggestion
    if (suggestion !== '建议删除或替换') {
      // 获取第一个替换建议
      const replacement = suggestion.split('/')[0]
      newText = newText.slice(0, match.position) + replacement + newText.slice(match.position + match.word.length)

      replacements.push({
        original: match.word,
        replacement,
      })
    }
  }

  return { result: newText, replacements: replacements.reverse() }
}

/**
 * 使用 LLM 进行深度检测（用于规则引擎检测不到的情况）
 */
export async function deepCheckWithLLM(
  text: string,
  platform: Platform = 'general'
): Promise<{
  issues: Array<{
    text: string
    reason: string
    suggestion: string
  }>
}> {
  // 这里可以调用 LLM 进行更深度的检测
  // 目前先返回空结果，后续可以扩展
  logger.info('[ForbiddenWords] Deep LLM check requested', { platform, textLength: text.length })

  return { issues: [] }
}

/**
 * 批量检测多段文本
 */
export function batchCheckForbiddenWords(
  texts: string[],
  platform: Platform = 'general'
): ForbiddenCheckResult[] {
  return texts.map(text => checkForbiddenWords(text, platform))
}

/**
 * 获取所有违禁词（用于前端提示）
 */
export function getAllForbiddenWords(platform: Platform = 'general'): Record<string, string[]> {
  const result: Record<string, string[]> = {
    absolute: FORBIDDEN_WORDS.absolute,
    medical: FORBIDDEN_WORDS.medical,
    falsePromise: FORBIDDEN_WORDS.falsePromise,
    exaggeration: FORBIDDEN_WORDS.exaggeration,
    sensitive: FORBIDDEN_WORDS.sensitive,
  }

  if (platform === 'douyin') {
    result.douyin = FORBIDDEN_WORDS.douyin
  }
  if (platform === 'xiaohongshu') {
    result.xiaohongshu = FORBIDDEN_WORDS.xiaohongshu
  }

  return result
}
