import { logger } from '@/lib/logger'

describe('Logger', () => {
  const originalEnv = process.env.NODE_ENV

  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterEach(() => {
    process.env.NODE_ENV = originalEnv
  })

  describe('debug logging', () => {
    it('should log in development environment', () => {
      process.env.NODE_ENV = 'development'
      const consoleSpy = jest.spyOn(console, 'log')

      logger.debug('test message', { data: 'test' })

      expect(consoleSpy).toHaveBeenCalled()
    })

    it('should not log in production environment', () => {
      process.env.NODE_ENV = 'production'
      const consoleSpy = jest.spyOn(console, 'log')

      logger.debug('test message', { data: 'test' })

      expect(consoleSpy).not.toHaveBeenCalled()
    })
  })

  describe('info logging', () => {
    it('should log in all environments', () => {
      const consoleSpy = jest.spyOn(console, 'log')

      logger.info('test message', { data: 'test' })

      expect(consoleSpy).toHaveBeenCalled()
    })
  })

  describe('error logging', () => {
    it('should log errors', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error')
      const error = new Error('test error')

      logger.error('error occurred', error)

      expect(consoleErrorSpy).toHaveBeenCalled()
    })
  })

  describe('database logging', () => {
    it('should log database queries', () => {
      process.env.NODE_ENV = 'development'
      const consoleSpy = jest.spyOn(console, 'log')

      logger.db.query('saveMessage', 'messages', { id: '123' })

      expect(consoleSpy).toHaveBeenCalled()
    })

    it('should log database errors', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error')

      logger.db.error('save failed', new Error('DB error'))

      expect(consoleErrorSpy).toHaveBeenCalled()
    })
  })

  describe('API logging', () => {
    it('should log API requests', () => {
      process.env.NODE_ENV = 'development'
      const consoleSpy = jest.spyOn(console, 'log')

      logger.api.request('POST', '/api/chat', { message: 'test' })

      expect(consoleSpy).toHaveBeenCalled()
    })

    it('should log API responses', () => {
      process.env.NODE_ENV = 'development'
      const consoleSpy = jest.spyOn(console, 'log')

      logger.api.response('POST', '/api/chat', 200, { result: 'ok' })

      expect(consoleSpy).toHaveBeenCalled()
    })
  })
})
