/**
 * 技能数据库操作
 * 使用 Service Role Key 绕过 RLS，支持自定义认证系统
 */

import { getSupabaseAdmin } from '@/lib/supabase'
import { DbSkill } from './index'
import { Skill, SkillSource } from '@/types'

// 获取 Supabase 客户端（使用 Service Role Key）
const getDb = () => getSupabaseAdmin()

// 将数据库记录转换为前端类型
function dbSkillToSkill(dbSkill: DbSkill): Skill {
  return {
    id: dbSkill.id,
    name: dbSkill.name,
    description: dbSkill.description,
    icon: dbSkill.icon,
    category: dbSkill.category,
    inputTypes: dbSkill.input_types as Skill['inputTypes'],
    placeholder: dbSkill.placeholder || undefined,
    source: dbSkill.source,
    ownerId: dbSkill.owner_id || undefined,
    content: dbSkill.content,
    metadata: {
      name: dbSkill.name,
      description: dbSkill.description,
      icon: dbSkill.icon,
      category: dbSkill.category,
      inputTypes: dbSkill.input_types as Skill['inputTypes'],
      placeholder: dbSkill.placeholder || undefined,
    },
    isPublic: dbSkill.is_public,
    usageCount: dbSkill.usage_count,
    rating: dbSkill.rating || undefined,
    createdAt: new Date(dbSkill.created_at),
    updatedAt: new Date(dbSkill.updated_at),
  }
}

/**
 * 获取所有官方技能
 */
export async function getOfficialSkills(): Promise<Skill[]> {
  const { data, error } = await getDb()
    .from('skills')
    .select('*')
    .eq('source', 'official')
    .order('usage_count', { ascending: false })

  if (error) {
    console.error('Error fetching official skills:', error)
    return []
  }

  return (data || []).map(dbSkillToSkill)
}

/**
 * 获取所有公开技能（官方 + 社区）
 */
export async function getPublicSkills(): Promise<Skill[]> {
  const { data, error } = await getDb()
    .from('skills')
    .select('*')
    .or('source.eq.official,is_public.eq.true')
    .order('usage_count', { ascending: false })

  if (error) {
    console.error('Error fetching public skills:', error)
    return []
  }

  return (data || []).map(dbSkillToSkill)
}

/**
 * 获取用户的自定义技能
 */
export async function getUserSkills(userId: string): Promise<Skill[]> {
  const { data, error } = await getDb()
    .from('skills')
    .select('*')
    .eq('owner_id', userId)
    .eq('source', 'custom')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching user skills:', error)
    return []
  }

  return (data || []).map(dbSkillToSkill)
}

/**
 * 根据 ID 获取技能
 */
export async function getSkillById(skillId: string): Promise<Skill | null> {
  const { data, error } = await getDb()
    .from('skills')
    .select('*')
    .eq('id', skillId)
    .single()

  if (error) {
    console.error('Error fetching skill:', error)
    return null
  }

  return data ? dbSkillToSkill(data) : null
}

/**
 * 根据分类获取技能
 */
export async function getSkillsByCategory(category: string): Promise<Skill[]> {
  const { data, error } = await getDb()
    .from('skills')
    .select('*')
    .eq('category', category)
    .or('source.eq.official,is_public.eq.true')
    .order('usage_count', { ascending: false })

  if (error) {
    console.error('Error fetching skills by category:', error)
    return []
  }

  return (data || []).map(dbSkillToSkill)
}

/**
 * 搜索技能
 */
export async function searchSkills(query: string): Promise<Skill[]> {
  const { data, error } = await getDb()
    .from('skills')
    .select('*')
    .or('source.eq.official,is_public.eq.true')
    .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
    .order('usage_count', { ascending: false })
    .limit(20)

  if (error) {
    console.error('Error searching skills:', error)
    return []
  }

  return (data || []).map(dbSkillToSkill)
}

// 技能字段验证常量
const SKILL_VALIDATION = {
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 100,
  DESCRIPTION_MIN_LENGTH: 10,
  DESCRIPTION_MAX_LENGTH: 500,
  CONTENT_MIN_LENGTH: 10,
  CONTENT_MAX_LENGTH: 50000,
}

/**
 * 验证技能字段
 */
export function validateSkillFields(skill: {
  name?: string
  description?: string
  content?: string
}): { valid: boolean; error?: string } {
  if (skill.name !== undefined) {
    if (skill.name.length < SKILL_VALIDATION.NAME_MIN_LENGTH) {
      return { valid: false, error: `技能名称至少 ${SKILL_VALIDATION.NAME_MIN_LENGTH} 个字符` }
    }
    if (skill.name.length > SKILL_VALIDATION.NAME_MAX_LENGTH) {
      return { valid: false, error: `技能名称最多 ${SKILL_VALIDATION.NAME_MAX_LENGTH} 个字符` }
    }
  }

  if (skill.description !== undefined) {
    if (skill.description.length < SKILL_VALIDATION.DESCRIPTION_MIN_LENGTH) {
      return { valid: false, error: `技能描述至少 ${SKILL_VALIDATION.DESCRIPTION_MIN_LENGTH} 个字符` }
    }
    if (skill.description.length > SKILL_VALIDATION.DESCRIPTION_MAX_LENGTH) {
      return { valid: false, error: `技能描述最多 ${SKILL_VALIDATION.DESCRIPTION_MAX_LENGTH} 个字符` }
    }
  }

  if (skill.content !== undefined) {
    if (skill.content.length < SKILL_VALIDATION.CONTENT_MIN_LENGTH) {
      return { valid: false, error: `技能内容（System Prompt）至少 ${SKILL_VALIDATION.CONTENT_MIN_LENGTH} 个字符` }
    }
    if (skill.content.length > SKILL_VALIDATION.CONTENT_MAX_LENGTH) {
      return { valid: false, error: `技能内容（System Prompt）最多 ${SKILL_VALIDATION.CONTENT_MAX_LENGTH} 个字符` }
    }
  }

  return { valid: true }
}

/**
 * 创建新技能
 */
export async function createSkill(
  skill: Omit<Skill, 'id' | 'createdAt' | 'updatedAt' | 'usageCount' | 'rating'>
): Promise<Skill | null> {
  // 验证必填字段
  const validation = validateSkillFields({
    name: skill.name,
    description: skill.description,
    content: skill.content,
  })
  if (!validation.valid) {
    console.error('Skill validation failed:', validation.error)
    throw new Error(validation.error)
  }

  const { data, error } = await getDb()
    .from('skills')
    .insert({
      name: skill.name,
      description: skill.description,
      icon: skill.icon,
      category: skill.category,
      input_types: skill.inputTypes,
      placeholder: skill.placeholder || null,
      source: skill.source,
      owner_id: skill.ownerId || null,
      content: skill.content,
      metadata: skill.metadata || null,
      is_public: skill.isPublic,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating skill:', error)
    return null
  }

  return data ? dbSkillToSkill(data) : null
}

/**
 * 更新技能
 */
export async function updateSkill(
  skillId: string,
  updates: Partial<Omit<Skill, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<Skill | null> {
  // 验证更新的字段
  const validation = validateSkillFields({
    name: updates.name,
    description: updates.description,
    content: updates.content,
  })
  if (!validation.valid) {
    console.error('Skill validation failed:', validation.error)
    throw new Error(validation.error)
  }

  const updateData: Record<string, any> = {
    updated_at: new Date().toISOString(),
  }

  if (updates.name !== undefined) updateData.name = updates.name
  if (updates.description !== undefined) updateData.description = updates.description
  if (updates.icon !== undefined) updateData.icon = updates.icon
  if (updates.category !== undefined) updateData.category = updates.category
  if (updates.inputTypes !== undefined) updateData.input_types = updates.inputTypes
  if (updates.placeholder !== undefined) updateData.placeholder = updates.placeholder
  if (updates.content !== undefined) updateData.content = updates.content
  if (updates.metadata !== undefined) updateData.metadata = updates.metadata
  if (updates.isPublic !== undefined) updateData.is_public = updates.isPublic

  const { data, error } = await getDb()
    .from('skills')
    .update(updateData)
    .eq('id', skillId)
    .select()
    .single()

  if (error) {
    console.error('Error updating skill:', error)
    return null
  }

  return data ? dbSkillToSkill(data) : null
}

/**
 * 删除技能
 */
export async function deleteSkill(skillId: string): Promise<boolean> {
  const { error } = await getDb()
    .from('skills')
    .delete()
    .eq('id', skillId)

  if (error) {
    console.error('Error deleting skill:', error)
    return false
  }

  return true
}

/**
 * 增加技能使用次数
 */
export async function incrementSkillUsage(skillId: string): Promise<void> {
  const { error } = await getDb().rpc('increment_skill_usage', {
    skill_id: skillId,
  })

  // 如果 RPC 不存在，使用普通更新
  if (error) {
    const { data: skill } = await getDb()
      .from('skills')
      .select('usage_count')
      .eq('id', skillId)
      .single()

    if (skill) {
      await getDb()
        .from('skills')
        .update({ usage_count: (skill.usage_count || 0) + 1 })
        .eq('id', skillId)
    }
  }
}

/**
 * 复制技能（Fork）
 */
export async function forkSkill(
  skillId: string,
  userId: string
): Promise<Skill | null> {
  // 获取原技能
  const originalSkill = await getSkillById(skillId)
  if (!originalSkill) return null

  // 创建副本
  const forkedSkill = await createSkill({
    ...originalSkill,
    name: `${originalSkill.name} (副本)`,
    source: 'custom',
    ownerId: userId,
    isPublic: false,
    metadata: originalSkill.metadata,
  })

  return forkedSkill
}

/**
 * 获取热门技能
 */
export async function getPopularSkills(limit: number = 10): Promise<Skill[]> {
  const { data, error } = await getDb()
    .from('skills')
    .select('*')
    .or('source.eq.official,is_public.eq.true')
    .order('usage_count', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching popular skills:', error)
    return []
  }

  return (data || []).map(dbSkillToSkill)
}

/**
 * 获取最近使用的技能
 */
export async function getRecentlyUsedSkills(
  userId: string,
  limit: number = 10
): Promise<Skill[]> {
  const { data, error } = await getDb()
    .from('usage_stats')
    .select('skill_id, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error || !data || data.length === 0) {
    return []
  }

  // 获取唯一的技能 ID
  const skillIds = Array.from(new Set(data.map((d) => d.skill_id)))

  const { data: skills, error: skillsError } = await getDb()
    .from('skills')
    .select('*')
    .in('id', skillIds)

  if (skillsError) {
    console.error('Error fetching recently used skills:', skillsError)
    return []
  }

  return (skills || []).map(dbSkillToSkill)
}
