/**
 * 单个用户 API
 * GET /api/users/[id] - 获取用户详情
 * PATCH /api/users/[id] - 更新用户
 * DELETE /api/users/[id] - 删除用户
 */

import { NextRequest, NextResponse } from 'next/server'
import { getUserById, updateUser, deleteUser, isSupabaseAdminConfigured } from '@/lib/db/users'
import { getCurrentUser, isAdmin } from '@/lib/auth'
import { withErrorHandler } from '@/lib/middleware/error-handler'
import { createError } from '@/lib/errors'
import { z } from 'zod'

// 更新用户验证 schema
const UpdateUserSchema = z.object({
  name: z.string().max(100).optional(),
  role: z.enum(['admin', 'member', 'viewer']).optional(),
  password: z.string().min(6, '密码至少6个字符').max(50).optional(),
  isActive: z.boolean().optional(),
})

// GET: 获取用户详情
async function getHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isSupabaseAdminConfigured) {
    throw createError.serviceUnavailable(
      'SUPABASE_SERVICE_ROLE_KEY 未配置',
      { hint: '请在 .env.local 中添加 SUPABASE_SERVICE_ROLE_KEY 环境变量' }
    )
  }

  // 检查登录状态
  const currentUser = await getCurrentUser()
  if (!currentUser) {
    throw createError.unauthorized('请先登录')
  }

  const { id } = await params

  // 普通用户只能查看自己的信息
  if (!isAdmin(currentUser.role) && currentUser.userId !== id) {
    throw createError.forbidden('权限不足，需要管理员权限')
  }

  const user = await getUserById(id)

  if (!user) {
    throw createError.notFound('用户')
  }

  return NextResponse.json({ user })
}

// PATCH: 更新用户
async function patchHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isSupabaseAdminConfigured) {
    throw createError.serviceUnavailable(
      'SUPABASE_SERVICE_ROLE_KEY 未配置',
      { hint: '请在 .env.local 中添加 SUPABASE_SERVICE_ROLE_KEY 环境变量' }
    )
  }

  // 检查登录状态
  const currentUser = await getCurrentUser()
  if (!currentUser) {
    throw createError.unauthorized('请先登录')
  }

  const { id } = await params
  const body = await request.json()

  // 普通用户只能修改自己的名称和密码
  if (!isAdmin(currentUser.role)) {
    if (currentUser.userId !== id) {
      throw createError.forbidden('权限不足，需要管理员权限')
    }
    // 普通用户不能修改角色和状态
    if (body.role !== undefined || body.isActive !== undefined) {
      throw createError.forbidden('您没有权限修改角色或账户状态')
    }
  }

  // 验证输入
  const result = UpdateUserSchema.safeParse(body)
  if (!result.success) {
    throw createError.validation(result.error.issues[0]?.message || '输入验证失败')
  }

  // 检查用户是否存在
  const existingUser = await getUserById(id)
  if (!existingUser) {
    throw createError.notFound('用户')
  }

  // 防止禁用最后一个管理员
  if (result.data.isActive === false && existingUser.role === 'admin') {
    // 这里可以添加检查是否是最后一个管理员的逻辑
  }

  // 更新用户
  const user = await updateUser(id, result.data)

  return NextResponse.json({ user })
}

// DELETE: 删除用户
async function deleteHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

  const { id } = await params

  // 不能删除自己
  if (currentUser.userId === id) {
    throw createError.validation('不能删除自己的账户')
  }

  // 检查用户是否存在
  const existingUser = await getUserById(id)
  if (!existingUser) {
    throw createError.notFound('用户')
  }

  // 删除用户
  await deleteUser(id)

  return NextResponse.json({ success: true, message: '用户已删除' })
}

export const GET = withErrorHandler(getHandler)
export const PATCH = withErrorHandler(patchHandler)
export const DELETE = withErrorHandler(deleteHandler)
