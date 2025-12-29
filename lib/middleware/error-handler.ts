/**
 * API 错误处理中间件
 *
 * 用法:
 * import { withErrorHandler } from '@/lib/middleware/error-handler'
 *
 * export const POST = withErrorHandler(async (req) => {
 *   // Your handler code
 * })
 */

import { NextRequest, NextResponse } from 'next/server'
import { AppError, ErrorHandler } from '@/lib/errors'
import { logger } from '@/lib/logger'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ApiHandler = (req: NextRequest, context?: any) => Promise<NextResponse>

/**
 * 错误处理中间件
 * 捕获所有错误并返回统一格式的错误响应
 */
export function withErrorHandler(handler: ApiHandler): ApiHandler {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return async (req: NextRequest, context?: any) => {
    try {
      return await handler(req, context)
    } catch (error) {
      return handleError(error, req)
    }
  }
}

/**
 * 统一错误处理函数
 */
function handleError(error: unknown, req: NextRequest): NextResponse {
  const appError = ErrorHandler.toAppError(error)

  // 记录错误日志
  logger.error('API Error', {
    path: req.nextUrl.pathname,
    method: req.method,
    error: appError.toLogFormat(),
  })

  // 返回错误响应
  return NextResponse.json(
    appError.toJSON(),
    { status: appError.statusCode }
  )
}

/**
 * 异步错误捕获包装函数
 * 用于包装任何异步函数以确保错误被正确捕获
 */
export async function tryCatch<T>(
  fn: () => Promise<T>,
  errorMessage?: string
): Promise<T> {
  try {
    return await fn()
  } catch (error) {
    if (ErrorHandler.isAppError(error)) {
      throw error
    }
    throw ErrorHandler.toAppError(error)
  }
}
