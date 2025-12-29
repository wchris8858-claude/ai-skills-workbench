'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PRESET_SKILLS } from '@/types'
import { Loader2, Play, Copy, Check } from 'lucide-react'

interface TestResult {
  success: boolean
  content: string
  tokensUsed?: number
  responseTime?: number
  error?: string
  rawRequest?: object
  rawResponse?: object
}

export function SkillTester() {
  const [selectedSkill, setSelectedSkill] = useState('')
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<TestResult | null>(null)
  const [copied, setCopied] = useState(false)

  const handleTest = async () => {
    if (!selectedSkill || !input.trim()) return

    setLoading(true)
    setResult(null)

    const startTime = Date.now()

    try {
      const response = await fetch('/api/claude/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skillId: selectedSkill,
          messages: [{ role: 'user', content: input }],
        }),
      })

      const data = await response.json()
      const endTime = Date.now()

      setResult({
        success: response.ok,
        content: data.content || data.error || '无响应',
        tokensUsed: data.usage?.total_tokens,
        responseTime: endTime - startTime,
        error: data.error,
        rawRequest: {
          skillId: selectedSkill,
          messages: [{ role: 'user', content: input }],
        },
        rawResponse: data,
      })
    } catch (error) {
      setResult({
        success: false,
        content: '',
        error: error instanceof Error ? error.message : '请求失败',
      })
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* 输入区 */}
      <Card>
        <CardHeader>
          <CardTitle>测试输入</CardTitle>
          <CardDescription>选择技能并输入测试内容</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>选择技能</Label>
            <Select value={selectedSkill} onValueChange={setSelectedSkill}>
              <SelectTrigger>
                <SelectValue placeholder="选择一个技能..." />
              </SelectTrigger>
              <SelectContent>
                {PRESET_SKILLS.map((skill) => (
                  <SelectItem key={skill.id} value={skill.id!}>
                    {skill.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>测试内容</Label>
            <Textarea
              placeholder="输入测试内容..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={6}
            />
          </div>

          <Button
            onClick={handleTest}
            disabled={loading || !selectedSkill || !input.trim()}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                执行中...
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                执行测试
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* 结果区 */}
      <Card>
        <CardHeader>
          <CardTitle>测试结果</CardTitle>
          <CardDescription>
            {result && (
              <span className="flex items-center gap-4">
                <span className={result.success ? 'text-green-600' : 'text-red-600'}>
                  {result.success ? '成功' : '失败'}
                </span>
                {result.responseTime && (
                  <span>耗时: {result.responseTime}ms</span>
                )}
                {result.tokensUsed && (
                  <span>Token: {result.tokensUsed}</span>
                )}
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {result ? (
            <>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>响应内容</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(result.content)}
                  >
                    {copied ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <div className="rounded-md bg-muted p-4 text-sm whitespace-pre-wrap max-h-[300px] overflow-auto">
                  {result.content || result.error}
                </div>
              </div>

              <details className="space-y-2">
                <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                  查看原始请求/响应
                </summary>
                <div className="space-y-2 mt-2">
                  <Label className="text-xs">请求</Label>
                  <pre className="rounded-md bg-muted p-2 text-xs overflow-auto max-h-[150px]">
                    {JSON.stringify(result.rawRequest, null, 2)}
                  </pre>
                  <Label className="text-xs">响应</Label>
                  <pre className="rounded-md bg-muted p-2 text-xs overflow-auto max-h-[150px]">
                    {JSON.stringify(result.rawResponse, null, 2)}
                  </pre>
                </div>
              </details>
            </>
          ) : (
            <div className="flex items-center justify-center h-[200px] text-muted-foreground">
              执行测试后查看结果
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
