'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { useAuth } from '@/contexts/AuthContext'
import { Loader2, History, Clock, MessageSquare, ArrowRight, Trash2, Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getRecentConversationsWithSkills, deleteConversation } from '@/lib/db/conversations'
import { Conversation } from '@/types'
import { getIcon } from '@/lib/icons'
import { useConfirm } from '@/components/ui/confirm-dialog'
import { logger } from '@/lib/logger'

interface HistoryItem {
  conversation: Omit<Conversation, 'messages'>
  skillName: string
  skillIcon: string
  lastMessagePreview: string | null
}

export default function HistoryPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { confirm, ConfirmDialog } = useConfirm()
  const [loading, setLoading] = useState(true)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    async function loadHistory() {
      if (!user) {
        router.push('/login')
        return
      }

      setLoading(true)
      try {
        const conversations = await getRecentConversationsWithSkills(user.id, 50)
        setHistory(conversations)
      } catch (error) {
        logger.error('Error loading history', error)
      } finally {
        setLoading(false)
      }
    }

    loadHistory()
  }, [user, router])

  // 过滤历史记录
  const filteredHistory = history.filter(item => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      item.skillName.toLowerCase().includes(query) ||
      (item.lastMessagePreview?.toLowerCase().includes(query) ?? false)
    )
  })

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-accent" />
            <p className="text-muted-foreground">加载中...</p>
          </div>
        </div>
      </div>
    )
  }

  const handleViewDetail = (skillId: string, conversationId: string) => {
    // 跳转到技能页面，带上对话ID参数以恢复历史对话
    router.push(`/skill/${skillId}?conversation=${conversationId}`)
  }

  const handleDelete = async (conversationId: string) => {
    const confirmed = await confirm({
      title: '删除对话记录',
      description: '确定要删除这条对话记录吗？此操作不可恢复。',
      confirmText: '删除',
      cancelText: '取消',
      variant: 'destructive',
    })

    if (!confirmed) {
      return
    }

    setDeleting(conversationId)
    try {
      const success = await deleteConversation(conversationId)
      if (success) {
        setHistory(prev => prev.filter(item => item.conversation.id !== conversationId))
      }
    } catch (error) {
      logger.error('Error deleting conversation', error)
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />

      <main className="flex-1">
        {/* 页面头部 */}
        <section className="relative overflow-hidden valley-hero-gradient border-b border-border/40">
          <div className="container relative z-10 py-12 md:py-16">
            <div className="max-w-4xl mx-auto">
              <div className="animate-fade-in-up">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-accent/20 to-accent/5">
                    <History className="h-6 w-6 text-accent" />
                  </div>
                  <h1 className="text-3xl md:text-4xl font-semibold text-foreground">历史记录</h1>
                </div>
                <p className="text-muted-foreground">
                  查看您的 AI 对话历史记录
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 历史记录列表 */}
        <section className="container py-8 md:py-12">
          <div className="max-w-4xl mx-auto">
            {/* 搜索框 */}
            {history.length > 0 && (
              <div className="valley-search max-w-md mb-6">
                <Search className="h-5 w-5 text-accent" />
                <input
                  type="text"
                  placeholder="搜索对话记录..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="text-base"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="p-1 rounded-lg hover:bg-secondary transition-colors"
                    aria-label="清除搜索"
                  >
                    <X className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
                  </button>
                )}
              </div>
            )}

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="flex flex-col items-center gap-4">
                  <Loader2 className="h-10 w-10 animate-spin text-accent" />
                  <p className="text-muted-foreground">加载历史记录...</p>
                </div>
              </div>
            ) : history.length === 0 ? (
              /* 空状态 */
              <div className="valley-card-glow p-12 text-center animate-fade-in-up">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-accent/20 to-accent/5">
                  <MessageSquare className="h-10 w-10 text-accent" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-foreground">还没有历史记录</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  开始使用 AI 技能后，您的对话记录会显示在这里
                </p>
                <button
                  onClick={() => router.push('/#skills')}
                  className="valley-button valley-button-secondary h-11 px-6 border border-border/50 hover:border-accent/50"
                >
                  浏览技能
                  <ArrowRight className="ml-2 h-4 w-4" />
                </button>
              </div>
            ) : filteredHistory.length === 0 ? (
              /* 搜索无结果 */
              <div className="valley-card-glow p-12 text-center animate-fade-in-up">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-accent/20 to-accent/5">
                  <Search className="h-10 w-10 text-accent" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-foreground">没有找到相关记录</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  试试其他关键词
                </p>
                <button
                  onClick={() => setSearchQuery('')}
                  className="valley-button valley-button-secondary h-11 px-6 border border-border/50 hover:border-accent/50"
                >
                  清除搜索
                  <X className="ml-2 h-4 w-4" />
                </button>
              </div>
            ) : (
              /* 历史记录列表 */
              <div className="space-y-4">
                {filteredHistory.map((item) => {
                  const IconComponent = getIcon(item.skillIcon)
                  return (
                    <div
                      key={item.conversation.id}
                      className="group valley-card-glow p-6 cursor-pointer animate-fade-in-up"
                      onClick={() => handleViewDetail(item.conversation.skillId, item.conversation.id)}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4 flex-1 min-w-0">
                          {/* 技能图标 */}
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-accent/20 to-accent/5">
                            <IconComponent className="h-6 w-6 text-accent" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-lg font-semibold text-foreground truncate group-hover:text-accent transition-colors">
                                {item.skillName}
                              </h3>
                            </div>
                            {item.lastMessagePreview && (
                              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                                {item.lastMessagePreview}...
                              </p>
                            )}
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {new Date(item.conversation.updatedAt).toLocaleString('zh-CN')}
                              </span>
                            </div>
                          </div>
                        </div>

                        <button
                          className={cn(
                            'flex h-9 w-9 items-center justify-center rounded-lg shrink-0',
                            'text-muted-foreground transition-all duration-200',
                            'hover:bg-destructive/10 hover:text-destructive',
                            deleting === item.conversation.id && 'opacity-50 cursor-not-allowed'
                          )}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDelete(item.conversation.id)
                          }}
                          disabled={deleting === item.conversation.id}
                          title="删除"
                          aria-label="删除对话"
                        >
                          {deleting === item.conversation.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </section>
      </main>

      <SiteFooter />
      <ConfirmDialog />
    </div>
  )
}
