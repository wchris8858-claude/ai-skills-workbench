/**
 * 统一错误处理类
 *
 * 用法:
 * import { AppError, ErrorCodes } from '@/lib/errors'
 *
 * throw new AppError(ErrorCodes.UNAUTHORIZED, 'Invalid token')
 * throw new AppError(ErrorCodes.RATE_LIMIT, 'Too many requests', { userId: '123' })
 */

export enum ErrorCodes {
  // 认证相关错误 (400-499)
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  VALIDATION_ERROR = 400,
  RATE_LIMIT = 429,

  // 服务器错误 (500-599)
  INTERNAL_ERROR = 500,
  DATABASE_ERROR = 503,
  AI_SERVICE_ERROR = 502,

  // 业务逻辑错误 (600+)
  CONVERSATION_NOT_FOUND = 600,
  MESSAGE_NOT_SAVED = 601,
  SKILL_NOT_FOUND = 602,
}

export class AppError extends Error {
  public readonly statusCode: number
  public readonly code: ErrorCodes
  public readonly details?: Record<string, unknown>
  public readonly timestamp: Date

  constructor(
    code: ErrorCodes,
    message: string,
    details?: Record<string, unknown>
  ) {
    super(message)
    this.name = 'AppError'
    this.code = code
    this.statusCode = this.getStatusCode(code)
    this.details = details
    this.timestamp = new Date()

    // 维持正确的原型链
    Object.setPrototypeOf(this, AppError.prototype)
  }

  private getStatusCode(code: ErrorCodes): number {
    // 对于 HTTP 标准错误码，直接返回
    if (code >= 400 && code < 600) {
      return code
    }
    // 对于业务逻辑错误码，返回 500
    return 500
  }

  /**
   * 转换为 JSON 响应格式
   */
  toJSON() {
    return {
      error: {
        code: this.code,
        message: this.message,
        details: this.details,
        timestamp: this.timestamp.toISOString(),
      }
    }
  }

  /**
   * 转换为适合日志记录的格式
   */
  toLogFormat() {
    return {
      name: this.name,
      code: this.code,
      statusCode: this.statusCode,
      message: this.message,
      details: this.details,
      timestamp: this.timestamp.toISOString(),
      stack: this.stack,
    }
  }
}

/**
 * 错误处理工具函数
 */
export class ErrorHandler {
  /**
   * 判断是否为 AppError
   */
  static isAppError(error: unknown): error is AppError {
    return error instanceof AppError
  }

  /**
   * 将未知错误转换为 AppError
   */
  static toAppError(error: unknown): AppError {
    if (this.isAppError(error)) {
      return error
    }

    if (error instanceof Error) {
      return new AppError(
        ErrorCodes.INTERNAL_ERROR,
        error.message,
        { originalError: error.name }
      )
    }

    return new AppError(
      ErrorCodes.INTERNAL_ERROR,
      'An unknown error occurred',
      { error: String(error) }
    )
  }

  /**
   * 获取用户友好的错误消息
   */
  static getUserMessage(error: AppError): string {
    const messages: Record<ErrorCodes, string> = {
      [ErrorCodes.UNAUTHORIZED]: '您需要登录才能执行此操作',
      [ErrorCodes.FORBIDDEN]: '您没有权限执行此操作',
      [ErrorCodes.NOT_FOUND]: '请求的资源不存在',
      [ErrorCodes.VALIDATION_ERROR]: '输入数据无效',
      [ErrorCodes.RATE_LIMIT]: '请求过于频繁，请稍后再试',
      [ErrorCodes.INTERNAL_ERROR]: '服务器内部错误',
      [ErrorCodes.DATABASE_ERROR]: '数据库连接错误',
      [ErrorCodes.AI_SERVICE_ERROR]: 'AI 服务暂时不可用',
      [ErrorCodes.CONVERSATION_NOT_FOUND]: '对话不存在',
      [ErrorCodes.MESSAGE_NOT_SAVED]: '消息保存失败',
      [ErrorCodes.SKILL_NOT_FOUND]: '技能不存在',
    }

    return messages[error.code] || error.message
  }
}

/**
 * 常用错误创建函数
 */
export const createError = {
  unauthorized: (message = 'Unauthorized') =>
    new AppError(ErrorCodes.UNAUTHORIZED, message),

  forbidden: (message = 'Forbidden') =>
    new AppError(ErrorCodes.FORBIDDEN, message),

  notFound: (resource: string) =>
    new AppError(ErrorCodes.NOT_FOUND, `${resource} not found`),

  validation: (message: string, details?: Record<string, unknown>) =>
    new AppError(ErrorCodes.VALIDATION_ERROR, message, details),

  rateLimit: (resetAt: Date) =>
    new AppError(ErrorCodes.RATE_LIMIT, 'Too many requests', { resetAt }),

  tooManyRequests: (message: string, details?: Record<string, unknown>) =>
    new AppError(ErrorCodes.RATE_LIMIT, message, details),

  database: (operation: string, details?: Record<string, unknown>) =>
    new AppError(ErrorCodes.DATABASE_ERROR, `Database error: ${operation}`, details),

  aiService: (message: string, details?: Record<string, unknown>) =>
    new AppError(ErrorCodes.AI_SERVICE_ERROR, message, details),

  serviceUnavailable: (message: string, details?: Record<string, unknown>) =>
    new AppError(ErrorCodes.DATABASE_ERROR, message, details),
}
