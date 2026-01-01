'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SiteHeader } from '@/components/site-header'
import { SkillTester } from './components/SkillTester'
import { LogViewer } from './components/LogViewer'
import { ModelSwitcher } from './components/ModelSwitcher'
import { DbInspector } from './components/DbInspector'
import { Wrench, Terminal, Cpu, Database, Loader2, ShieldX } from 'lucide-react'
import { useAuth, useIsAdmin } from '@/contexts/AuthContext'

export default function DevToolsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const isAdmin = useIsAdmin()
  const [activeTab, setActiveTab] = useState('skill-tester')

  // 权限检查：非管理员重定向
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    } else if (!authLoading && user && !isAdmin) {
      router.push('/')
    }
  }, [authLoading, user, isAdmin, router])

  // 加载中
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
          <p className="text-muted-foreground">此页面仅限管理员访问</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1 container py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Wrench className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold">开发调试工具</h1>
              <p className="text-sm text-muted-foreground">
                测试技能、查看日志、切换模型、检查数据库
              </p>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="skill-tester" className="flex items-center gap-2">
              <Terminal className="h-4 w-4" />
              技能测试
            </TabsTrigger>
            <TabsTrigger value="model-switcher" className="flex items-center gap-2">
              <Cpu className="h-4 w-4" />
              模型切换
            </TabsTrigger>
            <TabsTrigger value="log-viewer" className="flex items-center gap-2">
              <Terminal className="h-4 w-4" />
              日志查看
            </TabsTrigger>
            <TabsTrigger value="db-inspector" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              数据库
            </TabsTrigger>
          </TabsList>

          <TabsContent value="skill-tester" className="space-y-4">
            <SkillTester />
          </TabsContent>

          <TabsContent value="model-switcher" className="space-y-4">
            <ModelSwitcher />
          </TabsContent>

          <TabsContent value="log-viewer" className="space-y-4">
            <LogViewer />
          </TabsContent>

          <TabsContent value="db-inspector" className="space-y-4">
            <DbInspector />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
