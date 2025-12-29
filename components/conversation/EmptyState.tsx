'use client'

import { Sparkles } from 'lucide-react'
import { ModelSelector } from '../ModelSelector'
import { type ModelConfig } from '@/lib/models/config'

interface EmptyStateProps {
  skillName: string
  placeholder?: string
  selectedModelId: string
  onModelChange: (modelId: string, config: ModelConfig) => void
  onShowModelInfo: (config: ModelConfig) => void
}

/**
 * 对话空状态组件
 * 显示技能介绍和模型选择器
 */
export function EmptyState({
  skillName,
  placeholder,
  selectedModelId,
  onModelChange,
  onShowModelInfo,
}: EmptyStateProps) {
  return (
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
          onModelChange={onModelChange}
          onShowModelInfo={onShowModelInfo}
        />
      </div>
    </div>
  )
}
