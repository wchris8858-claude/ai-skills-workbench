/**
 * API 输入验证 Schema
 * 使用 Zod 进行类型安全的输入验证
 */

import { z } from 'zod'

// 聊天 API 验证
export const MessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1).max(50000),
})

export const ChatRequestSchema = z.object({
  skillId: z.string().min(1).max(100),
  messages: z.array(MessageSchema).min(1).max(100),
  model: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().min(1).max(100000).optional(),
})

export type ChatRequest = z.infer<typeof ChatRequestSchema>

// 技能 API 验证
export const SkillIdSchema = z.string()
  .min(1)
  .max(100)
  .regex(/^[a-zA-Z0-9_-]+$/)

export const CreateSkillSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().min(1).max(1000),
  icon: z.string().max(50).optional(),
  category: z.string().min(1).max(50),
  content: z.string().min(1).max(100000),
  inputTypes: z.array(z.enum(['text', 'voice', 'image'])).min(1),
  placeholder: z.string().max(500).optional(),
  isPublic: z.boolean().optional().default(false),
})

export type CreateSkillRequest = z.infer<typeof CreateSkillSchema>

// 验证辅助函数
export function validateBody<T extends z.ZodSchema>(
  schema: T,
  data: unknown
): { success: true; data: z.infer<T> } | { success: false; error: string } {
  const result = schema.safeParse(data)
  if (!result.success) {
    const firstError = result.error.issues[0]
    return { success: false, error: firstError?.message || '验证失败' }
  }
  return { success: true, data: result.data }
}

export function validationErrorResponse(error: string): Response {
  return new Response(JSON.stringify({ error, code: 'VALIDATION_ERROR' }), {
    status: 400,
    headers: { 'Content-Type': 'application/json' },
  })
}
