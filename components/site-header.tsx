'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import {
  User,
  LogOut,
  Settings,
  History,
  Menu,
  X,
  Sparkles,
  Shield,
  Users,
  ChevronDown,
} from 'lucide-react'
import { useAuth, useIsAdmin } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'
import { ThemeToggle } from '@/components/theme-toggle'

const navItems = [
  { href: '/', label: '技能广场' },
  { href: '/my-skills', label: '我的技能' },
  { href: '/history', label: '历史记录' },
  { href: '/docs', label: '文档' },
]

export function SiteHeader() {
  const router = useRouter()
  const { user, signOut } = useAuth()
  const isAdmin = useIsAdmin()
  const pathname = usePathname()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleSignOut = async () => {
    setIsMenuOpen(false)
    await signOut()
    router.push('/login')
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/90 backdrop-blur-xl">
      <div className="container flex h-16 max-w-screen-2xl items-center">
        {/* Logo */}
        <div className="mr-4 hidden md:flex">
          <Link href="/" className="mr-10 flex items-center space-x-3 group">
            {/* 印章风格 Logo */}
            <div className="relative w-9 h-9 flex items-center justify-center">
              <div className="absolute inset-0 border-2 border-primary/70 rounded rotate-3 transition-transform group-hover:rotate-6" />
              <div className="absolute inset-0.5 border border-primary/40 rounded -rotate-2" />
              <Sparkles className="h-4 w-4 text-primary relative z-10" />
            </div>
            <span className="font-heading font-semibold text-lg tracking-wide text-foreground transition-colors group-hover:text-primary">
              AI 工具箱
            </span>
          </Link>
          <nav className="flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'nav-link',
                  pathname === item.href && 'active text-foreground'
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Mobile Menu Button */}
        <button
          className={cn(
            'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200',
            'h-10 w-10 mr-2 md:hidden',
            'hover:bg-secondary text-muted-foreground hover:text-foreground',
            'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2'
          )}
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-expanded={isMobileMenuOpen}
          aria-controls="mobile-menu"
          aria-label={isMobileMenuOpen ? '关闭菜单' : '打开菜单'}
        >
          {isMobileMenuOpen ? (
            <X className="h-5 w-5" aria-hidden="true" />
          ) : (
            <Menu className="h-5 w-5" aria-hidden="true" />
          )}
        </button>

        {/* Mobile Logo */}
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <Link href="/" className="flex items-center space-x-2 md:hidden group">
            <div className="relative w-8 h-8 flex items-center justify-center">
              <div className="absolute inset-0 border-2 border-primary/70 rounded rotate-3" />
              <Sparkles className="h-3.5 w-3.5 text-primary relative z-10" />
            </div>
            <span className="font-heading font-semibold">AI 工具箱</span>
          </Link>

          {/* Right Side Actions */}
          <nav className="flex items-center gap-2">
            <ThemeToggle />

            {user ? (
              <div className="relative ml-2">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className={cn(
                    'inline-flex items-center justify-center rounded-lg transition-all duration-200',
                    'h-10 px-4 text-sm font-medium gap-2',
                    'border border-border/60 bg-card text-foreground',
                    'hover:border-primary/40 hover:bg-primary/5'
                  )}
                >
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <span className="hidden sm:inline max-w-[100px] truncate">
                    {user.name || user.username}
                  </span>
                  {isAdmin && (
                    <Shield className="h-3.5 w-3.5 text-primary" />
                  )}
                  <ChevronDown className={cn(
                    "h-4 w-4 text-muted-foreground transition-transform",
                    isMenuOpen && "rotate-180"
                  )} />
                </button>

                {isMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setIsMenuOpen(false)}
                    />
                    <div className={cn(
                      'absolute right-0 mt-2 w-60 z-50 overflow-hidden',
                      'rounded-xl border border-border/60 bg-card p-2',
                      'shadow-lg shadow-primary/5 animate-scale-in'
                    )}>
                      {/* 用户信息 */}
                      <div className="px-3 py-3 border-b border-border/60 mb-2">
                        <p className="font-heading font-semibold text-sm">{user.name || user.username}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{user.email}</p>
                        <div className="mt-2 flex items-center gap-1.5">
                          <span className={cn(
                            'px-2 py-0.5 rounded-full text-xs font-medium',
                            user.role === 'admin'
                              ? 'bg-primary/10 text-primary border border-primary/20'
                              : user.role === 'member'
                                ? 'bg-accent/10 text-accent border border-accent/20'
                                : 'bg-secondary text-muted-foreground'
                          )}>
                            {user.role === 'admin' ? '管理员' :
                             user.role === 'member' ? '成员' : '访客'}
                          </span>
                        </div>
                      </div>

                      {/* 管理员菜单 */}
                      {isAdmin && (
                        <>
                          <Link
                            href="/admin/users"
                            className={cn(
                              'flex items-center rounded-lg px-3 py-2.5 text-sm transition-all duration-200',
                              'text-muted-foreground hover:text-foreground hover:bg-secondary'
                            )}
                            onClick={() => setIsMenuOpen(false)}
                          >
                            <Users className="mr-3 h-4 w-4" />
                            <span>用户管理</span>
                          </Link>
                          <Link
                            href="/admin/settings"
                            className={cn(
                              'flex items-center rounded-lg px-3 py-2.5 text-sm transition-all duration-200',
                              'text-muted-foreground hover:text-foreground hover:bg-secondary'
                            )}
                            onClick={() => setIsMenuOpen(false)}
                          >
                            <Settings className="mr-3 h-4 w-4" />
                            <span>系统设置</span>
                          </Link>
                        </>
                      )}

                      <Link
                        href="/settings"
                        className={cn(
                          'flex items-center rounded-lg px-3 py-2.5 text-sm transition-all duration-200',
                          'text-muted-foreground hover:text-foreground hover:bg-secondary'
                        )}
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <Settings className="mr-3 h-4 w-4" />
                        <span>设置</span>
                      </Link>
                      <Link
                        href="/history"
                        className={cn(
                          'flex items-center rounded-lg px-3 py-2.5 text-sm transition-all duration-200',
                          'text-muted-foreground hover:text-foreground hover:bg-secondary'
                        )}
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <History className="mr-3 h-4 w-4" />
                        <span>历史记录</span>
                      </Link>
                      <div className="my-2 h-px bg-border/60" />
                      <button
                        onClick={handleSignOut}
                        className={cn(
                          'flex w-full items-center rounded-lg px-3 py-2.5 text-sm transition-all duration-200',
                          'text-destructive hover:bg-destructive/10'
                        )}
                      >
                        <LogOut className="mr-3 h-4 w-4" />
                        <span>退出登录</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="ink-button ink-button-primary h-10 px-6 ml-2"
              >
                登录
              </Link>
            )}
          </nav>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div id="mobile-menu" className="border-t border-border/40 md:hidden bg-background/95 backdrop-blur-xl">
          <nav className="container py-4 grid gap-1" aria-label="移动端导航">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200',
                  pathname === item.href
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                )}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            {isAdmin && (
              <Link
                href="/admin/users"
                className={cn(
                  'flex items-center rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200',
                  pathname === '/admin/users'
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                )}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Users className="mr-2 h-4 w-4" />
                用户管理
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}
