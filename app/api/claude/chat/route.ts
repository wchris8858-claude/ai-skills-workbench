import { NextRequest, NextResponse } from 'next/server'
import { dispatchAI } from '@/lib/ai/dispatcher'
import { getSkillSystemPrompt } from '@/lib/claude/client'
import { logger } from '@/lib/logger'
import { withErrorHandler } from '@/lib/middleware/error-handler'
import { createError } from '@/lib/errors'
import { Message } from '@/types'

type Attachment = NonNullable<Message['attachments']>[number]

async function handler(req: NextRequest) {
  let skillId: string = ''
  let message: string = ''
  let attachments: Attachment[] = []

  try {
    const body = await req.json()
    skillId = body.skillId
    message = body.message
    // 支持 images 和 attachments 两个字段名
    attachments = body.attachments || body.images || []

    // 如果是图片URL数组,转换为attachments格式
    if (Array.isArray(attachments) && attachments.length > 0 && typeof attachments[0] === 'string') {
      attachments = (attachments as unknown as string[]).map((url): Attachment => ({
        type: 'image',
        url: url
      }))
    }

    logger.api.request('POST', '/api/claude/chat', { skillId, messageLength: message.length, attachmentsCount: attachments.length })

    if (!skillId || !message) {
      throw createError.validation('Missing required fields: skillId and message are required')
    }

    // Get system prompt for the skill
    const systemPrompt = getSkillSystemPrompt(skillId)

    // Dispatch to appropriate AI model based on skill configuration
    const response = await dispatchAI({
      skillId,
      message,
      systemPrompt,
      attachments,
    })

    return NextResponse.json({
      content: response.content,
      model: response.model,
      provider: response.provider,
      tokenCount: response.tokenCount,
    })
  } catch (error) {
    logger.api.error('POST', '/api/claude/chat', error)

    // 检查是否是 API 配置/密钥相关的错误
    const errorMessage = error instanceof Error ? error.message.toLowerCase() : ''
    const isConfigError =
      errorMessage.includes('api key') ||
      errorMessage.includes('api_key') ||
      errorMessage.includes('not configured') ||
      errorMessage.includes('401') ||
      errorMessage.includes('unauthorized') ||
      errorMessage.includes('invalid_api_key')

    if (isConfigError) {
      logger.warn('API未配置或密钥错误,返回模拟响应', { skillId, error: errorMessage })
    } else {
      logger.warn('API调用失败,返回模拟响应', { skillId, error: errorMessage })
    }

    // 无论什么错误，都返回模拟响应以提供更好的用户体验
    // 但明确标识这是模拟响应，让用户知晓
    return NextResponse.json({
      content: getMockResponse(skillId, message, attachments),
      isMock: true,
      mockReason: isConfigError ? 'API 未配置' : 'API 调用失败',
    })
  }
}

// Mock responses for demo when API key is not configured
function getMockResponse(skillId: string, message: string, attachments: Attachment[] = []): string {
  const mockResponses: Record<string, string> = {
    'moments-copywriter': `---方案1---
生活中的小确幸，往往藏在最平凡的瞬间里 ✨

${message.slice(0, 30)}... 今天的你，是否也遇到了让心情明亮的小事呢？

#生活记录 #美好瞬间 💫

---方案2---
记录当下 📸

${message.slice(0, 40)}...

有些美好，值得被珍藏。你呢，今天过得怎么样？

---方案3---
平凡的日子里，总有不平凡的惊喜 🌟

${message.slice(0, 35)}... 分享给你们～

#日常vlog #心情记录`,

    'video-rewriter': `📝 改写后的视频文案：

【精华版】
${message.slice(0, 50)}...

这个版本去除了敏感内容，优化了表达方式，更适合在社交平台发布。

关键亮点：
• 核心信息保留完整
• 语言更加流畅自然
• 符合平台发布规范`,

    'viral-analyzer': `🔥 爆款内容分析报告：

**标题吸引力**：85分
运用了好奇心驱动和情感共鸣

**内容结构**：
1. 开头：设置悬念，快速抓住注意力
2. 发展：层层递进，保持阅读节奏
3. 高潮：情感爆发点，引发共鸣
4. 结尾：留白思考，促进互动

**可复用元素**：
- 故事化叙述手法
- 情感递进节奏
- 互动式结尾设计

建议：可以加强视觉元素的运用，提升整体传播力`,

    'meeting-transcriber': `📋 会议纪要

**会议主题**：${message.slice(0, 30)}...
**时间**：${new Date().toLocaleDateString('zh-CN')}

**主要议题**：
1. 讨论了项目进展情况
2. 确定了下一步工作计划
3. 分配了具体任务

**决议事项**：
• 需要在本周内完成方案初稿
• 下周二进行评审

**行动计划**：
- 张三：负责方案撰写
- 李四：准备相关数据
- 王五：协调资源

**下次会议**：待定`,

    'knowledge-query': `💡 为您查询到以下信息：

关于"${message.slice(0, 20)}"的解答：

这是一个很好的问题。根据相关资料，我可以为您提供以下信息：

1. **基本概念**：这涉及到一个重要的知识点...

2. **实际应用**：在日常生活中，这个概念可以...

3. **扩展知识**：如果您想深入了解，还可以关注...

希望这个回答对您有帮助！如有其他问题，欢迎继续提问。`,

    'official-notice': `📢 正式通知

**关于${message.slice(0, 20)}的通知**

各位同事：

根据相关要求，现就有关事项通知如下：

一、实施时间
自发布之日起正式实施。

二、具体要求
1. 请各部门认真学习相关内容
2. 严格按照规定执行
3. 做好相关记录和反馈

三、注意事项
如有疑问，请及时与相关部门联系。

特此通知。

${new Date().toLocaleDateString('zh-CN')}`,

    'poster-creator': `🎨 海报设计方案

**设计主题**：${message.slice(0, 20)}

**视觉风格**：
- 现代简约风格
- 主色调：#FF6B6B（珊瑚红）+ #4ECDC4（青绿色）
- 辅助色：白色、深灰色

**版面布局**：
- 上部1/3：主标题区域
- 中部：核心视觉元素
- 下部：信息说明区

**文案建议**：
主标题：简洁有力，不超过8个字
副标题：补充说明，营造氛围

**AI绘图提示词**：
"minimalist poster design, coral and teal color scheme, modern typography, clean layout, professional look"

这个设计方案简洁大方，视觉冲击力强，适合各类推广场景。`,

    'photo-selector': `📸 专业选片分析报告

${attachments.length > 0 ? `已收到 ${attachments.length} 张照片，正在为您分析...` : '请上传照片后，我将为您提供专业的选片和修图建议。'}

${attachments.length > 0 ? `
---

## 照片 1 分析

**综合评分**: 8.5/10 ⭐

**优点**：
- ✅ 构图平衡，主体突出，视觉引导清晰
- ✅ 光线柔和自然，明暗过渡流畅
- ✅ 色彩和谐，饱和度适中
- ✅ 焦点清晰，画面锐度良好

**不足**：
- ⚠️ 背景略显杂乱，可能分散注意力
- ⚠️ 对比度可以适当提升

**修图建议**：
1. **构图优化**: 适当裁剪，移除边缘杂乱元素，突出主体
2. **色调调整**:
   - 提升整体对比度 +15
   - 稍微增加饱和度 +10
   - 调整色温至 5200K，使画面更温暖
3. **光影处理**:
   - 提亮暗部 +20
   - 压低高光 -10
   - 增加清晰度 +25
4. **细节优化**:
   - 锐化主体 +30
   - 降低背景噪点
   - 适当添加暗角，聚焦视线

**推荐用途**: 社交媒体分享、个人作品集

---

${attachments.length > 1 ? `
## 照片 2 分析

**综合评分**: 7.5/10 ⭐

**优点**：
- ✅ 视角独特，创意性强
- ✅ 情感表达到位

**不足**：
- ⚠️ 曝光略微不足
- ⚠️ 构图可以更紧凑

**修图建议**：
1. 提升曝光 +0.5EV
2. 调整构图裁剪
3. 增强色彩层次

---
` : ''}

## 总体建议

**最佳照片**: 照片 1 (评分: 8.5/10)

该照片在构图、光影、色彩等方面都表现优秀，经过上述修图优化后，将是一张非常出色的作品。

**修图软件推荐**:
- Lightroom: 专业色调调整
- Photoshop: 细节处理
- VSCO: 快速滤镜应用

祝您修出满意的照片！📷✨
` : '请上传 1-5 张照片，我将为您提供：\n\n1. 每张照片的专业评分（1-10分）\n2. 详细的优缺点分析\n3. 具体的修图建议\n4. 最佳照片推荐\n\n点击上方图片按钮开始上传 📸'}
`
  }

  return mockResponses[skillId] || `感谢您的输入："${message.slice(0, 50)}"。\n\n这是一个模拟响应，实际使用时需要配置 Anthropic API Key。\n\n您可以在 .env.local 文件中设置 ANTHROPIC_API_KEY 环境变量来启用真实的 AI 响应。`
}

// 使用错误处理中间件包装
export const POST = withErrorHandler(handler)