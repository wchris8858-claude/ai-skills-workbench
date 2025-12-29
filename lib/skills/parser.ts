/**
 * Skill 文件解析器
 * 解析 SKILL.md 文件的 YAML frontmatter 和 Markdown 内容
 */

import { SkillMetadata, SkillModelConfig, InputType } from '@/types'

export interface ParsedSkill {
  metadata: SkillMetadata
  content: string
  rawFrontmatter: Record<string, unknown>
}

/**
 * 解析 YAML frontmatter
 */
function parseYamlFrontmatter(yaml: string): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  const lines = yaml.trim().split('\n')
  
  let currentKey = ''
  let currentIndent = 0
  let nestedObject: Record<string, unknown> | null = null
  
  for (const line of lines) {
    // 跳过空行
    if (!line.trim()) continue
    
    // 计算缩进
    const indent = line.search(/\S/)
    const trimmedLine = line.trim()
    
    // 检查是否是键值对
    const colonIndex = trimmedLine.indexOf(':')
    if (colonIndex === -1) continue
    
    const key = trimmedLine.substring(0, colonIndex).trim()
    let value = trimmedLine.substring(colonIndex + 1).trim()
    
    // 处理嵌套对象
    if (indent > currentIndent && currentKey && nestedObject) {
      // 是当前对象的子属性
      if (value === '') {
        // 新的嵌套层级
        const subObject: Record<string, unknown> = {}
        nestedObject[key] = subObject
      } else {
        nestedObject[key] = parseValue(value)
      }
    } else {
      // 顶级属性
      if (value === '') {
        // 开始一个新的嵌套对象
        nestedObject = {}
        result[key] = nestedObject
        currentKey = key
        currentIndent = indent
      } else {
        result[key] = parseValue(value)
        currentKey = key
        currentIndent = indent
        nestedObject = null
      }
    }
  }
  
  return result
}

/**
 * 解析单个值
 */
function parseValue(value: string): unknown {
  // 布尔值
  if (value === 'true') return true
  if (value === 'false') return false
  
  // 数字
  if (/^\d+(\.\d+)?$/.test(value)) {
    return parseFloat(value)
  }
  
  // 数组 [item1, item2]
  if (value.startsWith('[') && value.endsWith(']')) {
    const arrayContent = value.slice(1, -1)
    return arrayContent.split(',').map(item => item.trim())
  }
  
  // 字符串（去除引号）
  if ((value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1)
  }
  
  return value
}

/**
 * 将原始 frontmatter 转换为 SkillMetadata
 */
function toSkillMetadata(raw: Record<string, unknown>): SkillMetadata {
  const inputTypes = (raw.inputTypes as string[] || ['text']).map(t => t as InputType)
  
  // 处理模型配置
  let model: SkillModelConfig | undefined
  if (raw.model && typeof raw.model === 'object') {
    const rawModel = raw.model as Record<string, unknown>
    model = {
      primary: rawModel.primary as string | undefined,
      fallback: rawModel.fallback as string | undefined,
      temperature: rawModel.temperature as number | undefined,
      maxTokens: rawModel.maxTokens as number | undefined,
      stt: rawModel.stt as string | undefined,
    }
    
    // 处理嵌套的 llm 配置
    if (rawModel.llm && typeof rawModel.llm === 'object') {
      const llmConfig = rawModel.llm as Record<string, unknown>
      model.llm = {
        primary: llmConfig.primary as string,
        fallback: llmConfig.fallback as string | undefined,
        temperature: llmConfig.temperature as number | undefined,
        maxTokens: llmConfig.maxTokens as number | undefined,
      }
    }
    
    // 处理嵌套的 image 配置
    if (rawModel.image && typeof rawModel.image === 'object') {
      const imageConfig = rawModel.image as Record<string, unknown>
      model.image = {
        primary: imageConfig.primary as string,
        fallback: imageConfig.fallback as string | undefined,
      }
    }
  }
  
  return {
    name: raw.name as string || '',
    description: raw.description as string || '',
    icon: raw.icon as string || 'Zap',
    category: raw.category as string || '效率工具',
    inputTypes,
    placeholder: raw.placeholder as string | undefined,
    version: raw.version as string | undefined,
    model,
  }
}

/**
 * 解析 SKILL.md 文件内容
 */
export function parseSkillFile(fileContent: string): ParsedSkill {
  // 匹配 frontmatter
  const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/
  const match = fileContent.match(frontmatterRegex)
  
  if (!match) {
    throw new Error('Invalid SKILL.md format: missing frontmatter')
  }
  
  const [, yamlContent, markdownContent] = match
  
  // 解析 YAML
  const rawFrontmatter = parseYamlFrontmatter(yamlContent)
  
  // 转换为 SkillMetadata
  const metadata = toSkillMetadata(rawFrontmatter)
  
  return {
    metadata,
    content: markdownContent.trim(),
    rawFrontmatter,
  }
}

/**
 * 验证 Skill 文件是否符合规范
 */
export function validateSkillFile(parsed: ParsedSkill): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  // 必需字段检查
  if (!parsed.metadata.name) {
    errors.push('Missing required field: name')
  }
  if (!parsed.metadata.description) {
    errors.push('Missing required field: description')
  }
  if (!parsed.metadata.category) {
    errors.push('Missing required field: category')
  }
  if (!parsed.content) {
    errors.push('Missing skill content (markdown body)')
  }
  
  // 输入类型验证
  const validInputTypes: InputType[] = ['text', 'voice', 'image']
  for (const inputType of parsed.metadata.inputTypes) {
    if (!validInputTypes.includes(inputType)) {
      errors.push(`Invalid inputType: ${inputType}`)
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * 从 Skill 内容中提取指定部分
 */
export function extractSection(content: string, sectionTitle: string): string | null {
  // 匹配 ## sectionTitle 或 ### sectionTitle
  const regex = new RegExp(`^##?#?\\s*${sectionTitle}\\s*\n([\\s\\S]*?)(?=^##|$)`, 'im')
  const match = content.match(regex)
  
  return match ? match[1].trim() : null
}

/**
 * 获取 Skill 的核心指令（第一个 section 之前的内容）
 */
export function getCoreInstructions(content: string): string {
  // 获取第一个 ## 之前的内容
  const firstSectionIndex = content.indexOf('\n## ')
  if (firstSectionIndex === -1) {
    return content
  }
  
  // 去掉开头的 # 标题行
  const withoutTitle = content.replace(/^#[^#].*\n/, '')
  const sectionIndex = withoutTitle.indexOf('\n## ')
  
  return sectionIndex === -1 ? withoutTitle : withoutTitle.substring(0, sectionIndex).trim()
}
