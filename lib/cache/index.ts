import { logger } from '@/lib/logger'

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

interface CacheOptions {
  ttl?: number // Time to live in milliseconds
  maxSize?: number // Maximum number of entries
}

/**
 * In-memory cache with TTL support
 */
export class MemoryCache {
  private cache: Map<string, CacheEntry<unknown>>
  private readonly defaultTTL: number
  private readonly maxSize: number

  constructor(options: CacheOptions = {}) {
    this.cache = new Map()
    this.defaultTTL = options.ttl || 5 * 60 * 1000 // Default 5 minutes
    this.maxSize = options.maxSize || 100
  }

  /**
   * Get item from cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined

    if (!entry) {
      logger.debug(`Cache miss: ${key}`)
      return null
    }

    // Check if expired
    const now = Date.now()
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      logger.debug(`Cache expired: ${key}`)
      return null
    }

    logger.debug(`Cache hit: ${key}`)
    return entry.data
  }

  /**
   * Set item in cache
   */
  set<T>(key: string, data: T, ttl?: number): void {
    // Enforce max size
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value
      if (firstKey) {
        this.cache.delete(firstKey)
        logger.debug(`Cache evicted (max size): ${firstKey}`)
      }
    }

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
    }

    this.cache.set(key, entry as CacheEntry<unknown>)
    logger.debug(`Cache set: ${key}`, { ttl: entry.ttl })
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    return this.get(key) !== null
  }

  /**
   * Delete item from cache
   */
  delete(key: string): boolean {
    const result = this.cache.delete(key)
    if (result) {
      logger.debug(`Cache deleted: ${key}`)
    }
    return result
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear()
    logger.debug('Cache cleared')
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size
  }

  /**
   * Remove expired entries
   */
  cleanup(): number {
    const now = Date.now()
    let removed = 0

    for (const [key, entry] of Array.from(this.cache.entries())) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key)
        removed++
      }
    }

    if (removed > 0) {
      logger.debug(`Cache cleanup: removed ${removed} entries`)
    }

    return removed
  }

  /**
   * Get cache statistics
   */
  stats(): {
    size: number
    maxSize: number
    keys: string[]
  } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      keys: Array.from(this.cache.keys()),
    }
  }
}

/**
 * Global cache instance
 */
export const globalCache = new MemoryCache({
  ttl: 5 * 60 * 1000, // 5 minutes
  maxSize: 100,
})

// Run cleanup every 10 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    globalCache.cleanup()
  }, 10 * 60 * 1000)
}

/**
 * Cache key generator
 */
export function createCacheKey(...parts: (string | number | boolean | null | undefined)[]): string {
  return parts.filter(Boolean).join(':')
}

/**
 * Memoize function with cache
 */
export function memoize<Args extends unknown[], Result>(
  fn: (...args: Args) => Promise<Result>,
  options: {
    getKey: (...args: Args) => string
    ttl?: number
    cache?: MemoryCache
  }
): (...args: Args) => Promise<Result> {
  const cache = options.cache || globalCache

  return async (...args: Args): Promise<Result> => {
    const key = options.getKey(...args)

    // Check cache
    const cached = cache.get<Result>(key)
    if (cached !== null) {
      return cached
    }

    // Execute function
    const result = await fn(...args)

    // Store in cache
    cache.set(key, result, options.ttl)

    return result
  }
}
