import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { withErrorHandler } from '@/lib/middleware/error-handler'

/**
 * GET /api/admin/settings
 * 获取当前配置
 */
async function handler(req: NextRequest) {
  // 从数据库加载模型配置
  const { data, error } = await supabase
    .from('system_settings')
    .select('*')
    .eq('key', 'model_configs')
    .single()

  if (error && error.code !== 'PGRST116') {
    // PGRST116 = 未找到记录
    console.error('Failed to load settings:', error)
  }

  return NextResponse.json({
    modelConfigs: data?.value || {},
  })
}

export const GET = withErrorHandler(handler)
