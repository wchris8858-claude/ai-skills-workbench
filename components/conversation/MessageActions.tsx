'use client'

import { Copy, RefreshCw, Heart, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MessageActionsProps {
  messageId: string
  content: string
  copied: string | null
  favorited: boolean
  onCopy: (content: string, messageId: string) => void
  onRegenerate: (messageId: string) => void
  onFavorite: (messageId: string) => void
}

export function MessageActions({
  messageId,
  content,
  copied,
  favorited,
  onCopy,
  onRegenerate,
  onFavorite,
}: MessageActionsProps) {
  return (
    <div className="flex items-center gap-1 mt-4 pt-3 border-t border-border/30">
      <button
        onClick={() => onCopy(content, messageId)}
        className={cn(
          'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs',
          'text-muted-foreground transition-all duration-200',
          'hover:bg-accent/10 hover:text-accent'
        )}
        title="复制"
      >
        {copied === messageId ? (
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
      <button
        onClick={() => onRegenerate(messageId)}
        className={cn(
          'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs',
          'text-muted-foreground transition-all duration-200',
          'hover:bg-accent/10 hover:text-accent'
        )}
        title="重新生成"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        <span>重新生成</span>
      </button>
      <button
        onClick={() => onFavorite(messageId)}
        className={cn(
          'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs',
          'transition-all duration-200',
          favorited
            ? 'text-red-500 hover:bg-red-500/10'
            : 'text-muted-foreground hover:bg-accent/10 hover:text-accent'
        )}
        title={favorited ? "取消收藏" : "收藏"}
      >
        <Heart
          className="w-3.5 h-3.5"
          fill={favorited ? "currentColor" : "none"}
        />
        <span>{favorited ? '已收藏' : '收藏'}</span>
      </button>
    </div>
  )
}
