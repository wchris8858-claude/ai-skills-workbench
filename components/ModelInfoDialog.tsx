'use client'

import { X, ExternalLink, Cpu, Zap, MessageSquare, Image as ImageIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { type ModelConfig } from '@/lib/models/config'

interface ModelInfoDialogProps {
  isOpen: boolean
  onClose: () => void
  modelConfig: ModelConfig | null
}

// 模型详细信息映射
const MODEL_DETAILS: Record<string, {
  features: string[]
  useCases: string[]
  contextLength?: string
  speed?: string
  url?: string
}> = {
  // Claude 系列
  'claude-haiku-4-5-20251001': {
    features: ['快速响应', '高性价比', '多语言支持', '长上下文'],
    useCases: ['日常对话', '内容生成', '代码辅助', '数据分析'],
    contextLength: '200K tokens',
    speed: '极快',
    url: 'https://www.anthropic.com/claude',
  },
  'claude-opus-4-5-20251101': {
    features: ['最强推理能力', '深度理解', '复杂任务处理', '高质量输出'],
    useCases: ['复杂推理', '专业写作', '代码生成', '战略规划'],
    contextLength: '200K tokens',
    speed: '中等',
    url: 'https://www.anthropic.com/claude',
  },

  // Gemini 系列
  'gemini-pro-vision': {
    features: ['视觉理解', '图文结合', '多模态分析', '创意生成'],
    useCases: ['图像分析', '视觉问答', '创意设计', '多模态理解'],
    contextLength: '32K tokens',
    speed: '快',
    url: 'https://deepmind.google/technologies/gemini/',
  },

  // SiliconFlow - Qwen 系列
  'Qwen/Qwen2.5-7B-Instruct': {
    features: ['中文优化', '高性能', '多任务处理', '知识丰富'],
    useCases: ['中文对话', '知识问答', '内容创作', '逻辑推理'],
    contextLength: '32K tokens',
    speed: '极快',
    url: 'https://cloud.siliconflow.cn/models/qwen2-5-7b-instruct',
  },
  'Qwen/Qwen3-VL-32B-Instruct': {
    features: ['视觉理解', '32B参数', '多模态融合', '精准识别'],
    useCases: ['图像理解', '视觉问答', 'OCR识别', '图表分析'],
    contextLength: '32K tokens',
    speed: '快',
    url: 'https://cloud.siliconflow.cn/models/qwen3-vl-32b-instruct',
  },
  'Qwen/Qwen3-VL-32B-Thinking': {
    features: ['深度思考', '推理链展示', '视觉理解', '逻辑严密'],
    useCases: ['复杂推理', '问题分析', '视觉推理', '决策支持'],
    contextLength: '32K tokens',
    speed: '中等',
    url: 'https://cloud.siliconflow.cn/models/qwen3-vl-32b-thinking',
  },
  'Qwen/Qwen3-VL-30B-A3B-Instruct': {
    features: ['高效推理', 'A3B架构', '视觉理解', '快速响应'],
    useCases: ['实时分析', '图像理解', '快速问答', '批量处理'],
    contextLength: '32K tokens',
    speed: '极快',
    url: 'https://cloud.siliconflow.cn/models/qwen3-vl-30b-a3b-instruct',
  },

  // DeepSeek 系列
  'deepseek-ai/DeepSeek-V2.5': {
    features: ['代码专家', '深度推理', '数学能力', '逻辑严密'],
    useCases: ['代码生成', '算法设计', '技术文档', '问题解决'],
    contextLength: '64K tokens',
    speed: '快',
    url: 'https://cloud.siliconflow.cn/models/deepseek-v2-5',
  },

  // GLM 系列
  'Pro/zai-org/GLM-4.7': {
    features: ['智谱AI', '专业版本', '多任务处理', '高精度'],
    useCases: ['专业咨询', '知识问答', '内容生成', '数据分析'],
    contextLength: '128K tokens',
    speed: '快',
    url: 'https://cloud.siliconflow.cn/models/glm-4-7-pro',
  },
  'zai-org/GLM-4.6V': {
    features: ['视觉理解', '多模态', '智谱AI', '精准识别'],
    useCases: ['图像分析', '视觉问答', 'OCR', '图表理解'],
    contextLength: '128K tokens',
    speed: '快',
    url: 'https://cloud.siliconflow.cn/models/glm-4-6v',
  },

  // MiniMax 系列
  'MiniMaxAI/MiniMax-M2': {
    features: ['最新模型', '性能优异', '创意生成', '理解深入'],
    useCases: ['创意写作', '对话系统', '内容创作', '知识问答'],
    contextLength: '32K tokens',
    speed: '快',
    url: 'https://cloud.siliconflow.cn/models/minimax-m2',
  },
  'MiniMaxAI/MiniMax-M1-80k': {
    features: ['超长上下文', '80K tokens', '文档处理', '深度分析'],
    useCases: ['长文档分析', '报告生成', '知识整合', '研究辅助'],
    contextLength: '80K tokens',
    speed: '中等',
    url: 'https://cloud.siliconflow.cn/models/minimax-m1-80k',
  },

  // 图像生成模型
  'black-forest-labs/FLUX.1-schnell': {
    features: ['快速生成', '高质量', '风格多样', 'FLUX架构'],
    useCases: ['AI绘画', '创意设计', '插画生成', '概念图'],
    speed: '极快',
    url: 'https://cloud.siliconflow.cn/models/flux-1-schnell',
  },
  'stabilityai/stable-diffusion-3-5-large': {
    features: ['超高质量', '细节丰富', 'SD 3.5', '专业级'],
    useCases: ['专业插画', '高清海报', '艺术创作', '商业设计'],
    speed: '中等',
    url: 'https://cloud.siliconflow.cn/models/stable-diffusion-3-5-large',
  },

  // 语音模型
  'TeleAI/TeleSpeechASR': {
    features: ['高精度识别', '多语言', '实时转写', '降噪处理'],
    useCases: ['语音转文字', '会议记录', '字幕生成', '语音助手'],
    speed: '快',
    url: 'https://cloud.siliconflow.cn/models/telespeech-asr',
  },
}

export function ModelInfoDialog({ isOpen, onClose, modelConfig }: ModelInfoDialogProps) {
  if (!isOpen || !modelConfig) return null

  const details = MODEL_DETAILS[modelConfig.model] || {
    features: ['高性能AI模型', '支持多种任务'],
    useCases: ['文本生成', '对话交互'],
  }

  const getModelIcon = () => {
    switch (modelConfig.type) {
      case 'image':
        return ImageIcon
      case 'speech':
        return MessageSquare
      default:
        return Cpu
    }
  }

  const Icon = getModelIcon()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 遮罩层 */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* 弹窗内容 */}
      <div className="relative w-full max-w-2xl max-h-[80vh] overflow-y-auto rounded-valley bg-background border border-border/50 shadow-valley custom-scrollbar">
        {/* 头部 */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b border-border/50 bg-background/95 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-accent/20 to-accent/5">
              <Icon className="h-6 w-6 text-accent" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                {modelConfig.description.split(' - ')[0]}
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                {modelConfig.model}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={cn(
              'p-2 rounded-lg',
              'text-muted-foreground hover:text-foreground',
              'hover:bg-secondary transition-all'
            )}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 内容 */}
        <div className="p-6 space-y-6">
          {/* 基本信息 */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3">基本信息</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-lg bg-secondary/30">
                <div className="text-xs text-muted-foreground mb-1">模型类型</div>
                <div className="text-sm font-medium text-foreground">
                  {modelConfig.type === 'text' && '文本生成'}
                  {modelConfig.type === 'image' && '图像生成'}
                  {modelConfig.type === 'speech' && '语音识别'}
                  {modelConfig.type === 'video' && '视频生成'}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-secondary/30">
                <div className="text-xs text-muted-foreground mb-1">提供商</div>
                <div className="text-sm font-medium text-foreground capitalize">
                  {modelConfig.provider}
                </div>
              </div>
              {details.contextLength && (
                <div className="p-3 rounded-lg bg-secondary/30">
                  <div className="text-xs text-muted-foreground mb-1">上下文长度</div>
                  <div className="text-sm font-medium text-foreground">
                    {details.contextLength}
                  </div>
                </div>
              )}
              {details.speed && (
                <div className="p-3 rounded-lg bg-secondary/30">
                  <div className="text-xs text-muted-foreground mb-1">响应速度</div>
                  <div className="text-sm font-medium text-foreground flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-accent" />
                    {details.speed}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 核心特性 */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3">核心特性</h3>
            <div className="grid grid-cols-2 gap-2">
              {details.features.map((feature, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-2 rounded-lg bg-accent/5 border border-accent/20"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                  <span className="text-sm text-foreground">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 应用场景 */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3">应用场景</h3>
            <div className="space-y-2">
              {details.useCases.map((useCase, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2 p-3 rounded-lg bg-secondary/30"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-accent mt-2" />
                  <span className="text-sm text-foreground">{useCase}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 了解更多 */}
          {details.url && (
            <div className="pt-4 border-t border-border/50">
              <a
                href={details.url}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  'inline-flex items-center gap-2 px-4 py-2 rounded-lg',
                  'bg-accent text-accent-foreground',
                  'hover:shadow-valley-hover transition-all duration-200'
                )}
              >
                <span className="text-sm font-medium">了解更多</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
