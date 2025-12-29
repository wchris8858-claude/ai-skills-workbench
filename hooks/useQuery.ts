import { useState, useEffect, useCallback, useRef } from 'react'
import { queryCache } from '@/lib/cache/query-cache'
import { logger } from '@/lib/logger'

interface UseQueryOptions<T> {
  cacheKey?: string
  cacheTTL?: number
  enabled?: boolean
  refetchOnMount?: boolean
  refetchOnWindowFocus?: boolean
  onSuccess?: (data: T) => void
  onError?: (error: Error) => void
  retry?: number
  retryDelay?: number
}

interface UseQueryResult<T> {
  data: T | null
  error: Error | null
  isLoading: boolean
  isError: boolean
  isSuccess: boolean
  isFetching: boolean
  refetch: () => Promise<void>
  invalidate: () => void
}

/**
 * Query hook with caching support
 */
export function useQuery<T>(
  queryFn: () => Promise<T>,
  options: UseQueryOptions<T> = {}
): UseQueryResult<T> {
  const {
    cacheKey,
    cacheTTL,
    enabled = true,
    refetchOnMount = true,
    refetchOnWindowFocus = false,
    onSuccess,
    onError,
    retry = 0,
    retryDelay = 1000,
  } = options

  const [data, setData] = useState<T | null>(() => {
    // Try to get from cache on mount
    if (cacheKey) {
      const cached = queryCache.get<T>(cacheKey)
      return cached
    }
    return null
  })

  const [error, setError] = useState<Error | null>(null)
  const [isLoading, setIsLoading] = useState(!data && enabled)
  const [isFetching, setIsFetching] = useState(false)

  const retryCountRef = useRef(0)
  const mountedRef = useRef(true)
  const hasInitialFetchRef = useRef(false)

  const fetchData = useCallback(async () => {
    if (!enabled) return

    setIsFetching(true)
    setError(null)

    try {
      const result = await queryFn()

      if (mountedRef.current) {
        setData(result)
        setError(null)
        setIsLoading(false)
        setIsFetching(false)
        retryCountRef.current = 0

        // Store in cache
        if (cacheKey) {
          queryCache.set(cacheKey, result, cacheTTL)
        }

        onSuccess?.(result)
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))

      if (mountedRef.current) {
        // Retry logic
        if (retry && retryCountRef.current < retry) {
          retryCountRef.current++
          logger.warn(
            `Query failed, retrying (${retryCountRef.current}/${retry})`,
            error
          )

          setTimeout(() => {
            fetchData()
          }, retryDelay)
          return
        }

        setError(error)
        setData(null)
        setIsLoading(false)
        setIsFetching(false)

        onError?.(error)
        logger.error('Query failed', error)
      }
    }
  }, [queryFn, enabled, cacheKey, cacheTTL, retry, retryDelay, onSuccess, onError])

  const invalidate = useCallback(() => {
    if (cacheKey) {
      queryCache.delete(cacheKey)
      logger.debug(`Cache invalidated: ${cacheKey}`)
    }
  }, [cacheKey])

  const refetch = useCallback(async () => {
    invalidate()
    await fetchData()
  }, [fetchData, invalidate])

  // Initial fetch
  useEffect(() => {
    if (!enabled) {
      setIsLoading(false)
      return
    }

    // Skip initial fetch if we have cached data and refetchOnMount is false
    if (data && !refetchOnMount && !hasInitialFetchRef.current) {
      setIsLoading(false)
      hasInitialFetchRef.current = true
      return
    }

    hasInitialFetchRef.current = true
    fetchData()
  }, [enabled, fetchData, refetchOnMount, data])

  // Refetch on window focus
  useEffect(() => {
    if (!enabled || !refetchOnWindowFocus) return

    const handleFocus = () => {
      logger.debug('Window focused, refetching query')
      fetchData()
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [enabled, refetchOnWindowFocus, fetchData])

  // Cleanup
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  return {
    data,
    error,
    isLoading,
    isError: !!error,
    isSuccess: !!data && !error,
    isFetching,
    refetch,
    invalidate,
  }
}

/**
 * Mutation hook for data updates
 */
interface UseMutationOptions<TData, TVariables> {
  onSuccess?: (data: TData, variables: TVariables) => void
  onError?: (error: Error, variables: TVariables) => void
  onSettled?: (data: TData | null, error: Error | null, variables: TVariables) => void
  invalidateKeys?: string[]
}

export function useMutation<TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options: UseMutationOptions<TData, TVariables> = {}
): [
  (variables: TVariables) => Promise<void>,
  {
    data: TData | null
    error: Error | null
    isLoading: boolean
    isError: boolean
    isSuccess: boolean
    reset: () => void
  }
] {
  const { onSuccess, onError, onSettled, invalidateKeys = [] } = options

  const [data, setData] = useState<TData | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  const mutate = useCallback(
    async (variables: TVariables) => {
      setIsLoading(true)
      setError(null)

      try {
        const result = await mutationFn(variables)

        if (mountedRef.current) {
          setData(result)
          setError(null)
          setIsLoading(false)

          // Invalidate related caches
          invalidateKeys.forEach((key) => {
            queryCache.delete(key)
          })

          onSuccess?.(result, variables)
          onSettled?.(result, null, variables)
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err))

        if (mountedRef.current) {
          setData(null)
          setError(error)
          setIsLoading(false)

          onError?.(error, variables)
          onSettled?.(null, error, variables)
          logger.error('Mutation failed', error)
        }
      }
    },
    [mutationFn, invalidateKeys, onSuccess, onError, onSettled]
  )

  const reset = useCallback(() => {
    setData(null)
    setError(null)
    setIsLoading(false)
  }, [])

  return [
    mutate,
    {
      data,
      error,
      isLoading,
      isError: !!error,
      isSuccess: !!data && !error,
      reset,
    },
  ]
}
