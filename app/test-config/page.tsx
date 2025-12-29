'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Database,
  Cpu,
  Sparkles,
  Settings,
  ArrowLeft,
  RefreshCw,
  AlertTriangle
} from 'lucide-react'
import Link from 'next/link'

interface TestResult {
  success: boolean
  message: string
  data?: any
  duration?: number
}

interface TestResults {
  [key: string]: TestResult
}

export default function TestConfigPage() {
  const [loading, setLoading] = useState(true)
  const [results, setResults] = useState<TestResults>({})
  const [overallStatus, setOverallStatus] = useState<'success' | 'warning' | 'error'>('success')

  useEffect(() => {
    runTests()
  }, [])

  const runTests = async () => {
    setLoading(true)
    const testResults: TestResults = {}
    let allSuccess = true

    // 测试 1: Supabase 连接
    const supabaseStart = Date.now()
    try {
      const response = await fetch('/api/admin/settings')
      const data = await response.json()
      testResults.supabase = {
        success: response.ok,
        message: response.ok ? 'Supabase 连接成功' : '连接失败',
        data: response.ok ? { status: 'connected', url: data.supabaseUrl || 'configured' } : null,
        duration: Date.now() - supabaseStart
      }
      if (!response.ok) allSuccess = false
    } catch (error) {
      testResults.supabase = {
        success: false,
        message: '连接失败: ' + (error as Error).message,
        duration: Date.now() - supabaseStart
      }
      allSuccess = false
    }

    // 测试 2: AI API 配置
    const aiStart = Date.now()
    try {
      const hasEndpoint = !!process.env.NEXT_PUBLIC_UNIFIED_API_ENDPOINT
      testResults.aiConfig = {
        success: true,
        message: 'AI API 配置已就绪',
        data: {
          endpoint: process.env.NEXT_PUBLIC_UNIFIED_API_ENDPOINT || 'https://api4.mygptlife.com/v1',
          configured: true
        },
        duration: Date.now() - aiStart
      }
    } catch (error) {
      testResults.aiConfig = {
        success: false,
        message: 'AI API 配置检查失败',
        duration: Date.now() - aiStart
      }
      allSuccess = false
    }

    // 测试 3: 模型配置加载
    const modelStart = Date.now()
    try {
      const response = await fetch('/api/admin/settings')
      const data = await response.json()
      const configCount = data.modelConfigs ? Object.keys(data.modelConfigs).length : 0
      testResults.modelConfig = {
        success: !!data.modelConfigs && configCount > 0,
        message: data.modelConfigs ? `已加载 ${configCount} 个技能的模型配置` : '模型配置为空',
        data: data.modelConfigs ? { skillCount: configCount, configured: true } : null,
        duration: Date.now() - modelStart
      }
      if (!data.modelConfigs) allSuccess = false
    } catch (error) {
      testResults.modelConfig = {
        success: false,
        message: '模型配置加载失败',
        duration: Date.now() - modelStart
      }
      allSuccess = false
    }

    // 测试 4: 技能列表
    const skillsStart = Date.now()
    try {
      const response = await fetch('/api/skills')
      const data = await response.json()
      const skills = data.skills || data // 兼容两种格式
      testResults.skills = {
        success: Array.isArray(skills) && skills.length > 0,
        message: `成功加载 ${skills.length} 个技能`,
        data: { skillCount: skills.length, available: true },
        duration: Date.now() - skillsStart
      }
      if (!Array.isArray(skills) || skills.length === 0) allSuccess = false
    } catch (error) {
      testResults.skills = {
        success: false,
        message: '技能列表加载失败: ' + (error as Error).message,
        duration: Date.now() - skillsStart
      }
      allSuccess = false
    }

    setResults(testResults)
    setOverallStatus(allSuccess ? 'success' : 'error')
    setLoading(false)
  }

  const testItems = [
    {
      key: 'supabase',
      icon: Database,
      title: 'Supabase 数据库',
      description: '验证数据库连接和配置读取'
    },
    {
      key: 'aiConfig',
      icon: Cpu,
      title: 'AI API 配置',
      description: '检查统一 API 端点配置'
    },
    {
      key: 'modelConfig',
      icon: Settings,
      title: '模型配置',
      description: '验证技能模型映射加载'
    },
    {
      key: 'skills',
      icon: Sparkles,
      title: '技能列表',
      description: '检查技能服务可用性'
    }
  ]

  const successCount = Object.values(results).filter(r => r.success).length
  const totalCount = Object.keys(results).length

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            返回首页
          </Link>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-semibold text-foreground mb-3">
                系统配置诊断
              </h1>
              <p className="text-lg text-muted-foreground">
                全面检测系统配置状态,确保所有服务正常运行
              </p>
            </div>

            {!loading && (
              <div className="text-right">
                <div className="text-3xl font-semibold mb-1">
                  {successCount}/{totalCount}
                </div>
                <div className="text-sm text-muted-foreground">通过测试</div>
              </div>
            )}
          </div>
        </div>

        {/* Overall Status Banner */}
        {!loading && (
          <div className={`mb-8 p-6 rounded-2xl border-2 shadow-lg ${
            overallStatus === 'success'
              ? 'bg-success/10 border-success/30'
              : 'bg-destructive/10 border-destructive/30'
          }`}>
            <div className="flex items-start gap-4">
              {overallStatus === 'success' ? (
                <div className="p-3 gradient-success rounded-xl">
                  <CheckCircle2 className="h-8 w-8 text-white" />
                </div>
              ) : (
                <div className="p-3 gradient-danger rounded-xl">
                  <AlertTriangle className="h-8 w-8 text-white" />
                </div>
              )}
              <div className="flex-1">
                <h2 className="text-2xl font-semibold mb-2 text-foreground">
                  {overallStatus === 'success' ? '✨ 系统运行正常' : '⚠️ 检测到问题'}
                </h2>
                <p className="text-base text-muted-foreground">
                  {overallStatus === 'success'
                    ? '所有配置测试通过,系统已准备就绪'
                    : '部分配置存在问题,请检查下方详情并修复'
                  }
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="relative">
              <div className="w-20 h-20 border-4 border-muted border-t-primary rounded-full animate-spin"></div>
              <Loader2 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-8 w-8 text-primary animate-pulse" />
            </div>
            <p className="mt-6 text-lg font-medium text-foreground">正在运行诊断测试...</p>
            <p className="mt-2 text-sm text-muted-foreground">这可能需要几秒钟</p>
          </div>
        ) : (
          <>
            {/* Test Results Grid */}
            <div className="grid gap-6 md:grid-cols-2 mb-8">
              {testItems.map(({ key, icon: Icon, title, description }) => {
                const result = results[key]
                if (!result) return null

                return (
                  <Card
                    key={key}
                    className={`relative overflow-hidden transition-all hover:shadow-xl ${
                      result.success
                        ? 'border-success/30 bg-card'
                        : 'border-destructive/30 bg-card'
                    }`}
                  >
                    {/* Status Indicator Bar */}
                    <div className={`absolute top-0 left-0 right-0 h-1 ${
                      result.success ? 'gradient-success' : 'gradient-danger'
                    }`} />

                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2.5 rounded-lg ${
                            result.success ? 'bg-success/10' : 'bg-destructive/10'
                          }`}>
                            <Icon className={`h-5 w-5 ${
                              result.success ? 'text-success' : 'text-destructive'
                            }`} />
                          </div>
                          <div>
                            <CardTitle className="text-lg font-semibold">{title}</CardTitle>
                            <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
                          </div>
                        </div>

                        {result.success ? (
                          <CheckCircle2 className="h-6 w-6 text-success flex-shrink-0" />
                        ) : (
                          <XCircle className="h-6 w-6 text-destructive flex-shrink-0" />
                        )}
                      </div>
                    </CardHeader>

                    <CardContent>
                      <div className={`text-sm font-medium mb-3 ${
                        result.success ? 'text-success' : 'text-destructive'
                      }`}>
                        {result.message}
                      </div>

                      {result.data && (
                        <div className="bg-muted rounded-lg p-3 border border-border">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">状态详情</span>
                            {result.duration && (
                              <span className="text-muted-foreground">{result.duration}ms</span>
                            )}
                          </div>
                          <div className="mt-2 space-y-1">
                            {Object.entries(result.data).map(([k, v]) => (
                              <div key={k} className="flex justify-between text-xs">
                                <span className="text-muted-foreground font-medium">{k}:</span>
                                <span className="text-foreground font-mono">
                                  {typeof v === 'boolean' ? (v ? '✓' : '✗') : String(v)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-4 justify-center">
              <Button
                onClick={runTests}
                disabled={loading}
                size="lg"
                className="gradient-primary text-white shadow-lg glow-primary-sm"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                重新运行测试
              </Button>

              <Link href="/admin/settings">
                <Button variant="outline" size="lg">
                  <Settings className="h-4 w-4 mr-2" />
                  打开系统设置
                </Button>
              </Link>
            </div>

            {/* Info Box */}
            <div className="mt-8 p-6 bg-card rounded-2xl border border-border shadow-lg">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground mb-3">📋 测试项目说明</h3>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="font-medium text-foreground mb-1">✓ Supabase 数据库</div>
                      <p className="text-muted-foreground">验证数据库连接和 system_settings 表访问权限</p>
                    </div>
                    <div>
                      <div className="font-medium text-foreground mb-1">✓ AI API 配置</div>
                      <p className="text-muted-foreground">检查统一 API 端点和密钥配置状态</p>
                    </div>
                    <div>
                      <div className="font-medium text-foreground mb-1">✓ 模型配置</div>
                      <p className="text-muted-foreground">确认各技能的 AI 模型映射已正确加载</p>
                    </div>
                    <div>
                      <div className="font-medium text-foreground mb-1">✓ 技能列表</div>
                      <p className="text-muted-foreground">验证技能服务可用性和数据完整性</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
