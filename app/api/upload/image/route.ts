import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { withErrorHandler } from '@/lib/middleware/error-handler'
import { createError } from '@/lib/errors'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { logger } from '@/lib/logger'

async function handler(req: NextRequest) {
  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    throw createError.validation('请使用 multipart/form-data 格式上传文件')
  }

  const file = formData.get('file') as File

  if (!file) {
    throw createError.validation('未提供文件')
  }

  // 验证文件类型
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
  if (!validTypes.includes(file.type)) {
    throw createError.validation('文件类型不支持，仅支持 JPEG、PNG、GIF 和 WebP')
  }

  // 验证文件大小 (最大 10MB)
  const maxSize = 10 * 1024 * 1024
  if (file.size > maxSize) {
    throw createError.validation('文件大小超过 10MB 限制')
  }

  // 生成唯一文件名
  const ext = file.name.split('.').pop() || 'png'
  const filename = `${randomUUID()}.${ext}`
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  // 优先使用 Supabase Storage
  if (isSupabaseConfigured) {
    const { data, error } = await supabase.storage
      .from('uploads')
      .upload(`images/${filename}`, buffer, {
        contentType: file.type,
        upsert: false,
      })

    if (error) {
      // Supabase Storage 失败，回退到 base64
      logger.warn('Supabase Storage upload failed, falling back to base64', error.message)
      const base64 = buffer.toString('base64')
      const dataUrl = `data:${file.type};base64,${base64}`

      return NextResponse.json({
        success: true,
        url: dataUrl,
        filename,
        size: file.size,
        type: file.type,
        storage: 'base64',
      })
    }

    // 获取公开 URL
    const { data: urlData } = supabase.storage
      .from('uploads')
      .getPublicUrl(`images/${filename}`)

    return NextResponse.json({
      success: true,
      url: urlData.publicUrl,
      filename,
      size: file.size,
      type: file.type,
      storage: 'supabase',
    })
  }

  // 没有配置 Supabase，使用 base64 编码
  const base64 = buffer.toString('base64')
  const dataUrl = `data:${file.type};base64,${base64}`

  return NextResponse.json({
    success: true,
    url: dataUrl,
    filename,
    size: file.size,
    type: file.type,
    storage: 'base64',
  })
}

export const POST = withErrorHandler(handler)
