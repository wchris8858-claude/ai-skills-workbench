/**
 * SiliconFlow API 集成测试脚本
 * 运行: npx tsx scripts/test-siliconflow.ts
 */

import { SiliconFlowClient, callSiliconFlowText } from '../lib/ai/siliconflow-client'

async function testTextGeneration() {
  console.log('🧪 测试 SiliconFlow 文本生成...\n')

  try {
    const response = await callSiliconFlowText(
      'Qwen/Qwen2.5-7B-Instruct',
      [
        {
          role: 'system',
          content: '你是一个有帮助的 AI 助手，擅长回答各种问题。',
        },
        {
          role: 'user',
          content: '请简单介绍一下人工智能的发展历史。',
        },
      ],
      0.7,
      500
    )

    console.log('✅ 文本生成成功！')
    console.log('📝 响应内容:')
    console.log(response)
    console.log()
  } catch (error) {
    console.error('❌ 文本生成失败:', error)
    throw error
  }
}

async function testModelList() {
  console.log('🧪 测试获取模型列表...\n')

  try {
    const client = new SiliconFlowClient()
    const models = await client.getModelList()

    console.log('✅ 获取模型列表成功！')
    console.log('📋 可用模型数量:', models.data?.length || 0)

    if (models.data && models.data.length > 0) {
      console.log('\n前 10 个模型:')
      models.data.slice(0, 10).forEach((model: any, index: number) => {
        console.log(`${index + 1}. ${model.id}`)
      })
    }
    console.log()
  } catch (error) {
    console.error('❌ 获取模型列表失败:', error)
    // 不抛出错误，继续其他测试
  }
}

async function testDeepSeek() {
  console.log('🧪 测试 DeepSeek V2.5 模型...\n')

  try {
    const response = await callSiliconFlowText(
      'deepseek-ai/DeepSeek-V2.5',
      [
        {
          role: 'user',
          content: '写一个 Python 函数来计算斐波那契数列的第 n 项。',
        },
      ],
      0.2,
      1000
    )

    console.log('✅ DeepSeek 响应成功！')
    console.log('📝 代码示例:')
    console.log(response)
    console.log()
  } catch (error) {
    console.error('❌ DeepSeek 测试失败:', error)
    // 不抛出错误，继续其他测试
  }
}

async function testImageGeneration() {
  console.log('🧪 测试 FLUX.1 Schnell 图像生成...\n')

  try {
    const client = new SiliconFlowClient()
    const result = await client.generateImage({
      model: 'black-forest-labs/FLUX.1-schnell',
      prompt: 'A beautiful sunset over mountains, digital art style',
      image_size: '1024x1024',
      batch_size: 1,
    })

    console.log('✅ 图像生成成功！')
    console.log('🖼️  图像 URL:', result.images[0].url)
    console.log('⏱️  生成时间:', result.timings.inference, 'ms')
    console.log()
  } catch (error) {
    console.error('❌ 图像生成失败:', error)
    // 不抛出错误，继续其他测试
  }
}

async function testVoiceList() {
  console.log('🧪 测试获取语音列表...\n')

  try {
    const client = new SiliconFlowClient()
    const voices = await client.getVoiceList()

    console.log('✅ 获取语音列表成功！')
    console.log('🎤 可用声音数量:', voices.data?.length || 0)

    if (voices.data && voices.data.length > 0) {
      console.log('\n可用声音:')
      voices.data.forEach((voice: any, index: number) => {
        console.log(`${index + 1}. ${voice.voice_id} - ${voice.name || '未命名'}`)
      })
    }
    console.log()
  } catch (error) {
    console.error('❌ 获取语音列表失败:', error)
    // 不抛出错误
  }
}

async function main() {
  console.log('=' .repeat(60))
  console.log('🚀 SiliconFlow API 集成测试')
  console.log('=' .repeat(60))
  console.log()

  // 检查 API 密钥
  if (!process.env.SILICONFLOW_API_KEY) {
    console.error('❌ 错误: 未配置 SILICONFLOW_API_KEY 环境变量')
    console.error('请在 .env.local 文件中设置 SILICONFLOW_API_KEY')
    process.exit(1)
  }

  console.log('✅ API 密钥已配置')
  console.log('🔗 API 端点:', process.env.SILICONFLOW_API_ENDPOINT || 'https://api.siliconflow.cn/v1')
  console.log()

  try {
    // 执行所有测试
    await testTextGeneration()
    await testModelList()
    await testDeepSeek()
    await testImageGeneration()
    await testVoiceList()

    console.log('=' .repeat(60))
    console.log('✅ 所有测试完成！')
    console.log('=' .repeat(60))
  } catch (error) {
    console.log()
    console.log('=' .repeat(60))
    console.log('❌ 测试失败')
    console.log('=' .repeat(60))
    process.exit(1)
  }
}

// 运行测试
main().catch(console.error)
