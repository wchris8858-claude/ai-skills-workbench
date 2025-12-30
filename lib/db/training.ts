/**
 * 培训系统数据库操作
 */

import { getSupabaseAdmin } from '@/lib/supabase'
import { logger } from '@/lib/logger'

const getDb = () => getSupabaseAdmin()

// 学习进度类型
export interface LearningProgress {
  id: string
  userId: string
  shopId: string
  stage: string
  moduleId: string
  status: 'not_started' | 'in_progress' | 'completed'
  score?: number
  completedAt?: Date
  createdAt: Date
  updatedAt: Date
}

// 对练记录类型
export interface RoleplaySession {
  id: string
  userId: string
  shopId: string
  scenario: string
  messages: Array<{
    role: 'customer' | 'employee'
    content: string
    timestamp: string
  }>
  score?: number
  scoreDetails?: {
    accuracy: number
    speed: number
    emotion: number
    conversion: number
    knowledge: number
    total: number
  }
  feedback?: string
  createdAt: Date
}

// 数据库记录类型
interface DbLearningProgress {
  id: string
  user_id: string
  shop_id: string
  stage: string
  module_id: string
  status: string
  score: number | null
  completed_at: string | null
  created_at: string
  updated_at: string
}

interface DbRoleplaySession {
  id: string
  user_id: string
  shop_id: string
  scenario: string
  messages: unknown[]
  score: number | null
  score_details: Record<string, number> | null
  feedback: string | null
  created_at: string
}

// 转换函数
function dbProgressToProgress(dbProgress: DbLearningProgress): LearningProgress {
  return {
    id: dbProgress.id,
    userId: dbProgress.user_id,
    shopId: dbProgress.shop_id,
    stage: dbProgress.stage,
    moduleId: dbProgress.module_id,
    status: dbProgress.status as LearningProgress['status'],
    score: dbProgress.score ?? undefined,
    completedAt: dbProgress.completed_at ? new Date(dbProgress.completed_at) : undefined,
    createdAt: new Date(dbProgress.created_at),
    updatedAt: new Date(dbProgress.updated_at),
  }
}

function dbSessionToSession(dbSession: DbRoleplaySession): RoleplaySession {
  return {
    id: dbSession.id,
    userId: dbSession.user_id,
    shopId: dbSession.shop_id,
    scenario: dbSession.scenario,
    messages: dbSession.messages as RoleplaySession['messages'],
    score: dbSession.score ?? undefined,
    scoreDetails: dbSession.score_details as RoleplaySession['scoreDetails'],
    feedback: dbSession.feedback ?? undefined,
    createdAt: new Date(dbSession.created_at),
  }
}

// ==================== 学习进度操作 ====================

/**
 * 获取用户学习进度
 */
export async function getUserLearningProgress(
  userId: string,
  shopId: string
): Promise<LearningProgress[]> {
  const { data, error } = await getDb()
    .from('learning_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('shop_id', shopId)
    .order('stage', { ascending: true })
    .order('module_id', { ascending: true })

  if (error) {
    logger.db.error('getUserLearningProgress 失败', { code: error.code })
    return []
  }

  return (data || []).map(dbProgressToProgress)
}

/**
 * 获取模块学习进度
 */
export async function getModuleProgress(
  userId: string,
  shopId: string,
  moduleId: string
): Promise<LearningProgress | null> {
  const { data, error } = await getDb()
    .from('learning_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('shop_id', shopId)
    .eq('module_id', moduleId)
    .single()

  if (error) {
    if (error.code !== 'PGRST116') {
      logger.db.error('getModuleProgress 失败', { code: error.code })
    }
    return null
  }

  return data ? dbProgressToProgress(data) : null
}

/**
 * 创建或更新学习进度
 */
export async function upsertLearningProgress(
  userId: string,
  shopId: string,
  data: {
    stage: string
    moduleId: string
    status: LearningProgress['status']
    score?: number
  }
): Promise<LearningProgress | null> {
  const now = new Date().toISOString()
  const insertData = {
    user_id: userId,
    shop_id: shopId,
    stage: data.stage,
    module_id: data.moduleId,
    status: data.status,
    score: data.score || null,
    completed_at: data.status === 'completed' ? now : null,
    updated_at: now,
  }

  const { data: progress, error } = await getDb()
    .from('learning_progress')
    .upsert(insertData, {
      onConflict: 'user_id,shop_id,module_id',
    })
    .select()
    .single()

  if (error) {
    logger.db.error('upsertLearningProgress 失败', { code: error.code, message: error.message })
    return null
  }

  return progress ? dbProgressToProgress(progress) : null
}

/**
 * 标记模块完成
 */
export async function completeModule(
  userId: string,
  shopId: string,
  moduleId: string,
  score: number
): Promise<boolean> {
  const { error } = await getDb()
    .from('learning_progress')
    .update({
      status: 'completed',
      score,
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .eq('shop_id', shopId)
    .eq('module_id', moduleId)

  if (error) {
    logger.db.error('completeModule 失败', { code: error.code })
    return false
  }

  return true
}

/**
 * 获取学习统计
 */
export async function getLearningStats(
  userId: string,
  shopId: string
): Promise<{
  total: number
  completed: number
  inProgress: number
  averageScore: number
}> {
  const { data, error } = await getDb()
    .from('learning_progress')
    .select('status, score')
    .eq('user_id', userId)
    .eq('shop_id', shopId)

  if (error) {
    logger.db.error('getLearningStats 失败', { code: error.code })
    return { total: 0, completed: 0, inProgress: 0, averageScore: 0 }
  }

  const items = data || []
  const completed = items.filter(i => i.status === 'completed')
  const scores = completed.filter(i => i.score !== null).map(i => i.score as number)

  return {
    total: items.length,
    completed: completed.length,
    inProgress: items.filter(i => i.status === 'in_progress').length,
    averageScore: scores.length > 0
      ? scores.reduce((a, b) => a + b, 0) / scores.length
      : 0,
  }
}

// ==================== 对练记录操作 ====================

/**
 * 创建对练记录
 */
export async function createRoleplaySession(
  data: Omit<RoleplaySession, 'id' | 'createdAt'>
): Promise<RoleplaySession | null> {
  logger.db.query('createRoleplaySession', 'roleplay_sessions', { scenario: data.scenario })

  const { data: session, error } = await getDb()
    .from('roleplay_sessions')
    .insert({
      user_id: data.userId,
      shop_id: data.shopId,
      scenario: data.scenario,
      messages: data.messages,
      score: data.score || null,
      score_details: data.scoreDetails || null,
      feedback: data.feedback || null,
    })
    .select()
    .single()

  if (error) {
    logger.db.error('createRoleplaySession 失败', { code: error.code, message: error.message })
    return null
  }

  return session ? dbSessionToSession(session) : null
}

/**
 * 更新对练记录（添加评分）
 */
export async function updateRoleplaySession(
  sessionId: string,
  data: {
    messages?: RoleplaySession['messages']
    score?: number
    scoreDetails?: RoleplaySession['scoreDetails']
    feedback?: string
  }
): Promise<RoleplaySession | null> {
  const updateData: Record<string, unknown> = {}

  if (data.messages !== undefined) updateData.messages = data.messages
  if (data.score !== undefined) updateData.score = data.score
  if (data.scoreDetails !== undefined) updateData.score_details = data.scoreDetails
  if (data.feedback !== undefined) updateData.feedback = data.feedback

  const { data: session, error } = await getDb()
    .from('roleplay_sessions')
    .update(updateData)
    .eq('id', sessionId)
    .select()
    .single()

  if (error) {
    logger.db.error('updateRoleplaySession 失败', { code: error.code })
    return null
  }

  return session ? dbSessionToSession(session) : null
}

/**
 * 获取用户的对练记录
 */
export async function getUserRoleplaySessions(
  userId: string,
  shopId: string,
  options?: {
    scenario?: string
    limit?: number
  }
): Promise<RoleplaySession[]> {
  let query = getDb()
    .from('roleplay_sessions')
    .select('*')
    .eq('user_id', userId)
    .eq('shop_id', shopId)
    .order('created_at', { ascending: false })

  if (options?.scenario) {
    query = query.eq('scenario', options.scenario)
  }

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  const { data, error } = await query

  if (error) {
    logger.db.error('getUserRoleplaySessions 失败', { code: error.code })
    return []
  }

  return (data || []).map(dbSessionToSession)
}

/**
 * 获取单个对练记录
 */
export async function getRoleplaySessionById(
  sessionId: string
): Promise<RoleplaySession | null> {
  const { data, error } = await getDb()
    .from('roleplay_sessions')
    .select('*')
    .eq('id', sessionId)
    .single()

  if (error) {
    if (error.code !== 'PGRST116') {
      logger.db.error('getRoleplaySessionById 失败', { code: error.code })
    }
    return null
  }

  return data ? dbSessionToSession(data) : null
}

/**
 * 获取对练统计
 */
export async function getRoleplayStats(
  userId: string,
  shopId: string
): Promise<{
  totalSessions: number
  averageScore: number
  bestScore: number
  scenarioStats: Record<string, { count: number; averageScore: number }>
}> {
  const { data, error } = await getDb()
    .from('roleplay_sessions')
    .select('scenario, score')
    .eq('user_id', userId)
    .eq('shop_id', shopId)

  if (error) {
    logger.db.error('getRoleplayStats 失败', { code: error.code })
    return {
      totalSessions: 0,
      averageScore: 0,
      bestScore: 0,
      scenarioStats: {},
    }
  }

  const sessions = data || []
  const scores = sessions.filter(s => s.score !== null).map(s => s.score as number)

  // 按场景分组统计
  const scenarioStats: Record<string, { count: number; totalScore: number }> = {}
  for (const session of sessions) {
    if (!scenarioStats[session.scenario]) {
      scenarioStats[session.scenario] = { count: 0, totalScore: 0 }
    }
    scenarioStats[session.scenario].count++
    if (session.score !== null) {
      scenarioStats[session.scenario].totalScore += session.score
    }
  }

  const scenarioStatsResult: Record<string, { count: number; averageScore: number }> = {}
  for (const [scenario, stats] of Object.entries(scenarioStats)) {
    scenarioStatsResult[scenario] = {
      count: stats.count,
      averageScore: stats.count > 0 ? stats.totalScore / stats.count : 0,
    }
  }

  return {
    totalSessions: sessions.length,
    averageScore: scores.length > 0
      ? scores.reduce((a, b) => a + b, 0) / scores.length
      : 0,
    bestScore: scores.length > 0 ? Math.max(...scores) : 0,
    scenarioStats: scenarioStatsResult,
  }
}
