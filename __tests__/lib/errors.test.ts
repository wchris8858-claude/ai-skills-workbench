import { AppError, ErrorCodes, createError } from '@/lib/errors'

describe('AppError', () => {
  it('should create error with correct properties', () => {
    const error = new AppError(ErrorCodes.UNAUTHORIZED, 'Unauthorized access')

    expect(error.code).toBe(ErrorCodes.UNAUTHORIZED)
    expect(error.message).toBe('Unauthorized access')
    expect(error.statusCode).toBe(401)
  })

  it('should include details when provided', () => {
    const details = { userId: '123', reason: 'expired token' }
    const error = new AppError(ErrorCodes.UNAUTHORIZED, 'Token expired', details)

    expect(error.details).toEqual(details)
  })

  it('should serialize to JSON correctly', () => {
    const error = new AppError(ErrorCodes.VALIDATION_ERROR, 'Invalid input', { field: 'email' })

    const json = error.toJSON()

    expect(json).toEqual({
      error: {
        code: ErrorCodes.VALIDATION_ERROR,
        message: 'Invalid input',
        details: { field: 'email' },
      },
    })
  })
})

describe('createError helpers', () => {
  it('should create unauthorized error', () => {
    const error = createError.unauthorized()

    expect(error.code).toBe(ErrorCodes.UNAUTHORIZED)
    expect(error.statusCode).toBe(401)
  })

  it('should create forbidden error', () => {
    const error = createError.forbidden()

    expect(error.code).toBe(ErrorCodes.FORBIDDEN)
    expect(error.statusCode).toBe(403)
  })

  it('should create not found error', () => {
    const error = createError.notFound('User')

    expect(error.code).toBe(ErrorCodes.NOT_FOUND)
    expect(error.message).toContain('User')
  })

  it('should create validation error', () => {
    const error = createError.validation('Invalid email', { field: 'email' })

    expect(error.code).toBe(ErrorCodes.VALIDATION_ERROR)
    expect(error.message).toBe('Invalid email')
    expect(error.details).toEqual({ field: 'email' })
  })

  it('should create rate limit error', () => {
    const resetAt = new Date()
    const error = createError.rateLimit(resetAt)

    expect(error.code).toBe(ErrorCodes.RATE_LIMIT)
    expect(error.details?.resetAt).toBe(resetAt)
  })

  it('should create database error', () => {
    const error = createError.database('saveMessage', { table: 'messages' })

    expect(error.code).toBe(ErrorCodes.DATABASE_ERROR)
    expect(error.message).toContain('saveMessage')
  })

  it('should create AI service error', () => {
    const error = createError.aiService('Claude timeout', { timeout: 30000 })

    expect(error.code).toBe(ErrorCodes.AI_SERVICE_ERROR)
    expect(error.message).toBe('Claude timeout')
  })
})
