import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { withErrorHandler } from '@/lib/middleware/error-handler'
import { createError } from '@/lib/errors'
import { z } from 'zod'

// 模型配置验证 schema
const ModelConfigsSchema = z.object({
  modelConfigs: z.record(z.string(), z.unknown()).optional().nullable(),
})

/**
 * POST /api/admin/settings/models
 * 保存模型配置到数据库
 */
async function handler(req: NextRequest) {
  const body = await req.json()

  // 验证输入
  const result = ModelConfigsSchema.safeParse(body)
  if (!result.success) {
    throw createError.validation(result.error.issues[0]?.message || '输入验证失败')
  }

  const { modelConfigs } = result.data

  if (!modelConfigs) {
    throw createError.validation('缺少模型配置')
  }

  // 保存到数据库
  const { error } = await supabase
    .from('system_settings')
    .upsert({
      key: 'model_configs',
      value: modelConfigs,
      updated_at: new Date().toISOString(),
    })

  if (error) {
    console.error('Failed to save model configs:', error)
    throw createError.database('保存模型配置失败')
  }

  return NextResponse.json({
    success: true,
    message: 'Model configurations saved successfully'
  })
}

export const POST = withErrorHandler(handler)
