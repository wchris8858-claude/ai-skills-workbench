"use client"

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Skill, InputType } from '@/types'
import { useRouter } from 'next/navigation'
import { ArrowUpRight, Type, Mic, Image } from 'lucide-react'
import { getIcon } from '@/lib/icons'

interface SkillCardProps {
  skill: Partial<Skill>
  className?: string
}

const inputTypeConfig: Record<InputType, { icon: React.ReactNode; label: string }> = {
  text: { icon: <Type className="w-3.5 h-3.5" />, label: '文字' },
  voice: { icon: <Mic className="w-3.5 h-3.5" />, label: '语音' },
  image: { icon: <Image className="w-3.5 h-3.5" />, label: '图片' }
}

const sourceConfig = {
  official: { label: '官方', className: 'bg-primary/10 text-primary border-primary/20' },
  custom: { label: '自定义', className: 'bg-accent/10 text-accent border-accent/20' },
  community: { label: '社区', className: 'bg-secondary text-muted-foreground border-border' }
}

export function SkillCard({ skill, className }: SkillCardProps) {
  const router = useRouter()
  const IconComponent = getIcon(skill.icon || 'Sparkles')

  const handleClick = () => {
    if (skill.id) {
      router.push(`/skill/${skill.id}`)
    }
  }

  const sourceStyle = skill.source ? sourceConfig[skill.source] : sourceConfig.official

  return (
    <div
      className={cn(
        "skill-card cursor-pointer group",
        className
      )}
      onClick={handleClick}
    >
      {/* 内容区域 - 保持在 z-index 上层 */}
      <div className="relative z-10">
        {/* 顶部区域：图标 + 来源标签 */}
        <div className="flex items-start justify-between mb-5">
          {/* 图标容器 */}
          <div className={cn(
            "w-14 h-14 rounded-xl flex items-center justify-center",
            "bg-gradient-to-br from-primary/15 to-primary/5",
            "transition-all duration-300",
            "group-hover:scale-110 group-hover:rotate-3",
            "group-hover:shadow-lg group-hover:shadow-primary/20"
          )}>
            <IconComponent className="w-7 h-7 text-primary" />
          </div>

          {/* 来源标签 */}
          {skill.source && (
            <span className={cn(
              "px-3 py-1 rounded-full text-xs font-medium border",
              "transition-all duration-300",
              sourceStyle.className
            )}>
              {sourceStyle.label}
            </span>
          )}
        </div>

        {/* 标题与描述 */}
        <div className="mb-5">
          <h3 className="font-heading text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
            {skill.name}
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
            {skill.description}
          </p>
        </div>

        {/* 底部区域：输入类型 + 分类 + 箭头 */}
        <div className="flex items-center justify-between pt-4 border-t border-border/50">
          {/* 输入类型图标 */}
          <div className="flex items-center gap-3">
            {skill.inputTypes?.map((type) => (
              <div
                key={type}
                className={cn(
                  "flex items-center gap-1.5 text-muted-foreground",
                  "transition-colors group-hover:text-foreground"
                )}
                title={inputTypeConfig[type].label}
              >
                {inputTypeConfig[type].icon}
                <span className="text-xs">{inputTypeConfig[type].label}</span>
              </div>
            ))}
          </div>

          {/* 分类 + 箭头 */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground px-2.5 py-1 rounded-full bg-secondary">
              {skill.category}
            </span>
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center",
              "bg-secondary transition-all duration-300",
              "group-hover:bg-primary group-hover:text-primary-foreground"
            )}>
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
