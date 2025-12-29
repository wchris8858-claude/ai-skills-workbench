import { AlertCircle, RefreshCw, XCircle, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ErrorDisplayProps {
  error: Error | string | null
  onRetry?: () => void
  className?: string
  variant?: 'default' | 'destructive' | 'warning'
}

export function ErrorDisplay({
  error,
  onRetry,
  className,
  variant = 'destructive',
}: ErrorDisplayProps) {
  if (!error) return null

  const errorMessage = typeof error === 'string' ? error : error.message

  const variants = {
    default: {
      container: 'border-border bg-muted/50',
      icon: 'text-muted-foreground',
      text: 'text-foreground',
      Icon: AlertCircle,
    },
    destructive: {
      container: 'border-destructive/50 bg-destructive/10',
      icon: 'text-destructive',
      text: 'text-destructive',
      Icon: XCircle,
    },
    warning: {
      container: 'border-yellow-500/50 bg-yellow-500/10',
      icon: 'text-yellow-600',
      text: 'text-yellow-900 dark:text-yellow-100',
      Icon: AlertTriangle,
    },
  }

  const { container, icon, text, Icon } = variants[variant]

  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-lg border p-4',
        container,
        className
      )}
      role="alert"
      aria-live="assertive"
    >
      <Icon className={cn('mt-0.5 h-5 w-5 flex-shrink-0', icon)} />
      <div className="flex-1 space-y-2">
        <p className={cn('text-sm font-medium', text)}>{errorMessage}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className={cn(
              'flex items-center gap-2 text-sm font-medium transition-colors hover:underline',
              text
            )}
          >
            <RefreshCw className="h-4 w-4" />
            重试
          </button>
        )}
      </div>
    </div>
  )
}

interface ErrorBoundaryFallbackProps {
  error: Error
  resetErrorBoundary: () => void
}

export function ErrorBoundaryFallback({
  error,
  resetErrorBoundary,
}: ErrorBoundaryFallbackProps) {
  return (
    <div className="flex min-h-[400px] items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4 text-center">
        <XCircle className="mx-auto h-12 w-12 text-destructive" />
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">出错了</h2>
          <p className="text-sm text-muted-foreground">{error.message}</p>
        </div>
        <button
          onClick={resetErrorBoundary}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <RefreshCw className="h-4 w-4" />
          重新加载
        </button>
      </div>
    </div>
  )
}

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex min-h-[300px] flex-col items-center justify-center gap-4 text-center',
        className
      )}
    >
      {icon && <div className="text-muted-foreground">{icon}</div>}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action && (
        <button
          onClick={action.onClick}
          className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
