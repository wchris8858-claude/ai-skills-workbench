'use client'

import { useState, useCallback } from 'react'
import { Upload, X, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { logger } from '@/lib/logger'
import Image from 'next/image'

interface PhotoAnalysis {
  id: string
  url: string
  file: File
  score: number
  quality: {
    sharpness: number
    exposure: number
    composition: number
    color: number
  }
  issues: string[]
  suggestions: string[]
  tags: string[]
  isSelected: boolean
  analyzing?: boolean
}

interface PhotoSelectorProps {
  onPhotosAnalyzed?: (photos: PhotoAnalysis[]) => void
  onPhotoClick?: (photo: PhotoAnalysis) => void
  maxPhotos?: number
  minScore?: number
}

export function PhotoSelector({
  onPhotosAnalyzed,
  onPhotoClick,
  maxPhotos = 50,
  minScore = 0
}: PhotoSelectorProps) {
  const [photos, setPhotos] = useState<PhotoAnalysis[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const analyzePhotos = async (files: File[]) => {
    setIsAnalyzing(true)

    const newPhotos: PhotoAnalysis[] = files.map((file, index) => ({
      id: `photo-${Date.now()}-${index}`,
      url: URL.createObjectURL(file),
      file,
      score: 0,
      quality: {
        sharpness: 0,
        exposure: 0,
        composition: 0,
        color: 0,
      },
      issues: [],
      suggestions: [],
      tags: [],
      isSelected: false,
      analyzing: true,
    }))

    setPhotos(prev => [...prev, ...newPhotos])

    // 使用局部变量跟踪分析结果，避免闭包问题
    const analyzedPhotos: PhotoAnalysis[] = []

    // Analyze each photo using AI
    for (let i = 0; i < newPhotos.length; i++) {
      const photo = newPhotos[i]

      try {
        const formData = new FormData()
        formData.append('image', photo.file)

        const response = await fetch('/api/analyze-photo', {
          method: 'POST',
          body: formData,
        })

        if (response.ok) {
          const analysis = await response.json()
          const analyzedPhoto = {
            ...photo,
            ...analysis,
            analyzing: false,
            isSelected: analysis.score >= minScore
          }

          analyzedPhotos.push(analyzedPhoto)

          setPhotos(prev => prev.map(p =>
            p.id === photo.id ? analyzedPhoto : p
          ))
        } else {
          throw new Error('Analysis failed')
        }
      } catch (error) {
        logger.error('Error analyzing photo', error)
        const failedPhoto = { ...photo, analyzing: false, score: 0 }
        analyzedPhotos.push(failedPhoto)

        setPhotos(prev => prev.map(p =>
          p.id === photo.id ? failedPhoto : p
        ))
      }
    }

    setIsAnalyzing(false)

    // 使用 setPhotos 的回调形式获取最新状态并调用 onPhotosAnalyzed
    if (onPhotosAnalyzed) {
      setPhotos(currentPhotos => {
        // 筛选出已完成分析的照片（不包括正在分析的）
        const completedPhotos = currentPhotos.filter(p => !p.analyzing)
        // 在下一个微任务中调用回调，确保状态已更新
        setTimeout(() => onPhotosAnalyzed(completedPhotos), 0)
        return currentPhotos
      })
    }
  }

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return

    const imageFiles = Array.from(files).filter(file =>
      file.type.startsWith('image/')
    )

    if (imageFiles.length === 0) {
      alert('请选择图片文件')
      return
    }

    if (photos.length + imageFiles.length > maxPhotos) {
      alert(`最多只能上传 ${maxPhotos} 张照片`)
      return
    }

    analyzePhotos(imageFiles)
  }, [photos.length, maxPhotos])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    handleFileSelect(e.dataTransfer.files)
  }, [handleFileSelect])

  const removePhoto = (id: string) => {
    setPhotos(prev => {
      const photo = prev.find(p => p.id === id)
      if (photo) {
        URL.revokeObjectURL(photo.url)
      }
      return prev.filter(p => p.id !== id)
    })
  }

  const toggleSelection = (id: string) => {
    setPhotos(prev => prev.map(p =>
      p.id === id ? { ...p, isSelected: !p.isSelected } : p
    ))
  }

  const selectedCount = photos.filter(p => p.isSelected).length
  const averageScore = photos.length > 0
    ? photos.reduce((sum, p) => sum + p.score, 0) / photos.length
    : 0

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'relative border-2 border-dashed rounded-xl p-12 transition-all duration-200',
          isDragging
            ? 'border-accent bg-accent/5'
            : 'border-border/50 hover:border-accent/50 hover:bg-accent/5'
        )}
      >
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => handleFileSelect(e.target.files)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={isAnalyzing}
        />

        <div className="flex flex-col items-center gap-4 text-center pointer-events-none">
          <div className={cn(
            'flex h-16 w-16 items-center justify-center rounded-full transition-colors',
            isDragging ? 'bg-accent text-white' : 'bg-accent/10 text-accent'
          )}>
            <Upload className="h-8 w-8" />
          </div>

          <div>
            <p className="text-lg font-medium">
              {isDragging ? '松开以上传照片' : '拖拽照片到这里，或点击上传'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              支持 JPG、PNG、WEBP 格式，最多 {maxPhotos} 张
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      {photos.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-xl border border-border/50 bg-card p-4">
            <p className="text-sm text-muted-foreground">总照片数</p>
            <p className="text-2xl font-bold mt-1">{photos.length}</p>
          </div>
          <div className="rounded-xl border border-border/50 bg-card p-4">
            <p className="text-sm text-muted-foreground">已选中</p>
            <p className="text-2xl font-bold mt-1 text-accent">{selectedCount}</p>
          </div>
          <div className="rounded-xl border border-border/50 bg-card p-4">
            <p className="text-sm text-muted-foreground">平均评分</p>
            <p className="text-2xl font-bold mt-1">{averageScore.toFixed(1)}</p>
          </div>
        </div>
      )}

      {/* Photo Grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {photos.map((photo) => (
            <div
              key={photo.id}
              onClick={() => onPhotoClick?.(photo)}
              className={cn(
                'group relative aspect-square rounded-xl overflow-hidden border-2 transition-all duration-200 cursor-pointer',
                photo.isSelected
                  ? 'border-accent ring-2 ring-accent/20'
                  : 'border-border/30 hover:border-accent/50'
              )}
            >
              {/* Image */}
              <div className="relative w-full h-full">
                <Image
                  src={photo.url}
                  alt={`Photo ${photo.id}`}
                  fill
                  className="object-cover"
                />

                {/* Analyzing Overlay */}
                {photo.analyzing && (
                  <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="h-8 w-8 animate-spin text-accent" />
                      <p className="text-xs text-muted-foreground">分析中...</p>
                    </div>
                  </div>
                )}

                {/* Score Badge */}
                {!photo.analyzing && (
                  <div className="absolute top-2 left-2 px-2 py-1 rounded-lg bg-background/90 backdrop-blur-sm">
                    <p className="text-xs font-bold">
                      {photo.score.toFixed(1)}
                    </p>
                  </div>
                )}

                {/* Selection Indicator */}
                {photo.isSelected && !photo.analyzing && (
                  <div className="absolute top-2 right-2">
                    <CheckCircle2 className="h-6 w-6 text-accent fill-accent/20" />
                  </div>
                )}

                {/* Issues Indicator */}
                {photo.issues.length > 0 && !photo.analyzing && (
                  <div className="absolute bottom-2 left-2">
                    <AlertCircle className="h-5 w-5 text-orange-500" />
                  </div>
                )}

                {/* Hover Actions */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <div className="absolute bottom-0 left-0 right-0 p-3 flex items-center justify-between">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleSelection(photo.id)
                      }}
                      className="px-3 py-1.5 rounded-lg bg-white/90 text-black text-xs font-medium hover:bg-white transition-colors"
                    >
                      {photo.isSelected ? '取消选择' : '选择'}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        removePhoto(photo.id)
                      }}
                      className="p-1.5 rounded-lg bg-red-500/90 text-white hover:bg-red-500 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {photos.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p>暂无照片，请上传照片开始分析</p>
        </div>
      )}
    </div>
  )
}
