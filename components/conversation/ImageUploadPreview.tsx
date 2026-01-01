'use client'

import { X } from 'lucide-react'
import { logger } from '@/lib/logger'

interface UploadedImage {
  url: string
  name: string
  base64?: string
}

interface ImageUploadPreviewProps {
  images: UploadedImage[]
  onRemove: (url: string) => void
}

/**
 * 已上传图片预览组件
 */
export function ImageUploadPreview({ images, onRemove }: ImageUploadPreviewProps) {
  if (images.length === 0) return null

  return (
    <div className="flex gap-2 flex-wrap mb-3 p-3 bg-accent/10 border border-accent/30 rounded-lg">
      <div className="w-full text-xs text-accent mb-2">
        已上传 {images.length} 张图片，发送消息时将一起发送
      </div>
      {images.map((img) => (
        <div
          key={img.url}
          className="relative group rounded-lg overflow-hidden border-2 border-accent/50 bg-background"
        >
          <img
            src={img.url}
            alt={img.name}
            className="w-20 h-20 object-cover"
            onError={(e) => logger.error('Image failed to load', { url: img.url, error: e })}
          />
          <button
            onClick={() => onRemove(img.url)}
            className="absolute top-1 right-1 p-1 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ))}
    </div>
  )
}
