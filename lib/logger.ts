/**
 * 统一日志管理工具
 *
 * 用法:
 * import { logger } from '@/lib/logger'
 *
 * logger.debug('调试信息', { userId: '123' })  // 仅开发环境显示
 * logger.info('普通信息', data)
 * logger.warn('警告信息', warning)
 * logger.error('错误信息', error)
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

class Logger {
  private isDev = process.env.NODE_ENV === 'development'
  private isTest = process.env.NODE_ENV === 'test'

  /**
   * 格式化日志消息
   */
  private formatMessage(level: LogLevel, message: string): string {
    const timestamp = new Date().toISOString()
    const emoji = {
      debug: '🔍',
      info: '✅',
      warn: '⚠️',
      error: '❌'
    }[level]

    return `${emoji} [${level.toUpperCase()}] ${timestamp} - ${message}`
  }

  /**
   * 调试日志 - 仅在开发环境显示
   */
  debug(message: string, data?: unknown): void {
    if (this.isDev && !this.isTest) {
      console.log(this.formatMessage('debug', message), data || '')
    }
  }

  /**
   * 信息日志
   */
  info(message: string, data?: unknown): void {
    if (!this.isTest) {
      console.log(this.formatMessage('info', message), data || '')
    }
  }

  /**
   * 警告日志
   */
  warn(message: string, data?: unknown): void {
    if (!this.isTest) {
      console.warn(this.formatMessage('warn', message), data || '')
    }
  }

  /**
   * 错误日志
   */
  error(message: string, error?: unknown): void {
    console.error(this.formatMessage('error', message), error || '')

    // 在生产环境,可以发送到错误追踪服务
    if (!this.isDev && !this.isTest) {
      this.sendToErrorTracking(message, error)
    }
  }

  /**
   * 发送到错误追踪服务
   * TODO: 集成 Sentry 或其他错误追踪服务
   */
  private sendToErrorTracking(message: string, error?: unknown): void {
    // 占位符 - 将来可以集成 Sentry, LogRocket 等
    // Example:
    // Sentry.captureException(error, {
    //   tags: { component: 'logger' },
    //   extra: { message }
    // })
  }

  /**
   * 数据库操作日志
   */
  db = {
    query: (operation: string, table: string, params?: unknown) => {
      this.debug(`DB Query: ${operation} on ${table}`, params)
    },

    success: (operation: string, result?: unknown) => {
      this.debug(`DB Success: ${operation}`, result)
    },

    error: (operation: string, error: unknown) => {
      this.error(`DB Error: ${operation}`, error)
    }
  }

  /**
   * API 请求日志
   */
  api = {
    request: (method: string, url: string, data?: unknown) => {
      this.debug(`API Request: ${method} ${url}`, data)
    },

    response: (method: string, url: string, status: number, data?: unknown) => {
      this.debug(`API Response: ${method} ${url} - ${status}`, data)
    },

    error: (method: string, url: string, error: unknown) => {
      this.error(`API Error: ${method} ${url}`, error)
    }
  }
}

export const logger = new Logger()
