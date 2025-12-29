"use client"

import * as React from 'react'
import { SkillCard } from './SkillCard'
import { Skill, SkillCategory, SKILL_CATEGORIES } from '@/types'
import { cn } from '@/lib/utils'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface SkillGridProps {
  skills: Partial<Skill>[]
  className?: string
}

export function SkillGrid({ skills, className }: SkillGridProps) {
  const [selectedCategory, setSelectedCategory] = React.useState<string>('all')

  const filteredSkills = React.useMemo(() => {
    if (selectedCategory === 'all') {
      return skills
    }
    return skills.filter(skill => skill.category === selectedCategory)
  }, [skills, selectedCategory])

  return (
    <div className={cn("w-full", className)}>
      <Tabs defaultValue="all" value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-3 md:grid-cols-6 mb-8">
          <TabsTrigger value="all">全部</TabsTrigger>
          {SKILL_CATEGORIES.map((category) => (
            <TabsTrigger key={category} value={category}>
              {category}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value={selectedCategory} className="mt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {filteredSkills.map((skill) => (
              <SkillCard key={skill.id} skill={skill} />
            ))}
          </div>
          {filteredSkills.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">该分类暂无技能</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}