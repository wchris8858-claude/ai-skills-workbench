"use client"

import * as React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Trash2, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  variant?: 'default' | 'destructive' | 'warning'
  onConfirm: () => void | Promise<void>
  loading?: boolean
}

const variantConfig = {
  default: {
    icon: Info,
    iconClass: 'text-primary bg-primary/10',
    buttonClass: '',
  },
  destructive: {
    icon: Trash2,
    iconClass: 'text-destructive bg-destructive/10',
    buttonClass: 'bg-destructive hover:bg-destructive/90',
  },
  warning: {
    icon: AlertTriangle,
    iconClass: 'text-amber-500 bg-amber-500/10',
    buttonClass: 'bg-amber-500 hover:bg-amber-600',
  },
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = '确认',
  cancelText = '取消',
  variant = 'default',
  onConfirm,
  loading = false,
}: ConfirmDialogProps) {
  const config = variantConfig[variant]
  const IconComponent = config.icon

  const handleConfirm = async () => {
    await onConfirm()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader className="flex flex-col items-center text-center">
          <div className={cn(
            'flex h-12 w-12 items-center justify-center rounded-full mb-4',
            config.iconClass
          )}>
            <IconComponent className="h-6 w-6" />
          </div>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className="text-center">
            {description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col sm:flex-row gap-2 mt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="w-full sm:w-auto"
          >
            {cancelText}
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={loading}
            className={cn('w-full sm:w-auto', config.buttonClass)}
          >
            {loading ? '处理中...' : confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Hook for easier usage
interface UseConfirmOptions {
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  variant?: 'default' | 'destructive' | 'warning'
}

export function useConfirm() {
  const [state, setState] = React.useState<{
    open: boolean
    options: UseConfirmOptions | null
    resolve: ((value: boolean) => void) | null
    loading: boolean
  }>({
    open: false,
    options: null,
    resolve: null,
    loading: false,
  })

  const confirm = React.useCallback((options: UseConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setState({
        open: true,
        options,
        resolve,
        loading: false,
      })
    })
  }, [])

  const handleConfirm = React.useCallback(async () => {
    setState(prev => ({ ...prev, loading: true }))
    state.resolve?.(true)
    setState({ open: false, options: null, resolve: null, loading: false })
  }, [state.resolve])

  const handleCancel = React.useCallback((open: boolean) => {
    if (!open) {
      state.resolve?.(false)
      setState({ open: false, options: null, resolve: null, loading: false })
    }
  }, [state.resolve])

  // 返回一个函数组件而不是 JSX element，避免类型错误
  const ConfirmDialogComponent = React.useCallback(() => {
    if (!state.options) return null

    return (
      <ConfirmDialog
        open={state.open}
        onOpenChange={handleCancel}
        title={state.options.title}
        description={state.options.description}
        confirmText={state.options.confirmText}
        cancelText={state.options.cancelText}
        variant={state.options.variant}
        onConfirm={handleConfirm}
        loading={state.loading}
      />
    )
  }, [state, handleCancel, handleConfirm])

  return { confirm, ConfirmDialog: ConfirmDialogComponent }
}
