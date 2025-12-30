/**
 * RAG (Retrieval Augmented Generation) 知识检索服务
 *
 * 职责：
 * 1. 文档切片和向量化
 * 2. 语义检索
 * 3. 上下文组装
 */

import { logger } from '@/lib/logger'
import { generateEmbedding } from './dispatcher'
import {
  createKnowledgeDocument,
  saveKnowledgeChunks,
  searchKnowledge,
  type KnowledgeDocument,
  type KnowledgeSearchResult,
} from '@/lib/db/knowledge'

// 文档切片配置
interface ChunkConfig {
  chunkSize: number     // 每个切片的字符数
  chunkOverlap: number  // 切片重叠的字符数
  separator?: string    // 分隔符
}

// 默认切片配置
const DEFAULT_CHUNK_CONFIG: ChunkConfig = {
  chunkSize: 500,
  chunkOverlap: 50,
  separator: '\n\n',
}

// 检索结果
export interface RetrievalResult {
  chunks: KnowledgeSearchResult[]
  context: string
  sources: Array<{
    documentId: string
    title: string
    similarity: number
  }>
}

/**
 * 将文本切分为块
 */
export function splitTextIntoChunks(
  text: string,
  config: Partial<ChunkConfig> = {}
): string[] {
  const { chunkSize, chunkOverlap, separator } = { ...DEFAULT_CHUNK_CONFIG, ...config }

  // 先按分隔符分段
  const paragraphs = text.split(separator || '\n\n').filter(p => p.trim())

  const chunks: string[] = []
  let currentChunk = ''

  for (const paragraph of paragraphs) {
    // 如果段落本身就超过 chunkSize，需要进一步切分
    if (paragraph.length > chunkSize) {
      // 先保存当前块
      if (currentChunk) {
        chunks.push(currentChunk.trim())
        currentChunk = ''
      }

      // 按句子切分长段落
      const sentences = paragraph.split(/[。！？.!?]+/).filter(s => s.trim())
      let tempChunk = ''

      for (const sentence of sentences) {
        if ((tempChunk + sentence).length > chunkSize) {
          if (tempChunk) {
            chunks.push(tempChunk.trim())
          }
          tempChunk = sentence
        } else {
          tempChunk += (tempChunk ? '。' : '') + sentence
        }
      }

      if (tempChunk) {
        chunks.push(tempChunk.trim())
      }
    } else {
      // 正常大小的段落
      if ((currentChunk + paragraph).length > chunkSize) {
        if (currentChunk) {
          chunks.push(currentChunk.trim())
          // 保留重叠部分
          const overlapText = currentChunk.slice(-chunkOverlap)
          currentChunk = overlapText + paragraph
        } else {
          currentChunk = paragraph
        }
      } else {
        currentChunk += (currentChunk ? '\n\n' : '') + paragraph
      }
    }
  }

  // 保存最后一个块
  if (currentChunk) {
    chunks.push(currentChunk.trim())
  }

  return chunks
}

/**
 * 处理并存储文档
 * 1. 创建文档记录
 * 2. 切分文本
 * 3. 生成向量
 * 4. 存储切片
 */
export async function processAndStoreDocument(
  shopId: string,
  title: string,
  content: string,
  metadata?: {
    category?: string
    tags?: string[]
    source?: string
  },
  chunkConfig?: Partial<ChunkConfig>
): Promise<{
  document: KnowledgeDocument | null
  chunkCount: number
  success: boolean
  error?: string
}> {
  logger.info('[RAG] Processing document', { shopId, title, contentLength: content.length })

  try {
    // 1. 创建文档记录
    const document = await createKnowledgeDocument(shopId, {
      title,
      content,
      category: metadata?.category,
      tags: metadata?.tags,
      sourceType: metadata?.source as 'upload' | 'chat' | 'ai_generated' | undefined,
    })

    if (!document) {
      return {
        document: null,
        chunkCount: 0,
        success: false,
        error: 'Failed to create document record',
      }
    }

    // 2. 切分文本
    const textChunks = splitTextIntoChunks(content, chunkConfig)
    logger.info('[RAG] Text split into chunks', { chunkCount: textChunks.length })

    // 3. 生成向量并准备切片数据
    const chunksWithEmbeddings: Array<{
      chunkText: string
      chunkIndex: number
      embedding: number[]
    }> = []

    for (let i = 0; i < textChunks.length; i++) {
      const chunkText = textChunks[i]

      // 生成向量
      const embedding = await generateEmbedding(chunkText)

      chunksWithEmbeddings.push({
        chunkText,
        chunkIndex: i,
        embedding,
      })

      // 添加延迟避免 API 限流
      if (i < textChunks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }

    // 4. 批量存储切片
    const saved = await saveKnowledgeChunks(document.id, chunksWithEmbeddings)

    logger.info('[RAG] Document processed successfully', {
      documentId: document.id,
      savedChunks: chunksWithEmbeddings.length,
    })

    return {
      document,
      chunkCount: saved ? chunksWithEmbeddings.length : 0,
      success: saved,
    }
  } catch (error) {
    logger.error('[RAG] Document processing failed', { error })
    return {
      document: null,
      chunkCount: 0,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * 检索相关知识
 * 1. 将查询转为向量
 * 2. 语义搜索
 * 3. 组装上下文
 */
export async function retrieveKnowledge(
  shopId: string,
  query: string,
  options?: {
    topK?: number
    minSimilarity?: number
    category?: string
  }
): Promise<RetrievalResult> {
  const { topK = 5, minSimilarity = 0.7, category } = options || {}

  logger.info('[RAG] Retrieving knowledge', { shopId, query, topK })

  try {
    // 先生成查询的嵌入向量
    const queryEmbedding = await generateEmbedding(query)

    // 搜索相关知识
    const results = await searchKnowledge(shopId, queryEmbedding, { limit: topK, threshold: minSimilarity })

    // 组装上下文
    const context = results
      .map((result, i) => {
        return `[来源 ${i + 1}: ${result.title}]\n${result.content}`
      })
      .join('\n\n---\n\n')

    // 提取来源信息
    const sources = results.map(result => ({
      documentId: result.documentId,
      title: result.title,
      similarity: result.similarity || 0,
    }))

    logger.info('[RAG] Knowledge retrieved', {
      resultCount: results.length,
    })

    return {
      chunks: results,
      context,
      sources,
    }
  } catch (error) {
    logger.error('[RAG] Knowledge retrieval failed', { error })
    return {
      chunks: [],
      context: '',
      sources: [],
    }
  }
}

/**
 * 生成带知识增强的提示词
 */
export function buildRAGPrompt(
  userQuery: string,
  knowledgeContext: string,
  systemPrompt?: string
): {
  systemPrompt: string
  userPrompt: string
} {
  const ragSystemPrompt = systemPrompt
    ? `${systemPrompt}

# 知识库参考
以下是与用户问题相关的知识库内容，请优先参考这些信息回答问题。如果知识库中没有相关信息，请明确告知用户。

${knowledgeContext}`
    : `你是一个智能助手，请基于以下知识库内容回答用户的问题。
如果知识库中没有相关信息，请如实告知用户。回答时请引用信息来源。

# 知识库内容
${knowledgeContext}`

  return {
    systemPrompt: ragSystemPrompt,
    userPrompt: userQuery,
  }
}

/**
 * 完整的 RAG 问答流程
 */
export async function ragQuery(
  shopId: string,
  query: string,
  options?: {
    topK?: number
    minSimilarity?: number
    category?: string
    systemPrompt?: string
  }
): Promise<{
  context: string
  sources: RetrievalResult['sources']
  systemPrompt: string
  userPrompt: string
}> {
  // 检索知识
  const retrieval = await retrieveKnowledge(shopId, query, {
    topK: options?.topK,
    minSimilarity: options?.minSimilarity,
    category: options?.category,
  })

  // 构建提示词
  const prompts = buildRAGPrompt(
    query,
    retrieval.context,
    options?.systemPrompt
  )

  return {
    context: retrieval.context,
    sources: retrieval.sources,
    ...prompts,
  }
}

/**
 * 估算文档的 token 数量（粗略估计）
 * 中文大约每个字 1.5 tokens，英文大约每个词 1 token
 */
export function estimateTokens(text: string): number {
  // 简单估计：中文字符 * 1.5 + 英文词数
  const chineseChars = (text.match(/[\u4e00-\u9fff]/g) || []).length
  const englishWords = text.replace(/[\u4e00-\u9fff]/g, ' ').split(/\s+/).filter(w => w).length

  return Math.ceil(chineseChars * 1.5 + englishWords)
}

/**
 * 优化上下文长度
 * 如果上下文过长，进行截断
 */
export function optimizeContext(
  context: string,
  maxTokens: number = 4000
): string {
  const currentTokens = estimateTokens(context)

  if (currentTokens <= maxTokens) {
    return context
  }

  // 按比例截断
  const ratio = maxTokens / currentTokens
  const targetLength = Math.floor(context.length * ratio * 0.9) // 留 10% 余量

  // 尝试在句子边界截断
  let truncated = context.slice(0, targetLength)
  const lastSentenceEnd = Math.max(
    truncated.lastIndexOf('。'),
    truncated.lastIndexOf('！'),
    truncated.lastIndexOf('？'),
    truncated.lastIndexOf('.'),
    truncated.lastIndexOf('!'),
    truncated.lastIndexOf('?')
  )

  if (lastSentenceEnd > targetLength * 0.8) {
    truncated = truncated.slice(0, lastSentenceEnd + 1)
  }

  return truncated + '\n\n[... 内容已截断 ...]'
}

export default {
  splitTextIntoChunks,
  processAndStoreDocument,
  retrieveKnowledge,
  buildRAGPrompt,
  ragQuery,
  estimateTokens,
  optimizeContext,
}
