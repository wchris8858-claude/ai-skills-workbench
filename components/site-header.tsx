'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useMemo } from 'react'
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
  Store,
  Wrench,
  Star,
  Clock,
  FileText,
  Code,
  Zap,
  BookOpen,
  Video,
  TrendingUp,
  RefreshCw,
  MessageCircle,
  Calendar,
  Image,
  BarChart3,
  Search,
  FileQuestion,
  Mic,
  Camera,
} from 'lucide-react'
import { useAuth, useIsAdmin } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'
import { ThemeToggle } from '@/components/theme-toggle'
import { PRESET_SKILL_CONFIGS } from '@/lib/skills/config'

interface NavItem {
  href?: string
  label: string
  icon?: React.ReactNode
  adminOnly?: boolean
  children?: {
    href: string
    label: string
    icon?: React.ReactNode
    description?: string
  }[]
}

// 图标名称到组件的映射（带彩色样式）
const iconMap: Record<string, React.ReactNode> = {
  // 自媒体工具库 - 蓝紫色系
  Video: <Video className="h-4 w-4 text-violet-500" />,
  BookOpen: <BookOpen className="h-4 w-4 text-pink-500" />,
  TrendingUp: <TrendingUp className="h-4 w-4 text-orange-500" />,
  RefreshCw: <RefreshCw className="h-4 w-4 text-cyan-500" />,
  // 私域运营助理 - 暖色系
  MessageCircle: <MessageCircle className="h-4 w-4 text-rose-500" />,
  Calendar: <Calendar className="h-4 w-4 text-amber-500" />,
  Image: <Image className="h-4 w-4 text-indigo-500" />,
  BarChart3: <BarChart3 className="h-4 w-4 text-emerald-500" />,
  // 品牌知识库 - 青绿色系
  Search: <Search className="h-4 w-4 text-teal-500" />,
  Users: <Users className="h-4 w-4 text-blue-500" />,
  FileQuestion: <FileQuestion className="h-4 w-4 text-purple-500" />,
  // 效率工具 - 其他
  Mic: <Mic className="h-4 w-4 text-red-500" />,
  Camera: <Camera className="h-4 w-4 text-sky-500" />,
  Zap: <Zap className="h-4 w-4 text-yellow-500" />,
}

// 从预设技能配置生成技能广场下拉菜单项
const skillNavItems = PRESET_SKILL_CONFIGS.map(skill => ({
  href: `/skill/${skill.id}`,
  label: skill.name,
  icon: iconMap[skill.icon] || <Zap className="h-4 w-4" />,
  description: skill.description,
}))

const navItems: NavItem[] = [
  {
    label: '技能广场',
    icon: <Zap className="h-4 w-4" />,
    children: skillNavItems,
  },
  {
    label: '我的空间',
    icon: <Star className="h-4 w-4" />,
    children: [
      { href: '/shops', label: '我的店铺', icon: <Store className="h-4 w-4" />, description: '管理您的店铺和商品' },
      { href: '/my-skills', label: '我的技能', icon: <Wrench className="h-4 w-4" />, description: '自定义和管理技能' },
      { href: '/history', label: '历史记录', icon: <Clock className="h-4 w-4" />, description: '查看使用历史' },
    ]
  },
  {
    label: '开发者',
    icon: <Code className="h-4 w-4" />,
    adminOnly: true,
    children: [
      { href: '/dev-tools', label: '开发工具', icon: <Wrench className="h-4 w-4" />, description: 'API 测试和调试工具' },
      { href: '/docs', label: '开发文档', icon: <BookOpen className="h-4 w-4" />, description: 'API 文档和指南' },
    ]
  },
  {
    label: '文档',
    icon: <FileText className="h-4 w-4" />,
    children: [
      { href: '/docs', label: '使用指南', icon: <BookOpen className="h-4 w-4" />, description: '快速上手和使用教程' },
      { href: '/docs#api', label: 'API 文档', icon: <Code className="h-4 w-4" />, description: '接口文档和示例' },
    ]
  },
]

export function SiteHeader() {
  const router = useRouter()
  const { user, signOut } = useAuth()
  const isAdmin = useIsAdmin()
  const pathname = usePathname()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [mobileOpenDropdown, setMobileOpenDropdown] = useState<string | null>(null)

  const handleSignOut = async () => {
    setIsMenuOpen(false)
    await signOut()
    router.push('/login')
  }

  // 检查路径是否匹配（用于高亮当前菜单）
  const isPathActive = (item: NavItem): boolean => {
    if (item.href) {
      return pathname === item.href
    }
    if (item.children) {
      return item.children.some(child => pathname === child.href)
    }
    return false
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
              AI 掌柜
            </span>
          </Link>
          <nav className="flex items-center gap-1">
            {navItems
              .filter((item) => !item.adminOnly || isAdmin)
              .map((item) => {
                // 有子菜单的项目
                if (item.children) {
                  return (
                    <div key={item.label} className="relative">
                      <button
                        onClick={() => setOpenDropdown(openDropdown === item.label ? null : item.label)}
                        className={cn(
                          'nav-link inline-flex items-center gap-1.5',
                          isPathActive(item) && 'active text-foreground'
                        )}
                      >
                        {item.icon}
                        {item.label}
                        <ChevronDown className={cn(
                          "h-3.5 w-3.5 transition-transform duration-200",
                          openDropdown === item.label && "rotate-180"
                        )} />
                      </button>

                      {/* 下拉菜单 */}
                      {openDropdown === item.label && (
                        <>
                          <div
                            className="fixed inset-0 z-40"
                            onClick={() => setOpenDropdown(null)}
                          />
                          <div className={cn(
                            'absolute left-0 mt-2 z-50 overflow-hidden',
                            'rounded-xl border border-border/60 bg-card p-2',
                            'shadow-lg shadow-primary/5 animate-scale-in',
                            // 技能广场使用更宽的多列布局
                            item.label === '技能广场' ? 'w-[520px] grid grid-cols-2 gap-1' : 'w-64'
                          )}>
                            {item.children.map((child) => (
                              <Link
                                key={child.href}
                                href={child.href}
                                className={cn(
                                  'flex items-start gap-3 rounded-lg px-3 py-2.5 transition-all duration-200',
                                  pathname === child.href
                                    ? 'bg-primary/10 text-primary'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                                )}
                                onClick={() => setOpenDropdown(null)}
                              >
                                <div className={cn(
                                  'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                                  // 技能广场使用透明背景让彩色图标更突出
                                  item.label === '技能广场'
                                    ? 'bg-muted/50'
                                    : pathname === child.href
                                      ? 'bg-primary/20 text-primary'
                                      : 'bg-secondary text-muted-foreground'
                                )}>
                                  {child.icon}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className={cn(
                                    "font-medium text-sm",
                                    item.label === '技能广场' && 'text-foreground'
                                  )}>{child.label}</div>
                                  {child.description && (
                                    <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                                      {child.description}
                                    </div>
                                  )}
                                </div>
                              </Link>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  )
                }

                // 普通链接项目
                return (
                  <Link
                    key={item.href}
                    href={item.href!}
                    className={cn(
                      'nav-link inline-flex items-center gap-1.5',
                      pathname === item.href && 'active text-foreground'
                    )}
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                )
              })}
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
            <span className="font-heading font-semibold">AI 掌柜</span>
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
            {navItems
              .filter((item) => !item.adminOnly || isAdmin)
              .map((item) => {
                // 有子菜单的项目
                if (item.children) {
                  return (
                    <div key={item.label}>
                      <button
                        onClick={() => setMobileOpenDropdown(mobileOpenDropdown === item.label ? null : item.label)}
                        className={cn(
                          'flex items-center justify-between w-full rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200',
                          isPathActive(item)
                            ? 'bg-primary/10 text-primary'
                            : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                        )}
                      >
                        <div className="flex items-center gap-2">
                          {item.icon}
                          {item.label}
                        </div>
                        <ChevronDown className={cn(
                          "h-4 w-4 transition-transform duration-200",
                          mobileOpenDropdown === item.label && "rotate-180"
                        )} />
                      </button>

                      {/* 子菜单展开 */}
                      {mobileOpenDropdown === item.label && (
                        <div className="ml-4 mt-1 space-y-1 border-l-2 border-border/60 pl-4">
                          {item.children.map((child) => (
                            <Link
                              key={child.href}
                              href={child.href}
                              className={cn(
                                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200',
                                pathname === child.href
                                  ? 'bg-primary/10 text-primary'
                                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                              )}
                              onClick={() => {
                                setMobileOpenDropdown(null)
                                setIsMobileMenuOpen(false)
                              }}
                            >
                              <div className={cn(
                                'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg',
                                pathname === child.href
                                  ? 'bg-primary/20 text-primary'
                                  : 'bg-secondary text-muted-foreground'
                              )}>
                                {child.icon}
                              </div>
                              <div>
                                <div className="font-medium">{child.label}</div>
                                {child.description && (
                                  <div className="text-xs text-muted-foreground">{child.description}</div>
                                )}
                              </div>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                }

                // 普通链接项目
                return (
                  <Link
                    key={item.href}
                    href={item.href!}
                    className={cn(
                      'flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200',
                      pathname === item.href
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                    )}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                )
              })}
            {isAdmin && (
              <Link
                href="/admin/users"
                className={cn(
                  'flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200',
                  pathname === '/admin/users'
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                )}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Users className="h-4 w-4" />
                用户管理
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}
