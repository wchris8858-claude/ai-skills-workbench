import { NextRequest, NextResponse } from 'next/server'
import { callByteDance } from '@/lib/ai/bytedance'
import { withErrorHandler } from '@/lib/middleware/error-handler'
import { createError } from '@/lib/errors'

async function handler(request: NextRequest) {
  const formData = await request.formData()
  const imageFile = formData.get('image') as File

  if (!imageFile) {
    throw createError.validation('未找到图片文件')
  }

    // Determine media type
    const mediaType = imageFile.type

    // Convert image to base64 (for multimodal request)
    const bytes = await imageFile.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64Image = buffer.toString('base64')
    const imageDataUrl = `data:${mediaType};base64,${base64Image}`

    // Analyze image with ByteDance (豆包)
    const analysisPrompt = `请分析这张照片的质量，并以 JSON 格式返回分析结果。

要求：
1. 评分标准（0-100分）：
   - sharpness: 清晰度（对焦是否准确、细节是否清晰）
   - exposure: 曝光度（亮度是否合适、是否过曝或欠曝）
   - composition: 构图（布局是否合理、主体是否突出）
   - color: 色彩（色彩是否饱满、白平衡是否准确）

2. 综合评分 score = (sharpness + exposure + composition + color) / 4

3. 识别问题（issues）：列出所有明显的质量问题
4. 提供建议（suggestions）：针对每个问题提供修图建议
5. 标签（tags）：描述照片内容的关键词（3-5个）

返回格式：
{
  "score": 85.5,
  "quality": {
    "sharpness": 90,
    "exposure": 85,
    "composition": 80,
    "color": 87
  },
  "issues": ["轻微过曝", "构图偏左"],
  "suggestions": ["降低高光", "裁剪画面向右移动主体"],
  "tags": ["人像", "室内", "自然光"]
}

只返回 JSON，不要其他说明文字。

图片信息：
- 文件名：${imageFile.name}
- 类型：${mediaType}
- 大小：${(imageFile.size / 1024).toFixed(2)} KB`

    // Call ByteDance API with image analysis (multimodal)
    const model = process.env.BYTEDANCE_VISION_MODEL || 'doubao-pro-32k'

    let responseText: string
    try {
      responseText = await callByteDance({
        model,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: analysisPrompt },
              { type: 'image_url', image_url: { url: imageDataUrl } },
            ],
          },
        ],
        temperature: 0.3,
        max_tokens: 2048,
      })
    } catch (_error) {
      // Fallback to text-only analysis if the model/endpoint doesn't support images
      responseText = await callByteDance({
        model,
        messages: [
          {
            role: 'user',
            content: analysisPrompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 2048,
      })
    }

    // Extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('No JSON found in response')
    }

    const analysis = JSON.parse(jsonMatch[0])

    return NextResponse.json(analysis)
}

export const POST = withErrorHandler(handler)
