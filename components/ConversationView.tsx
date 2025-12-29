'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Send,
  Mic,
  Image as ImageIcon,
  Loader2,
  StopCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import ReactMarkdown from 'react-markdown'
import { Message } from '@/types'
import { useAuth } from '@/contexts/AuthContext'
import { getOrCreateConversation } from '@/lib/db/conversations'
import { saveMessage, getConversationMessages } from '@/lib/db/messages'
import { recordUsage, checkRateLimit } from '@/lib/db/stats'
import { toggleMessageFavorite, batchCheckFavorites } from '@/lib/db/favorites'
import { ModelSelector } from './ModelSelector'
import { ModelInfoDialog } from './ModelInfoDialog'
import { type ModelConfig } from '@/lib/models/config'
import {
  MessageActions,
  CopywriterMessage,
  ImageUploadPreview,
  EmptyState,
} from './conversation'

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
  const [uploadedImages, setUploadedImages] = useState<Array<{ url: string; name: string; base64?: string }>>([])
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

  // 将文件转换为 base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  // 处理图片上传
  const handleImageUpload = async (file: File) => {
    console.log('Starting image upload:', file.name, file.size, file.type)
    setIsUploading(true)
    try {
      // 先获取 base64（用于 Vision API）
      const base64Data = await fileToBase64(file)
      console.log('Base64 generated, length:', base64Data.length)

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
        // 同时保存 URL 和 base64
        const newImage = {
          url: data.url,
          name: file.name,
          base64: base64Data  // 保存完整的 data URL
        }
        console.log('Adding image to state with base64:', {
          url: newImage.url.substring(0, 50),
          base64Length: newImage.base64.length
        })
        setUploadedImages(prev => {
          console.log('Previous images:', prev.length)
          const updated = [...prev, newImage]
          console.log('Updated images:', updated.length)
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
    } catch (error: unknown) {
      console.error('Recording error:', error)

      // 根据错误类型给出更具体的提示
      let errorMessage = '无法访问麦克风'
      if (error instanceof DOMException) {
        switch (error.name) {
          case 'NotAllowedError':
          case 'PermissionDeniedError':
            errorMessage = '麦克风权限被拒绝，请在浏览器设置中允许访问麦克风'
            break
          case 'NotFoundError':
          case 'DevicesNotFoundError':
            errorMessage = '未检测到麦克风设备，请确认麦克风已正确连接'
            break
          case 'NotReadableError':
          case 'TrackStartError':
            errorMessage = '麦克风被其他应用占用，请关闭其他正在使用麦克风的应用'
            break
          case 'OverconstrainedError':
            errorMessage = '麦克风不支持所需的音频格式'
            break
          case 'SecurityError':
            errorMessage = '安全限制：请使用 HTTPS 连接或 localhost'
            break
          default:
            errorMessage = `麦克风错误: ${error.name}`
        }
      }
      alert(errorMessage)
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
      // 检查录音是否有效
      if (audioBlob.size < 1000) {
        alert('录音时间太短，请重新录制')
        return
      }

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
        // 根据错误类型给出更具体的提示
        let errorMsg = '语音识别失败'
        const errorDetail = data.error?.message || (typeof data.error === 'string' ? data.error : '')

        if (errorDetail.toLowerCase().includes('api key') || errorDetail.toLowerCase().includes('unauthorized')) {
          errorMsg = '语音服务未配置，请联系管理员'
        } else if (errorDetail.toLowerCase().includes('timeout') || errorDetail.toLowerCase().includes('超时')) {
          errorMsg = '语音识别超时，请尝试说话更短一些'
        } else if (errorDetail.toLowerCase().includes('format') || errorDetail.toLowerCase().includes('格式')) {
          errorMsg = '音频格式不支持，请重试'
        } else if (errorDetail.toLowerCase().includes('empty') || errorDetail.toLowerCase().includes('空')) {
          errorMsg = '未检测到语音内容，请重新录制'
        } else if (errorDetail) {
          errorMsg = `语音识别失败: ${errorDetail}`
        }

        alert(errorMsg)
      }
    } catch (error) {
      console.error('STT error:', error)

      // 判断网络错误类型
      let errorMsg = '语音识别失败'
      if (error instanceof TypeError && error.message.includes('fetch')) {
        errorMsg = '网络连接失败，请检查网络后重试'
      } else if (error instanceof Error && error.name === 'AbortError') {
        errorMsg = '请求被取消'
      } else {
        errorMsg = '语音识别服务暂不可用，请稍后重试'
      }

      alert(errorMsg)
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
        // 保存用户消息，包含图片附件（只保存URL，不保存base64以节省存储空间）
        await saveMessage(activeConvId, {
          role: 'user',
          content: currentInput,
          attachments: currentImages.length > 0 ? currentImages.map(img => ({
            type: 'image' as const,
            url: img.url,
          })) : undefined,
        })
      } else {
        console.error('Conversation ID is null, cannot save user message')
      }

      // 验证图片数据完整性
      const validImages = currentImages.filter(img => {
        if (!img.base64) {
          console.warn('[ConversationView] 跳过无效图片（缺少 base64）:', img.url?.substring(0, 50))
          return false
        }
        return true
      })

      // 调试：打印发送的图片信息
      console.log('[ConversationView] Sending request with images:', {
        skillId,
        messageLength: currentInput.length,
        totalImages: currentImages.length,
        validImages: validImages.length,
        imageDetails: validImages.map(img => ({
          urlPrefix: img.url.substring(0, 80),
          hasBase64: !!img.base64,
          base64Length: img.base64?.length || 0,
          base64Prefix: img.base64?.substring(0, 30),
        }))
      })

      // 准备 attachments 数据，包含 base64 用于 Vision API
      const attachments = validImages.map(img => ({
        type: 'image' as const,
        url: img.url,
        base64: img.base64,  // 传递 base64 用于 Vision API
      }))

      const response = await fetch('/api/claude/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skillId,
          message: currentInput,
          model: selectedModelId,
          attachments,  // 使用 attachments 替代 images
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
      // 准备原始消息的附件（如果有）
      // 注意：历史消息中可能只有 URL，没有 base64
      // 对于需要 base64 的 Vision API，这种情况下图片分析将被跳过
      const attachments = userMessage.attachments?.map(att => ({
        type: att.type,
        url: att.url,
        base64: att.base64,
      })) || []

      console.log('[Regenerate] Using original attachments:', {
        count: attachments.length,
        hasBase64: attachments.some(a => !!a.base64),
      })

      const response = await fetch('/api/claude/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skillId,
          message: userMessage.content,
          model: selectedModelId,
          attachments, // 重新生成时包含原始图片
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
          <EmptyState
            skillName={skillName}
            placeholder={placeholder}
            selectedModelId={selectedModelId}
            onModelChange={handleModelChange}
            onShowModelInfo={handleShowModelInfo}
          />
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
                      <CopywriterMessage
                        content={message.content}
                        messageId={message.id}
                        copied={copied}
                        onCopy={handleCopy}
                      />
                    ) : (
                      <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-secondary/50 prose-pre:border prose-pre:border-border/50">
                        <ReactMarkdown>{message.content}</ReactMarkdown>
                      </div>
                    )
                  ) : (
                    <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                  )}

                  {message.role === 'assistant' && (
                    <MessageActions
                      messageId={message.id}
                      content={message.content}
                      copied={copied}
                      favorited={favorited.has(message.id)}
                      onCopy={handleCopy}
                      onRegenerate={handleRegenerate}
                      onFavorite={handleFavorite}
                    />
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
          <ImageUploadPreview
            images={uploadedImages}
            onRemove={removeImage}
          />

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
