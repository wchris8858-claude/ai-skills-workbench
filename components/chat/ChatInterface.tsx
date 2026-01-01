"use client"

import * as React from 'react'
import { Message, Skill } from '@/types'
import { MessageBubble } from './MessageBubble'
import { InputArea } from './InputArea'
import { cn } from '@/lib/utils'
import { generateId } from '@/lib/utils'
import { logger } from '@/lib/logger'

interface ChatInterfaceProps {
  skill: Partial<Skill>
  className?: string
}

export function ChatInterface({ skill, className }: ChatInterfaceProps) {
  const [messages, setMessages] = React.useState<Message[]>([])
  const [isLoading, setIsLoading] = React.useState(false)
  const messagesEndRef = React.useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  React.useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async (
    content: string,
    attachments?: Message['attachments']
  ) => {
    // Add user message
    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content,
      timestamp: new Date(),
      attachments
    }

    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)

    try {
      // Call API to get response
      const response = await fetch('/api/claude/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          skillId: skill.id,
          message: content,
          attachments
        })
      })

      if (!response.ok) {
        throw new Error('Failed to get response')
      }

      const data = await response.json()

      // Add assistant message
      const assistantMessage: Message = {
        id: generateId(),
        role: 'assistant',
        content: data.content,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      logger.error('Error sending message', error)
      // Add error message
      const errorMessage: Message = {
        id: generateId(),
        role: 'assistant',
        content: '抱歉，处理您的请求时出现了错误。请稍后再试。',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={cn("flex flex-col h-[calc(100vh-12rem)]", className)}>
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-4 pb-4">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center space-y-4 animate-fade-in">
              <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-3xl">💬</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">开始对话</h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  {skill.description}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            {isLoading && (
              <div className="flex items-center gap-2 text-muted-foreground" role="status" aria-label="加载中">
                <div className="flex gap-1" aria-hidden="true">
                  <div className="w-2 h-2 rounded-full bg-current animate-bounce" />
                  <div className="w-2 h-2 rounded-full bg-current animate-bounce" style={{ animationDelay: '100ms' }} />
                  <div className="w-2 h-2 rounded-full bg-current animate-bounce" style={{ animationDelay: '200ms' }} />
                </div>
                <span className="text-sm">AI 正在思考...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t bg-background p-4">
        <InputArea
          onSend={handleSendMessage}
          disabled={isLoading}
          inputTypes={skill.inputTypes || ['text']}
          placeholder={skill.metadata?.placeholder || '输入您的内容...'}
        />
      </div>
    </div>
  )
}