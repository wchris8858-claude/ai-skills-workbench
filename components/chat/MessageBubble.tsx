"use client"

import * as React from 'react'
import { Message } from '@/types'
import { cn } from '@/lib/utils'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface MessageBubbleProps {
  message: Message
  className?: string
}

export function MessageBubble({ message, className }: MessageBubbleProps) {
  const [copied, setCopied] = React.useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  return (
    <div
      className={cn(
        "flex animate-fade-in",
        message.role === 'user' ? 'justify-end' : 'justify-start',
        className
      )}
    >
      <div
        className={cn(
          "max-w-[85%] md:max-w-[70%] group relative",
          message.role === 'user'
            ? 'bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-4 py-3'
            : 'bg-muted rounded-2xl rounded-tl-sm px-4 py-3'
        )}
      >
        {/* Message Content */}
        {message.role === 'user' ? (
          <div className="space-y-2">
            {message.content && <p className="whitespace-pre-wrap">{message.content}</p>}
            {message.attachments && (
              <div className="flex flex-wrap gap-2 mt-2">
                {message.attachments.map((attachment, index) => (
                  <div key={index} className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {attachment.type === 'image' && (
                      <img
                        src={attachment.url}
                        alt={`消息附件图片 ${index + 1}`}
                        className="max-w-[200px] max-h-[200px] rounded-lg object-cover"
                        loading="lazy"
                        decoding="async"
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {message.content}
            </ReactMarkdown>
          </div>
        )}

        {/* Copy Button for Assistant Messages */}
        {message.role === 'assistant' && (
          <Button
            size="icon"
            variant="ghost"
            className={cn(
              "absolute -top-8 right-0 h-8 w-8 transition-opacity",
              "md:opacity-0 md:group-hover:opacity-100",
              "opacity-70 hover:opacity-100"
            )}
            onClick={handleCopy}
            aria-label={copied ? '已复制' : '复制消息内容'}
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-500" aria-hidden="true" />
            ) : (
              <Copy className="h-4 w-4" aria-hidden="true" />
            )}
          </Button>
        )}

        {/* Timestamp */}
        <div className="mt-1 text-xs opacity-50">
          {new Date(message.timestamp).toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit'
          })}
        </div>
      </div>
    </div>
  )
}