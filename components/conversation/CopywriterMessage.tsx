'use client'

import { Copy, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CopywriterMessageProps {
  content: string
  messageId: string
  copied: string | null
  onCopy: (content: string, id: string) => void
}

/**
 * 朋友圈文案专用消息显示组件
 * 将多个方案拆分显示，每个方案独立复制
 */
export function CopywriterMessage({
  content,
  messageId,
  copied,
  onCopy,
}: CopywriterMessageProps) {
  const solutions = content.split(/---方案\d+---/).filter(s => s.trim())

  return (
    <div className="space-y-4">
      {solutions.map((solution, idx) => (
        <div
          key={idx}
          className="relative border border-border/30 rounded-lg p-4 bg-secondary/10"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-accent">方案 {idx + 1}</span>
            <button
              onClick={() => onCopy(solution.trim(), `${messageId}-${idx}`)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs',
                'text-muted-foreground transition-all duration-200',
                'hover:bg-accent/10 hover:text-accent'
              )}
              title="复制此方案"
            >
              {copied === `${messageId}-${idx}` ? (
                <>
                  <Check className="w-3.5 h-3.5 text-accent" />
                  <span className="text-accent">已复制</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>复制</span>
                </>
              )}
            </button>
          </div>
          <p className="whitespace-pre-wrap leading-relaxed text-foreground">
            {solution.trim()}
          </p>
        </div>
      ))}
    </div>
  )
}
