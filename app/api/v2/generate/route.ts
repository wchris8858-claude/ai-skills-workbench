/**
 * 内容生成统一入口 API
 * POST /api/v2/generate - AI 内容生成
 *
 * 支持功能:
 * - video_script: 短视频脚本
 * - xiaohongshu: 小红书笔记
 * - moments: 朋友圈文案
 * - campaign: 活动策划
 * - rewrite: 改写润色
 * - knowledge_qa: 知识问答
 */

import { NextRequest, NextResponse } from 'next/server'
import { getUserFromToken } from '@/lib/auth'
import { getUserShopRole, getShopContext } from '@/lib/db/shops'
import { dispatchV2 } from '@/lib/ai/dispatcher'
import { checkForbiddenWords, Platform } from '@/lib/services/forbidden-words'
import { scoreContent, ContentType } from '@/lib/services/quality-scorer'
import { logger } from '@/lib/logger'
import { withErrorHandler } from '@/lib/api/error-handler'

// 功能到内容类型的映射
const FEATURE_TO_CONTENT_TYPE: Record<string, ContentType> = {
  video_script: 'video_script',
  xiaohongshu: 'xiaohongshu',
  moments: 'moments',
  campaign: 'campaign',
  rewrite: 'general',
  knowledge_qa: 'general',
}

// 功能到平台的映射
const FEATURE_TO_PLATFORM: Record<string, Platform> = {
  video_script: 'douyin',
  xiaohongshu: 'xiaohongshu',
  moments: 'weixin',
  campaign: 'general',
  rewrite: 'general',
  knowledge_qa: 'general',
}

export const POST = withErrorHandler(async (request: NextRequest) => {
  // 获取当前用户
  const user = await getUserFromToken(request)
  if (!user) {
    return NextResponse.json({ error: '未登录' }, { status: 401 })
  }

  // 解析请求体
  const body = await request.json()
  const {
    feature,
    message,
    shopId,
    skillId,
    attachments,
    modelOverride,
    options,
  } = body

  // 验证必填字段
  if (!feature || !message) {
    return NextResponse.json(
      { error: '功能类型和消息内容不能为空' },
      { status: 400 }
    )
  }

  // 如果指定了店铺，检查权限并获取上下文
  let shopContext: string | undefined
  if (shopId) {
    const role = await getUserShopRole(user.id, shopId)
    if (!role) {
      return NextResponse.json({ error: '无权访问该店铺' }, { status: 403 })
    }
    const context = await getShopContext(shopId)
    shopContext = context ?? undefined
  }

  logger.info('[API v2] Generate request', {
    feature,
    shopId,
    userId: user.id,
    messageLength: message.length,
  })

  try {
    // 调用 AI 生成
    const response = await dispatchV2({
      skillId: skillId || feature,
      message,
      feature,
      shopId,
      shopContext,
      attachments,
      modelOverride,
      // 如果是知识问答，启用知识检索
      knowledgeQuery: feature === 'knowledge_qa' ? message : undefined,
    })

    // 获取生成的内容
    const generatedContent = response.content

    // 违禁词检测
    const platform = FEATURE_TO_PLATFORM[feature] || 'general'
    const forbiddenResult = checkForbiddenWords(generatedContent, platform)

    // 质量评分
    const contentType = FEATURE_TO_CONTENT_TYPE[feature] || 'general'
    const qualityScore = options?.skipQualityScore
      ? null
      : scoreContent(generatedContent, contentType, platform)

    logger.info('[API v2] Generate completed', {
      feature,
      model: response.model,
      hasForbidden: forbiddenResult.hasForbidden,
      qualityGrade: qualityScore?.grade,
    })

    return NextResponse.json({
      content: generatedContent,
      model: response.model,
      provider: response.provider,
      // 违禁词检测结果
      forbidden: forbiddenResult.hasForbidden ? {
        matches: forbiddenResult.matches,
        count: forbiddenResult.matches.length,
      } : null,
      // 质量评分
      quality: qualityScore ? {
        overall: qualityScore.overall,
        grade: qualityScore.grade,
        dimensions: qualityScore.dimensions,
        suggestions: qualityScore.suggestions,
      } : null,
    })
  } catch (error) {
    logger.error('[API v2] Generate failed', { error, feature })
    throw error
  }
})
