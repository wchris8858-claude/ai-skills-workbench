'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Loader2, Search, Database, RefreshCw } from 'lucide-react'

const TABLES = [
  { name: 'skills', description: '技能表' },
  { name: 'conversations', description: '对话表' },
  { name: 'messages', description: '消息表' },
  { name: 'usage_stats', description: '使用统计表' },
  { name: 'favorites', description: '收藏表' },
  { name: 'profiles', description: '用户资料表' },
]

interface QueryResult {
  data: any[]
  count: number
  error?: string
}

export function DbInspector() {
  const [selectedTable, setSelectedTable] = useState('')
  const [customQuery, setCustomQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<QueryResult | null>(null)
  const [limit, setLimit] = useState('10')

  const handleTableQuery = async () => {
    if (!selectedTable) return

    setLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/dev/db-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table: selectedTable,
          limit: parseInt(limit),
        }),
      })

      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({
        data: [],
        count: 0,
        error: error instanceof Error ? error.message : '查询失败',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCustomQuery = async () => {
    if (!customQuery.trim()) return

    // 安全检查：只允许 SELECT 查询
    if (!customQuery.trim().toLowerCase().startsWith('select')) {
      setResult({
        data: [],
        count: 0,
        error: '只允许 SELECT 查询',
      })
      return
    }

    setLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/dev/db-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawQuery: customQuery,
        }),
      })

      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({
        data: [],
        count: 0,
        error: error instanceof Error ? error.message : '查询失败',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* 表格查询 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            数据表查询
          </CardTitle>
          <CardDescription>
            选择数据表查看内容
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-end gap-4">
            <div className="flex-1 space-y-2">
              <Label>选择表</Label>
              <Select value={selectedTable} onValueChange={setSelectedTable}>
                <SelectTrigger>
                  <SelectValue placeholder="选择数据表..." />
                </SelectTrigger>
                <SelectContent>
                  {TABLES.map((table) => (
                    <SelectItem key={table.name} value={table.name}>
                      {table.name} - {table.description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="w-24 space-y-2">
              <Label>限制条数</Label>
              <Input
                type="number"
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
                min="1"
                max="100"
              />
            </div>

            <Button onClick={handleTableQuery} disabled={loading || !selectedTable}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              <span className="ml-2">查询</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 自定义 SQL */}
      <Card>
        <CardHeader>
          <CardTitle>自定义查询</CardTitle>
          <CardDescription>
            执行自定义 SQL 查询（仅支持 SELECT）
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>SQL 查询</Label>
            <Textarea
              placeholder="SELECT * FROM skills WHERE is_public = true LIMIT 10"
              value={customQuery}
              onChange={(e) => setCustomQuery(e.target.value)}
              rows={3}
              className="font-mono text-sm"
            />
          </div>
          <Button onClick={handleCustomQuery} disabled={loading || !customQuery.trim()}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Search className="h-4 w-4 mr-2" />
            )}
            执行查询
          </Button>
        </CardContent>
      </Card>

      {/* 查询结果 */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>查询结果</span>
              <span className="text-sm font-normal text-muted-foreground">
                共 {result.count} 条记录
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {result.error ? (
              <div className="text-red-500 p-4 bg-red-50 dark:bg-red-950 rounded-md">
                {result.error}
              </div>
            ) : result.data.length === 0 ? (
              <div className="text-muted-foreground text-center py-8">
                无数据
              </div>
            ) : (
              <div className="overflow-auto max-h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {Object.keys(result.data[0]).map((key) => (
                        <TableHead key={key} className="whitespace-nowrap">
                          {key}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.data.map((row, i) => (
                      <TableRow key={i}>
                        {Object.values(row).map((value: any, j) => (
                          <TableCell key={j} className="max-w-[200px] truncate">
                            {typeof value === 'object'
                              ? JSON.stringify(value)
                              : String(value ?? '')}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
