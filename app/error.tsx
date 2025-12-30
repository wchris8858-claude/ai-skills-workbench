'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import Link from 'next/link'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // 记录错误到控制台
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="h-8 w-8 text-destructive" />
        </div>

        <h1 className="text-2xl font-heading font-semibold text-foreground mb-2">
          出错了
        </h1>

        <p className="text-muted-foreground mb-6">
          抱歉，应用程序遇到了一个意外错误。请尝试刷新页面或返回首页。
        </p>

        {process.env.NODE_ENV === 'development' && error.message && (
          <div className="mb-6 p-4 rounded-lg bg-destructive/5 border border-destructive/20 text-left">
            <p className="text-xs text-muted-foreground mb-1">错误信息 (仅开发环境可见)</p>
            <p className="text-sm text-destructive font-mono break-all">
              {error.message}
            </p>
            {error.digest && (
              <p className="text-xs text-muted-foreground mt-2">
                Digest: {error.digest}
              </p>
            )}
          </div>
        )}

        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center rounded-lg h-10 px-5 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            重试
          </button>

          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-lg h-10 px-5 text-sm font-medium border border-border bg-background hover:bg-secondary transition-colors"
          >
            <Home className="h-4 w-4 mr-2" />
            返回首页
          </Link>
        </div>
      </div>
    </div>
  )
}
