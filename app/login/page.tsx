'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'
import {
  User,
  Lock,
  Loader2,
  Zap,
  ArrowLeft,
  ArrowRight,
  Shield,
  Sparkles,
  Eye,
  EyeOff,
} from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const { signIn, user, loading: authLoading } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // 如果已登录，重定向到首页
  useEffect(() => {
    if (!authLoading && user) {
      router.replace('/')
    }
  }, [user, authLoading, router])

  // 认证加载中或已登录时显示加载状态
  if (authLoading || user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!username.trim()) {
      setError('请输入用户名')
      return
    }

    if (!password.trim()) {
      setError('请输入密码')
      return
    }

    setLoading(true)

    try {
      await signIn(username, password)
      router.push('/')
    } catch (err: unknown) {
      console.error('Login error:', err)
      setError(err instanceof Error ? err.message : '登录失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-background">
      {/* 背景效果 */}
      <div className="absolute inset-0 valley-hero-gradient" />

      {/* 返回按钮 */}
      <Link
        href="/"
        className={cn(
          'absolute left-4 top-4 md:left-8 md:top-8 z-10',
          'valley-button valley-button-secondary h-10 px-4',
          'border border-border/50 hover:border-accent/50'
        )}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        返回
      </Link>

      {/* 主内容区 */}
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-[400px] animate-fade-in-up">
          {/* 登录表单 - AI Valley 风格 */}
          <div className="valley-card-glow p-8">
            {/* Logo 和标题 */}
            <div className="mb-8 flex flex-col items-center space-y-4 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-accent/20 to-accent/5 shadow-lg shadow-accent/10">
                <Zap className="h-7 w-7 text-accent" />
              </div>
              <div className="space-y-1">
                <h1 className="text-2xl font-semibold tracking-tight">欢迎回来</h1>
                <p className="text-sm text-muted-foreground">
                  输入您的账号信息登录系统
                </p>
              </div>
            </div>

            {/* 表单 */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* 用户名输入框 */}
              <div className="space-y-1.5">
                <label htmlFor="username" className="sr-only">用户名</label>
                <div className="valley-search">
                  <User className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                  <input
                    id="username"
                    name="username"
                    type="text"
                    placeholder="用户名"
                    autoCapitalize="none"
                    autoComplete="username"
                    autoCorrect="off"
                    disabled={loading}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
                    aria-required="true"
                  />
                </div>
              </div>

              {/* 密码输入框 */}
              <div className="space-y-1.5">
                <label htmlFor="password" className="sr-only">密码</label>
                <div className="valley-search">
                  <Lock className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="密码"
                    autoComplete="current-password"
                    disabled={loading}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
                    aria-required="true"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showPassword ? '隐藏密码' : '显示密码'}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" aria-hidden="true" />
                    ) : (
                      <Eye className="h-5 w-5" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>

              {/* 错误提示 */}
              {error && (
                <div className="rounded-valley bg-destructive/10 border border-destructive/30 p-3 text-sm text-destructive animate-fade-in">
                  {error}
                </div>
              )}

              {/* 提交按钮 */}
              <button
                type="submit"
                disabled={loading}
                className={cn(
                  'valley-button valley-button-primary h-12 w-full text-base',
                  'hover:shadow-valley-hover transition-all duration-300',
                  loading && 'opacity-70 cursor-not-allowed'
                )}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    登录中...
                  </>
                ) : (
                  <>
                    登录
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </button>
            </form>

            {/* 分隔线 */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border/50" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-3 text-muted-foreground">
                  安全登录
                </span>
              </div>
            </div>

            {/* 特性展示 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="group flex flex-col items-center gap-2 rounded-valley bg-secondary/30 p-4 transition-all duration-200 hover:bg-secondary/50">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 transition-colors group-hover:bg-accent/20">
                  <User className="h-5 w-5 text-accent" />
                </div>
                <span className="text-sm text-muted-foreground">账号登录</span>
              </div>
              <div className="group flex flex-col items-center gap-2 rounded-valley bg-secondary/30 p-4 transition-all duration-200 hover:bg-secondary/50">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 transition-colors group-hover:bg-accent/20">
                  <Shield className="h-5 w-5 text-accent" />
                </div>
                <span className="text-sm text-muted-foreground">权限控制</span>
              </div>
            </div>

            {/* 提示信息 - 仅在开发环境显示 */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-6 rounded-valley bg-secondary/30 p-4 text-center text-sm text-muted-foreground">
                <p className="text-xs text-muted-foreground/70 mb-2">[仅开发环境可见]</p>
                <p>默认管理员账号：<span className="font-medium text-accent">admin</span></p>
                <p className="mt-1">默认密码：<span className="font-medium text-accent">admin123</span></p>
              </div>
            )}
          </div>

          {/* 底部装饰 */}
          <div className="mt-8 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4 text-accent" />
            <span>AI Skills Workbench</span>
          </div>
        </div>
      </div>
    </div>
  )
}
