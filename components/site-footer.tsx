import Link from 'next/link'
import { Sparkles, Heart, ExternalLink } from 'lucide-react'

const footerLinks = [
  { href: '/docs', label: '文档' },
  { href: '/privacy', label: '隐私政策' },
  { href: '/terms', label: '服务条款' },
]

export function SiteFooter() {
  return (
    <footer className="relative border-t border-border/40 bg-card/50">
      {/* 装饰分隔线 */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-px"
        style={{
          background: 'linear-gradient(90deg, transparent, hsl(var(--primary) / 0.5), transparent)',
        }}
      />

      <div className="container py-12 md:py-16">
        <div className="grid gap-8 md:grid-cols-3 md:gap-12">
          {/* 品牌区域 */}
          <div className="space-y-4">
            <Link href="/" className="inline-flex items-center space-x-3 group">
              <div className="relative w-9 h-9 flex items-center justify-center">
                <div className="absolute inset-0 border-2 border-primary/60 rounded rotate-3 transition-transform group-hover:rotate-6" />
                <Sparkles className="h-4 w-4 text-primary relative z-10" />
              </div>
              <span className="font-heading font-semibold text-lg tracking-wide">
                AI 工具箱
              </span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              一站式 AI 能力平台，让创意如墨般流淌。文案创作、内容分析、智能对话，为你的创意赋能。
            </p>
          </div>

          {/* 链接区域 */}
          <div className="space-y-4">
            <h3 className="font-heading font-semibold text-sm text-foreground">
              快速链接
            </h3>
            <nav className="flex flex-col space-y-2">
              {footerLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors w-fit"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* 技术栈 */}
          <div className="space-y-4">
            <h3 className="font-heading font-semibold text-sm text-foreground">
              技术支持
            </h3>
            <div className="flex flex-wrap gap-2">
              <a
                href="https://anthropic.com"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors"
              >
                Claude AI
                <ExternalLink className="h-3 w-3" />
              </a>
              <a
                href="https://nextjs.org"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-secondary text-muted-foreground hover:text-foreground transition-colors"
              >
                Next.js
                <ExternalLink className="h-3 w-3" />
              </a>
              <a
                href="https://ui.shadcn.com"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-secondary text-muted-foreground hover:text-foreground transition-colors"
              >
                shadcn/ui
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>

        {/* 底部版权 */}
        <div className="mt-12 pt-6 border-t border-border/40">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <p className="flex items-center gap-1">
              Made with <Heart className="h-3.5 w-3.5 text-primary fill-primary" /> by AI Skills Team
            </p>
            <p>
              © {new Date().getFullYear()} AI 工具箱. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
