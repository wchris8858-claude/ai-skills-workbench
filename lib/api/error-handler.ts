/**
 * API 错误处理中间件
 * 统一处理 API 路由中的错误
 */

import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

// 自定义 API 错误类
export class APIError extends Error {
  statusCode: number
  code: string

  constructor(message: string, statusCode: number = 500, code: string = 'INTERNAL_ERROR') {
    super(message)
    this.name = 'APIError'
    this.statusCode = statusCode
    this.code = code
  }
}

// 常见错误
export const Errors = {
  Unauthorized: () => new APIError('未登录', 401, 'UNAUTHORIZED'),
  Forbidden: () => new APIError('无权限', 403, 'FORBIDDEN'),
  NotFound: (resource: string = '资源') => new APIError(`${resource}不存在`, 404, 'NOT_FOUND'),
  BadRequest: (message: string = '请求参数错误') => new APIError(message, 400, 'BAD_REQUEST'),
  InternalError: (message: string = '服务器错误') => new APIError(message, 500, 'INTERNAL_ERROR'),
}

// 错误响应类型
interface ErrorResponse {
  error: string
  code: string
  details?: unknown
}

/**
 * 将错误转换为 NextResponse
 */
export function errorToResponse(error: unknown): NextResponse<ErrorResponse> {
  if (error instanceof APIError) {
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: error.statusCode }
    )
  }

  // 处理 Supabase 错误
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const supabaseError = error as { code: string; message?: string }
    if (supabaseError.code === 'PGRST301') {
      return NextResponse.json(
        { error: '资源不存在', code: 'NOT_FOUND' },
        { status: 404 }
      )
    }
  }

  // 通用错误
  const message = error instanceof Error ? error.message : '未知错误'
  logger.error('[API Error]', { error: message })

  return NextResponse.json(
    { error: '服务器错误', code: 'INTERNAL_ERROR' },
    { status: 500 }
  )
}

// API 处理函数类型 - 支持带参数和不带参数的路由
type APIHandlerWithContext<T = unknown> = (
  request: NextRequest,
  context: T
) => Promise<NextResponse>

type APIHandlerWithoutContext = (
  request: NextRequest
) => Promise<NextResponse>

/**
 * 包装 API 处理函数，自动处理错误
 * 支持带路由参数和不带参数的处理函数
 */
export function withErrorHandler<T>(
  handler: APIHandlerWithContext<T>
): APIHandlerWithContext<T>
export function withErrorHandler(
  handler: APIHandlerWithoutContext
): APIHandlerWithoutContext
export function withErrorHandler<T>(
  handler: APIHandlerWithContext<T> | APIHandlerWithoutContext
): APIHandlerWithContext<T> | APIHandlerWithoutContext {
  return async (request: NextRequest, context?: T) => {
    try {
      if (context !== undefined) {
        return await (handler as APIHandlerWithContext<T>)(request, context)
      }
      return await (handler as APIHandlerWithoutContext)(request)
    } catch (error) {
      logger.error('[API Error]', {
        path: request.url,
        method: request.method,
        error: error instanceof Error ? error.message : String(error),
      })
      return errorToResponse(error)
    }
  }
}

/**
 * 验证必填字段
 */
export function validateRequired<T extends Record<string, unknown>>(
  data: T,
  fields: (keyof T)[]
): void {
  const missing = fields.filter(field => !data[field])
  if (missing.length > 0) {
    throw Errors.BadRequest(`缺少必填字段: ${missing.join(', ')}`)
  }
}

/**
 * 安全解析 JSON
 */
export async function safeParseJSON<T = unknown>(request: NextRequest): Promise<T> {
  try {
    return await request.json()
  } catch {
    throw Errors.BadRequest('无效的 JSON 格式')
  }
}
