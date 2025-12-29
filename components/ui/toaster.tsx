'use client'

import { useEffect, useState, createContext, useContext, useCallback } from 'react'
import { Toast, ToastTitle, ToastDescription } from './toast'
import { cn } from '@/lib/utils'

export interface ToastData {
  id: string
  title?: string
  description?: string
  variant?: 'default' | 'success' | 'error' | 'warning'
  duration?: number
}

interface ToasterContextValue {
  toast: (data: Omit<ToastData, 'id'>) => void
  dismiss: (id: string) => void
}

const ToasterContext = createContext<ToasterContextValue | null>(null)

export function useToast() {
  const context = useContext(ToasterContext)
  if (!context) {
    throw new Error('useToast must be used within a ToasterProvider')
  }
  return context
}

export function ToasterProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastData[]>([])

  const toast = useCallback((data: Omit<ToastData, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    setToasts((prev) => [...prev, { ...data, id }])

    // 自动关闭
    const duration = data.duration ?? 5000
    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
      }, duration)
    }
  }, [])

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToasterContext.Provider value={{ toast, dismiss }}>
      {children}
      <Toaster toasts={toasts} onDismiss={dismiss} />
    </ToasterContext.Provider>
  )
}

function Toaster({
  toasts,
  onDismiss,
}: {
  toasts: ToastData[]
  onDismiss: (id: string) => void
}) {
  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-0 right-0 z-50 flex max-h-screen w-full flex-col-reverse gap-2 p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col-reverse md:max-w-[420px]">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          variant={toast.variant}
          onClose={() => onDismiss(toast.id)}
          className="animate-in slide-in-from-right-full"
        >
          <div className="grid gap-1">
            {toast.title && <ToastTitle>{toast.title}</ToastTitle>}
            {toast.description && (
              <ToastDescription>{toast.description}</ToastDescription>
            )}
          </div>
        </Toast>
      ))}
    </div>
  )
}

/**
 * 便捷 toast 函数
 */
export const toastHelpers = {
  success: (title: string, description?: string) => ({
    title,
    description,
    variant: 'success' as const,
  }),
  error: (title: string, description?: string) => ({
    title,
    description,
    variant: 'error' as const,
  }),
  warning: (title: string, description?: string) => ({
    title,
    description,
    variant: 'warning' as const,
  }),
}
