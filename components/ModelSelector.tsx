'use client'

import { useState } from 'react'
import { ChevronDown, Sparkles, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AVAILABLE_MODELS, type ModelConfig } from '@/lib/models/config'

interface ModelSelectorProps {
  selectedModel: string
  onModelChange: (modelId: string, modelConfig: ModelConfig) => void
  onShowModelInfo: (modelConfig: ModelConfig) => void
  className?: string
}

// 获取所有可用的文本模型
function getAllTextModels(): Array<{ id: string; config: ModelConfig; category: string }> {
  const models: Array<{ id: string; config: ModelConfig; category: string }> = []

  // Anthropic 模型
  Object.entries(AVAILABLE_MODELS.anthropic).forEach(([key, config]) => {
    if (config.type === 'text') {
      models.push({ id: config.model, config, category: 'Claude (Anthropic)' })
    }
  })

  // Google 模型
  Object.entries(AVAILABLE_MODELS.google).forEach(([key, config]) => {
    if (config.type === 'text') {
      models.push({ id: config.model, config, category: 'Gemini (Google)' })
    }
  })

  // SiliconFlow 模型
  Object.entries(AVAILABLE_MODELS.siliconflow).forEach(([key, config]) => {
    if (config.type === 'text') {
      models.push({ id: config.model, config, category: 'SiliconFlow' })
    }
  })

  return models
}

export function ModelSelector({
  selectedModel,
  onModelChange,
  onShowModelInfo,
  className,
}: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const allModels = getAllTextModels()

  // 按类别分组模型
  const modelsByCategory = allModels.reduce((acc, model) => {
    if (!acc[model.category]) {
      acc[model.category] = []
    }
    acc[model.category].push(model)
    return acc
  }, {} as Record<string, typeof allModels>)

  // 获取当前选中的模型配置
  const selectedModelConfig = allModels.find((m) => m.id === selectedModel)

  return (
    <div className={cn('relative', className)}>
      {/* 选择器按钮 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-lg',
          'bg-secondary/50 hover:bg-secondary',
          'border border-border/50',
          'transition-all duration-200',
          'text-sm font-medium'
        )}
      >
        <Sparkles className="w-4 h-4 text-accent" />
        <span className="text-foreground">
          {selectedModelConfig?.config.description.split(' - ')[0] || '选择模型'}
        </span>
        <ChevronDown
          className={cn(
            'w-4 h-4 text-muted-foreground transition-transform',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {/* 下拉菜单 */}
      {isOpen && (
        <>
          {/* 遮罩层 */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* 模型列表 */}
          <div className="absolute top-full left-0 mt-2 w-96 max-h-96 overflow-y-auto z-50 rounded-valley bg-background border border-border/50 shadow-valley custom-scrollbar">
            {Object.entries(modelsByCategory).map(([category, models]) => (
              <div key={category} className="py-2">
                {/* 类别标题 */}
                <div className="px-4 py-2 text-xs font-semibold text-muted-foreground">
                  {category}
                </div>

                {/* 模型列表 */}
                {models.map((model) => (
                  <button
                    key={model.id}
                    onClick={() => {
                      onModelChange(model.id, model.config)
                      setIsOpen(false)
                    }}
                    className={cn(
                      'w-full flex items-center justify-between gap-3 px-4 py-2.5',
                      'hover:bg-accent/10 transition-colors',
                      selectedModel === model.id && 'bg-accent/20'
                    )}
                  >
                    <div className="flex-1 text-left">
                      <div className="text-sm font-medium text-foreground">
                        {model.config.description.split(' - ')[0]}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {model.config.description.split(' - ')[1] || model.config.model}
                      </div>
                    </div>

                    {/* 信息按钮 */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onShowModelInfo(model.config)
                        setIsOpen(false)
                      }}
                      className={cn(
                        'p-1.5 rounded-lg',
                        'text-muted-foreground hover:text-accent',
                        'hover:bg-accent/10 transition-all'
                      )}
                      title="查看模型详情"
                    >
                      <Info className="w-4 h-4" />
                    </button>
                  </button>
                ))}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
