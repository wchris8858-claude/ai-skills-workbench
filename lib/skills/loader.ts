/**
 * Skill 加载器
 * 负责从文件系统加载和管理 Skill 文件
 */

import { Skill, SkillSource, PRESET_SKILLS } from '@/types'
import { parseSkillFile, validateSkillFile, ParsedSkill } from './parser'

// 缓存已加载的 Skills
const skillCache = new Map<string, ParsedSkill>()
const skillContentCache = new Map<string, string>()

/**
 * Skill 加载状态
 */
export interface SkillLoadStatus {
  id: string
  metadataLoaded: boolean
  contentLoaded: boolean
  error?: string
}

/**
 * 获取所有可用的 Skill 元数据（轻量级，用于列表展示）
 */
export async function getAllSkillsMetadata(): Promise<Partial<Skill>[]> {
  // 在客户端环境下，返回预设的 skills
  if (typeof window !== 'undefined') {
    return PRESET_SKILLS
  }
  
  // 在服务端，可以从文件系统加载
  try {
    const skills = await loadSkillsFromFileSystem()
    return skills.map(s => ({
      id: s.metadata.name,
      name: s.metadata.name,
      description: s.metadata.description,
      icon: s.metadata.icon,
      category: s.metadata.category,
      inputTypes: s.metadata.inputTypes,
      placeholder: s.metadata.placeholder,
      source: 'official' as SkillSource,
    }))
  } catch {
    // 如果文件系统加载失败，返回预设的 skills
    return PRESET_SKILLS
  }
}

/**
 * 加载单个 Skill 的完整内容
 */
export async function loadSkillContent(skillId: string): Promise<ParsedSkill | null> {
  // 检查缓存
  if (skillCache.has(skillId)) {
    return skillCache.get(skillId)!
  }
  
  try {
    // 从 API 加载
    const response = await fetch(`/api/skills/${skillId}`)
    if (!response.ok) {
      throw new Error(`Failed to load skill: ${skillId}`)
    }
    
    const data = await response.json()
    const parsed = parseSkillFile(data.content)
    
    // 验证
    const validation = validateSkillFile(parsed)
    if (!validation.valid) {
      console.warn(`Skill validation warnings for ${skillId}:`, validation.errors)
    }
    
    // 缓存
    skillCache.set(skillId, parsed)
    
    return parsed
  } catch (error) {
    console.error(`Error loading skill ${skillId}:`, error)
    return null
  }
}

/**
 * 从文件系统加载所有 Skills（仅服务端）
 */
async function loadSkillsFromFileSystem(): Promise<ParsedSkill[]> {
  // 这个函数只在服务端执行
  if (typeof window !== 'undefined') {
    throw new Error('loadSkillsFromFileSystem can only be called on server')
  }
  
  const fs = await import('fs/promises')
  const path = await import('path')
  
  const skillsDir = path.join(process.cwd(), 'skills')
  const skills: ParsedSkill[] = []
  
  try {
    const dirs = await fs.readdir(skillsDir)
    
    for (const dir of dirs) {
      const skillPath = path.join(skillsDir, dir, 'SKILL.md')
      
      try {
        const content = await fs.readFile(skillPath, 'utf-8')
        const parsed = parseSkillFile(content)
        skills.push(parsed)
      } catch {
        // 跳过无法读取的文件
        console.warn(`Skipping invalid skill directory: ${dir}`)
      }
    }
  } catch {
    console.warn('Skills directory not found, using preset skills')
  }
  
  return skills
}

/**
 * 获取 Skill 的系统提示词（用于 AI 对话）
 */
export function buildSystemPrompt(parsed: ParsedSkill): string {
  const { metadata, content } = parsed
  
  // 构建系统提示词
  const systemPrompt = `你是一个专业的 AI 助手，正在执行「${metadata.name}」技能。

## 技能说明
${metadata.description}

## 执行指南
${content}

## 输入方式
支持的输入类型：${metadata.inputTypes.join('、')}
${metadata.placeholder ? `\n提示：${metadata.placeholder}` : ''}

请严格按照上述指南执行任务，保持专业和友好的态度。`

  return systemPrompt
}

/**
 * 预热指定的 Skills（预加载到缓存）
 */
export async function preloadSkills(skillIds: string[]): Promise<SkillLoadStatus[]> {
  const results: SkillLoadStatus[] = []
  
  await Promise.all(
    skillIds.map(async (id) => {
      try {
        const skill = await loadSkillContent(id)
        results.push({
          id,
          metadataLoaded: true,
          contentLoaded: !!skill,
          error: skill ? undefined : 'Failed to load content',
        })
      } catch (error) {
        results.push({
          id,
          metadataLoaded: false,
          contentLoaded: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    })
  )
  
  return results
}

/**
 * 清除 Skill 缓存
 */
export function clearSkillCache(skillId?: string): void {
  if (skillId) {
    skillCache.delete(skillId)
    skillContentCache.delete(skillId)
  } else {
    skillCache.clear()
    skillContentCache.clear()
  }
}

/**
 * 获取缓存状态
 */
export function getCacheStatus(): { cached: string[]; size: number } {
  return {
    cached: Array.from(skillCache.keys()),
    size: skillCache.size,
  }
}

/**
 * 将 ParsedSkill 转换为完整的 Skill 对象
 */
export function toSkill(parsed: ParsedSkill, source: SkillSource = 'official'): Skill {
  const { metadata, content } = parsed
  
  return {
    id: metadata.name,
    name: metadata.name,
    description: metadata.description,
    icon: metadata.icon,
    category: metadata.category,
    inputTypes: metadata.inputTypes,
    placeholder: metadata.placeholder,
    source,
    content,
    metadata,
    isPublic: source === 'official',
    usageCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    version: metadata.version,
    model: metadata.model,
  }
}
