/**
 * 知识库数据库操作
 */

import { getSupabaseAdmin } from '@/lib/supabase'
import { logger } from '@/lib/logger'

const getDb = () => getSupabaseAdmin()

// 知识库文档类型
export interface KnowledgeDocument {
  id: string
  shopId: string
  title: string
  content: string
  category?: string
  tags?: string[]
  version: number
  parentId?: string
  sourceType?: 'upload' | 'chat' | 'ai_generated'
  createdBy?: string
  createdAt: Date
  updatedAt: Date
}

// 知识块类型（用于 RAG）
export interface KnowledgeChunk {
  id: string
  documentId: string
  chunkIndex: number
  chunkText: string
  embedding?: number[]
  createdAt: Date
}

// 检索结果类型
export interface KnowledgeSearchResult {
  id: string
  documentId: string
  title: string
  content: string
  similarity: number
}

// 数据库记录类型
interface DbKnowledgeDocument {
  id: string
  shop_id: string
  title: string
  content: string
  category: string | null
  tags: string[] | null
  version: number
  parent_id: string | null
  source_type: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

// 转换函数
function dbDocToDoc(dbDoc: DbKnowledgeDocument): KnowledgeDocument {
  return {
    id: dbDoc.id,
    shopId: dbDoc.shop_id,
    title: dbDoc.title,
    content: dbDoc.content,
    category: dbDoc.category ?? undefined,
    tags: dbDoc.tags ?? undefined,
    version: dbDoc.version,
    parentId: dbDoc.parent_id ?? undefined,
    sourceType: dbDoc.source_type as KnowledgeDocument['sourceType'],
    createdBy: dbDoc.created_by ?? undefined,
    createdAt: new Date(dbDoc.created_at),
    updatedAt: new Date(dbDoc.updated_at),
  }
}

/**
 * 创建知识文档
 */
export async function createKnowledgeDocument(
  shopId: string,
  data: {
    title: string
    content: string
    category?: string
    tags?: string[]
    sourceType?: KnowledgeDocument['sourceType']
    createdBy?: string
  }
): Promise<KnowledgeDocument | null> {
  logger.db.query('createKnowledgeDocument', 'knowledge_documents', { shopId, title: data.title })

  const { data: doc, error } = await getDb()
    .from('knowledge_documents')
    .insert({
      shop_id: shopId,
      title: data.title,
      content: data.content,
      category: data.category || null,
      tags: data.tags || null,
      source_type: data.sourceType || null,
      created_by: data.createdBy || null,
    })
    .select()
    .single()

  if (error) {
    logger.db.error('createKnowledgeDocument 失败', { code: error.code, message: error.message })
    return null
  }

  logger.db.success('createKnowledgeDocument 成功', doc?.id)
  return doc ? dbDocToDoc(doc) : null
}

/**
 * 获取店铺的知识文档列表
 */
export async function getShopKnowledgeDocuments(
  shopId: string,
  options?: {
    category?: string
    limit?: number
    offset?: number
  }
): Promise<KnowledgeDocument[]> {
  let query = getDb()
    .from('knowledge_documents')
    .select('*')
    .eq('shop_id', shopId)
    .order('updated_at', { ascending: false })

  if (options?.category) {
    query = query.eq('category', options.category)
  }

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
  }

  const { data, error } = await query

  if (error) {
    logger.db.error('getShopKnowledgeDocuments 失败', { code: error.code, message: error.message })
    return []
  }

  return (data || []).map(dbDocToDoc)
}

/**
 * 获取单个知识文档
 */
export async function getKnowledgeDocumentById(
  documentId: string
): Promise<KnowledgeDocument | null> {
  const { data, error } = await getDb()
    .from('knowledge_documents')
    .select('*')
    .eq('id', documentId)
    .single()

  if (error) {
    if (error.code !== 'PGRST116') {
      logger.db.error('getKnowledgeDocumentById 失败', { code: error.code })
    }
    return null
  }

  return data ? dbDocToDoc(data) : null
}

/**
 * 更新知识文档
 */
export async function updateKnowledgeDocument(
  documentId: string,
  data: Partial<Pick<KnowledgeDocument, 'title' | 'content' | 'category' | 'tags'>>
): Promise<KnowledgeDocument | null> {
  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }

  if (data.title !== undefined) updateData.title = data.title
  if (data.content !== undefined) updateData.content = data.content
  if (data.category !== undefined) updateData.category = data.category
  if (data.tags !== undefined) updateData.tags = data.tags

  const { data: doc, error } = await getDb()
    .from('knowledge_documents')
    .update(updateData)
    .eq('id', documentId)
    .select()
    .single()

  if (error) {
    logger.db.error('updateKnowledgeDocument 失败', { code: error.code })
    return null
  }

  return doc ? dbDocToDoc(doc) : null
}

/**
 * 删除知识文档
 */
export async function deleteKnowledgeDocument(documentId: string): Promise<boolean> {
  const { error } = await getDb()
    .from('knowledge_documents')
    .delete()
    .eq('id', documentId)

  if (error) {
    logger.db.error('deleteKnowledgeDocument 失败', { code: error.code })
    return false
  }

  return true
}

/**
 * 保存知识块和向量
 */
export async function saveKnowledgeChunks(
  documentId: string,
  chunks: Array<{ chunkIndex: number; chunkText: string; embedding: number[] }>
): Promise<boolean> {
  const { error } = await getDb()
    .from('knowledge_embeddings')
    .insert(
      chunks.map(chunk => ({
        document_id: documentId,
        chunk_index: chunk.chunkIndex,
        chunk_text: chunk.chunkText,
        embedding: chunk.embedding,
      }))
    )

  if (error) {
    logger.db.error('saveKnowledgeChunks 失败', { code: error.code, message: error.message })
    return false
  }

  return true
}

/**
 * 删除文档的所有向量
 */
export async function deleteDocumentChunks(documentId: string): Promise<boolean> {
  const { error } = await getDb()
    .from('knowledge_embeddings')
    .delete()
    .eq('document_id', documentId)

  if (error) {
    logger.db.error('deleteDocumentChunks 失败', { code: error.code })
    return false
  }

  return true
}

/**
 * 搜索知识库（使用向量相似度）
 */
export async function searchKnowledge(
  shopId: string,
  queryEmbedding: number[],
  options?: {
    threshold?: number
    limit?: number
  }
): Promise<KnowledgeSearchResult[]> {
  const threshold = options?.threshold ?? 0.7
  const limit = options?.limit ?? 5

  const { data, error } = await getDb()
    .rpc('match_knowledge', {
      p_shop_id: shopId,
      p_query_embedding: queryEmbedding,
      p_match_threshold: threshold,
      p_match_count: limit,
    })

  if (error) {
    logger.db.error('searchKnowledge 失败', { code: error.code, message: error.message })
    return []
  }

  return (data || []).map((item: {
    id: string
    document_id: string
    title: string
    content: string
    similarity: number
  }) => ({
    id: item.id,
    documentId: item.document_id,
    title: item.title,
    content: item.content,
    similarity: item.similarity,
  }))
}

/**
 * 获取知识库分类列表
 */
export async function getKnowledgeCategories(shopId: string): Promise<string[]> {
  const { data, error } = await getDb()
    .from('knowledge_documents')
    .select('category')
    .eq('shop_id', shopId)
    .not('category', 'is', null)

  if (error) {
    logger.db.error('getKnowledgeCategories 失败', { code: error.code })
    return []
  }

  const categories = new Set<string>()
  for (const item of data || []) {
    if (item.category) {
      categories.add(item.category)
    }
  }

  return Array.from(categories)
}

/**
 * 统计知识库文档数量
 */
export async function countKnowledgeDocuments(
  shopId: string,
  category?: string
): Promise<number> {
  let query = getDb()
    .from('knowledge_documents')
    .select('*', { count: 'exact', head: true })
    .eq('shop_id', shopId)

  if (category) {
    query = query.eq('category', category)
  }

  const { count, error } = await query

  if (error) {
    logger.db.error('countKnowledgeDocuments 失败', { code: error.code })
    return 0
  }

  return count || 0
}
