'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Loader2, Zap, ArrowRightLeft } from 'lucide-react'

const AVAILABLE_MODELS = [
  { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', provider: 'Anthropic' },
  { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', provider: 'Anthropic' },
  { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', provider: 'Anthropic' },
  { id: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash', provider: 'Google' },
  { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', provider: 'Google' },
  { id: 'deepseek-v3', name: 'DeepSeek V3', provider: 'DeepSeek' },
]

interface ModelResult {
  model: string
  content: string
  responseTime: number
  tokensUsed?: number
}

export function ModelSwitcher() {
  const [selectedModels, setSelectedModels] = useState<string[]>([
    'claude-3-5-sonnet-20241022',
  ])
  const [prompt, setPrompt] = useState('')
  const [temperature, setTemperature] = useState(0.7)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<ModelResult[]>([])

  const toggleModel = (modelId: string) => {
    setSelectedModels((prev) =>
      prev.includes(modelId)
        ? prev.filter((id) => id !== modelId)
        : [...prev, modelId]
    )
  }

  const handleCompare = async () => {
    if (!prompt.trim() || selectedModels.length === 0) return

    setLoading(true)
    setResults([])

    const newResults: ModelResult[] = []

    for (const modelId of selectedModels) {
      const startTime = Date.now()

      try {
        const response = await fetch('/api/dev/model-test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: modelId,
            prompt,
            temperature,
          }),
        })

        const data = await response.json()
        const endTime = Date.now()

        newResults.push({
          model: modelId,
          content: data.content || data.error || '无响应',
          responseTime: endTime - startTime,
          tokensUsed: data.usage?.total_tokens,
        })
      } catch (error) {
        newResults.push({
          model: modelId,
          content: error instanceof Error ? error.message : '请求失败',
          responseTime: 0,
        })
      }
    }

    setResults(newResults)
    setLoading(false)
  }

  const getModelName = (modelId: string) => {
    return AVAILABLE_MODELS.find((m) => m.id === modelId)?.name || modelId
  }

  return (
    <div className="space-y-6">
      {/* 配置区 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5" />
            模型对比测试
          </CardTitle>
          <CardDescription>
            选择多个模型，使用相同的输入进行对比测试
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>选择模型（可多选）</Label>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_MODELS.map((model) => (
                <Button
                  key={model.id}
                  variant={selectedModels.includes(model.id) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => toggleModel(model.id)}
                >
                  {model.name}
                  <span className="ml-1 text-xs opacity-70">({model.provider})</span>
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>温度 (Temperature): {temperature}</Label>
            <Slider
              value={[temperature]}
              onValueChange={([value]) => setTemperature(value)}
              min={0}
              max={1}
              step={0.1}
            />
          </div>

          <div className="space-y-2">
            <Label>测试提示词</Label>
            <Textarea
              placeholder="输入测试提示词..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
            />
          </div>

          <Button
            onClick={handleCompare}
            disabled={loading || selectedModels.length === 0 || !prompt.trim()}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                测试中...
              </>
            ) : (
              <>
                <Zap className="mr-2 h-4 w-4" />
                开始对比测试
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* 结果对比 */}
      {results.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {results.map((result) => (
            <Card key={result.model}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{getModelName(result.model)}</CardTitle>
                <CardDescription className="flex items-center gap-4">
                  <span>耗时: {result.responseTime}ms</span>
                  {result.tokensUsed && <span>Token: {result.tokensUsed}</span>}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md bg-muted p-3 text-sm whitespace-pre-wrap max-h-[300px] overflow-auto">
                  {result.content}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
