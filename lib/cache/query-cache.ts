import { MemoryCache, createCacheKey } from './index'
import { logger } from '@/lib/logger'

/**
 * Query cache for API requests
 */
export class QueryCache extends MemoryCache {
  constructor() {
    super({
      ttl: 5 * 60 * 1000, // 5 minutes for queries
      maxSize: 50,
    })
  }

  /**
   * Invalidate cache by prefix
   */
  invalidateByPrefix(prefix: string): number {
    let removed = 0
    const keys = Array.from(this.stats().keys)

    for (const key of keys) {
      if (key.startsWith(prefix)) {
        this.delete(key)
        removed++
      }
    }

    if (removed > 0) {
      logger.debug(`Invalidated ${removed} cache entries with prefix: ${prefix}`)
    }

    return removed
  }

  /**
   * Invalidate cache by pattern
   */
  invalidateByPattern(pattern: RegExp): number {
    let removed = 0
    const keys = Array.from(this.stats().keys)

    for (const key of keys) {
      if (pattern.test(key)) {
        this.delete(key)
        removed++
      }
    }

    if (removed > 0) {
      logger.debug(`Invalidated ${removed} cache entries matching pattern`)
    }

    return removed
  }
}

/**
 * Global query cache instance
 */
export const queryCache = new QueryCache()

/**
 * Cache keys for different entities
 */
export const CacheKeys = {
  // Conversations
  conversations: (userId: string) => createCacheKey('conversations', userId),
  conversation: (conversationId: string) => createCacheKey('conversation', conversationId),

  // Messages
  messages: (conversationId: string) => createCacheKey('messages', conversationId),

  // Skills
  skills: () => createCacheKey('skills'),
  skill: (skillId: string) => createCacheKey('skill', skillId),

  // User
  user: (userId: string) => createCacheKey('user', userId),

  // Stats
  stats: (userId: string) => createCacheKey('stats', userId),

  // Favorites
  favorites: (userId: string) => createCacheKey('favorites', userId),
} as const

/**
 * Cache invalidation helpers
 */
export const invalidateCache = {
  /**
   * Invalidate all conversation-related caches for a user
   */
  conversations: (userId: string) => {
    queryCache.invalidateByPrefix(createCacheKey('conversations', userId))
    queryCache.invalidateByPrefix(createCacheKey('conversation'))
    queryCache.invalidateByPrefix(createCacheKey('messages'))
  },

  /**
   * Invalidate a specific conversation
   */
  conversation: (conversationId: string) => {
    queryCache.delete(CacheKeys.conversation(conversationId))
    queryCache.delete(CacheKeys.messages(conversationId))
  },

  /**
   * Invalidate messages for a conversation
   */
  messages: (conversationId: string) => {
    queryCache.delete(CacheKeys.messages(conversationId))
  },

  /**
   * Invalidate skills cache
   */
  skills: () => {
    queryCache.delete(CacheKeys.skills())
    queryCache.invalidateByPrefix(createCacheKey('skill'))
  },

  /**
   * Invalidate user-related caches
   */
  user: (userId: string) => {
    queryCache.delete(CacheKeys.user(userId))
    queryCache.delete(CacheKeys.stats(userId))
    queryCache.delete(CacheKeys.favorites(userId))
  },

  /**
   * Clear all caches
   */
  all: () => {
    queryCache.clear()
  },
}
