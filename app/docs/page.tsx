'use client'

import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { Book, Sparkles, Upload, Zap, Shield, Code, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

export default function DocsPage() {
  const sections = [
    {
      title: '快速开始',
      icon: Zap,
      description: '了解如何快速开始使用 AI Skills Workbench',
      items: [
        { title: '注册登录', description: '创建账号并登录系统' },
        { title: '选择技能', description: '在技能广场浏览并选择 AI 技能' },
        { title: '开始对话', description: '与 AI 助手进行交互' },
      ]
    },
    {
      title: '预设技能',
      icon: Sparkles,
      description: '平台提供的预设 AI 技能',
      items: [
        { title: '朋友圈文案', description: '生成吸引人的朋友圈文案' },
        { title: '官方通知', description: '生成正式的官方通知文本' },
        { title: '海报制作', description: '生成创意海报设计' },
        { title: 'AI 选片修片', description: '智能照片评分和修图建议' },
      ]
    },
    {
      title: '自定义技能',
      icon: Upload,
      description: '创建和管理您自己的 AI 技能',
      items: [
        { title: 'SKILL.md 格式', description: '了解技能文件的格式规范' },
        { title: '上传技能', description: '上传自定义 AI 技能' },
        { title: '管理技能', description: '编辑、删除和分享您的技能' },
      ]
    },
    {
      title: 'API 集成',
      icon: Code,
      description: '将 AI 能力集成到您的应用',
      items: [
        { title: 'API 密钥', description: '获取和管理 API 密钥' },
        { title: 'API 文档', description: '查看详细的 API 接口文档' },
        { title: '示例代码', description: '参考各种语言的示例代码' },
      ]
    },
    {
      title: '安全隐私',
      icon: Shield,
      description: '了解我们如何保护您的数据',
      items: [
        { title: '数据加密', description: '所有数据传输和存储均加密' },
        { title: '隐私政策', description: '查看我们的隐私保护政策' },
        { title: '使用条款', description: '了解服务使用条款' },
      ]
    },
  ]

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
                    <Book className="h-6 w-6 text-accent" />
                  </div>
                  <h1 className="text-3xl md:text-4xl font-semibold text-foreground">文档中心</h1>
                </div>
                <p className="text-muted-foreground">
                  学习如何使用 AI Skills Workbench 的各项功能
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 文档内容 */}
        <section className="container py-8 md:py-12">
          <div className="max-w-6xl mx-auto">
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {sections.map((section, index) => (
                <div
                  key={section.title}
                  className="valley-card-glow p-6 animate-fade-in-up"
                >
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-accent/20 to-accent/5">
                      <section.icon className="h-5 w-5 text-accent" />
                    </div>
                    <h2 className="text-xl font-semibold text-foreground">{section.title}</h2>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    {section.description}
                  </p>
                  <div className="space-y-3">
                    {section.items.map((item) => (
                      <div
                        key={item.title}
                        className="group cursor-pointer rounded-lg p-3 transition-all hover:bg-secondary/50"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <h3 className="text-sm font-medium text-foreground group-hover:text-accent transition-colors">
                              {item.title}
                            </h3>
                            <p className="text-xs text-muted-foreground mt-1">
                              {item.description}
                            </p>
                          </div>
                          <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-1" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* 底部提示 */}
            <div className="mt-12 valley-card-glow p-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-accent/20 to-accent/5">
                <Sparkles className="h-8 w-8 text-accent" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-foreground">需要帮助?</h3>
              <p className="text-muted-foreground mb-6">
                如果您在使用过程中遇到问题，欢迎联系我们的技术支持团队
              </p>
              <Link
                href="/#skills"
                className={cn(
                  'valley-button valley-button-primary h-11 px-6 inline-flex items-center',
                  'hover:shadow-valley-hover transition-all duration-300'
                )}
              >
                开始使用
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
