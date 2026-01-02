/**
 * 用户 API
 * GET /api/users - 获取用户列表
 * POST /api/users - 创建新用户
 */

import { NextRequest, NextResponse } from 'next/server'
import { createUser, getAllUsers, emailExists, usernameExists, isSupabaseAdminConfigured } from '@/lib/db/users'
import { getCurrentUser, isAdmin } from '@/lib/auth'
import { withErrorHandler } from '@/lib/middleware/error-handler'
import { createError } from '@/lib/errors'
import { z } from 'zod'

// 创建用户验证 schema
const CreateUserSchema = z.object({
  email: z.string().email('邮箱格式不正确').optional().or(z.literal('')),  // 邮箱可选
  username: z.string().min(3, '用户名至少3个字符').max(50, '用户名最多50个字符')
    .regex(/^[a-zA-Z0-9_]+$/, '用户名只能包含字母、数字和下划线'),
  password: z.string().min(6, '密码至少6个字符').max(50, '密码最多50个字符'),
  name: z.string().max(100).optional(),
  role: z.enum(['admin', 'member', 'viewer']).optional(),
})

// GET: 获取用户列表
async function getHandler(request: NextRequest) {
  if (!isSupabaseAdminConfigured) {
    throw createError.serviceUnavailable(
      'SUPABASE_SERVICE_ROLE_KEY 未配置',
      { hint: '请在 .env.local 中添加 SUPABASE_SERVICE_ROLE_KEY 环境变量' }
    )
  }

  // 检查登录状态和权限
  const currentUser = await getCurrentUser()
  if (!currentUser) {
    throw createError.unauthorized('请先登录')
  }

  if (!isAdmin(currentUser.role)) {
    throw createError.forbidden('权限不足，需要管理员权限')
  }

  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const role = searchParams.get('role') as 'admin' | 'member' | 'viewer' | null

  const result = await getAllUsers({
    page,
    limit,
    role: role || undefined,
  })

  return NextResponse.json({
    users: result.users,
    total: result.total,
    page,
    limit,
    totalPages: Math.ceil(result.total / limit),
  })
}

// POST: 创建新用户
async function postHandler(request: NextRequest) {
  if (!isSupabaseAdminConfigured) {
    throw createError.serviceUnavailable(
      'SUPABASE_SERVICE_ROLE_KEY 未配置',
      { hint: '请在 .env.local 中添加 SUPABASE_SERVICE_ROLE_KEY 环境变量' }
    )
  }

  // 检查登录状态和权限
  const currentUser = await getCurrentUser()
  if (!currentUser) {
    throw createError.unauthorized('请先登录')
  }

  if (!isAdmin(currentUser.role)) {
    throw createError.forbidden('权限不足，需要管理员权限')
  }

  const body = await request.json()

  // 验证输入
  const result = CreateUserSchema.safeParse(body)
  if (!result.success) {
    throw createError.validation(result.error.issues[0]?.message || '输入验证失败')
  }

  const { email, username, password, name, role } = result.data

  // 检查用户名是否已存在
  if (await usernameExists(username)) {
    throw createError.validation('该用户名已被使用')
  }

  // 检查邮箱是否已存在（仅当提供了邮箱时）
  if (email && await emailExists(email)) {
    throw createError.validation('该邮箱已被注册')
  }

  // 创建用户（邮箱可为空）
  const user = await createUser({ email: email || undefined, username, password, name, role })

  return NextResponse.json({ user }, { status: 201 })
}

export const GET = withErrorHandler(getHandler)
export const POST = withErrorHandler(postHandler)
