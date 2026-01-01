'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { useAuth } from '@/contexts/AuthContext'
import { logger } from '@/lib/logger'
import {
  Store,
  FileText,
  Calendar,
  BarChart3,
  GraduationCap,
  MessageSquare,
  Loader2,
  ChevronLeft,
  Clock,
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
        logger.error('Error loading shop', error)
      } finally {
        setLoading(false)
      }
    }

    loadShop()
  }, [user, shopId, router])

  // 功能模块（即将上线）
  const modules = [
    {
      id: 'content',
      name: '内容生成',
      description: '短视频脚本、小红书笔记、朋友圈文案',
      icon: FileText,
      color: 'primary',
    },
    {
      id: 'calendar',
      name: '内容日历',
      description: '规划和管理内容发布计划',
      icon: Calendar,
      color: 'accent',
    },
    {
      id: 'analytics',
      name: '数据分析',
      description: '运营数据录入与分析',
      icon: BarChart3,
      color: 'primary',
    },
    {
      id: 'knowledge',
      name: '知识库',
      description: '品牌知识管理与智能问答',
      icon: MessageSquare,
      color: 'accent',
    },
    {
      id: 'training',
      name: '员工培训',
      description: 'AI 对练与考核系统',
      icon: GraduationCap,
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

        </div>

        {/* 功能模块网格 */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map((module) => (
            <div
              key={module.id}
              className="group relative overflow-hidden rounded-xl border border-border/60 bg-card p-6 opacity-75"
            >
              {/* 即将上线标记 */}
              <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20">
                <Clock className="h-3.5 w-3.5 text-amber-600" />
                <span className="text-xs font-medium text-amber-600">即将上线</span>
              </div>

              {/* 图标 */}
              <div className={cn(
                "w-14 h-14 rounded-xl flex items-center justify-center mb-6",
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
              <h3 className="font-heading text-xl font-semibold text-foreground mb-2">
                {module.name}
              </h3>
              <p className="text-muted-foreground">
                {module.description}
              </p>

              {/* 装饰线 */}
              <div className="mt-6 h-0.5 w-12 bg-gradient-to-r from-muted-foreground/30 to-transparent" />
            </div>
          ))}
        </div>

        {/* 快捷入口（即将上线） */}
        <div className="mt-12">
          <h2 className="font-heading text-xl font-semibold text-foreground mb-6">
            快捷操作
            <span className="ml-2 text-xs font-normal text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-full">即将上线</span>
          </h2>
          <div className="flex flex-wrap gap-3">
            <span className="ink-tag ink-tag-inactive opacity-60 cursor-not-allowed">
              生成短视频脚本
            </span>
            <span className="ink-tag ink-tag-inactive opacity-60 cursor-not-allowed">
              写小红书笔记
            </span>
            <span className="ink-tag ink-tag-inactive opacity-60 cursor-not-allowed">
              发朋友圈文案
            </span>
            <span className="ink-tag ink-tag-inactive opacity-60 cursor-not-allowed">
              策划营销活动
            </span>
            <span className="ink-tag ink-tag-inactive opacity-60 cursor-not-allowed">
              智能问答
            </span>
            <span className="ink-tag ink-tag-inactive opacity-60 cursor-not-allowed">
              AI 对练
            </span>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
