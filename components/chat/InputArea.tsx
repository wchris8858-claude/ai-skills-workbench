"use client"

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Send, Mic, MicOff, Image, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { InputType, Message } from '@/types'
import { VoiceRecorder } from './VoiceRecorder'

interface InputAreaProps {
  onSend: (content: string, attachments?: Message['attachments']) => void
  disabled?: boolean
  inputTypes: InputType[]
  placeholder?: string
  className?: string
}

export function InputArea({
  onSend,
  disabled = false,
  inputTypes,
  placeholder = '输入您的内容...',
  className
}: InputAreaProps) {
  const [inputValue, setInputValue] = React.useState('')
  const [attachments, setAttachments] = React.useState<Message['attachments']>([])
  const [isRecording, setIsRecording] = React.useState(false)
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const handleSend = () => {
    if (inputValue.trim() || attachments?.length) {
      onSend(inputValue.trim(), attachments?.length ? attachments : undefined)
      setInputValue('')
      setAttachments([])
      textareaRef.current?.focus()
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    Array.from(files).forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (event) => {
          const base64 = event.target?.result as string
          setAttachments(prev => [
            ...(prev || []),
            {
              type: 'image',
              url: base64,
              base64
            }
          ])
        }
        reader.readAsDataURL(file)
      }
    })
  }

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev?.filter((_, i) => i !== index))
  }

  const handleVoiceComplete = (transcript: string) => {
    setInputValue(prev => prev + transcript)
    setIsRecording(false)
  }

  return (
    <div className={cn("space-y-2", className)}>
      {/* Attachments Preview */}
      {attachments && attachments.length > 0 && (
        <div className="flex gap-2 p-2 bg-muted/50 rounded-lg">
          {attachments.map((attachment, index) => (
            <div key={index} className="relative group">
              {attachment.type === 'image' && (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={attachment.url}
                    alt={`已上传的图片 ${index + 1}`}
                    className="w-16 h-16 rounded-lg object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                  <Button
                    size="icon"
                    variant="destructive"
                    className="absolute -top-2 -right-2 h-5 w-5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeAttachment(index)}
                    aria-label={`删除图片 ${index + 1}`}
                  >
                    <X className="h-3 w-3" aria-hidden="true" />
                  </Button>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Input Area */}
      <div className="flex items-end gap-2">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            disabled={disabled || isRecording}
            rows={1}
            className={cn(
              "w-full resize-none rounded-2xl px-4 py-3 pr-12",
              "bg-muted/50 backdrop-blur-sm",
              "border border-border/50 focus:border-primary",
              "outline-none transition-all duration-200",
              "placeholder:text-muted-foreground",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "min-h-[48px] max-h-[120px]"
            )}
            style={{
              height: 'auto',
              overflowY: inputValue.split('\n').length > 4 ? 'auto' : 'hidden'
            }}
          />

          {/* Send Button */}
          <Button
            size="icon"
            variant="ghost"
            className="absolute right-2 bottom-2 h-8 w-8 rounded-full"
            onClick={handleSend}
            disabled={disabled || (!inputValue.trim() && !attachments?.length)}
            aria-label="发送消息"
          >
            <Send className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>

        {/* Voice Input */}
        {inputTypes.includes('voice') && (
          <VoiceRecorder
            isRecording={isRecording}
            onStart={() => setIsRecording(true)}
            onComplete={handleVoiceComplete}
            disabled={disabled}
          />
        )}

        {/* Image Upload */}
        {inputTypes.includes('image') && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageSelect}
              className="hidden"
              aria-label="选择图片"
            />
            <Button
              size="icon"
              variant="outline"
              className="h-12 w-12 rounded-full"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
              aria-label="上传图片"
            >
              <Image className="h-5 w-5" aria-hidden="true" />
            </Button>
          </>
        )}
      </div>
    </div>
  )
}