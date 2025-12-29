import { NextRequest, NextResponse } from 'next/server'
import { callSiliconFlowSTT } from '@/lib/ai/siliconflow-client'
import { withErrorHandler } from '@/lib/middleware/error-handler'
import { createError } from '@/lib/errors'

async function handler(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get('file') as File
  const language = formData.get('language') as string || 'zh'

  if (!file) {
    throw createError.validation('未提供音频文件')
  }

  // 验证文件类型
  const validTypes = [
    'audio/wav',
    'audio/mp3',
    'audio/mpeg',
    'audio/m4a',
    'audio/webm',
    'audio/ogg',
  ]
  if (!validTypes.includes(file.type)) {
    throw createError.validation('音频文件类型不支持')
  }

  // 验证文件大小 (最大 25MB)
  const maxSize = 25 * 1024 * 1024
  if (file.size > maxSize) {
    throw createError.validation('文件大小超过 25MB 限制')
  }

  // 调用 SiliconFlow 语音识别 API
  const result = await callSiliconFlowSTT(
    'TeleAI/TeleSpeechASR',
    file,
    {
      language,
      format: 'json',
    }
  )

  return NextResponse.json({
    success: true,
    text: result.text || result,
    language,
  })
}

export const POST = withErrorHandler(handler)
