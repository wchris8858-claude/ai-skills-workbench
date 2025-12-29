'use client'

import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import {
  Send,
  Mic,
  Image as ImageIcon,
  Copy,
  RefreshCw,
  Heart,
  Loader2,
  Check,
  Sparkles,
  Zap,
  X,
  Upload,
  StopCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import ReactMarkdown from 'react-markdown'
import { Message } from '@/types'
import { useAuth } from '@/contexts/AuthContext'
import { getOrCreateConversation } from '@/lib/db/conversations'
import { saveMessage, getConversationMessages } from '@/lib/db/messages'
import { recordUsage, checkRateLimit } from '@/lib/db/stats'
import { toggleMessageFavorite, isMessageFavorited, batchCheckFavorites } from '@/lib/db/favorites'
import { ModelSelector } from './ModelSelector'
import { ModelInfoDialog } from './ModelInfoDialog'
import { type ModelConfig, AVAILABLE_MODELS } from '@/lib/models/config'

interface ConversationViewProps {
  skillId: string
  skillName: string
  placeholder?: string
  inputTypes: string[]
  modelInfo?: string
  initialConversationId?: string
}

export function ConversationView({
  skillId,
  skillName,
  placeholder,
  inputTypes,
  modelInfo,
  initialConversationId
}: ConversationViewProps) {
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [copied, setCopied] = useState<string | null>(null)
  const [favorited, setFavorited] = useState<Set<string>>(new Set())

  // 新增状态
  const [selectedModelId, setSelectedModelId] = useState<string>(modelInfo || 'claude-haiku-4-5-20251001')
  const [selectedModelConfig, setSelectedModelConfig] = useState<ModelConfig | null>(null)
  const [showModelInfo, setShowModelInfo] = useState(false)
  const [uploadedImages, setUploadedImages] = useState<Array<{ url: string; name: string }>>([])
  const [isUploading, setIsUploading] = useState(false)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // 清理 MediaRecorder：组件卸载时停止录音并释放资源
  useEffect(() => {
    return () => {
      if (mediaRecorder) {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop()
        }
        // 停止所有音轨
        mediaRecorder.stream?.getTracks().forEach(track => track.stop())
      }
    }
  }, [mediaRecorder])

  // 加载对话历史
  useEffect(() => {
    async function loadConversation() {
      if (!user) {
        setLoadingHistory(false)
        return
      }

      setLoadingHistory(true)
      try {
        // 优先使用传入的 conversationId（从历史记录页面跳转）
        let convId: string | null = initialConversationId || null
        if (!convId) {
          // 否则获取或创建新对话
          convId = await getOrCreateConversation(user.id, skillId)
        }

        if (convId) {
          setConversationId(convId)
          const historyMessages = await getConversationMessages(convId)
          setMessages(historyMessages)

          // 批量检查收藏状态，避免 N+1 查询
          const assistantMessageIds = historyMessages
            .filter(msg => msg.role === 'assistant')
            .map(msg => msg.id)
          const favoritedSet = await batchCheckFavorites(user.id, assistantMessageIds)
          setFavorited(favoritedSet)
        }
      } catch (error) {
        console.error('Error loading conversation:', error)
      } finally {
        setLoadingHistory(false)
      }
    }

    loadConversation()
  }, [user, skillId, initialConversationId])

  // 处理图片上传
  const handleImageUpload = async (file: File) => {
    console.log('Starting image upload:', file.name, file.size, file.type)
    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
      })

      console.log('Upload response status:', response.status)
      const data = await response.json()
      console.log('Upload response data:', data)

      if (data.success) {
        const newImage = { url: data.url, name: file.name }
        console.log('Adding image to state:', newImage)
        setUploadedImages(prev => {
          console.log('Previous images:', prev)
          const updated = [...prev, newImage]
          console.log('Updated images:', updated)
          return updated
        })
      } else {
        const errorMsg = data.error?.message || (typeof data.error === 'string' ? data.error : '未知错误')
        console.error('Upload failed:', errorMsg)
        alert('图片上传失败: ' + errorMsg)
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert('图片上传失败: 网络错误或服务不可用')
    } finally {
      setIsUploading(false)
    }
  }

  // 移除已上传的图片
  const removeImage = (url: string) => {
    setUploadedImages(prev => prev.filter(img => img.url !== url))
  }

  // 开始录音
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      const chunks: Blob[] = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data)
        }
      }

      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' })
        await handleSpeechToText(audioBlob)
        stream.getTracks().forEach(track => track.stop())
      }

      recorder.start()
      setMediaRecorder(recorder)
      setIsRecording(true)
    } catch (error) {
      console.error('Recording error:', error)
      alert('无法访问麦克风，请检查浏览器权限设置')
    }
  }

  // 停止录音
  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop()
      setIsRecording(false)
      setMediaRecorder(null)
    }
  }

  // 语音转文字
  const handleSpeechToText = async (audioBlob: Blob) => {
    try {
      const formData = new FormData()
      formData.append('file', audioBlob, 'recording.webm')
      formData.append('language', 'zh')

      const response = await fetch('/api/speech-to-text', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (data.success && data.text) {
        setInput(prev => prev + (prev ? ' ' : '') + data.text)
      } else {
        const errorMsg = data.error?.message || (typeof data.error === 'string' ? data.error : '未知错误')
        alert('语音识别失败: ' + errorMsg)
      }
    } catch (error) {
      console.error('STT error:', error)
      alert('语音识别失败: 网络错误或服务不可用')
    }
  }

  const handleSend = useCallback(async () => {
    // 防止连击：检查 loading 状态和输入
    if (!input.trim() || isLoading || !user) return

    // 立即设置 loading 状态，防止重复点击
    setIsLoading(true)

    // 保存当前输入和图片（因为马上要清空）
    const currentInput = input.trim()
    const currentImages = [...uploadedImages]

    // 立即清空输入和图片，提供即时反馈
    setInput('')
    setUploadedImages([])

    const rateLimit = await checkRateLimit(user.id)
    if (!rateLimit.allowed) {
      // 恢复输入
      setInput(currentInput)
      setUploadedImages(currentImages)
      setIsLoading(false)
      alert(`请求过于频繁，请${Math.ceil((rateLimit.resetAt.getTime() - Date.now()) / 1000)}秒后再试`)
      return
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: currentInput,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])

    const startTime = Date.now()

    try {
      // 确保有 conversationId，如果没有就创建
      let activeConvId = conversationId
      if (!activeConvId) {
        activeConvId = await getOrCreateConversation(user.id, skillId)
        if (activeConvId) {
          setConversationId(activeConvId)
        } else {
          console.error('Failed to create conversation ID')
        }
      }

      if (activeConvId) {
        await saveMessage(activeConvId, {
          role: 'user',
          content: currentInput,
        })
      } else {
        console.error('Conversation ID is null, cannot save user message')
      }

      const response = await fetch('/api/claude/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skillId,
          message: currentInput,
          model: selectedModelId,
          images: currentImages.map(img => img.url),
        })
      })

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      const responseTime = Date.now() - startTime

      // 如果是模拟响应，在内容前添加提示
      let finalContent = data.content
      if (data.isMock) {
        finalContent = `> ⚠️ **演示模式**：${data.mockReason || 'API 未配置'}，以下为模拟响应\n\n${data.content}`
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: finalContent,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])

      if (activeConvId) {
        const savedMsg = await saveMessage(activeConvId, {
          role: 'assistant',
          content: data.content,
        }, data.tokenCount)

        if (savedMsg) {
          setMessages(prev =>
            prev.map(m =>
              m.id === assistantMessage.id ? { ...m, id: savedMsg.id } : m
            )
          )
        }

        await recordUsage(
          user.id,
          skillId,
          data.tokenCount || 100,
          responseTime
        )
      } else {
        console.error('Conversation ID is null, cannot save AI response')
      }
    } catch (error) {
      console.error('Error:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '抱歉，处理请求时出现错误。请稍后重试。',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }, [input, isLoading, user, conversationId, skillId, selectedModelId, uploadedImages])

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    } else if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault()
      handleSend()
    }
  }, [handleSend])

  const handleCopy = useCallback(async (content: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(messageId)
      setTimeout(() => setCopied(null), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }, [])

  const handleRegenerate = useCallback(async (messageId: string) => {
    if (isLoading || !user) return

    const messageIndex = messages.findIndex(m => m.id === messageId)
    if (messageIndex <= 0) return

    const userMessage = messages[messageIndex - 1]
    if (userMessage.role !== 'user') return

    // 删除当前 AI 响应
    setMessages(prev => prev.filter(m => m.id !== messageId))
    setIsLoading(true)

    const startTime = Date.now()

    try {
      const response = await fetch('/api/claude/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skillId,
          message: userMessage.content,
          model: selectedModelId,
          images: [], // 重新生成时不包含图片
        })
      })

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      const responseTime = Date.now() - startTime

      // 如果是模拟响应，在内容前添加提示
      let finalContent = data.content
      if (data.isMock) {
        finalContent = `> ⚠️ **演示模式**：${data.mockReason || 'API 未配置'}，以下为模拟响应\n\n${data.content}`
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: finalContent,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])

      if (conversationId) {
        const savedMsg = await saveMessage(conversationId, {
          role: 'assistant',
          content: data.content,
        }, data.tokenCount)

        if (savedMsg) {
          setMessages(prev =>
            prev.map(m =>
              m.id === assistantMessage.id ? { ...m, id: savedMsg.id } : m
            )
          )
        }

        await recordUsage(
          user.id,
          skillId,
          data.tokenCount || 100,
          responseTime
        )
      }
    } catch (error) {
      console.error('Regenerate error:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '抱歉，重新生成时出现错误。请稍后重试。',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }, [messages, isLoading, user, skillId, selectedModelId, conversationId])

  const handleFavorite = useCallback(async (messageId: string) => {
    if (!user) return

    try {
      const result = await toggleMessageFavorite(user.id, messageId)
      setFavorited(prev => {
        const next = new Set(prev)
        if (result.favorited) {
          next.add(messageId)
        } else {
          next.delete(messageId)
        }
        return next
      })
    } catch (error) {
      console.error('Error toggling favorite:', error)
    }
  }, [user])

  const handleModelChange = useCallback((modelId: string, config: ModelConfig) => {
    setSelectedModelId(modelId)
    setSelectedModelConfig(config)
  }, [])

  const handleShowModelInfo = useCallback((config: ModelConfig) => {
    setSelectedModelConfig(config)
    setShowModelInfo(true)
  }, [])

  if (loadingHistory) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-accent" />
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 custom-scrollbar">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-20 animate-fade-in">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-accent/20 to-accent/5">
              <Sparkles className="h-10 w-10 text-accent" />
            </div>
            <h2 className="text-2xl font-bold mb-3 text-foreground">{skillName}</h2>
            <p className="text-muted-foreground max-w-md mb-4">
              {placeholder || '开始对话，探索 AI 的无限可能'}
            </p>

            {/* 模型选择器 */}
            <div className="mt-4">
              <ModelSelector
                selectedModel={selectedModelId}
                onModelChange={handleModelChange}
                onShowModelInfo={handleShowModelInfo}
              />
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  'flex animate-fade-in',
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                <div
                  className={cn(
                    'max-w-[80%] rounded-valley px-5 py-4',
                    message.role === 'user'
                      ? 'bg-accent text-accent-foreground shadow-lg shadow-accent/20'
                      : 'bg-card text-card-foreground border border-border/50 shadow-sm'
                  )}
                >
                  {message.role === 'assistant' ? (
                    skillId === 'moments-copywriter' ? (
                      // 朋友圈文案特殊处理 - 每个方案独立显示
                      <div className="space-y-4">
                        {message.content.split(/---方案\d+---/).filter(s => s.trim()).map((solution, idx) => (
                          <div key={idx} className="relative border border-border/30 rounded-lg p-4 bg-secondary/10">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-sm font-medium text-accent">方案 {idx + 1}</span>
                              <button
                                onClick={() => handleCopy(solution.trim(), `${message.id}-${idx}`)}
                                className={cn(
                                  'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs',
                                  'text-muted-foreground transition-all duration-200',
                                  'hover:bg-accent/10 hover:text-accent'
                                )}
                                title="复制此方案"
                              >
                                {copied === `${message.id}-${idx}` ? (
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
                            <p className="whitespace-pre-wrap leading-relaxed text-foreground">{solution.trim()}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-secondary/50 prose-pre:border prose-pre:border-border/50">
                        <ReactMarkdown>{message.content}</ReactMarkdown>
                      </div>
                    )
                  ) : (
                    <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                  )}

                  {message.role === 'assistant' && (
                    <div className="flex items-center gap-1 mt-4 pt-3 border-t border-border/30">
                      <button
                        onClick={() => handleCopy(message.content, message.id)}
                        className={cn(
                          'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs',
                          'text-muted-foreground transition-all duration-200',
                          'hover:bg-accent/10 hover:text-accent'
                        )}
                        title="复制"
                      >
                        {copied === message.id ? (
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
                        onClick={() => handleRegenerate(message.id)}
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
                        onClick={() => handleFavorite(message.id)}
                        className={cn(
                          'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs',
                          'transition-all duration-200',
                          favorited.has(message.id)
                            ? 'text-red-500 hover:bg-red-500/10'
                            : 'text-muted-foreground hover:bg-accent/10 hover:text-accent'
                        )}
                        title={favorited.has(message.id) ? "取消收藏" : "收藏"}
                      >
                        <Heart
                          className="w-3.5 h-3.5"
                          fill={favorited.has(message.id) ? "currentColor" : "none"}
                        />
                        <span>{favorited.has(message.id) ? '已收藏' : '收藏'}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start animate-fade-in">
                <div className="bg-card border border-border/50 rounded-valley px-5 py-4">
                  <div className="flex items-center gap-3">
                    <Loader2 className="w-5 h-5 animate-spin text-accent" />
                    <span className="text-sm text-muted-foreground">AI 正在思考...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t border-border/40 px-4 py-4 bg-background/80 backdrop-blur-xl">
        <div className="max-w-3xl mx-auto space-y-3">
          {/* 模型选择器 - 在对话中也显示 */}
          {messages.length > 0 && (
            <div className="flex items-center justify-between">
              <ModelSelector
                selectedModel={selectedModelId}
                onModelChange={handleModelChange}
                onShowModelInfo={handleShowModelInfo}
              />
            </div>
          )}

          {/* 已上传的图片预览 */}
          {uploadedImages.length > 0 && (
            <div className="flex gap-2 flex-wrap mb-3 p-3 bg-secondary/30 rounded-lg">
              {uploadedImages.map((img) => (
                <div
                  key={img.url}
                  className="relative group rounded-lg overflow-hidden border border-border/50 bg-background"
                >
                  <img
                    src={img.url}
                    alt={img.name}
                    className="w-20 h-20 object-cover"
                    onError={(e) => console.error('Image failed to load:', img.url, e)}
                  />
                  <button
                    onClick={() => removeImage(img.url)}
                    className="absolute top-1 right-1 p-1 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-end gap-3">
            <div className="flex-1 valley-search !py-2">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder={placeholder || '输入你的问题...'}
                className="flex-1 bg-transparent resize-none outline-none text-base placeholder:text-muted-foreground min-h-[24px] max-h-[120px]"
                rows={1}
                disabled={!user}
              />

              <div className="flex items-center gap-1 ml-2">
                {inputTypes.includes('image') && (
                  <>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        const files = e.target.files
                        if (files && files.length > 0) {
                          // 支持多图上传，最多 9 张
                          const maxImages = 9
                          const currentCount = uploadedImages.length
                          const remainingSlots = maxImages - currentCount
                          const filesToUpload = Array.from(files).slice(0, remainingSlots)

                          if (files.length > remainingSlots) {
                            alert(`最多上传 ${maxImages} 张图片，已选择前 ${remainingSlots} 张`)
                          }

                          filesToUpload.forEach(file => handleImageUpload(file))
                        }
                        // 清空 input 以允许重复选择同一文件
                        e.target.value = ''
                      }}
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        fileInputRef.current?.click()
                      }}
                      className={cn(
                        'p-2 rounded-lg transition-all duration-200 relative z-10',
                        'text-muted-foreground hover:text-accent hover:bg-accent/10',
                        uploadedImages.length >= 9 && 'opacity-50 cursor-not-allowed'
                      )}
                      title={uploadedImages.length >= 9 ? "已达到最大图片数量" : "上传图片（最多9张）"}
                      disabled={!user || isUploading || uploadedImages.length >= 9}
                    >
                      {isUploading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <ImageIcon className="w-5 h-5" />
                      )}
                    </button>
                  </>
                )}
                {inputTypes.includes('voice') && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      if (isRecording) {
                        stopRecording()
                      } else {
                        startRecording()
                      }
                    }}
                    className={cn(
                      'p-2 rounded-lg transition-all duration-200 relative z-10',
                      isRecording
                        ? 'bg-red-500 text-white'
                        : 'text-muted-foreground hover:text-accent hover:bg-accent/10'
                    )}
                    title={isRecording ? "停止录音" : "语音输入"}
                    disabled={!user}
                  >
                    {isRecording ? (
                      <StopCircle className="w-5 h-5" />
                    ) : (
                      <Mic className="w-5 h-5" />
                    )}
                  </button>
                )}
              </div>
            </div>

            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading || !user}
              className={cn(
                'flex h-12 w-12 items-center justify-center rounded-full transition-all duration-300',
                input.trim() && !isLoading && user
                  ? 'bg-accent text-accent-foreground hover:shadow-valley-hover hover:scale-105'
                  : 'bg-secondary text-muted-foreground cursor-not-allowed'
              )}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>

          {!user && (
            <p className="text-center text-sm text-muted-foreground mt-3">
              请先{' '}
              <a href="/login" className="text-accent hover:underline underline-offset-4">
                登录
              </a>{' '}
              后使用此技能
            </p>
          )}
        </div>
      </div>

      {/* 模型信息弹窗 */}
      <ModelInfoDialog
        isOpen={showModelInfo}
        onClose={() => setShowModelInfo(false)}
        modelConfig={selectedModelConfig}
      />
    </div>
  )
}
