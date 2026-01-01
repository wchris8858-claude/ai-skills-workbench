import Link from 'next/link'
import { Sparkles, Heart } from 'lucide-react'

const footerLinks = [
  { href: '/docs', label: '文档' },
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
                AI 掌柜
              </span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              实体店 AI 运营助手，让创意如墨般流淌。短视频脚本、小红书笔记、朋友圈文案，助你经营更轻松。
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

          {/* 联系我们 */}
          <div className="space-y-4">
            <h3 className="font-heading font-semibold text-sm text-foreground">
              联系我们
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              如有问题或建议，欢迎联系我们的客服团队。
            </p>
          </div>
        </div>

        {/* 底部版权 */}
        <div className="mt-12 pt-6 border-t border-border/40">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <p className="flex items-center gap-1">
              Made with <Heart className="h-3.5 w-3.5 text-primary fill-primary" /> by AI 掌柜团队
            </p>
            <p>
              © {new Date().getFullYear()} AI 掌柜. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
