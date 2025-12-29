"use client"

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Upload, FileText, Edit3 } from 'lucide-react'
import { Skill, SkillMetadata, SKILL_CATEGORIES } from '@/types'
import { parseSkillFile } from '@/lib/skills/parser'
import { validateSkillFields } from '@/lib/db/skills'
import { cn } from '@/lib/utils'

interface SkillUploaderProps {
  onClose: () => void
  onUpload: (skill: Partial<Skill>) => void
  initialData?: Partial<Skill>
}

export function SkillUploader({ onClose, onUpload, initialData }: SkillUploaderProps) {
  const isEditMode = !!initialData?.id
  const [selectedTab, setSelectedTab] = React.useState(isEditMode ? 'editor' : 'upload')
  const [isDragging, setIsDragging] = React.useState(false)
  const [skillData, setSkillData] = React.useState<Partial<Skill>>({
    name: '',
    description: '',
    icon: 'Sparkles',
    category: '文案创作',
    inputTypes: ['text'],
    source: 'custom',
    content: ''
  })

  // 编辑模式时，填充初始数据
  React.useEffect(() => {
    if (initialData) {
      setSkillData({
        ...skillData,
        id: initialData.id,
        name: initialData.name || '',
        description: initialData.description || '',
        icon: initialData.icon || 'Sparkles',
        category: initialData.category || '文案创作',
        inputTypes: initialData.inputTypes || ['text'],
        content: initialData.content || '',
        source: initialData.source || 'custom',
      })
    }
  }, [initialData])

  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files)
    handleFiles(files)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(Array.from(e.target.files))
    }
  }

  const handleFiles = async (files: File[]) => {
    const file = files[0]
    if (!file) return

    if (file.name.endsWith('.md')) {
      // Handle markdown file
      const content = await file.text()
      const parsed = parseSkillFile(content)
      setSkillData({
        ...skillData,
        ...parsed,
        content
      })
    } else {
      alert('仅支持 .md 格式的技能文件')
    }
  }

  const handleSave = () => {
    // 使用统一验证函数
    const validation = validateSkillFields({
      name: skillData.name,
      description: skillData.description,
      content: skillData.content,
    })

    if (!validation.valid) {
      alert(validation.error)
      return
    }

    onUpload(skillData)
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditMode ? '编辑技能' : '上传自定义技能'}</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? '修改技能的名称、描述和内容'
              : '通过上传 SKILL.md 文件或在线编辑器创建您的自定义技能'
            }
          </DialogDescription>
        </DialogHeader>

        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload" className="gap-2">
              <Upload className="h-4 w-4" />
              上传文件
            </TabsTrigger>
            <TabsTrigger value="editor" className="gap-2">
              <Edit3 className="h-4 w-4" />
              在线编辑
            </TabsTrigger>
          </TabsList>

          {/* Upload Tab */}
          <TabsContent value="upload" className="space-y-4">
            <div
              className={cn(
                "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
                isDragging ? "border-primary bg-primary/5" : "border-border"
              )}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".md"
                onChange={handleFileSelect}
                className="hidden"
              />
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium mb-2">拖拽 SKILL.md 文件到这里</p>
              <p className="text-sm text-muted-foreground mb-4">或者</p>
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
              >
                选择文件
              </Button>
            </div>

            {skillData.name && (
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <h4 className="font-semibold">解析结果</h4>
                <div className="text-sm space-y-1">
                  <p><span className="text-muted-foreground">名称：</span>{skillData.name}</p>
                  <p><span className="text-muted-foreground">描述：</span>{skillData.description}</p>
                  <p><span className="text-muted-foreground">分类：</span>{skillData.category}</p>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Editor Tab */}
          <TabsContent value="editor" className="space-y-4">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">技能名称</Label>
                <Input
                  id="name"
                  value={skillData.name}
                  onChange={(e) => setSkillData({ ...skillData, name: e.target.value })}
                  placeholder="例如：朋友圈文案生成器"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">技能描述</Label>
                <Textarea
                  id="description"
                  value={skillData.description}
                  onChange={(e) => setSkillData({ ...skillData, description: e.target.value })}
                  placeholder="描述这个技能的功能和用途"
                  rows={3}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="category">分类</Label>
                <Select
                  value={skillData.category}
                  onValueChange={(value) => setSkillData({ ...skillData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SKILL_CATEGORIES.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="content">技能内容 (System Prompt)</Label>
                <Textarea
                  id="content"
                  value={skillData.content}
                  onChange={(e) => setSkillData({ ...skillData, content: e.target.value })}
                  placeholder="输入技能的系统提示词，定义 AI 的行为和能力"
                  rows={10}
                  className="font-mono text-sm"
                />
              </div>
            </div>
          </TabsContent>

        </Tabs>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            取消
          </Button>
          <Button onClick={handleSave}>
            {isEditMode ? '更新技能' : '保存技能'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}