import { useState, useEffect, useCallback, useRef } from 'react'
import { logger } from '@/lib/logger'

interface UseAsyncState<T> {
  data: T | null
  error: Error | null
  isLoading: boolean
  isError: boolean
  isSuccess: boolean
}

interface UseAsyncOptions<T> {
  onSuccess?: (data: T) => void
  onError?: (error: Error) => void
  retry?: number
  retryDelay?: number
}

/**
 * Custom hook for handling async operations with loading, error, and success states
 */
export function useAsync<T>(
  asyncFunction: () => Promise<T>,
  dependencies: React.DependencyList = [],
  options: UseAsyncOptions<T> = {}
): UseAsyncState<T> & { refetch: () => Promise<void> } {
  const [state, setState] = useState<UseAsyncState<T>>({
    data: null,
    error: null,
    isLoading: true,
    isError: false,
    isSuccess: false,
  })

  const retryCountRef = useRef(0)
  const mountedRef = useRef(true)

  const execute = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }))

    try {
      const data = await asyncFunction()

      if (mountedRef.current) {
        setState({
          data,
          error: null,
          isLoading: false,
          isError: false,
          isSuccess: true,
        })
        options.onSuccess?.(data)
        retryCountRef.current = 0
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))

      if (mountedRef.current) {
        // Retry logic
        if (
          options.retry &&
          retryCountRef.current < options.retry
        ) {
          retryCountRef.current++
          logger.warn(
            `Async operation failed, retrying (${retryCountRef.current}/${options.retry})`,
            err
          )

          setTimeout(() => {
            execute()
          }, options.retryDelay || 1000)
          return
        }

        setState({
          data: null,
          error: err,
          isLoading: false,
          isError: true,
          isSuccess: false,
        })
        options.onError?.(err)
        logger.error('Async operation failed', err)
      }
    }
  }, [asyncFunction, options])

  useEffect(() => {
    mountedRef.current = true
    execute()

    return () => {
      mountedRef.current = false
    }
  }, dependencies)

  return {
    ...state,
    refetch: execute,
  }
}

/**
 * Custom hook for manual async operations (not automatically executed)
 */
export function useAsyncCallback<T, Args extends unknown[]>(
  asyncFunction: (...args: Args) => Promise<T>,
  options: UseAsyncOptions<T> = {}
): [
  (...args: Args) => Promise<void>,
  UseAsyncState<T> & { reset: () => void }
] {
  const [state, setState] = useState<UseAsyncState<T>>({
    data: null,
    error: null,
    isLoading: false,
    isError: false,
    isSuccess: false,
  })

  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  const execute = useCallback(
    async (...args: Args) => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }))

      try {
        const data = await asyncFunction(...args)

        if (mountedRef.current) {
          setState({
            data,
            error: null,
            isLoading: false,
            isError: false,
            isSuccess: true,
          })
          options.onSuccess?.(data)
        }
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))

        if (mountedRef.current) {
          setState({
            data: null,
            error: err,
            isLoading: false,
            isError: true,
            isSuccess: false,
          })
          options.onError?.(err)
          logger.error('Async callback failed', err)
        }
      }
    },
    [asyncFunction, options]
  )

  const reset = useCallback(() => {
    setState({
      data: null,
      error: null,
      isLoading: false,
      isError: false,
      isSuccess: false,
    })
  }, [])

  return [execute, { ...state, reset }]
}
