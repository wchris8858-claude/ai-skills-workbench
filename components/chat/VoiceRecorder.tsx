"use client"

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Mic, MicOff, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { logger } from '@/lib/logger'

interface VoiceRecorderProps {
  isRecording: boolean
  onStart: () => void
  onComplete: (transcript: string) => void
  disabled?: boolean
  className?: string
}

export function VoiceRecorder({
  isRecording,
  onStart,
  onComplete,
  disabled = false,
  className
}: VoiceRecorderProps) {
  const [isProcessing, setIsProcessing] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null)
  const audioChunksRef = React.useRef<Blob[]>([])
  const streamRef = React.useRef<MediaStream | null>(null)

  // 清理函数
  const cleanup = React.useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    mediaRecorderRef.current = null
    audioChunksRef.current = []
  }, [])

  // 组件卸载时清理
  React.useEffect(() => {
    return () => cleanup()
  }, [cleanup])

  // 发送音频到后端进行语音识别
  const sendToSpeechRecognition = React.useCallback(async (audioBlob: Blob) => {
    try {
      const formData = new FormData()
      formData.append('file', audioBlob, 'recording.webm')
      formData.append('language', 'zh')

      const response = await fetch('/api/speech-to-text', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `识别失败: ${response.status}`)
      }

      const data = await response.json()

      if (data.success && data.text) {
        onComplete(data.text)
      } else {
        setError('未能识别语音内容')
        onComplete('')
      }
    } catch (err: unknown) {
      logger.error('Speech recognition error', err)
      setError(err instanceof Error ? err.message : '语音识别失败')
      onComplete('')
    } finally {
      setIsProcessing(false)
    }
  }, [onComplete])

  // 开始录音
  const startRecording = async () => {
    try {
      setError(null)

      // 请求麦克风权限
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        }
      })

      streamRef.current = stream
      audioChunksRef.current = []

      // 尝试使用 webm 格式，如果不支持则使用默认格式
      let mimeType = 'audio/webm'
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/mp4'
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = '' // 使用默认格式
        }
      }

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: mimeType || undefined,
      })

      mediaRecorderRef.current = mediaRecorder

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: mimeType || 'audio/webm'
        })

        // 停止所有轨道
        stream.getTracks().forEach(track => track.stop())
        streamRef.current = null

        // 发送到后端进行语音识别
        await sendToSpeechRecognition(audioBlob)
      }

      mediaRecorder.onerror = () => {
        logger.error('MediaRecorder error')
        setError('录音出错，请重试')
        cleanup()
      }

      // 开始录音，每 1 秒获取一次数据
      mediaRecorder.start(1000)
      onStart()
    } catch (err: unknown) {
      logger.error('Error starting recording', err)
      if (err instanceof DOMException && err.name === 'NotAllowedError') {
        setError('请允许访问麦克风')
      } else if (err instanceof DOMException && err.name === 'NotFoundError') {
        setError('未检测到麦克风')
      } else {
        setError('无法启动录音')
      }
      cleanup()
    }
  }

  // 停止录音
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      setIsProcessing(true)
      mediaRecorderRef.current.stop()
    }
  }

  // 切换录音状态
  const handleToggleRecording = () => {
    if (isRecording) {
      stopRecording()
    } else {
      startRecording()
    }
  }

  // 显示加载状态
  if (isProcessing) {
    return (
      <div className="relative">
        <Button
          size="icon"
          variant="outline"
          className={cn("h-12 w-12 rounded-full", className)}
          disabled
        >
          <Loader2 className="h-5 w-5 animate-spin" />
        </Button>
        <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-muted-foreground whitespace-nowrap">
          识别中...
        </span>
      </div>
    )
  }

  return (
    <div className="relative">
      <Button
        size="icon"
        variant={isRecording ? "destructive" : "outline"}
        className={cn(
          "h-12 w-12 rounded-full transition-all",
          isRecording && "animate-pulse ring-2 ring-red-400 ring-offset-2",
          className
        )}
        onClick={handleToggleRecording}
        disabled={disabled}
        title={isRecording ? "点击停止录音" : "点击开始录音"}
      >
        {isRecording ? (
          <MicOff className="h-5 w-5" />
        ) : (
          <Mic className="h-5 w-5" />
        )}
      </Button>
      {isRecording && (
        <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-red-500 whitespace-nowrap animate-pulse">
          录音中...
        </span>
      )}
      {error && !isRecording && (
        <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-red-500 whitespace-nowrap">
          {error}
        </span>
      )}
    </div>
  )
}
