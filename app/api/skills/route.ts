/**
 * Skills 列表 API 端点
 * GET /api/skills - 获取所有 Skill 的元数据
 */

import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { parseSkillFile } from '@/lib/skills/parser'
import { PRESET_SKILLS } from '@/types'
import { withErrorHandler } from '@/lib/middleware/error-handler'

async function handler() {
  const skillsDir = path.join(process.cwd(), 'skills')

  // 尝试读取 skills 目录
  let dirs: string[] = []
  try {
    dirs = await fs.readdir(skillsDir)
  } catch {
    // 目录不存在，返回预设 skills
    return NextResponse.json({ skills: PRESET_SKILLS })
  }

  const skills = []

  for (const dir of dirs) {
    const skillPath = path.join(skillsDir, dir, 'SKILL.md')

    try {
      const content = await fs.readFile(skillPath, 'utf-8')
      const parsed = parseSkillFile(content)

      skills.push({
        id: dir,
        name: parsed.metadata.name,
        description: parsed.metadata.description,
        icon: parsed.metadata.icon,
        category: parsed.metadata.category,
        inputTypes: parsed.metadata.inputTypes,
        placeholder: parsed.metadata.placeholder,
        version: parsed.metadata.version,
        source: 'official',
      })
    } catch (error) {
      console.warn(`Skipping invalid skill: ${dir}`, error)
    }
  }

  // 如果没有找到任何 skill，返回预设的
  if (skills.length === 0) {
    return NextResponse.json({ skills: PRESET_SKILLS })
  }

  return NextResponse.json({ skills })
}

export const GET = withErrorHandler(handler)
