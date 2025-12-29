import { useState, useCallback } from 'react'

export interface Toast {
  id: string
  title?: string
  description?: string
  variant?: 'default' | 'destructive' | 'success'
  duration?: number
}

interface ToastStore {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
  success: (title: string, description?: string) => void
  error: (title: string, description?: string) => void
  info: (title: string, description?: string) => void
}

const toasts: Toast[] = []
const listeners: Set<(toasts: Toast[]) => void> = new Set()

function notify() {
  listeners.forEach((listener) => listener([...toasts]))
}

function addToast(toast: Omit<Toast, 'id'>) {
  const id = Math.random().toString(36).substring(2, 9)
  const newToast: Toast = { id, ...toast }

  toasts.push(newToast)
  notify()

  // Auto-remove after duration
  const duration = toast.duration ?? 5000
  if (duration > 0) {
    setTimeout(() => {
      removeToast(id)
    }, duration)
  }

  return id
}

function removeToast(id: string) {
  const index = toasts.findIndex((t) => t.id === id)
  if (index !== -1) {
    toasts.splice(index, 1)
    notify()
  }
}

/**
 * Toast notification hook
 */
export function useToast(): ToastStore {
  const [localToasts, setLocalToasts] = useState<Toast[]>([...toasts])

  useState(() => {
    listeners.add(setLocalToasts)
    return () => {
      listeners.delete(setLocalToasts)
    }
  })

  const success = useCallback((title: string, description?: string) => {
    addToast({
      title,
      description,
      variant: 'success',
    })
  }, [])

  const error = useCallback((title: string, description?: string) => {
    addToast({
      title,
      description,
      variant: 'destructive',
    })
  }, [])

  const info = useCallback((title: string, description?: string) => {
    addToast({
      title,
      description,
      variant: 'default',
    })
  }, [])

  return {
    toasts: localToasts,
    addToast,
    removeToast,
    success,
    error,
    info,
  }
}
