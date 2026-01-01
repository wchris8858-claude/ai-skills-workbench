'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { useAuth } from '@/contexts/AuthContext'
import { logger } from '@/lib/logger'
import {
  Store,
  Plus,
  Settings,
  Users,
  MoreVertical,
  Loader2,
  Building2,
  MapPin,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Shop {
  id: string
  name: string
  industry?: string
  description?: string
  role: 'owner' | 'admin' | 'editor' | 'viewer'
  createdAt: string
}

export default function ShopsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [shops, setShops] = useState<Shop[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)

  // 加载店铺列表
  useEffect(() => {
    async function loadShops() {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        const response = await fetch('/api/v2/shops?includeShared=true')
        if (response.ok) {
          const data = await response.json()
          setShops(data.shops || [])
        }
      } catch (error) {
        logger.error('Error loading shops', error)
      } finally {
        setLoading(false)
      }
    }

    loadShops()
  }, [user])

  // 未登录
  if (!user) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <SiteHeader />
        <main className="flex-1 container py-16 flex items-center justify-center">
          <div className="text-center">
            <Store className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-heading font-semibold mb-2">请先登录</h1>
            <p className="text-muted-foreground mb-6">登录后可以管理您的店铺</p>
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

  const getRoleBadge = (role: Shop['role']) => {
    const styles = {
      owner: 'bg-primary/10 text-primary border-primary/20',
      admin: 'bg-accent/10 text-accent border-accent/20',
      editor: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      viewer: 'bg-secondary text-muted-foreground border-border',
    }
    const labels = {
      owner: '所有者',
      admin: '管理员',
      editor: '编辑',
      viewer: '查看',
    }
    return (
      <span className={cn('px-2 py-0.5 rounded-full text-xs border', styles[role])}>
        {labels[role]}
      </span>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />

      <main className="flex-1 container py-8 md:py-12">
        {/* 页面标题 */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-heading font-semibold text-foreground">
              我的店铺
            </h1>
            <p className="text-muted-foreground mt-1">
              管理您的店铺和团队
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="ink-button ink-button-primary"
          >
            <Plus className="h-4 w-4 mr-2" />
            创建店铺
          </button>
        </div>

        {/* 店铺列表 */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : shops.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center bg-secondary mb-6">
              <Store className="h-10 w-10 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-heading font-semibold text-foreground mb-2">
              还没有店铺
            </h2>
            <p className="text-muted-foreground mb-6 max-w-md">
              创建您的第一个店铺，开始使用 AI 掌柜的全部功能
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="ink-button ink-button-primary"
            >
              <Plus className="h-4 w-4 mr-2" />
              创建店铺
            </button>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {shops.map((shop) => (
              <div
                key={shop.id}
                className="group relative overflow-hidden rounded-xl border border-border/60 bg-card p-6 transition-all duration-300 hover:border-primary/40 hover:shadow-lg cursor-pointer"
                onClick={() => router.push(`/shops/${shop.id}`)}
              >
                {/* 头部 */}
                <div className="flex items-start justify-between mb-4">
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-primary/10">
                    <Building2 className="h-7 w-7 text-primary" />
                  </div>
                  {getRoleBadge(shop.role)}
                </div>

                {/* 内容 */}
                <h3 className="font-heading text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                  {shop.name}
                </h3>

                {shop.industry && (
                  <p className="text-sm text-muted-foreground mb-2">
                    {shop.industry}
                  </p>
                )}

                {shop.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {shop.description}
                  </p>
                )}

                {/* 底部操作 */}
                <div className="mt-4 pt-4 border-t border-border/60 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    创建于 {new Date(shop.createdAt).toLocaleDateString('zh-CN')}
                  </span>
                  <div className="flex items-center gap-2">
                    {(shop.role === 'owner' || shop.role === 'admin') && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push(`/shops/${shop.id}/settings`)
                        }}
                        className="p-2 rounded-lg hover:bg-secondary transition-colors"
                        title="设置"
                      >
                        <Settings className="h-4 w-4 text-muted-foreground" />
                      </button>
                    )}
                    {shop.role === 'owner' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push(`/shops/${shop.id}/members`)
                        }}
                        className="p-2 rounded-lg hover:bg-secondary transition-colors"
                        title="成员管理"
                      >
                        <Users className="h-4 w-4 text-muted-foreground" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* 添加店铺卡片 */}
            <button
              onClick={() => setShowCreateModal(true)}
              className="group relative overflow-hidden rounded-xl border-2 border-dashed border-border/50 p-6 transition-all duration-300 hover:border-primary/40 hover:bg-primary/5"
            >
              <div className="flex flex-col items-center justify-center h-full min-h-[200px]">
                <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-secondary mb-4 transition-all group-hover:bg-primary/10 group-hover:scale-110">
                  <Plus className="h-7 w-7 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <h3 className="font-heading text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                  创建新店铺
                </h3>
                <p className="mt-2 text-sm text-muted-foreground text-center">
                  添加更多店铺，统一管理
                </p>
              </div>
            </button>
          </div>
        )}
      </main>

      <SiteFooter />

      {/* 创建店铺模态框 */}
      {showCreateModal && (
        <CreateShopModal
          onClose={() => setShowCreateModal(false)}
          onCreated={(shop) => {
            setShops([...shops, { ...shop, role: 'owner' }])
            setShowCreateModal(false)
          }}
        />
      )}
    </div>
  )
}

// 创建店铺模态框组件
function CreateShopModal({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated: (shop: Shop) => void
}) {
  const [name, setName] = useState('')
  const [industry, setIndustry] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const industries = [
    '瑜伽馆',
    '健身房',
    '美容美发',
    '餐饮店',
    '零售店',
    '教育培训',
    '医疗健康',
    '其他',
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('请输入店铺名称')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/v2/shops', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, industry, description }),
      })

      if (response.ok) {
        const data = await response.json()
        onCreated(data.shop)
      } else {
        const data = await response.json()
        setError(data.error || '创建失败')
      }
    } catch {
      setError('网络错误，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 遮罩 */}
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* 模态框 */}
      <div className="relative w-full max-w-md mx-4 rounded-2xl border border-border bg-card p-6 shadow-xl">
        <h2 className="text-xl font-heading font-semibold text-foreground mb-6">
          创建新店铺
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 店铺名称 */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              店铺名称 <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如：瑜伽生活馆"
              className="w-full h-11 px-4 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          {/* 行业 */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              所属行业
            </label>
            <select
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className="w-full h-11 px-4 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              <option value="">请选择行业</option>
              {industries.map((ind) => (
                <option key={ind} value={ind}>
                  {ind}
                </option>
              ))}
            </select>
          </div>

          {/* 描述 */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              店铺简介
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="简要描述您的店铺..."
              rows={3}
              className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
            />
          </div>

          {/* 错误提示 */}
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          {/* 按钮 */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="ink-button ink-button-secondary"
              disabled={loading}
            >
              取消
            </button>
            <button
              type="submit"
              className="ink-button ink-button-primary"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  创建中...
                </>
              ) : (
                '创建店铺'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
