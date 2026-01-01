'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { SkillCard } from '@/components/skills/SkillCard'
import { SKILL_CATEGORIES, Skill } from '@/types'
import { PRESET_SKILLS } from '@/lib/skills/config'
import { useAuth } from '@/contexts/AuthContext'
import { logger } from '@/lib/logger'
import {
  Search,
  Upload,
  Loader2,
  ArrowRight,
  Sparkles,
  Zap,
  Shield,
  Layers,
  X,
  PenTool,
  Feather,
  Palette,
  MessageCircle,
} from 'lucide-react'
import { getPublicSkills, getUserSkills } from '@/lib/db/skills'
import { cn } from '@/lib/utils'

export default function HomePage() {
  const router = useRouter()
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('全部')
  const [dbSkills, setDbSkills] = useState<Skill[]>([])
  const [userSkills, setUserSkills] = useState<Skill[]>([])
  const [loading, setLoading] = useState(true)
  const [useDatabase, setUseDatabase] = useState(false)

  const categories = ['全部', ...SKILL_CATEGORIES]

  // 加载技能数据
  useEffect(() => {
    async function loadSkills() {
      setLoading(true)
      try {
        const publicSkills = await getPublicSkills()
        if (publicSkills.length > 0) {
          setDbSkills(publicSkills)
          setUseDatabase(true)
        } else {
          setUseDatabase(false)
        }
        if (user) {
          const customSkills = await getUserSkills(user.id)
          setUserSkills(customSkills)
        }
      } catch (error) {
        logger.error('Error loading skills', error)
        setUseDatabase(false)
      } finally {
        setLoading(false)
      }
    }
    loadSkills()
  }, [user])

  // 键盘导航支持 - ESC 清除搜索,Enter 选择第一个结果
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ESC 清除搜索
      if (e.key === 'Escape' && searchQuery) {
        setSearchQuery('')
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [searchQuery])

  // 合并技能列表
  const allSkills = useMemo(() => {
    if (useDatabase) {
      return [...dbSkills, ...userSkills]
    }
    const presetAsSkills = PRESET_SKILLS.map((s) => ({
      ...s,
      content: '',
      metadata: {
        name: s.name!,
        description: s.description!,
        icon: s.icon!,
        category: s.category!,
        inputTypes: s.inputTypes!,
      },
      isPublic: true,
      usageCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    })) as Skill[]
    return [...presetAsSkills, ...userSkills]
  }, [useDatabase, dbSkills, userSkills])

  const filteredSkills = useMemo(() => {
    let skills = [...allSkills]
    if (activeCategory === '我的技能') {
      skills = skills.filter((skill) => skill.source === 'custom')
    } else if (activeCategory !== '全部') {
      skills = skills.filter((skill) => skill.category === activeCategory)
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      skills = skills.filter(
        (skill) =>
          skill.name?.toLowerCase().includes(query) ||
          skill.description?.toLowerCase().includes(query) ||
          skill.category?.toLowerCase().includes(query)
      )
    }
    return skills
  }, [searchQuery, activeCategory, allSkills])

  const handleSkillClick = (skillId: string) => {
    if (!user) {
      router.push('/login')
      return
    }
    router.push(`/skill/${skillId}`)
  }

  // 特性列表 - 东方美学配色
  const features = [
    {
      icon: PenTool,
      title: '文案创作',
      description: '朋友圈、短视频文案一键生成，妙笔生花',
      color: 'primary',
    },
    {
      icon: Feather,
      title: '内容改写',
      description: '智能润色与重写，让文字更具感染力',
      color: 'accent',
    },
    {
      icon: Palette,
      title: '创意设计',
      description: '海报文案、视觉创意，激发灵感火花',
      color: 'primary',
    },
    {
      icon: MessageCircle,
      title: '智能对话',
      description: '自然流畅的对话体验，懂你所想',
      color: 'accent',
    },
  ]

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />

      <main className="flex-1">
        {/* ==================== Hero 区域 - 墨韵东方风格 ==================== */}
        <section className="relative overflow-hidden min-h-[85vh] flex items-center">
          {/* 水墨背景装饰 */}
          <div className="absolute inset-0 pointer-events-none">
            {/* 主水墨晕染 */}
            <div
              className="absolute top-[-20%] right-[-10%] w-[70%] h-[80%] opacity-60 animate-gentle-pulse"
              style={{
                background: 'radial-gradient(ellipse at center, hsl(350 72% 50% / 0.08) 0%, transparent 60%)',
                filter: 'blur(80px)',
              }}
            />
            <div
              className="absolute bottom-[-10%] left-[-5%] w-[50%] h-[70%] opacity-50 animate-float"
              style={{
                background: 'radial-gradient(ellipse at center, hsl(160 45% 40% / 0.06) 0%, transparent 60%)',
                filter: 'blur(60px)',
                animationDelay: '1s',
              }}
            />
            {/* 装饰点 */}
            <div className="absolute top-[20%] left-[15%] w-3 h-3 rounded-full bg-primary/20 animate-float" style={{ animationDelay: '0.5s' }} />
            <div className="absolute top-[60%] right-[20%] w-2 h-2 rounded-full bg-accent/30 animate-float" style={{ animationDelay: '1.5s' }} />
            <div className="absolute bottom-[30%] left-[10%] w-4 h-4 rounded-full bg-primary/10 animate-float" style={{ animationDelay: '2s' }} />
          </div>

          <div className="container relative z-10 flex flex-col lg:flex-row items-center gap-12 lg:gap-20 py-16 lg:py-0">
            {/* 左侧文字区域 */}
            <div className="flex-1 text-center lg:text-left max-w-2xl">
              {/* 装饰标签 */}
              <div className="inline-flex items-center gap-2 mb-8 animate-fade-in-down">
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium">
                  <Sparkles className="h-4 w-4" />
                  实体店 AI 运营助手
                </span>
              </div>

              {/* 主标题 - 使用宋体 */}
              <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-semibold tracking-tight mb-6 animate-fade-in-up">
                <span className="block text-foreground">让创意</span>
                <span className="block mt-2">
                  <span className="text-gradient">如墨</span>
                  <span className="text-foreground">般流淌</span>
                </span>
              </h1>

              {/* 副标题 */}
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed mb-10 max-w-lg mx-auto lg:mx-0 animate-fade-in-up delay-100">
                短视频脚本、小红书笔记、朋友圈文案...
                <br className="hidden sm:block" />
                实体店 AI 运营助手，助你经营更轻松
              </p>

              {/* 按钮组 */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 animate-fade-in-up delay-200">
                <Link
                  href={user ? '#skills' : '/login'}
                  className="group ink-button ink-button-primary h-14 px-10 text-base"
                >
                  立即体验
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link
                  href="/docs"
                  className="ink-button ink-button-secondary h-14 px-10 text-base"
                >
                  了解更多
                </Link>
              </div>

              {/* 统计数据 */}
              <div className="mt-14 flex flex-wrap items-center justify-center lg:justify-start gap-10 animate-fade-in-up delay-300">
                <div className="group text-center">
                  <div className="stat-number group-hover:scale-110 transition-transform">7+</div>
                  <div className="text-sm text-muted-foreground mt-1">预设技能</div>
                </div>
                <div className="w-px h-10 bg-border/50" />
                <div className="group text-center">
                  <div className="stat-number group-hover:scale-110 transition-transform">∞</div>
                  <div className="text-sm text-muted-foreground mt-1">创意可能</div>
                </div>
                <div className="w-px h-10 bg-border/50" />
                <div className="group text-center">
                  <div className="stat-number group-hover:scale-110 transition-transform">24h</div>
                  <div className="text-sm text-muted-foreground mt-1">随时可用</div>
                </div>
              </div>
            </div>

            {/* 右侧装饰区域 - 印章风格 */}
            <div className="relative hidden lg:flex items-center justify-center w-[400px] h-[400px]">
              {/* 外圈 */}
              <div className="absolute inset-0 rounded-full border-2 border-dashed border-primary/20 animate-[spin_30s_linear_infinite]" />

              {/* 内圈装饰 */}
              <div className="absolute inset-8 rounded-full border border-primary/30" />

              {/* 中心印章 */}
              <div className="relative w-48 h-48 flex items-center justify-center animate-float">
                <div className="absolute inset-0 rounded-2xl border-2 border-primary/60 rotate-6" />
                <div className="absolute inset-2 rounded-xl border border-primary/40 -rotate-3" />
                <div className="relative z-10 text-center">
                  <div className="font-heading text-3xl font-bold text-primary tracking-wider">AI</div>
                  <div className="font-heading text-lg text-primary/80 mt-1">掌柜</div>
                </div>
              </div>

              {/* 四角装饰 */}
              <div className="absolute top-16 left-16 w-12 h-12 flex items-center justify-center">
                <PenTool className="w-6 h-6 text-primary/40" />
              </div>
              <div className="absolute top-16 right-16 w-12 h-12 flex items-center justify-center">
                <Feather className="w-6 h-6 text-accent/40" />
              </div>
              <div className="absolute bottom-16 left-16 w-12 h-12 flex items-center justify-center">
                <Palette className="w-6 h-6 text-accent/40" />
              </div>
              <div className="absolute bottom-16 right-16 w-12 h-12 flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-primary/40" />
              </div>
            </div>
          </div>

          {/* 滚动指示器 */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
            <div className="w-6 h-10 rounded-full border-2 border-primary/30 flex items-start justify-center p-2">
              <div className="w-1.5 h-2.5 rounded-full bg-primary/50 animate-[bounce_1s_ease-in-out_infinite]" />
            </div>
          </div>
        </section>

        {/* ==================== 特性区域 ==================== */}
        <section className="container py-24 md:py-32">
          <div className="mx-auto max-w-3xl text-center mb-16">
            <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-semibold text-foreground mb-4">
              功能特性
            </h2>
            <p className="text-lg text-muted-foreground">
              强大的 AI 能力，优雅的使用体验
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="feature-card group animate-fade-in-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* 图标 */}
                <div className={cn(
                  "w-14 h-14 rounded-xl flex items-center justify-center mb-6",
                  "transition-all duration-300 group-hover:scale-110 group-hover:rotate-3",
                  feature.color === 'primary'
                    ? 'icon-container'
                    : 'icon-container-accent'
                )}>
                  <feature.icon className={cn(
                    "w-7 h-7",
                    feature.color === 'primary' ? 'text-primary' : 'text-accent'
                  )} />
                </div>

                {/* 内容 */}
                <h3 className="font-heading text-xl font-semibold text-foreground mb-3">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>

                {/* 装饰线 */}
                <div className="mt-6 h-0.5 w-12 bg-gradient-to-r from-primary/50 to-transparent transition-all duration-300 group-hover:w-full" />
              </div>
            ))}
          </div>
        </section>

        {/* ==================== 技能广场 ==================== */}
        <section id="skills" className="py-24 md:py-32 bg-ink-texture">
          <div className="container">
            <div className="mx-auto max-w-3xl text-center mb-16">
              <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-semibold text-foreground mb-4">
                技能广场
              </h2>
              <p className="text-lg text-muted-foreground">
                选择一个技能，开启你的创作之旅
              </p>
            </div>

            {/* 搜索与筛选 */}
            <div className="max-w-4xl mx-auto space-y-8 mb-16">
              {/* 搜索框 */}
              <div className="ink-search max-w-xl mx-auto">
                <Search className="h-5 w-5 text-primary/60" />
                <input
                  type="text"
                  placeholder="搜索技能..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && filteredSkills.length > 0 && filteredSkills[0]?.id) {
                      handleSkillClick(filteredSkills[0].id)
                    }
                  }}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="p-1.5 rounded-lg hover:bg-secondary transition-colors"
                    aria-label="清除搜索"
                  >
                    <X className="h-4 w-4 text-muted-foreground" />
                  </button>
                )}
              </div>

              {/* 分类标签 */}
              <div className="flex flex-wrap justify-center gap-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setActiveCategory(category)}
                    className={cn(
                      'ink-tag',
                      activeCategory === category
                        ? 'ink-tag-active'
                        : 'ink-tag-inactive'
                    )}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            {/* 技能网格 */}
            <div className="max-w-6xl mx-auto">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-24">
                  <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                  <p className="text-muted-foreground">加载中...</p>
                </div>
              ) : (
                <>
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredSkills.map((skill, index) => (
                      <div
                        key={skill.id}
                        className="animate-fade-in-up"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <SkillCard skill={skill} />
                      </div>
                    ))}

                    {/* 添加自定义技能卡片 */}
                    {user && activeCategory === '我的技能' && (
                      <button
                        onClick={() => router.push('/my-skills')}
                        className={cn(
                          'group relative overflow-hidden rounded-xl border-2 border-dashed border-border/50 p-8',
                          'transition-all duration-300',
                          'hover:border-primary/40 hover:bg-primary/5'
                        )}
                      >
                        <div className="flex flex-col items-center justify-center h-full min-h-[180px]">
                          <div className="w-16 h-16 rounded-xl flex items-center justify-center bg-secondary mb-4 transition-all group-hover:bg-primary/10 group-hover:scale-110">
                            <Upload className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors" />
                          </div>
                          <h3 className="font-heading text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                            上传自定义技能
                          </h3>
                          <p className="mt-2 text-sm text-muted-foreground text-center">
                            上传 .skill 文件创建专属 AI 技能
                          </p>
                        </div>
                      </button>
                    )}
                  </div>

                  {/* 空状态 */}
                  {filteredSkills.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                      <div className="w-20 h-20 rounded-2xl flex items-center justify-center bg-secondary mb-6">
                        <Search className="h-10 w-10 text-muted-foreground" />
                      </div>
                      <p className="text-xl font-heading font-semibold text-foreground mb-2">
                        没有找到相关技能
                      </p>
                      <p className="text-muted-foreground">
                        试试其他关键词或切换分类
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </section>

        {/* ==================== CTA 区域 ==================== */}
        <section className="relative overflow-hidden py-28 md:py-36">
          {/* 背景装饰 */}
          <div className="absolute inset-0 bg-radial-fade pointer-events-none" />
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-px"
            style={{
              background: 'linear-gradient(90deg, transparent, hsl(var(--border)), transparent)',
            }}
          />

          <div className="container relative z-10">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-semibold text-foreground mb-6">
                准备好开始了吗？
              </h2>
              <p className="text-lg text-muted-foreground mb-10">
                立即注册，免费体验全部 AI 技能
              </p>
              <Link
                href={user ? '#skills' : '/login'}
                className="group inline-flex items-center ink-button ink-button-primary h-14 px-12 text-lg"
              >
                {user ? '浏览技能' : '免费开始'}
                <ArrowRight className="ml-3 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>

          <div
            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[80%] h-px"
            style={{
              background: 'linear-gradient(90deg, transparent, hsl(var(--border)), transparent)',
            }}
          />
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
