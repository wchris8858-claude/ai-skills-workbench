'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Send,
  Mic,
  Image as ImageIcon,
  Loader2,
  StopCircle,
  Plus,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Message } from '@/types'
import { useAuth } from '@/contexts/AuthContext'
import { getOrCreateConversation } from '@/lib/db/conversations'
import { saveMessage, getConversationMessages, getMessagesBefore } from '@/lib/db/messages'
import { recordUsage, checkRateLimit } from '@/lib/db/stats'
import { batchCheckFavorites } from '@/lib/db/favorites'
import { ModelSelector } from './ModelSelector'
import { ModelInfoDialog } from './ModelInfoDialog'
import { type ModelConfig } from '@/lib/models/config'
import {
  MessageActions,
  CopywriterMessage,
  ImageUploadPreview,
  EmptyState,
} from './conversation'
import { compressImage } from '@/lib/utils/image-compression'
import { logger } from '@/lib/logger'

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

  // 分页状态
  const [hasMoreHistory, setHasMoreHistory] = useState(false)
  const [loadingMoreHistory, setLoadingMoreHistory] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const uploadingCountRef = useRef(0)  // 跟踪正在上传的图片数量

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

  // 消息分页配置
  const INITIAL_MESSAGE_LIMIT = 50  // 初始加载的消息数量
  const LOAD_MORE_LIMIT = 20        // 每次加载更多的数量

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
          // 获取所有消息，但只显示最近的消息
          const historyMessages = await getConversationMessages(convId)

          // 如果消息数量超过初始限制，只显示最近的消息
          if (historyMessages.length > INITIAL_MESSAGE_LIMIT) {
            setMessages(historyMessages.slice(-INITIAL_MESSAGE_LIMIT))
            setHasMoreHistory(true)
          } else {
            setMessages(historyMessages)
            setHasMoreHistory(false)
          }

          // 批量检查收藏状态，避免 N+1 查询
          const assistantMessageIds = historyMessages
            .filter(msg => msg.role === 'assistant')
            .map(msg => msg.id)
          const favoritedSet = await batchCheckFavorites(user.id, assistantMessageIds)
          setFavorited(favoritedSet)
        }
      } catch (error) {
        logger.error('Error loading conversation', error)
      } finally {
        setLoadingHistory(false)
      }
    }

    loadConversation()
  }, [user, skillId, initialConversationId])

  // 加载更多历史消息
  const loadMoreHistory = useCallback(async () => {
    if (!conversationId || loadingMoreHistory || !hasMoreHistory || messages.length === 0) {
      return
    }

    setLoadingMoreHistory(true)
    try {
      const oldestMessage = messages[0]
      const result = await getMessagesBefore(
        conversationId,
        oldestMessage.timestamp,
        LOAD_MORE_LIMIT
      )

      if (result.messages.length > 0) {
        // 保存当前滚动位置
        const container = messagesContainerRef.current
        const previousScrollHeight = container?.scrollHeight || 0

        setMessages(prev => [...result.messages, ...prev])
        setHasMoreHistory(result.hasMore)

        // 恢复滚动位置（保持视图不跳动）
        requestAnimationFrame(() => {
          if (container) {
            const newScrollHeight = container.scrollHeight
            container.scrollTop = newScrollHeight - previousScrollHeight
          }
        })
      } else {
        setHasMoreHistory(false)
      }
    } catch (error) {
      logger.error('Error loading more history', error)
    } finally {
      setLoadingMoreHistory(false)
    }
  }, [conversationId, loadingMoreHistory, hasMoreHistory, messages])

  // 处理图片上传（带压缩）- 优化：只压缩一次 + 修复多图上传竞态条件
  const handleImageUpload = async (file: File) => {
    // 使用计数器正确管理多图上传状态
    uploadingCountRef.current += 1
    setIsUploading(true)
    try {
      // 压缩选项 - 降低大小以确保多图上传时请求体不超限
      const compressionOptions = {
        maxWidth: 1280,  // 降低最大宽度
        maxHeight: 720,  // 降低最大高度
        quality: 0.7,    // 降低质量
        maxSizeKB: 300,  // 降低最大文件大小 (300KB * 4张 * 1.33 ≈ 1.6MB)
      }

      // 只压缩一次，生成压缩后的文件
      const compressedFile = await compressImage(file, compressionOptions)

      // 从压缩后的文件读取 base64（避免重复压缩，大幅提升速度）
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(compressedFile)
      })

      const formData = new FormData()
      formData.append('file', compressedFile)

      const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (data.success) {
        // 同时保存 URL 和 base64
        const newImage = {
          url: data.url,
          name: file.name,
          base64: base64Data  // 保存压缩后的 data URL
        }
        setUploadedImages(prev => [...prev, newImage])
      } else {
        const errorMsg = data.error?.message || (typeof data.error === 'string' ? data.error : '未知错误')
        alert('图片上传失败: ' + errorMsg)
      }
    } catch {
      alert('图片上传失败: 网络错误或服务不可用')
    } finally {
      // 减少计数器，只有当所有上传都完成时才关闭 loading 状态
      uploadingCountRef.current -= 1
      if (uploadingCountRef.current <= 0) {
        uploadingCountRef.current = 0  // 安全重置，防止负数
        setIsUploading(false)
      }
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
      logger.error('Recording error', error)

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
      logger.error('STT error', error)

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
      timestamp: new Date(),
      // 包含上传的图片附件用于显示
      attachments: currentImages.length > 0 ? currentImages.map(img => ({
        type: 'image' as const,
        url: img.url,
      })) : undefined,
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
          logger.error('Failed to create conversation ID')
          // 继续执行，但不保存消息到数据库
        }
      }

      // 保存用户消息（如果有有效的会话ID）
      if (activeConvId) {
        try {
          await saveMessage(activeConvId, {
            role: 'user',
            content: currentInput,
            attachments: currentImages.length > 0 ? currentImages.map(img => ({
              type: 'image' as const,
              url: img.url,
            })) : undefined,
          })
        } catch (saveError) {
          logger.error('Failed to save user message', saveError)
          // 继续执行 AI 请求，即使保存失败
        }
      }

      // 验证图片数据完整性
      const validImages = currentImages.filter(img => {
        if (!img.base64) {
          return false
        }
        return true
      })

      // 准备 attachments 数据，包含 base64 用于 Vision API
      const attachments = validImages.map(img => ({
        type: 'image' as const,
        url: img.url,
        base64: img.base64,  // 传递 base64 用于 Vision API
      }))

      // 构建对话历史，用于上下文记忆
      // 只传递最近的消息避免过长，限制为最近 10 轮对话（20条消息）
      const recentMessages = messages.slice(-20)
      const history = recentMessages.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      }))

      const response = await fetch('/api/claude/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skillId,
          message: currentInput,
          model: selectedModelId,
          attachments,  // 使用 attachments 替代 images
          history,      // 添加对话历史用于上下文记忆
        })
      })

      // 先检查响应状态
      if (!response.ok) {
        let errorMsg = `请求失败 (${response.status})`
        try {
          const errorData = await response.json()
          // 处理不同格式的错误响应
          if (errorData.error) {
            if (typeof errorData.error === 'string') {
              errorMsg = errorData.error
            } else if (errorData.error.message) {
              errorMsg = errorData.error.message
            }
          }
          // 速率限制特殊处理
          if (errorData.code === 'RATE_LIMIT_EXCEEDED') {
            errorMsg = `请求过于频繁，请 ${errorData.retryAfter || 60} 秒后重试`
          }
        } catch {
          // JSON 解析失败，使用默认错误信息
        }
        throw new Error(errorMsg)
      }

      const data = await response.json()

      // 检查响应体中的错误（兼容旧格式）
      if (data.error) {
        const errorMsg = typeof data.error === 'string'
          ? data.error
          : (data.error.message || '未知错误')
        throw new Error(errorMsg)
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
        logger.error('Conversation ID is null, cannot save AI response')
      }
    } catch (error) {
      logger.error('Chat error', error)
      // 获取具体的错误信息
      let errorContent = '抱歉，处理请求时出现错误。'
      if (error instanceof Error) {
        // 使用实际的错误信息
        if (error.message.includes('请求过于频繁')) {
          errorContent = error.message
        } else if (error.message.includes('请求失败')) {
          errorContent = error.message
        } else if (error.message.includes('timeout') || error.message.includes('Timeout')) {
          errorContent = '请求超时，请稍后重试。图片分析可能需要较长时间，建议减少上传图片数量。'
        } else if (error.message.includes('Failed to fetch') || error.message.includes('网络')) {
          errorContent = '网络连接失败，请检查网络后重试。'
        } else if (error.message !== '[object Object]' && error.message.length < 200) {
          // 只显示合理长度的错误信息
          errorContent = `处理失败：${error.message}`
        } else {
          errorContent = '抱歉，处理请求时出现错误。请稍后重试。'
        }
      }
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: errorContent,
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
      logger.error('Failed to copy', error)
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

      // 构建对话历史（不包含被删除的消息和当前要重新生成的对话）
      // 获取当前消息之前的历史，限制为最近 10 轮对话
      const historyMessages = messages.slice(0, messageIndex - 1).slice(-20)
      const history = historyMessages.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      }))

      const response = await fetch('/api/claude/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skillId,
          message: userMessage.content,
          model: selectedModelId,
          attachments, // 重新生成时包含原始图片
          history,     // 添加对话历史用于上下文记忆
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
      logger.error('Regenerate error', error)
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
      // 通过 API 调用收藏功能，确保服务端使用 Service Role Key
      const response = await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'message', id: messageId })
      })

      if (!response.ok) {
        throw new Error('Failed to toggle favorite')
      }

      const result = await response.json()
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
      logger.error('Error toggling favorite', error)
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

  // 新建对话
  const handleNewConversation = useCallback(async () => {
    if (!user || isLoading) return

    // 清空当前对话状态
    setMessages([])
    setConversationId(null)
    setUploadedImages([])
    setInput('')
    setFavorited(new Set())
    setHasMoreHistory(false)

    // 创建新对话
    try {
      const newConvId = await getOrCreateConversation(user.id, skillId, true) // 强制创建新对话
      if (newConvId) {
        setConversationId(newConvId)
      }
    } catch (error) {
      logger.error('Failed to create new conversation', error)
    }
  }, [user, isLoading, skillId])

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
          <div ref={messagesContainerRef} className="max-w-3xl mx-auto space-y-6">
            {/* 加载更多历史消息按钮 */}
            {hasMoreHistory && (
              <div className="flex justify-center py-2">
                <button
                  onClick={loadMoreHistory}
                  disabled={loadingMoreHistory}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-foreground bg-secondary/50 hover:bg-secondary rounded-full transition-colors disabled:opacity-50"
                >
                  {loadingMoreHistory ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      加载中...
                    </>
                  ) : (
                    <>
                      <span>↑</span>
                      加载更早的消息
                    </>
                  )}
                </button>
              </div>
            )}

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
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
                      </div>
                    )
                  ) : (
                    <div className="space-y-2">
                      {/* 显示用户上传的图片 */}
                      {message.attachments && message.attachments.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-2">
                          {message.attachments.filter(att => att.type === 'image').map((att, index) => (
                            <div key={index} className="relative">
                              <img
                                src={att.url}
                                alt={`上传的图片 ${index + 1}`}
                                className="max-w-[200px] max-h-[150px] rounded-lg object-cover"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                      <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                    </div>
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
          {/* 模型选择器和新建对话按钮 - 在对话中显示 */}
          {messages.length > 0 && (
            <div className="flex items-center justify-between">
              <ModelSelector
                selectedModel={selectedModelId}
                onModelChange={handleModelChange}
                onShowModelInfo={handleShowModelInfo}
              />
              <button
                onClick={handleNewConversation}
                disabled={isLoading || !user}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground bg-secondary/50 hover:bg-secondary rounded-lg transition-colors disabled:opacity-50"
                title="新建对话"
              >
                <Plus className="w-4 h-4" />
                <span>新对话</span>
              </button>
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
                onChange={(e) => {
                  setInput(e.target.value)
                  // 自动调整高度
                  if (textareaRef.current) {
                    textareaRef.current.style.height = 'auto'
                    textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px'
                  }
                }}
                onKeyDown={handleKeyPress}
                placeholder={placeholder || '输入你的问题...'}
                className="flex-1 bg-transparent resize-none outline-none text-base placeholder:text-muted-foreground min-h-[44px] max-h-[200px] py-2 overflow-y-auto"
                rows={2}
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
