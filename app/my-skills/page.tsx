"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { SkillUploader } from '@/components/skills/SkillUploader'
import { useConfirm } from '@/components/ui/confirm-dialog'
import {
  Plus,
  Edit,
  Trash2,
  Download,
  Share2,
  Loader2,
  Sparkles,
  Upload,
  ArrowUpRight,
} from 'lucide-react'
import { Skill } from '@/types'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'
import {
  getUserSkills,
  createSkill,
  deleteSkill,
  updateSkill,
} from '@/lib/db/skills'

export default function MySkillsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { confirm, ConfirmDialog } = useConfirm()
  const [showUploader, setShowUploader] = useState(false)
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null)
  const [mySkills, setMySkills] = useState<Skill[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)

  // 加载用户技能
  useEffect(() => {
    async function loadUserSkills() {
      if (!user) {
        router.push('/login')
        return
      }

      setLoading(true)
      try {
        const skills = await getUserSkills(user.id)
        setMySkills(skills)
      } catch (error) {
        console.error('Error loading user skills:', error)
      } finally {
        setLoading(false)
      }
    }

    loadUserSkills()
  }, [user, router])

  const handleSkillUpload = async (skillData: Partial<Skill>) => {
    if (!user) return

    try {
      // 编辑模式：更新现有技能
      if (editingSkill?.id) {
        const updated = await updateSkill(editingSkill.id, {
          name: skillData.name!,
          description: skillData.description!,
          icon: skillData.icon || 'Sparkles',
          category: skillData.category || '我的技能',
          inputTypes: skillData.inputTypes || ['text'],
          placeholder: skillData.placeholder,
          content: skillData.content || '',
          metadata: {
            name: skillData.name!,
            description: skillData.description!,
            icon: skillData.icon || 'Sparkles',
            category: skillData.category || '我的技能',
            inputTypes: skillData.inputTypes || ['text'],
          },
        })

        if (updated) {
          setMySkills(prev => prev.map(s => (s.id === updated.id ? updated : s)))
        }
      } else {
        // 创建模式：新建技能
        const newSkill = await createSkill({
          name: skillData.name!,
          description: skillData.description!,
          icon: skillData.icon || 'Sparkles',
          category: skillData.category || '我的技能',
          inputTypes: skillData.inputTypes || ['text'],
          placeholder: skillData.placeholder,
          source: 'custom',
          ownerId: user.id,
          content: skillData.content || '',
          metadata: {
            name: skillData.name!,
            description: skillData.description!,
            icon: skillData.icon || 'Sparkles',
            category: skillData.category || '我的技能',
            inputTypes: skillData.inputTypes || ['text'],
          },
          isPublic: false,
        })

        if (newSkill) {
          setMySkills(prev => [newSkill, ...prev])
        }
      }
    } catch (error) {
      console.error('Error saving skill:', error)
      alert(editingSkill?.id ? '更新技能失败，请重试' : '创建技能失败，请重试')
    }

    setShowUploader(false)
    setEditingSkill(null)
  }

  const handleEditSkill = (skill: Skill) => {
    setEditingSkill(skill)
    setShowUploader(true)
  }

  const handleDeleteSkill = async (skillId: string) => {
    const confirmed = await confirm({
      title: '删除技能',
      description: '确定要删除这个技能吗？此操作不可恢复。',
      confirmText: '删除',
      cancelText: '取消',
      variant: 'destructive',
    })

    if (!confirmed) {
      return
    }

    setDeleting(skillId)
    try {
      const success = await deleteSkill(skillId)
      if (success) {
        setMySkills(prev => prev.filter(s => s.id !== skillId))
      } else {
        alert('删除失败，请重试')
      }
    } catch (error) {
      console.error('Error deleting skill:', error)
      alert('删除失败，请重试')
    } finally {
      setDeleting(null)
    }
  }

  const handleExportSkill = (skill: Skill) => {
    // 生成 SKILL.md 内容
    const content = `---
name: ${skill.id}
description: ${skill.description}
icon: ${skill.icon}
category: ${skill.category}
inputTypes: [${skill.inputTypes.join(', ')}]
${skill.placeholder ? `placeholder: ${skill.placeholder}` : ''}
---

${skill.content || '# ' + skill.name}
`

    // 创建下载
    const blob = new Blob([content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${skill.id || skill.name}.skill.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleTogglePublic = async (skill: Skill) => {
    try {
      const updated = await updateSkill(skill.id, {
        isPublic: !skill.isPublic,
      })

      if (updated) {
        setMySkills(prev =>
          prev.map(s => (s.id === skill.id ? updated : s))
        )
      }
    } catch (error) {
      console.error('Error updating skill:', error)
    }
  }

  const handleUseSkill = (skillId: string) => {
    router.push(`/skill/${skillId}`)
  }

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

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />

      <main className="flex-1">
        {/* 页面头部 - AI Valley 风格 */}
        <section className="relative overflow-hidden valley-hero-gradient border-b border-border/40">
          <div className="container relative z-10 py-12 md:py-16">
            <div className="max-w-4xl mx-auto">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div className="animate-fade-in-up">
                  <h1 className="text-3xl md:text-4xl font-semibold mb-2">我的技能</h1>
                  <p className="text-muted-foreground">
                    管理您上传的自定义技能，打造专属 AI 助手
                  </p>
                </div>
                <button
                  onClick={() => setShowUploader(true)}
                  className={cn(
                    'valley-button valley-button-primary h-12 px-6 text-base',
                    'hover:shadow-valley-hover transition-all duration-300',
                    'animate-fade-in-up'
                  )}
                >
                  <Upload className="mr-2 h-5 w-5" />
                  上传新技能
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* 技能列表区域 */}
        <section className="container py-8 md:py-12">
          <div className="max-w-4xl mx-auto">
            {/* Loading State */}
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="flex flex-col items-center gap-4">
                  <Loader2 className="h-10 w-10 animate-spin text-accent" />
                  <p className="text-muted-foreground">加载技能中...</p>
                </div>
              </div>
            ) : mySkills.length === 0 ? (
              /* Empty State - AI Valley 风格 */
              <div className="valley-card-glow p-12 text-center animate-fade-in-up">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-accent/20 to-accent/5">
                  <Sparkles className="h-10 w-10 text-accent" />
                </div>
                <h3 className="text-xl font-semibold mb-3">还没有上传技能</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  上传您的第一个自定义技能，扩展 AI 能力边界。支持 SKILL.md 格式文件。
                </p>
                <button
                  onClick={() => setShowUploader(true)}
                  className="valley-button valley-button-secondary h-11 px-6 border border-border/50 hover:border-accent/50"
                >
                  <Plus className="mr-2 h-5 w-5" />
                  上传技能
                </button>
              </div>
            ) : (
              /* Skills List - AI Valley 风格 */
              <div className="space-y-4">
                {mySkills.map((skill, index) => (
                  <div
                    key={skill.id}
                    className={cn(
                      'group valley-card-glow p-6 cursor-pointer animate-fade-in-up'
                    )}
                    onClick={() => handleUseSkill(skill.id)}
                  >
                    <div className="relative z-10">
                      <div className="flex items-start justify-between gap-4">
                        {/* 技能信息 */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold truncate transition-colors group-hover:text-accent">
                              {skill.name}
                            </h3>
                            {skill.isPublic && (
                              <span className={cn(
                                'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium',
                                'bg-accent/15 text-accent border border-accent/30'
                              )}>
                                公开
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                            {skill.description}
                          </p>
                          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                            <span className={cn(
                              'inline-flex items-center rounded-full px-3 py-1',
                              'bg-secondary/50 border border-border/50'
                            )}>
                              {skill.category}
                            </span>
                            <span>使用 {skill.usageCount || 0} 次</span>
                            <span>
                              {skill.createdAt
                                ? new Date(skill.createdAt).toLocaleDateString('zh-CN')
                                : '刚刚创建'}
                            </span>
                          </div>
                        </div>

                        {/* 操作按钮组 */}
                        <div
                          className="flex items-center gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            className={cn(
                              'flex h-9 w-9 items-center justify-center rounded-lg',
                              'text-muted-foreground transition-all duration-200',
                              'hover:bg-accent/10 hover:text-accent'
                            )}
                            title="编辑"
                            onClick={() => handleEditSkill(skill)}
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            className={cn(
                              'flex h-9 w-9 items-center justify-center rounded-lg',
                              'text-muted-foreground transition-all duration-200',
                              'hover:bg-accent/10 hover:text-accent'
                            )}
                            title="导出"
                            onClick={() => handleExportSkill(skill)}
                          >
                            <Download className="h-4 w-4" />
                          </button>
                          <button
                            className={cn(
                              'flex h-9 w-9 items-center justify-center rounded-lg',
                              'text-muted-foreground transition-all duration-200',
                              'hover:bg-accent/10 hover:text-accent'
                            )}
                            title={skill.isPublic ? '取消公开' : '公开分享'}
                            onClick={() => handleTogglePublic(skill)}
                          >
                            <Share2 className="h-4 w-4" />
                          </button>
                          <button
                            className={cn(
                              'flex h-9 w-9 items-center justify-center rounded-lg',
                              'transition-all duration-200',
                              'text-destructive hover:bg-destructive/10'
                            )}
                            title="删除"
                            onClick={() => handleDeleteSkill(skill.id)}
                            disabled={deleting === skill.id}
                          >
                            {deleting === skill.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </button>
                        </div>

                        {/* 右侧箭头 */}
                        <div className={cn(
                          'hidden sm:flex h-10 w-10 items-center justify-center rounded-full',
                          'bg-secondary/50 text-muted-foreground',
                          'transition-all duration-300',
                          'group-hover:bg-accent group-hover:text-accent-foreground',
                          'group-hover:translate-x-1 group-hover:-translate-y-1'
                        )}>
                          <ArrowUpRight className="h-5 w-5" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      <SiteFooter />

      {/* Skill Uploader Modal */}
      {showUploader && (
        <SkillUploader
          onClose={() => {
            setShowUploader(false)
            setEditingSkill(null)
          }}
          onUpload={handleSkillUpload}
          initialData={editingSkill || undefined}
        />
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog />
    </div>
  )
}
