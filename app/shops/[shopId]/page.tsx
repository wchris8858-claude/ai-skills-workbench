'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { useAuth } from '@/contexts/AuthContext'
import {
  Store,
  FileText,
  Calendar,
  BarChart3,
  GraduationCap,
  MessageSquare,
  ArrowRight,
  Loader2,
  ChevronLeft,
  Settings,
  Users,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Shop {
  id: string
  name: string
  industry?: string
  description?: string
}

interface PageProps {
  params: Promise<{ shopId: string }>
}

export default function ShopDetailPage({ params }: PageProps) {
  const { shopId } = use(params)
  const router = useRouter()
  const { user } = useAuth()
  const [shop, setShop] = useState<Shop | null>(null)
  const [role, setRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // 加载店铺详情
  useEffect(() => {
    async function loadShop() {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        const response = await fetch(`/api/v2/shops/${shopId}`)
        if (response.ok) {
          const data = await response.json()
          setShop(data.shop)
          setRole(data.role)
        } else if (response.status === 404) {
          router.push('/shops')
        }
      } catch (error) {
        console.error('Error loading shop:', error)
      } finally {
        setLoading(false)
      }
    }

    loadShop()
  }, [user, shopId, router])

  // 功能模块
  const modules = [
    {
      id: 'content',
      name: '内容生成',
      description: '短视频脚本、小红书笔记、朋友圈文案',
      icon: FileText,
      href: `/shops/${shopId}/content`,
      color: 'primary',
    },
    {
      id: 'calendar',
      name: '内容日历',
      description: '规划和管理内容发布计划',
      icon: Calendar,
      href: `/shops/${shopId}/calendar`,
      color: 'accent',
    },
    {
      id: 'analytics',
      name: '数据分析',
      description: '运营数据录入与分析',
      icon: BarChart3,
      href: `/shops/${shopId}/analytics`,
      color: 'primary',
    },
    {
      id: 'knowledge',
      name: '知识库',
      description: '品牌知识管理与智能问答',
      icon: MessageSquare,
      href: `/shops/${shopId}/knowledge`,
      color: 'accent',
    },
    {
      id: 'training',
      name: '员工培训',
      description: 'AI 对练与考核系统',
      icon: GraduationCap,
      href: `/shops/${shopId}/training`,
      color: 'primary',
    },
  ]

  // 未登录
  if (!user) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <SiteHeader />
        <main className="flex-1 container py-16 flex items-center justify-center">
          <div className="text-center">
            <Store className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-heading font-semibold mb-2">请先登录</h1>
            <p className="text-muted-foreground mb-6">登录后可以查看店铺详情</p>
            <button
              onClick={() => router.push('/login')}
              className="ink-button ink-button-primary"
            >
              立即登录
            </button>
          </div>
        </main>
        <SiteFooter />
      </div>
    )
  }

  // 加载中
  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <SiteHeader />
        <main className="flex-1 container py-16 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <SiteFooter />
      </div>
    )
  }

  // 店铺不存在
  if (!shop) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <SiteHeader />
        <main className="flex-1 container py-16 flex items-center justify-center">
          <div className="text-center">
            <Store className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-heading font-semibold mb-2">店铺不存在</h1>
            <p className="text-muted-foreground mb-6">该店铺可能已被删除或您没有访问权限</p>
            <button
              onClick={() => router.push('/shops')}
              className="ink-button ink-button-primary"
            >
              返回店铺列表
            </button>
          </div>
        </main>
        <SiteFooter />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />

      <main className="flex-1 container py-8 md:py-12">
        {/* 面包屑 */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link href="/shops" className="hover:text-primary transition-colors">
            <ChevronLeft className="h-4 w-4 inline mr-1" />
            我的店铺
          </Link>
          <span>/</span>
          <span className="text-foreground">{shop.name}</span>
        </div>

        {/* 店铺头部 */}
        <div className="flex items-start justify-between mb-12">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center bg-primary/10">
              <Store className="h-10 w-10 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-heading font-semibold text-foreground">
                {shop.name}
              </h1>
              {shop.industry && (
                <p className="text-muted-foreground mt-1">{shop.industry}</p>
              )}
              {shop.description && (
                <p className="text-muted-foreground mt-2 max-w-xl">
                  {shop.description}
                </p>
              )}
            </div>
          </div>

          {/* 操作按钮 */}
          {(role === 'owner' || role === 'admin') && (
            <div className="flex items-center gap-2">
              <Link
                href={`/shops/${shopId}/settings`}
                className="ink-button ink-button-secondary"
              >
                <Settings className="h-4 w-4 mr-2" />
                设置
              </Link>
              {role === 'owner' && (
                <Link
                  href={`/shops/${shopId}/members`}
                  className="ink-button ink-button-secondary"
                >
                  <Users className="h-4 w-4 mr-2" />
                  成员
                </Link>
              )}
            </div>
          )}
        </div>

        {/* 功能模块网格 */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map((module) => (
            <Link
              key={module.id}
              href={module.href}
              className="group relative overflow-hidden rounded-xl border border-border/60 bg-card p-6 transition-all duration-300 hover:border-primary/40 hover:shadow-lg"
            >
              {/* 图标 */}
              <div className={cn(
                "w-14 h-14 rounded-xl flex items-center justify-center mb-6",
                "transition-all duration-300 group-hover:scale-110 group-hover:rotate-3",
                module.color === 'primary'
                  ? 'bg-primary/10'
                  : 'bg-accent/10'
              )}>
                <module.icon className={cn(
                  "h-7 w-7",
                  module.color === 'primary' ? 'text-primary' : 'text-accent'
                )} />
              </div>

              {/* 内容 */}
              <h3 className="font-heading text-xl font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                {module.name}
              </h3>
              <p className="text-muted-foreground">
                {module.description}
              </p>

              {/* 箭头 */}
              <div className="absolute bottom-6 right-6 opacity-0 transform translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                <ArrowRight className="h-5 w-5 text-primary" />
              </div>

              {/* 装饰线 */}
              <div className="mt-6 h-0.5 w-12 bg-gradient-to-r from-primary/50 to-transparent transition-all duration-300 group-hover:w-full" />
            </Link>
          ))}
        </div>

        {/* 快捷入口 */}
        <div className="mt-12">
          <h2 className="font-heading text-xl font-semibold text-foreground mb-6">
            快捷操作
          </h2>
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/shops/${shopId}/content?feature=video_script`}
              className="ink-tag ink-tag-inactive hover:ink-tag-active"
            >
              生成短视频脚本
            </Link>
            <Link
              href={`/shops/${shopId}/content?feature=xiaohongshu`}
              className="ink-tag ink-tag-inactive hover:ink-tag-active"
            >
              写小红书笔记
            </Link>
            <Link
              href={`/shops/${shopId}/content?feature=moments`}
              className="ink-tag ink-tag-inactive hover:ink-tag-active"
            >
              发朋友圈文案
            </Link>
            <Link
              href={`/shops/${shopId}/content?feature=campaign`}
              className="ink-tag ink-tag-inactive hover:ink-tag-active"
            >
              策划营销活动
            </Link>
            <Link
              href={`/shops/${shopId}/knowledge?tab=qa`}
              className="ink-tag ink-tag-inactive hover:ink-tag-active"
            >
              智能问答
            </Link>
            <Link
              href={`/shops/${shopId}/training?tab=roleplay`}
              className="ink-tag ink-tag-inactive hover:ink-tag-active"
            >
              AI 对练
            </Link>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
