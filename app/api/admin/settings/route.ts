import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { withErrorHandler } from '@/lib/middleware/error-handler'
import { createError } from '@/lib/errors'
import { getCurrentUser, isAdmin } from '@/lib/auth'
import { logger } from '@/lib/logger'

/**
 * GET /api/admin/settings
 * 获取当前配置
 */
async function handler(req: NextRequest) {
  // 检查登录状态和权限
  const currentUser = await getCurrentUser()
  if (!currentUser) {
    throw createError.unauthorized('请先登录')
  }
  if (!isAdmin(currentUser.role)) {
    throw createError.forbidden('权限不足，需要管理员权限')
  }

  // 从数据库加载模型配置
  const { data, error } = await supabase
    .from('system_settings')
    .select('key, value, updated_at')
    .eq('key', 'model_configs')
    .single()

  if (error && error.code !== 'PGRST116') {
    // PGRST116 = 未找到记录
    logger.db.error('Failed to load settings', error)
  }

  return NextResponse.json({
    modelConfigs: data?.value || {},
  })
}

export const GET = withErrorHandler(handler)
