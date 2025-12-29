/**
 * Google Gemini 客户端
 *
 * 用于计划制定、创意头脑风暴等需要发散思维的任务
 */

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || ''
const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta'

// 检查是否配置
export const isGeminiConfigured = Boolean(GOOGLE_API_KEY)

// Gemini 消息格式
interface GeminiMessage {
  role: 'user' | 'model'
  parts: Array<{ text: string }>
}

// Gemini 请求参数
interface GeminiRequest {
  model?: string
  messages: Array<{ role: 'user' | 'assistant'; content: string }>
  systemPrompt?: string
  temperature?: number
  maxTokens?: number
}

// Gemini 响应
interface GeminiResponse {
  success: boolean
  content: string
  error?: string
}

/**
 * 调用 Gemini API 生成内容
 */
export async function generateWithGemini(
  request: GeminiRequest
): Promise<GeminiResponse> {
  if (!isGeminiConfigured) {
    return {
      success: false,
      content: '',
      error: 'Gemini API 未配置，请设置 GOOGLE_API_KEY 环境变量',
    }
  }

  const {
    model = 'gemini-2.0-flash-exp',
    messages,
    systemPrompt,
    temperature = 0.7,
    maxTokens = 8192,
  } = request

  try {
    // 转换消息格式
    const geminiMessages: GeminiMessage[] = messages.map((msg) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }))

    // 如果有系统提示，添加到第一条消息前
    if (systemPrompt && geminiMessages.length > 0) {
      geminiMessages[0].parts[0].text = `${systemPrompt}\n\n${geminiMessages[0].parts[0].text}`
    }

    const response = await fetch(
      `${GEMINI_API_BASE}/models/${model}:generateContent?key=${GOOGLE_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: geminiMessages,
          generationConfig: {
            temperature,
            maxOutputTokens: maxTokens,
            topP: 0.95,
            topK: 40,
          },
          safetySettings: [
            {
              category: 'HARM_CATEGORY_HARASSMENT',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE',
            },
            {
              category: 'HARM_CATEGORY_HATE_SPEECH',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE',
            },
            {
              category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE',
            },
            {
              category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE',
            },
          ],
        }),
      }
    )

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error?.message || `HTTP ${response.status}`)
    }

    const data = await response.json()

    // 提取生成的内容
    const content =
      data.candidates?.[0]?.content?.parts?.[0]?.text || ''

    return {
      success: true,
      content,
    }
  } catch (error) {
    console.error('Gemini API error:', error)
    return {
      success: false,
      content: '',
      error: error instanceof Error ? error.message : 'Gemini 调用失败',
    }
  }
}

/**
 * 使用 Gemini 进行计划制定
 */
export async function makePlanWithGemini(
  topic: string,
  context?: string
): Promise<GeminiResponse> {
  const systemPrompt = `你是一个专业的规划专家，擅长制定清晰、可执行的计划。

规划原则：
- 目标明确，步骤清晰
- 考虑可行性和资源限制
- 预留弹性空间
- 设置关键节点和检查点
- 提供可量化的成功标准

输出格式：
1. 目标概述
2. 分阶段计划
3. 关键里程碑
4. 风险预案
5. 资源需求`

  return generateWithGemini({
    model: 'gemini-2.0-flash-exp',
    messages: [
      {
        role: 'user',
        content: context ? `背景：${context}\n\n请帮我制定关于「${topic}」的计划` : `请帮我制定关于「${topic}」的计划`,
      },
    ],
    systemPrompt,
    temperature: 0.7,
  })
}

/**
 * 使用 Gemini 进行头脑风暴
 */
export async function brainstormWithGemini(
  topic: string,
  constraints?: string
): Promise<GeminiResponse> {
  const systemPrompt = `你是一个创意专家，擅长发散思维和头脑风暴。

头脑风暴原则：
- 数量优先，不要过早评判
- 鼓励跨界联想和创新组合
- 从不同角度和维度思考
- 包含常规和非常规的想法
- 每个想法都值得被记录

输出格式：
- 按类别分组展示想法
- 每个想法附带简短说明
- 标记出最有潜力的 3-5 个想法
- 提供进一步探索的方向`

  return generateWithGemini({
    model: 'gemini-1.5-pro',
    messages: [
      {
        role: 'user',
        content: constraints
          ? `主题：${topic}\n限制条件：${constraints}\n\n请进行头脑风暴`
          : `主题：${topic}\n\n请进行头脑风暴`,
      },
    ],
    systemPrompt,
    temperature: 0.9, // 高温度以获得更多创意
  })
}

/**
 * 使用 Gemini 分析长文档
 */
export async function analyzeDocumentWithGemini(
  document: string,
  analysisType: 'summary' | 'structure' | 'insights' = 'summary'
): Promise<GeminiResponse> {
  const prompts = {
    summary: '请对以下文档进行总结，提取关键信息和主要观点：',
    structure: '请分析以下文档的结构和逻辑框架：',
    insights: '请从以下文档中提取洞察和有价值的发现：',
  }

  return generateWithGemini({
    model: 'gemini-1.5-pro', // 使用 Pro 版本处理长文档
    messages: [
      {
        role: 'user',
        content: `${prompts[analysisType]}\n\n${document}`,
      },
    ],
    temperature: 0.3, // 低温度保持分析客观
  })
}
