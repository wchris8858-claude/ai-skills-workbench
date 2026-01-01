/**
 * 使用统计数据库操作
 * 使用 Service Role Key 绕过 RLS，支持自定义认证系统
 */

import { getSupabaseAdmin } from '@/lib/supabase'
import { DbUsageStats } from './index'
import { UsageStats } from '@/types'
import { logger } from '@/lib/logger'

// 获取 Supabase 客户端（使用 Service Role Key）
const getDb = () => getSupabaseAdmin()

// 将数据库记录转换为前端类型
function dbStatsToStats(dbStats: DbUsageStats): UsageStats {
  return {
    id: dbStats.id,
    userId: dbStats.user_id,
    skillId: dbStats.skill_id,
    tokensUsed: dbStats.tokens_used,
    responseTime: dbStats.response_time || 0,
    createdAt: new Date(dbStats.created_at),
  }
}

/**
 * 记录一次使用
 */
export async function recordUsage(
  userId: string,
  skillId: string,
  tokensUsed: number,
  responseTime?: number
): Promise<UsageStats | null> {
  const { data, error } = await getDb()
    .from('usage_stats')
    .insert({
      user_id: userId,
      skill_id: skillId,
      tokens_used: tokensUsed,
      response_time: responseTime || null,
    })
    .select()
    .single()

  if (error) {
    logger.db.error('记录使用统计失败', error)
    return null
  }

  return data ? dbStatsToStats(data) : null
}

/**
 * 获取用户的使用统计摘要
 */
export async function getUserStatsSummary(userId: string): Promise<{
  totalUsage: number
  totalTokens: number
  avgResponseTime: number
  thisMonthUsage: number
  thisMonthTokens: number
  skillBreakdown: Array<{ skillId: string; count: number; tokens: number }>
}> {
  // 获取所有使用记录
  const { data: allStats, error: allError } = await getDb()
    .from('usage_stats')
    .select('*')
    .eq('user_id', userId)

  if (allError || !allStats) {
    logger.db.error('获取用户统计失败', allError)
    return {
      totalUsage: 0,
      totalTokens: 0,
      avgResponseTime: 0,
      thisMonthUsage: 0,
      thisMonthTokens: 0,
      skillBreakdown: [],
    }
  }

  // 计算本月开始时间
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  // 总体统计
  const totalUsage = allStats.length
  const totalTokens = allStats.reduce((sum, s) => sum + s.tokens_used, 0)
  const responseTimes = allStats.filter((s) => s.response_time).map((s) => s.response_time!)
  const avgResponseTime =
    responseTimes.length > 0
      ? responseTimes.reduce((sum, t) => sum + t, 0) / responseTimes.length
      : 0

  // 本月统计
  const thisMonthStats = allStats.filter(
    (s) => new Date(s.created_at) >= monthStart
  )
  const thisMonthUsage = thisMonthStats.length
  const thisMonthTokens = thisMonthStats.reduce((sum, s) => sum + s.tokens_used, 0)

  // 按技能分组
  const skillMap = new Map<string, { count: number; tokens: number }>()
  for (const stat of allStats) {
    const existing = skillMap.get(stat.skill_id) || { count: 0, tokens: 0 }
    skillMap.set(stat.skill_id, {
      count: existing.count + 1,
      tokens: existing.tokens + stat.tokens_used,
    })
  }

  const skillBreakdown = Array.from(skillMap.entries()).map(([skillId, data]) => ({
    skillId,
    count: data.count,
    tokens: data.tokens,
  }))

  return {
    totalUsage,
    totalTokens,
    avgResponseTime: Math.round(avgResponseTime),
    thisMonthUsage,
    thisMonthTokens,
    skillBreakdown,
  }
}

/**
 * 获取技能的使用统计
 */
export async function getSkillStats(skillId: string): Promise<{
  totalUsage: number
  totalTokens: number
  avgResponseTime: number
  uniqueUsers: number
}> {
  const { data, error } = await getDb()
    .from('usage_stats')
    .select('*')
    .eq('skill_id', skillId)

  if (error || !data) {
    logger.db.error('获取技能统计失败', error)
    return {
      totalUsage: 0,
      totalTokens: 0,
      avgResponseTime: 0,
      uniqueUsers: 0,
    }
  }

  const totalUsage = data.length
  const totalTokens = data.reduce((sum, s) => sum + s.tokens_used, 0)
  const responseTimes = data.filter((s) => s.response_time).map((s) => s.response_time!)
  const avgResponseTime =
    responseTimes.length > 0
      ? responseTimes.reduce((sum, t) => sum + t, 0) / responseTimes.length
      : 0
  const uniqueUsers = new Set(data.map((s) => s.user_id)).size

  return {
    totalUsage,
    totalTokens,
    avgResponseTime: Math.round(avgResponseTime),
    uniqueUsers,
  }
}

/**
 * 获取用户在特定技能上的使用统计
 */
export async function getUserSkillStats(
  userId: string,
  skillId: string
): Promise<{
  totalUsage: number
  totalTokens: number
  lastUsed: Date | null
}> {
  const { data, error } = await getDb()
    .from('usage_stats')
    .select('*')
    .eq('user_id', userId)
    .eq('skill_id', skillId)
    .order('created_at', { ascending: false })

  if (error || !data) {
    logger.db.error('获取用户技能统计失败', error)
    return {
      totalUsage: 0,
      totalTokens: 0,
      lastUsed: null,
    }
  }

  return {
    totalUsage: data.length,
    totalTokens: data.reduce((sum, s) => sum + s.tokens_used, 0),
    lastUsed: data.length > 0 ? new Date(data[0].created_at) : null,
  }
}

/**
 * 获取用户的每日使用趋势（最近 30 天）
 */
export async function getUserDailyTrend(
  userId: string,
  days: number = 30
): Promise<Array<{ date: string; count: number; tokens: number }>> {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const { data, error } = await getDb()
    .from('usage_stats')
    .select('*')
    .eq('user_id', userId)
    .gte('created_at', startDate.toISOString())
    .order('created_at', { ascending: true })

  if (error || !data) {
    logger.db.error('获取每日趋势失败', error)
    return []
  }

  // 按日期分组
  const dailyMap = new Map<string, { count: number; tokens: number }>()

  for (const stat of data) {
    const date = new Date(stat.created_at).toISOString().split('T')[0]
    const existing = dailyMap.get(date) || { count: 0, tokens: 0 }
    dailyMap.set(date, {
      count: existing.count + 1,
      tokens: existing.tokens + stat.tokens_used,
    })
  }

  return Array.from(dailyMap.entries()).map(([date, data]) => ({
    date,
    count: data.count,
    tokens: data.tokens,
  }))
}

/**
 * 获取热门技能排行（基于使用次数）
 */
export async function getPopularSkillsRanking(
  limit: number = 10
): Promise<Array<{ skillId: string; usageCount: number }>> {
  const { data, error } = await getDb()
    .from('usage_stats')
    .select('skill_id')

  if (error || !data) {
    logger.db.error('获取热门技能失败', error)
    return []
  }

  // 按技能分组计数
  const skillCounts = new Map<string, number>()
  for (const stat of data) {
    skillCounts.set(stat.skill_id, (skillCounts.get(stat.skill_id) || 0) + 1)
  }

  // 排序并返回前 N 个
  return Array.from(skillCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([skillId, usageCount]) => ({ skillId, usageCount }))
}

/**
 * 检查用户是否超出速率限制
 */
export async function checkRateLimit(
  userId: string,
  limitPerMinute: number = 10
): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
  const oneMinuteAgo = new Date()
  oneMinuteAgo.setMinutes(oneMinuteAgo.getMinutes() - 1)

  const { count, error } = await getDb()
    .from('usage_stats')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', oneMinuteAgo.toISOString())

  if (error) {
    logger.db.error('检查速率限制失败', error)
    // 出错时允许访问，避免误拦截
    return { allowed: true, remaining: limitPerMinute, resetAt: new Date() }
  }

  const usedCount = count || 0
  const remaining = Math.max(0, limitPerMinute - usedCount)
  const resetAt = new Date()
  resetAt.setMinutes(resetAt.getMinutes() + 1)

  return {
    allowed: usedCount < limitPerMinute,
    remaining,
    resetAt,
  }
}

/**
 * 获取用户的使用历史记录
 */
export async function getUserUsageHistory(
  userId: string,
  page: number = 1,
  pageSize: number = 20
): Promise<{ stats: UsageStats[]; total: number }> {
  const offset = (page - 1) * pageSize

  const { data, error, count } = await getDb()
    .from('usage_stats')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1)

  if (error) {
    logger.db.error('获取使用历史失败', error)
    return { stats: [], total: 0 }
  }

  return {
    stats: (data || []).map(dbStatsToStats),
    total: count || 0,
  }
}
