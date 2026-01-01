'use client'

import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react'
import { SiteHeader } from '@/components/site-header'
import { ConversationView } from '@/components/ConversationView'
import { PRESET_SKILLS } from '@/lib/skills/config'
import { useAuth } from '@/contexts/AuthContext'
import { getSkillById } from '@/lib/db/skills'
import { cn } from '@/lib/utils'
import { getIcon } from '@/lib/icons'
import { getSkillModelConfig } from '@/lib/models/config'
import { logger } from '@/lib/logger'

export default function SkillPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading: authLoading } = useAuth()
  const skillId = params.id as string
  const conversationId = searchParams.get('conversation') || undefined

  const [skill, setSkill] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    async function loadSkill() {
      setLoading(true)
      setNotFound(false)

      // 先从预设技能中查找
      const foundSkill = PRESET_SKILLS.find(s => s.id === skillId)
      if (foundSkill) {
        setSkill(foundSkill)
        setLoading(false)
        return
      }

      // 从数据库中查找自定义技能
      try {
        const dbSkill = await getSkillById(skillId)
        if (dbSkill) {
          setSkill(dbSkill)
        } else {
          setNotFound(true)
        }
      } catch (error) {
        logger.error('Error loading skill', error)
        setNotFound(true)
      } finally {
        setLoading(false)
      }
    }

    loadSkill()
  }, [skillId])

  useEffect(() => {
    // 等待认证加载完成后再判断
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  // 加载中状态
  if (loading || authLoading) {
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

  // 技能未找到状态
  if (notFound || !skill) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="flex flex-col items-center gap-4 text-center px-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <h2 className="text-xl font-semibold">技能未找到</h2>
            <p className="text-muted-foreground max-w-md">
              找不到 ID 为 "{skillId}" 的技能，可能已被删除或不存在。
            </p>
            <button
              onClick={() => router.push('/')}
              className={cn(
                'mt-4 px-6 py-2 rounded-full',
                'bg-accent text-accent-foreground',
                'hover:bg-accent/90 transition-colors'
              )}
            >
              返回首页
            </button>
          </div>
        </div>
      </div>
    )
  }

  const SkillIcon = getIcon(skill.icon)

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* 技能信息栏 - AI Valley 风格 */}
      <div className="border-b border-border/40 bg-background/80 backdrop-blur-xl sticky top-16 z-40">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          {/* 返回按钮 */}
          <button
            onClick={() => router.back()}
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-full',
              'bg-secondary/50 text-muted-foreground',
              'transition-all duration-200',
              'hover:bg-accent/20 hover:text-accent'
            )}
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          {/* 技能图标 */}
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-accent/20 to-accent/5">
            <SkillIcon className="h-6 w-6 text-accent" />
          </div>

          {/* 技能信息 */}
          <div className="flex-1 min-w-0">
            <h1 className="font-semibold text-lg truncate">{skill.name}</h1>
            <p className="text-sm text-muted-foreground truncate">{skill.description}</p>
          </div>

          {/* 右侧操作区（预留） */}
          <div className="hidden sm:flex items-center gap-2">
            <span className={cn(
              'inline-flex items-center rounded-full px-3 py-1 text-xs font-medium',
              'bg-accent/10 text-accent border border-accent/30'
            )}>
              {skill.category}
            </span>
          </div>
        </div>
      </div>

      <ConversationView
        skillId={skill.id}
        skillName={skill.name}
        placeholder={skill.placeholder}
        inputTypes={skill.inputTypes || ['text']}
        modelInfo={getSkillModelConfig(skill.id).text.model}
        initialConversationId={conversationId}
      />
    </div>
  )
}