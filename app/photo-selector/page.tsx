'use client'

import { useState } from 'react'
import { SiteHeader } from '@/components/site-header'
import { PhotoSelector } from '@/components/PhotoSelector'
import { Camera, Download, Sparkles, Sliders } from 'lucide-react'
import { cn } from '@/lib/utils'

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
}

export default function PhotoSelectorPage() {
  const [photos, setPhotos] = useState<PhotoAnalysis[]>([])
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoAnalysis | null>(null)
  const [minScore, setMinScore] = useState(70)

  const handlePhotosAnalyzed = (analyzedPhotos: PhotoAnalysis[]) => {
    setPhotos(analyzedPhotos)
  }

  const exportSelectedPhotos = () => {
    const selected = photos.filter(p => p.isSelected)
    if (selected.length === 0) {
      alert('请先选择要导出的照片')
      return
    }

    // TODO: Implement export functionality
    alert(`准备导出 ${selected.length} 张照片`)
  }

  const selectedPhotos = photos.filter(p => p.isSelected)

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Header */}
      <div className="border-b border-border/40 bg-background/80 backdrop-blur-xl sticky top-16 z-40">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-accent/20 to-accent/5">
                <Camera className="h-7 w-7 text-accent" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold">AI 选片修片</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  批量上传照片，AI 自动筛选最佳照片并提供修图建议
                </p>
              </div>
            </div>

            {photos.length > 0 && (
              <button
                onClick={exportSelectedPhotos}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-200',
                  'bg-accent text-white hover:bg-accent/90',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
                disabled={selectedPhotos.length === 0}
              >
                <Download className="h-4 w-4" />
                导出选中 ({selectedPhotos.length})
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Settings */}
            <div className="rounded-xl border border-border/50 bg-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <Sliders className="h-5 w-5 text-accent" />
                <h2 className="font-semibold text-lg">筛选设置</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium">
                      最低评分阈值
                    </label>
                    <span className="text-sm text-accent font-bold">
                      {minScore} 分
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={minScore}
                    onChange={(e) => setMinScore(Number(e.target.value))}
                    className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-accent"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    评分低于此值的照片将不会被自动选中
                  </p>
                </div>
              </div>
            </div>

            {/* Photo Selector */}
            <PhotoSelector
              onPhotosAnalyzed={handlePhotosAnalyzed}
              onPhotoClick={setSelectedPhoto}
              maxPhotos={50}
              minScore={minScore}
            />
          </div>

          {/* Sidebar - Selected Photo Details */}
          <div className="lg:col-span-1">
            <div className="sticky top-32 space-y-6">
              {selectedPhoto ? (
                <>
                  {/* Photo Preview */}
                  <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
                    <div className="aspect-square relative">
                      <img
                        src={selectedPhoto.url}
                        alt="Selected photo"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold">综合评分</h3>
                        <div className={cn(
                          'px-3 py-1 rounded-lg text-lg font-bold',
                          selectedPhoto.score >= 80 ? 'bg-green-500/10 text-green-500' :
                          selectedPhoto.score >= 60 ? 'bg-yellow-500/10 text-yellow-500' :
                          'bg-red-500/10 text-red-500'
                        )}>
                          {selectedPhoto.score.toFixed(1)}
                        </div>
                      </div>

                      {/* Quality Breakdown */}
                      <div className="space-y-2">
                        {Object.entries(selectedPhoto.quality).map(([key, value]) => (
                          <div key={key}>
                            <div className="flex items-center justify-between text-sm mb-1">
                              <span className="text-muted-foreground">
                                {key === 'sharpness' ? '清晰度' :
                                 key === 'exposure' ? '曝光度' :
                                 key === 'composition' ? '构图' : '色彩'}
                              </span>
                              <span className="font-medium">{value}</span>
                            </div>
                            <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                              <div
                                className="h-full bg-accent transition-all duration-300"
                                style={{ width: `${value}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Issues */}
                  {selectedPhoto.issues.length > 0 && (
                    <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-4">
                      <h3 className="font-semibold text-sm text-orange-600 mb-2">
                        发现的问题
                      </h3>
                      <ul className="space-y-1">
                        {selectedPhoto.issues.map((issue, index) => (
                          <li key={index} className="text-sm text-orange-600/80">
                            • {issue}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Suggestions */}
                  {selectedPhoto.suggestions.length > 0 && (
                    <div className="rounded-xl border border-accent/20 bg-accent/5 p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="h-4 w-4 text-accent" />
                        <h3 className="font-semibold text-sm text-accent">
                          AI 修图建议
                        </h3>
                      </div>
                      <ul className="space-y-1">
                        {selectedPhoto.suggestions.map((suggestion, index) => (
                          <li key={index} className="text-sm text-accent/80">
                            • {suggestion}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Tags */}
                  {selectedPhoto.tags.length > 0 && (
                    <div className="rounded-xl border border-border/50 bg-card p-4">
                      <h3 className="font-semibold text-sm mb-3">内容标签</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedPhoto.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 rounded-full text-xs font-medium bg-secondary text-foreground"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="rounded-xl border border-border/50 bg-card p-8 text-center">
                  <Camera className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">
                    点击照片查看详细分析
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
