'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Trash2, Search, RefreshCw, Filter } from 'lucide-react'

interface LogEntry {
  id: string
  timestamp: Date
  level: 'info' | 'warn' | 'error' | 'debug'
  message: string
  data?: any
}

// 模拟日志数据（实际应从后端获取）
const generateMockLogs = (): LogEntry[] => {
  const levels: LogEntry['level'][] = ['info', 'warn', 'error', 'debug']
  const messages = [
    'API 请求: POST /api/claude/chat',
    '技能加载: moments-copywriter',
    '模型调用: claude-3-5-sonnet',
    '响应时间: 1234ms',
    '用户认证成功',
    '数据库查询: skills',
    '缓存命中',
    '限流触发',
    '会话创建',
  ]

  return Array.from({ length: 20 }, (_, i) => ({
    id: `log-${i}`,
    timestamp: new Date(Date.now() - i * 60000),
    level: levels[Math.floor(Math.random() * levels.length)],
    message: messages[Math.floor(Math.random() * messages.length)],
    data: Math.random() > 0.5 ? { userId: 'user-123', skillId: 'skill-456' } : undefined,
  }))
}

export function LogViewer() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [filter, setFilter] = useState('')
  const [levelFilter, setLevelFilter] = useState<LogEntry['level'] | 'all'>('all')
  const [autoRefresh, setAutoRefresh] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // 初始加载日志
    setLogs(generateMockLogs())
  }, [])

  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      setLogs((prev) => [
        {
          id: `log-${Date.now()}`,
          timestamp: new Date(),
          level: 'info',
          message: '新日志条目',
        },
        ...prev.slice(0, 99),
      ])
    }, 3000)

    return () => clearInterval(interval)
  }, [autoRefresh])

  const filteredLogs = logs.filter((log) => {
    if (levelFilter !== 'all' && log.level !== levelFilter) return false
    if (filter && !log.message.toLowerCase().includes(filter.toLowerCase())) {
      return false
    }
    return true
  })

  const clearLogs = () => setLogs([])

  const getLevelColor = (level: LogEntry['level']) => {
    switch (level) {
      case 'error':
        return 'bg-red-500/10 text-red-500 border-red-500/20'
      case 'warn':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
      case 'info':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20'
      case 'debug':
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20'
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>系统日志</CardTitle>
            <CardDescription>实时查看系统运行日志</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={autoRefresh ? 'default' : 'outline'}
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${autoRefresh ? 'animate-spin' : ''}`} />
              自动刷新
            </Button>
            <Button variant="outline" size="sm" onClick={clearLogs}>
              <Trash2 className="h-4 w-4 mr-1" />
              清空
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 过滤器 */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="搜索日志..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <div className="flex gap-1">
              {(['all', 'info', 'warn', 'error', 'debug'] as const).map((level) => (
                <Button
                  key={level}
                  variant={levelFilter === level ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setLevelFilter(level)}
                >
                  {level === 'all' ? '全部' : level.toUpperCase()}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* 日志列表 */}
        <ScrollArea className="h-[400px] rounded-md border" ref={scrollRef}>
          <div className="p-4 space-y-2">
            {filteredLogs.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                暂无日志
              </div>
            ) : (
              filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-3 text-sm p-2 rounded-md hover:bg-muted/50"
                >
                  <span className="text-muted-foreground whitespace-nowrap">
                    {log.timestamp.toLocaleTimeString()}
                  </span>
                  <Badge
                    variant="outline"
                    className={`${getLevelColor(log.level)} text-xs uppercase`}
                  >
                    {log.level}
                  </Badge>
                  <span className="flex-1">{log.message}</span>
                  {log.data && (
                    <details className="text-xs text-muted-foreground">
                      <summary className="cursor-pointer">详情</summary>
                      <pre className="mt-1 p-2 bg-muted rounded text-xs">
                        {JSON.stringify(log.data, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        <div className="text-xs text-muted-foreground">
          显示 {filteredLogs.length} / {logs.length} 条日志
        </div>
      </CardContent>
    </Card>
  )
}
