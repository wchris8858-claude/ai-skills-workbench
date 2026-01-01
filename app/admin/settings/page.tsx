'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Save,
  Database,
  Cpu,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  ShieldX
} from 'lucide-react'
import { useAuth, useIsAdmin } from '@/contexts/AuthContext'
import { logger } from '@/lib/logger'

interface ModelConfig {
  provider: string
  model: string
  temperature: number
  maxTokens: number
}

interface SkillModelMapping {
  [skillId: string]: {
    text: ModelConfig
    image?: ModelConfig
  }
}

export default function SettingsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const isAdmin = useIsAdmin()

  const [activeTab, setActiveTab] = useState('supabase')
  const [showApiKey, setShowApiKey] = useState(false)
  const [showSupabaseKey, setShowSupabaseKey] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  // Supabase 配置
  const [supabaseUrl, setSupabaseUrl] = useState('')
  const [supabaseAnonKey, setSupabaseAnonKey] = useState('')

  // AI API 配置
  const [unifiedApiKey, setUnifiedApiKey] = useState('')
  const [unifiedApiEndpoint, setUnifiedApiEndpoint] = useState('https://api4.mygptlife.com/v1')

  // 权限检查：非管理员重定向
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    } else if (!authLoading && user && !isAdmin) {
      router.push('/')
    }
  }, [authLoading, user, isAdmin, router])

  // 加载中或权限检查中
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    )
  }

  // 非管理员显示无权限提示
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <ShieldX className="h-16 w-16 mx-auto text-destructive" />
          <h1 className="text-2xl font-semibold">无权访问</h1>
          <p className="text-muted-foreground">您没有权限访问此页面</p>
          <Button onClick={() => router.push('/')}>返回首页</Button>
        </div>
      </div>
    )
  }

  // 模型配置
  const [modelConfigs, setModelConfigs] = useState<SkillModelMapping>({})
  const [availableModels, setAvailableModels] = useState<string[]>([
    'claude-haiku-4-5-20251001',
    'claude-opus-4-5-20251101',
    'gemini-pro-vision',
    'gpt-image-1.5',
    'nano-banana-pro',
  ])

  useEffect(() => {
    // 加载当前配置
    loadCurrentConfig()
  }, [])

  const loadCurrentConfig = async () => {
    try {
      // 从 localStorage 加载配置
      const savedSupabaseUrl = localStorage.getItem('supabase_url')
      const savedSupabaseKey = localStorage.getItem('supabase_anon_key')
      const savedApiKey = localStorage.getItem('unified_api_key')
      const savedEndpoint = localStorage.getItem('unified_api_endpoint')
      const savedModelConfigs = localStorage.getItem('model_configs')

      if (savedSupabaseUrl) setSupabaseUrl(savedSupabaseUrl)
      if (savedSupabaseKey) setSupabaseAnonKey(savedSupabaseKey)
      if (savedApiKey) setUnifiedApiKey(savedApiKey)
      if (savedEndpoint) setUnifiedApiEndpoint(savedEndpoint)
      if (savedModelConfigs) setModelConfigs(JSON.parse(savedModelConfigs))

      // 尝试从服务器加载配置
      const response = await fetch('/api/admin/settings')
      if (response.ok) {
        const data = await response.json()
        if (data.modelConfigs) {
          setModelConfigs(data.modelConfigs)
        }
      }
    } catch (err) {
      logger.error('Failed to load config', err)
    }
  }

  const saveSupabaseConfig = async () => {
    setError('')
    setSaved(false)

    // 验证 URL 格式
    if (!supabaseUrl.startsWith('https://')) {
      setError('Supabase URL 必须以 https:// 开头')
      return
    }

    try {
      // 保存到 localStorage
      localStorage.setItem('supabase_url', supabaseUrl)
      localStorage.setItem('supabase_anon_key', supabaseAnonKey)

      // 调用 API 更新环境变量
      const response = await fetch('/api/admin/settings/supabase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supabaseUrl,
          supabaseAnonKey,
        }),
      })

      if (!response.ok) {
        throw new Error('保存失败')
      }

      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setError('保存配置失败,请重试')
    }
  }

  const saveAIConfig = async () => {
    setError('')
    setSaved(false)

    try {
      // 保存到 localStorage
      localStorage.setItem('unified_api_key', unifiedApiKey)
      localStorage.setItem('unified_api_endpoint', unifiedApiEndpoint)

      // 调用 API 更新环境变量
      const response = await fetch('/api/admin/settings/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: unifiedApiKey,
          endpoint: unifiedApiEndpoint,
        }),
      })

      if (!response.ok) {
        throw new Error('保存失败')
      }

      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setError('保存配置失败,请重试')
    }
  }

  const saveModelConfig = async () => {
    setError('')
    setSaved(false)

    try {
      // 保存到 localStorage
      localStorage.setItem('model_configs', JSON.stringify(modelConfigs))

      // 调用 API 保存到数据库
      const response = await fetch('/api/admin/settings/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modelConfigs }),
      })

      if (!response.ok) {
        throw new Error('保存失败')
      }

      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setError('保存模型配置失败,请重试')
    }
  }

  const updateSkillModel = (skillId: string, modelType: 'text' | 'image', modelName: string) => {
    setModelConfigs(prev => {
      const newConfig = { ...prev }
      if (!newConfig[skillId]) {
        newConfig[skillId] = {
          text: {
            provider: 'anthropic',
            model: 'claude-haiku-4-5-20251001',
            temperature: 0.7,
            maxTokens: 4096,
          },
        }
      }

      if (modelType === 'text') {
        newConfig[skillId].text = {
          ...newConfig[skillId].text,
          model: modelName,
        }
      } else {
        newConfig[skillId].image = {
          provider: 'image',
          model: modelName,
          temperature: 0.7,
          maxTokens: 1024,
        }
      }

      return newConfig
    })
  }

  const skills = [
    { id: 'moments-copywriter', name: '朋友圈文案', hasImage: false },
    { id: 'video-rewriter', name: '视频文案改写', hasImage: false },
    { id: 'viral-analyzer', name: '爆款拆解', hasImage: false },
    { id: 'meeting-transcriber', name: '会议语音转文字', hasImage: false },
    { id: 'knowledge-query', name: '知识库查询', hasImage: false },
    { id: 'official-notice', name: '官方通知', hasImage: false },
    { id: 'poster-creator', name: '海报制作', hasImage: true },
    { id: 'photo-selector', name: 'AI选片修片', hasImage: true },
  ]

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold mb-2">系统设置</h1>
        <p className="text-muted-foreground">
          配置 Supabase 数据库和 AI 模型参数
        </p>
      </div>

      {saved && (
        <div className="mb-6 p-4 border border-green-500 bg-green-50 rounded-lg flex items-start gap-2">
          <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
          <p className="text-green-600">
            配置已成功保存!
          </p>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 border border-red-500 bg-red-50 rounded-lg flex items-start gap-2">
          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
          <p className="text-red-600">
            {error}
          </p>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="supabase" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Supabase 配置
          </TabsTrigger>
          <TabsTrigger value="ai" className="flex items-center gap-2">
            <Cpu className="h-4 w-4" />
            AI API 配置
          </TabsTrigger>
          <TabsTrigger value="models" className="flex items-center gap-2">
            <Cpu className="h-4 w-4" />
            模型配置
          </TabsTrigger>
        </TabsList>

        {/* Supabase 配置 */}
        <TabsContent value="supabase">
          <Card>
            <CardHeader>
              <CardTitle>Supabase 数据库配置</CardTitle>
              <CardDescription>
                配置 Supabase 项目的连接信息。您可以在 Supabase 项目的 Settings → API 中找到这些信息。
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="supabase-url">Supabase URL</Label>
                <Input
                  id="supabase-url"
                  placeholder="https://your-project.supabase.co"
                  value={supabaseUrl}
                  onChange={(e) => setSupabaseUrl(e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  格式: https://xxxxx.supabase.co
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="supabase-key">Supabase Anon Key</Label>
                <div className="relative">
                  <Input
                    id="supabase-key"
                    type={showSupabaseKey ? 'text' : 'password'}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    value={supabaseAnonKey}
                    onChange={(e) => setSupabaseAnonKey(e.target.value)}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSupabaseKey(!showSupabaseKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showSupabaseKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-sm text-muted-foreground">
                  这是公开的匿名密钥,用于客户端连接
                </p>
              </div>

              <Button
                onClick={saveSupabaseConfig}
                className="w-full"
                disabled={!supabaseUrl || !supabaseAnonKey}
              >
                <Save className="h-4 w-4 mr-2" />
                保存 Supabase 配置
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI API 配置 */}
        <TabsContent value="ai">
          <Card>
            <CardHeader>
              <CardTitle>统一 AI API 配置</CardTitle>
              <CardDescription>
                配置统一 API 端点,用于访问所有 AI 模型
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="api-endpoint">API 端点</Label>
                <Input
                  id="api-endpoint"
                  placeholder="https://api4.mygptlife.com/v1"
                  value={unifiedApiEndpoint}
                  onChange={(e) => setUnifiedApiEndpoint(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="api-key">API 密钥</Label>
                <div className="relative">
                  <Input
                    id="api-key"
                    type={showApiKey ? 'text' : 'password'}
                    placeholder="sk-..."
                    value={unifiedApiKey}
                    onChange={(e) => setUnifiedApiKey(e.target.value)}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">支持的模型</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  {availableModels.map(model => (
                    <li key={model} className="font-mono">• {model}</li>
                  ))}
                </ul>
              </div>

              <Button
                onClick={saveAIConfig}
                className="w-full"
                disabled={!unifiedApiKey || !unifiedApiEndpoint}
              >
                <Save className="h-4 w-4 mr-2" />
                保存 AI API 配置
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 模型配置 */}
        <TabsContent value="models">
          <Card>
            <CardHeader>
              <CardTitle>技能模型配置</CardTitle>
              <CardDescription>
                为每个技能分配合适的 AI 模型
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {skills.map(skill => (
                <div key={skill.id} className="border rounded-lg p-4 space-y-4">
                  <h3 className="font-medium text-lg">{skill.name}</h3>

                  <div className="space-y-2">
                    <Label>文本模型</Label>
                    <select
                      className="w-full border rounded-md p-2"
                      value={modelConfigs[skill.id]?.text?.model || 'claude-haiku-4-5-20251001'}
                      onChange={(e) => updateSkillModel(skill.id, 'text', e.target.value)}
                    >
                      <option value="claude-haiku-4-5-20251001">Claude Haiku 4.5 (快速)</option>
                      <option value="claude-opus-4-5-20251101">Claude Opus 4.5 (高质量)</option>
                      <option value="gemini-pro-vision">Gemini Pro Vision (视觉)</option>
                    </select>
                  </div>

                  {skill.hasImage && (
                    <div className="space-y-2">
                      <Label>图像模型</Label>
                      <select
                        className="w-full border rounded-md p-2"
                        value={modelConfigs[skill.id]?.image?.model || 'gpt-image-1.5'}
                        onChange={(e) => updateSkillModel(skill.id, 'image', e.target.value)}
                      >
                        <option value="gpt-image-1.5">GPT Image 1.5</option>
                        <option value="nano-banana-pro">Nano Banana Pro</option>
                      </select>
                    </div>
                  )}
                </div>
              ))}

              <Button
                onClick={saveModelConfig}
                className="w-full"
              >
                <Save className="h-4 w-4 mr-2" />
                保存模型配置
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
