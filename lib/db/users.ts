/**
 * 用户数据库操作
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { logger } from '@/lib/logger'
import { User, UserRole } from '@/types'
import { hashPassword, verifyPassword } from '@/lib/auth'

// 用户表字段（不含密码）
const USER_FIELDS = 'id, email, username, name, role, is_active, last_login_at, created_at'
// 用户表字段（含密码，仅用于认证）
const USER_FIELDS_WITH_PASSWORD = `${USER_FIELDS}, password_hash`

// Supabase 客户端
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// 检查是否配置了 Supabase Admin
export const isSupabaseAdminConfigured = Boolean(supabaseUrl && supabaseServiceKey)

let supabaseAdmin: SupabaseClient | null = null

function getSupabaseAdmin(): SupabaseClient {
  if (!isSupabaseAdminConfigured) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY 未配置。请在 .env.local 中添加此环境变量。')
  }

  if (!supabaseAdmin) {
    supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })
  }

  return supabaseAdmin
}

// 数据库记录到 User 对象的转换
function toUser(data: Record<string, unknown>): User {
  return {
    id: data.id as string,
    email: data.email as string | undefined,  // 邮箱可选
    username: data.username as string,
    name: data.name as string | undefined,
    role: data.role as UserRole,
    isActive: data.is_active as boolean ?? true,
    lastLoginAt: data.last_login_at ? new Date(data.last_login_at as string) : undefined,
    createdAt: new Date(data.created_at as string),
  }
}

export interface CreateUserInput {
  email?: string  // 邮箱可选
  username: string
  password: string
  name?: string
  role?: UserRole
}

export interface UpdateUserInput {
  name?: string
  role?: UserRole
  password?: string
  isActive?: boolean
}

/**
 * 创建用户
 */
export async function createUser(input: CreateUserInput): Promise<User> {
  const supabase = getSupabaseAdmin()

  // 哈希密码
  const passwordHash = await hashPassword(input.password)

  const { data, error } = await supabase
    .from('users')
    .insert({
      email: input.email || null,  // 邮箱可为空
      username: input.username,
      password_hash: passwordHash,
      name: input.name || null,
      role: input.role || 'member',
      is_active: true,
      created_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      if (error.message.includes('username')) {
        throw new Error('该用户名已被使用')
      }
      if (error.message.includes('email')) {
        throw new Error('该邮箱已被注册')
      }
    }
    throw new Error(`创建用户失败: ${error.message}`)
  }

  return toUser(data)
}

/**
 * 验证用户登录
 */
export async function authenticateUser(username: string, password: string): Promise<User | null> {
  const supabase = getSupabaseAdmin()

  const { data, error } = await supabase
    .from('users')
    .select(USER_FIELDS_WITH_PASSWORD)
    .eq('username', username)
    .single()

  if (error || !data) {
    return null
  }

  // 检查账户是否激活
  if (!data.is_active) {
    throw new Error('账户已被禁用')
  }

  // 验证密码
  const isValid = await verifyPassword(password, data.password_hash)
  if (!isValid) {
    return null
  }

  // 更新最后登录时间
  await supabase
    .from('users')
    .update({ last_login_at: new Date().toISOString() })
    .eq('id', data.id)

  return toUser(data)
}

/**
 * 根据 ID 获取用户
 */
export async function getUserById(id: string): Promise<User | null> {
  const supabase = getSupabaseAdmin()

  const { data, error } = await supabase
    .from('users')
    .select(USER_FIELDS)
    .eq('id', id)
    .single()

  if (error || !data) {
    return null
  }

  return toUser(data)
}

/**
 * 根据用户名获取用户
 */
export async function getUserByUsername(username: string): Promise<User | null> {
  const supabase = getSupabaseAdmin()

  const { data, error } = await supabase
    .from('users')
    .select(USER_FIELDS)
    .eq('username', username)
    .single()

  if (error || !data) {
    return null
  }

  return toUser(data)
}

/**
 * 根据邮箱获取用户
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  const supabase = getSupabaseAdmin()

  const { data, error } = await supabase
    .from('users')
    .select(USER_FIELDS)
    .eq('email', email)
    .single()

  if (error || !data) {
    return null
  }

  return toUser(data)
}

/**
 * 获取所有用户
 */
export async function getAllUsers(options?: {
  page?: number
  limit?: number
  role?: UserRole
}): Promise<{ users: User[]; total: number }> {
  const supabase = getSupabaseAdmin()
  const page = options?.page || 1
  const limit = options?.limit || 20
  const offset = (page - 1) * limit

  let query = supabase.from('users').select(USER_FIELDS, { count: 'exact' })

  if (options?.role) {
    query = query.eq('role', options.role)
  }

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    throw new Error(`获取用户列表失败: ${error.message}`)
  }

  const users: User[] = (data || []).map(d => toUser(d))

  return { users, total: count || 0 }
}

/**
 * 更新用户
 */
export async function updateUser(id: string, input: UpdateUserInput): Promise<User> {
  const supabase = getSupabaseAdmin()

  const updates: Record<string, unknown> = {}
  if (input.name !== undefined) updates.name = input.name
  if (input.role !== undefined) updates.role = input.role
  if (input.isActive !== undefined) updates.is_active = input.isActive

  // 如果更新密码
  if (input.password) {
    updates.password_hash = await hashPassword(input.password)
  }

  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw new Error(`更新用户失败: ${error.message}`)
  }

  return toUser(data)
}

/**
 * 删除用户
 */
export async function deleteUser(id: string): Promise<void> {
  const supabase = getSupabaseAdmin()

  const { error } = await supabase
    .from('users')
    .delete()
    .eq('id', id)

  if (error) {
    throw new Error(`删除用户失败: ${error.message}`)
  }
}

/**
 * 检查邮箱是否已存在
 * 性能优化: 只查询 id 而不是完整用户对象
 */
export async function emailExists(email: string): Promise<boolean> {
  const supabase = getSupabaseAdmin()

  const { data, error } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .single()

  // PGRST116 = no rows returned, 这不是错误
  if (error && error.code !== 'PGRST116') {
    logger.db.error('检查邮箱失败', error)
  }

  return !!data
}

/**
 * 检查用户名是否已存在
 * 性能优化: 只查询 id 而不是完整用户对象
 */
export async function usernameExists(username: string): Promise<boolean> {
  const supabase = getSupabaseAdmin()

  const { data, error } = await supabase
    .from('users')
    .select('id')
    .eq('username', username)
    .single()

  // PGRST116 = no rows returned, 这不是错误
  if (error && error.code !== 'PGRST116') {
    logger.db.error('检查用户名失败', error)
  }

  return !!data
}
