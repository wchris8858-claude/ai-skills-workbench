import { NextRequest, NextResponse } from 'next/server'
import { writeFileSync, readFileSync } from 'fs'
import { join } from 'path'
import { withErrorHandler } from '@/lib/middleware/error-handler'
import { createError } from '@/lib/errors'
import { getCurrentUser, isAdmin } from '@/lib/auth'
import { z } from 'zod'

// Supabase配置验证 schema
const SupabaseConfigSchema = z.object({
  supabaseUrl: z.string().url('Supabase URL 必须是有效的 URL').startsWith('https://', 'Supabase URL 必须以 https:// 开头'),
  supabaseAnonKey: z.string().min(1, 'Supabase Anon Key 不能为空'),
})

/**
 * POST /api/admin/settings/supabase
 * 更新 Supabase 配置
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

  const body = await req.json()

  // 验证输入
  const result = SupabaseConfigSchema.safeParse(body)
  if (!result.success) {
    throw createError.validation(result.error.issues[0]?.message || '输入验证失败')
  }

  const { supabaseUrl, supabaseAnonKey } = result.data

  // 读取现有的 .env.local 文件
  const envPath = join(process.cwd(), '.env.local')
  let envContent = ''

  try {
    envContent = readFileSync(envPath, 'utf-8')
  } catch (err) {
    // 如果文件不存在,使用默认模板
    envContent = `# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# 统一 AI API 配置
UNIFIED_API_KEY=
UNIFIED_API_ENDPOINT=https://api4.mygptlife.com/v1

# JWT Secret for Authentication
JWT_SECRET=your_jwt_secret_key_change_this_in_production
`
  }

  // 更新 Supabase 配置
  const lines = envContent.split('\n')
  let updatedLines: string[] = []
  let supabaseUrlUpdated = false
  let supabaseKeyUpdated = false

  for (const line of lines) {
    if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
      updatedLines.push(`NEXT_PUBLIC_SUPABASE_URL=${supabaseUrl}`)
      supabaseUrlUpdated = true
    } else if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) {
      updatedLines.push(`NEXT_PUBLIC_SUPABASE_ANON_KEY=${supabaseAnonKey}`)
      supabaseKeyUpdated = true
    } else {
      updatedLines.push(line)
    }
  }

  // 如果没有找到配置行,添加它们
  if (!supabaseUrlUpdated) {
    updatedLines.unshift(`NEXT_PUBLIC_SUPABASE_URL=${supabaseUrl}`)
  }
  if (!supabaseKeyUpdated) {
    updatedLines.splice(1, 0, `NEXT_PUBLIC_SUPABASE_ANON_KEY=${supabaseAnonKey}`)
  }

  // 写入文件
  writeFileSync(envPath, updatedLines.join('\n'))

  return NextResponse.json({
    success: true,
    message: 'Supabase configuration updated. Please restart the server for changes to take effect.'
  })
}

export const POST = withErrorHandler(handler)
