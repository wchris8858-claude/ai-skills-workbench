/**
 * 内容检测 API
 * POST /api/v2/content/check - 违禁词检测和质量评分
 */

import { NextRequest, NextResponse } from 'next/server'
import { getUserFromToken } from '@/lib/auth'
import {
  checkForbiddenWords,
  replaceForbiddenWords,
  getAllForbiddenWords,
  getCategoryName,
  Platform,
} from '@/lib/services/forbidden-words'
import {
  scoreContent,
  getDimensionName,
  getGradeDescription,
  ContentType,
} from '@/lib/services/quality-scorer'
import { logger } from '@/lib/logger'
import { withErrorHandler } from '@/lib/api/error-handler'

export const POST = withErrorHandler(async (request: NextRequest) => {
  // 获取当前用户
  const user = await getUserFromToken(request)
  if (!user) {
    return NextResponse.json({ error: '未登录' }, { status: 401 })
  }

  // 解析请求体
  const body = await request.json()
  const {
    content,
    platform = 'general',
    contentType = 'general',
    checkTypes = ['forbidden', 'quality'],
    autoReplace = false,
  } = body

  // 验证必填字段
  if (!content) {
    return NextResponse.json({ error: '内容不能为空' }, { status: 400 })
  }

  logger.info('[API v2] Content check', {
    userId: user.id,
    contentLength: content.length,
    platform,
    contentType,
    checkTypes,
  })

  const result: Record<string, unknown> = {}

  // 违禁词检测
  if (checkTypes.includes('forbidden')) {
    const forbiddenResult = checkForbiddenWords(content, platform as Platform)

    result.forbidden = {
      hasForbidden: forbiddenResult.hasForbidden,
      count: forbiddenResult.matches.length,
      matches: forbiddenResult.matches.map(m => ({
        ...m,
        categoryName: getCategoryName(m.category),
      })),
    }

    // 自动替换
    if (autoReplace && forbiddenResult.hasForbidden) {
      const replaceResult = replaceForbiddenWords(content, platform as Platform)
      result.replaced = {
        content: replaceResult.result,
        replacements: replaceResult.replacements,
      }
    }
  }

  // 质量评分
  if (checkTypes.includes('quality')) {
    const qualityResult = scoreContent(
      content,
      contentType as ContentType,
      platform as Platform
    )

    result.quality = {
      overall: qualityResult.overall,
      grade: qualityResult.grade,
      gradeDescription: getGradeDescription(qualityResult.grade),
      dimensions: Object.entries(qualityResult.dimensions).map(([key, value]) => ({
        key,
        name: getDimensionName(key as keyof typeof qualityResult.dimensions),
        score: value,
      })),
      feedback: qualityResult.feedback,
      suggestions: qualityResult.suggestions,
    }
  }

  return NextResponse.json(result)
})

// 获取违禁词库
export const GET = withErrorHandler(async (request: NextRequest) => {
  // 获取当前用户
  const user = await getUserFromToken(request)
  if (!user) {
    return NextResponse.json({ error: '未登录' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const platform = (searchParams.get('platform') || 'general') as Platform

  const words = getAllForbiddenWords(platform)

  // 添加分类名称
  const wordsWithNames = Object.entries(words).map(([category, wordList]) => ({
    category,
    categoryName: getCategoryName(category),
    words: wordList,
  }))

  return NextResponse.json({ categories: wordsWithNames })
})
