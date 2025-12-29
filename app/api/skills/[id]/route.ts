/**
 * Skill API 端点
 * GET /api/skills/[id] - 获取单个 Skill 的完整内容
 */

import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { withErrorHandler } from '@/lib/middleware/error-handler'
import { createError } from '@/lib/errors'

async function handler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  // 安全检查：防止路径遍历
  if (id.includes('..') || id.includes('/')) {
    throw createError.validation('Invalid skill ID')
  }

  // 构建文件路径
  const skillPath = path.join(process.cwd(), 'skills', id, 'SKILL.md')

  try {
    // 读取文件
    const content = await fs.readFile(skillPath, 'utf-8')

    return NextResponse.json({
      id,
      content,
    })
  } catch (error) {
    // 文件不存在
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      throw createError.notFound('Skill')
    }

    // 其他错误
    throw error
  }
}

export const GET = withErrorHandler(handler)
