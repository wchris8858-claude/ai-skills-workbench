'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Settings, User, Palette, ChevronRight, Moon, Sun, Monitor } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTheme } from 'next-themes'

export default function SettingsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [activeSection, setActiveSection] = useState('account')

  if (!user) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-16">
        <div className="text-center">
          <Settings className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">设置</h1>
          <p className="text-muted-foreground mb-6">请先登录以访问设置页面</p>
          <button
            onClick={() => router.push('/login')}
            className="px-6 py-2 bg-accent text-accent-foreground rounded-lg hover:opacity-90 transition-opacity"
          >
            去登录
          </button>
        </div>
      </div>
    )
  }

  const sections = [
    { id: 'account', label: '账户信息', icon: User },
    { id: 'appearance', label: '外观设置', icon: Palette },
  ]

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="w-6 h-6" />
          设置
        </h1>
        <p className="text-muted-foreground mt-1">管理您的账户和偏好设置</p>
      </div>

      <div className="grid md:grid-cols-[240px_1fr] gap-6">
        {/* 侧边导航 */}
        <nav className="space-y-1">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors',
                activeSection === section.id
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
              )}
            >
              <section.icon className="w-5 h-5" />
              <span>{section.label}</span>
              <ChevronRight className={cn(
                'w-4 h-4 ml-auto transition-transform',
                activeSection === section.id && 'rotate-90'
              )} />
            </button>
          ))}
        </nav>

        {/* 设置内容 */}
        <div className="bg-card border border-border/50 rounded-xl p-6">
          {activeSection === 'account' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold">账户信息</h2>

              <div className="space-y-4">
                <div>
                  <label className="text-sm text-muted-foreground">用户名</label>
                  <p className="mt-1 font-medium">{user.username || '未设置'}</p>
                </div>

                <div>
                  <label className="text-sm text-muted-foreground">邮箱</label>
                  <p className="mt-1 font-medium">{user.email || '未设置'}</p>
                </div>

                <div>
                  <label className="text-sm text-muted-foreground">用户 ID</label>
                  <p className="mt-1 font-mono text-sm text-muted-foreground">{user.id}</p>
                </div>

                <div>
                  <label className="text-sm text-muted-foreground">角色</label>
                  <p className="mt-1">
                    <span className={cn(
                      'px-2 py-0.5 rounded-full text-xs font-medium',
                      user.role === 'admin'
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                        : 'bg-secondary text-secondary-foreground'
                    )}>
                      {user.role === 'admin' ? '管理员' : '普通用户'}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'appearance' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold">外观设置</h2>

              <div>
                <label className="text-sm text-muted-foreground mb-3 block">主题模式</label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setTheme('light')}
                    className={cn(
                      'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-colors',
                      theme === 'light'
                        ? 'border-accent bg-accent/10'
                        : 'border-border hover:border-accent/50'
                    )}
                  >
                    <Sun className="w-6 h-6" />
                    <span className="text-sm">浅色</span>
                  </button>

                  <button
                    onClick={() => setTheme('dark')}
                    className={cn(
                      'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-colors',
                      theme === 'dark'
                        ? 'border-accent bg-accent/10'
                        : 'border-border hover:border-accent/50'
                    )}
                  >
                    <Moon className="w-6 h-6" />
                    <span className="text-sm">深色</span>
                  </button>

                  <button
                    onClick={() => setTheme('system')}
                    className={cn(
                      'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-colors',
                      theme === 'system'
                        ? 'border-accent bg-accent/10'
                        : 'border-border hover:border-accent/50'
                    )}
                  >
                    <Monitor className="w-6 h-6" />
                    <span className="text-sm">跟随系统</span>
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
