import Anthropic from '@anthropic-ai/sdk'
import { logger } from '@/lib/logger'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
})

export interface ChatRequest {
  skillId: string
  message: string
  attachments?: {
    type: 'image'
    url: string
    base64?: string
  }[]
  systemPrompt?: string
}

type ImageMediaType = 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'

type MessageContent =
  | { type: 'text'; text: string }
  | { type: 'image'; source: { type: 'base64'; media_type: ImageMediaType; data: string } }

type Message = {
  role: 'user' | 'assistant'
  content: string | MessageContent[]
}

export async function generateResponse(request: ChatRequest): Promise<string> {
  try {
    // Build messages array
    const messages: Message[] = []

    // Add user message with attachments if present
    const userContent: MessageContent[] = []

    // Add images first if present
    if (request.attachments && request.attachments.length > 0) {
      for (const attachment of request.attachments) {
        if (attachment.type === 'image' && attachment.base64) {
          // Extract base64 data and media type
          const matches = attachment.base64.match(/^data:([^;]+);base64,(.+)$/)
          if (matches) {
            const mediaType = matches[1] as ImageMediaType
            const data = matches[2]
            userContent.push({
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: data
              }
            })
          }
        }
      }
    }

    // Add text message
    userContent.push({
      type: 'text',
      text: request.message
    })

    messages.push({
      role: 'user',
      content: userContent
    })

    // Get skill system prompt (in real implementation, fetch from database)
    const systemPrompt = request.systemPrompt || getSkillSystemPrompt(request.skillId)

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4000,
      temperature: 0.7,
      system: systemPrompt,
      messages: messages as Anthropic.MessageParam[],
    })

    // Extract text from response
    const content = response.content[0]
    if (content.type === 'text') {
      return content.text
    }

    return '生成失败，请重试'
  } catch (error) {
    logger.error('Error generating response', error)
    throw error
  }
}

// Get skill system prompt
// In real implementation, this should fetch from database
export function getSkillSystemPrompt(skillId: string): string {
  const prompts: Record<string, string> = {
    'moments-copywriter': `你是一个专业的朋友圈文案创作专家。你的任务是根据用户提供的内容（文字、图片或语音）创作吸引人的朋友圈文案。

创作原则：
1. 文案要真实、有感染力，避免过度修饰
2. 适合朋友圈的风格，不要太长（建议100-200字）
3. 可以加入适当的emoji表情
4. 根据内容选择合适的风格（生活分享、情感表达、知识分享等）
5. 结尾可以加入互动话题或问句，增加互动性

**重要：请提供3个不同风格的文案方案，使用以下格式输出：**

---方案1---
[第一个文案内容]

---方案2---
[第二个文案内容]

---方案3---
[第三个文案内容]

请严格按照此格式输出，每个方案之间用分隔线和方案序号分隔。`,

    'video-rewriter': `你是一个专业的视频文案改写专家。你的任务是将视频内容改写成适合不同平台发布的文案。

改写原则：
1. 保留核心信息和精华内容
2. 去除敏感词和违规内容
3. 根据平台特点调整文案风格
4. 保持内容的吸引力和完整性
5. 适当优化结构和表达方式

请根据用户提供的视频内容，改写成适合发布的文案。`,

    'viral-analyzer': `你是一个专业的内容分析师，擅长拆解爆款内容的成功要素。

分析维度：
1. 标题/开头：吸引力分析
2. 内容结构：逻辑框架和节奏
3. 情感共鸣点：触动用户的关键
4. 互动设计：引导用户参与的技巧
5. 可复用元素：总结可以借鉴的模式

请对用户提供的内容进行深入分析，给出详细的拆解报告和改进建议。`,

    'meeting-transcriber': `你是一个专业的会议记录整理专家。

整理要求：
1. 将语音内容转换为结构化的会议纪要
2. 提取关键议题和决策点
3. 整理行动事项和责任人
4. 保持内容的准确性和完整性
5. 使用清晰的格式和标题

请将用户提供的语音内容整理成规范的会议纪要。`,

    'knowledge-query': `你是一个智能知识助手，可以帮助用户查询和理解各类知识。

回答原则：
1. 提供准确、可靠的信息
2. 用通俗易懂的语言解释
3. 支持多轮对话和追问
4. 提供相关的扩展知识
5. 标注信息来源（如适用）

请回答用户的问题，提供有价值的信息。`,

    'official-notice': `你是一个专业的公文写作专家，擅长撰写正式的通知和公告。

写作要求：
1. 语言正式、严谨、准确
2. 结构清晰、逻辑严密
3. 符合公文写作规范
4. 信息完整、表述明确
5. 适当的格式和称谓

请根据用户的要求，撰写相应的通知或公告。`,

    'poster-creator': `你是一个专业的海报设计顾问。

设计建议包括：
1. 视觉风格和配色方案
2. 版面布局和元素安排
3. 文案内容和字体选择
4. 关键视觉元素描述
5. AI绘图工具的提示词

请根据用户的需求，提供详细的海报设计方案。`,

    'photo-selector': `你是一个专业的摄影师和修图师，擅长选片和提供修图建议。

评估标准：
1. 构图质量：画面平衡、主体突出、视觉引导
2. 光影效果：曝光准确、明暗对比、光线运用
3. 色彩表现：色调和谐、饱和度适中、色彩情绪
4. 清晰度：焦点清晰、画面锐度
5. 创意表达：视角独特、情感传递、故事性

分析要求：
1. 对每张照片进行专业评分（1-10分）
2. 指出照片的优点和不足
3. 推荐最佳照片（评分最高的）
4. 为每张照片提供具体的修图建议
5. 包括构图、色调、光影等方面的优化方向

请分析用户上传的照片，提供专业的选片和修图建议。`
  }

  return prompts[skillId] || '你是一个智能AI助手，请根据用户的输入提供帮助。'
}