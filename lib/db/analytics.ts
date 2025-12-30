/**
 * 运营数据分析数据库操作
 */

import { getSupabaseAdmin } from '@/lib/supabase'
import { logger } from '@/lib/logger'

const getDb = () => getSupabaseAdmin()

// 运营数据类型
export interface OperationData {
  id: string
  shopId: string
  date: Date
  metrics: OperationMetrics
  source: 'manual' | 'import'
  createdBy?: string
  createdAt: Date
}

export interface OperationMetrics {
  // 曝光量
  exposure?: {
    total: number
    douyin?: number
    xiaohongshu?: number
    moments?: number
    videoAccount?: number
  }
  // 互动量
  engagement?: {
    likes: number
    comments: number
    shares: number
    saves: number
  }
  // 咨询量
  inquiries?: {
    total: number
    wechat?: number
    phone?: number
    online?: number
  }
  // 到店量
  visits?: {
    total: number
    new?: number
    returning?: number
  }
  // 成交量
  sales?: {
    count: number
    amount: number
    avgTicket?: number
  }
  // 自定义指标
  custom?: Record<string, number>
}

// 数据库记录类型
interface DbOperationData {
  id: string
  shop_id: string
  date: string
  metrics: OperationMetrics
  source: string
  created_by: string | null
  created_at: string
}

// 转换函数
function dbDataToData(dbData: DbOperationData): OperationData {
  return {
    id: dbData.id,
    shopId: dbData.shop_id,
    date: new Date(dbData.date),
    metrics: dbData.metrics,
    source: dbData.source as OperationData['source'],
    createdBy: dbData.created_by ?? undefined,
    createdAt: new Date(dbData.created_at),
  }
}

/**
 * 录入运营数据
 */
export async function createOperationData(
  shopId: string,
  date: Date,
  metrics: OperationMetrics,
  createdBy?: string
): Promise<OperationData | null> {
  const dateStr = date.toISOString().split('T')[0]

  logger.db.query('createOperationData', 'operation_data', { shopId, date: dateStr })

  const { data, error } = await getDb()
    .from('operation_data')
    .upsert({
      shop_id: shopId,
      date: dateStr,
      metrics,
      source: 'manual',
      created_by: createdBy || null,
    }, {
      onConflict: 'shop_id,date',
    })
    .select()
    .single()

  if (error) {
    logger.db.error('createOperationData 失败', { code: error.code, message: error.message })
    return null
  }

  return data ? dbDataToData(data) : null
}

/**
 * 获取店铺运营数据
 */
export async function getShopOperationData(
  shopId: string,
  startDate: Date,
  endDate: Date
): Promise<OperationData[]> {
  const { data, error } = await getDb()
    .from('operation_data')
    .select('*')
    .eq('shop_id', shopId)
    .gte('date', startDate.toISOString().split('T')[0])
    .lte('date', endDate.toISOString().split('T')[0])
    .order('date', { ascending: true })

  if (error) {
    logger.db.error('getShopOperationData 失败', { code: error.code })
    return []
  }

  return (data || []).map(dbDataToData)
}

/**
 * 获取单日运营数据
 */
export async function getDayOperationData(
  shopId: string,
  date: Date
): Promise<OperationData | null> {
  const dateStr = date.toISOString().split('T')[0]

  const { data, error } = await getDb()
    .from('operation_data')
    .select('*')
    .eq('shop_id', shopId)
    .eq('date', dateStr)
    .single()

  if (error) {
    if (error.code !== 'PGRST116') {
      logger.db.error('getDayOperationData 失败', { code: error.code })
    }
    return null
  }

  return data ? dbDataToData(data) : null
}

/**
 * 更新运营数据
 */
export async function updateOperationData(
  shopId: string,
  date: Date,
  metrics: Partial<OperationMetrics>
): Promise<OperationData | null> {
  const dateStr = date.toISOString().split('T')[0]

  // 先获取现有数据
  const existing = await getDayOperationData(shopId, date)
  if (!existing) {
    // 如果不存在，创建新记录
    return createOperationData(shopId, date, metrics as OperationMetrics)
  }

  // 合并指标
  const mergedMetrics: OperationMetrics = {
    ...existing.metrics,
    ...metrics,
  }

  const { data, error } = await getDb()
    .from('operation_data')
    .update({ metrics: mergedMetrics })
    .eq('shop_id', shopId)
    .eq('date', dateStr)
    .select()
    .single()

  if (error) {
    logger.db.error('updateOperationData 失败', { code: error.code })
    return null
  }

  return data ? dbDataToData(data) : null
}

/**
 * 计算周期对比数据
 */
export async function calculatePeriodComparison(
  shopId: string,
  currentStart: Date,
  currentEnd: Date,
  previousStart: Date,
  previousEnd: Date
): Promise<{
  current: AggregatedMetrics
  previous: AggregatedMetrics
  changes: Record<string, number> // 变化百分比
}> {
  const currentData = await getShopOperationData(shopId, currentStart, currentEnd)
  const previousData = await getShopOperationData(shopId, previousStart, previousEnd)

  const current = aggregateMetrics(currentData)
  const previous = aggregateMetrics(previousData)

  const changes: Record<string, number> = {}

  // 计算各项指标的变化百分比
  if (previous.totalExposure > 0) {
    changes.exposure = ((current.totalExposure - previous.totalExposure) / previous.totalExposure) * 100
  }
  if (previous.totalEngagement > 0) {
    changes.engagement = ((current.totalEngagement - previous.totalEngagement) / previous.totalEngagement) * 100
  }
  if (previous.totalInquiries > 0) {
    changes.inquiries = ((current.totalInquiries - previous.totalInquiries) / previous.totalInquiries) * 100
  }
  if (previous.totalVisits > 0) {
    changes.visits = ((current.totalVisits - previous.totalVisits) / previous.totalVisits) * 100
  }
  if (previous.totalSales > 0) {
    changes.sales = ((current.totalSales - previous.totalSales) / previous.totalSales) * 100
  }
  if (previous.totalAmount > 0) {
    changes.amount = ((current.totalAmount - previous.totalAmount) / previous.totalAmount) * 100
  }

  return { current, previous, changes }
}

// 聚合指标类型
interface AggregatedMetrics {
  totalExposure: number
  totalEngagement: number
  totalInquiries: number
  totalVisits: number
  totalSales: number
  totalAmount: number
  avgConversionRate: number
}

/**
 * 聚合多日数据
 */
function aggregateMetrics(dataList: OperationData[]): AggregatedMetrics {
  const result: AggregatedMetrics = {
    totalExposure: 0,
    totalEngagement: 0,
    totalInquiries: 0,
    totalVisits: 0,
    totalSales: 0,
    totalAmount: 0,
    avgConversionRate: 0,
  }

  for (const data of dataList) {
    const m = data.metrics

    if (m.exposure?.total) {
      result.totalExposure += m.exposure.total
    }

    if (m.engagement) {
      result.totalEngagement += (m.engagement.likes || 0) +
        (m.engagement.comments || 0) +
        (m.engagement.shares || 0) +
        (m.engagement.saves || 0)
    }

    if (m.inquiries?.total) {
      result.totalInquiries += m.inquiries.total
    }

    if (m.visits?.total) {
      result.totalVisits += m.visits.total
    }

    if (m.sales) {
      result.totalSales += m.sales.count || 0
      result.totalAmount += m.sales.amount || 0
    }
  }

  // 计算转化率
  if (result.totalExposure > 0) {
    result.avgConversionRate = (result.totalSales / result.totalExposure) * 100
  }

  return result
}

/**
 * 获取趋势数据
 */
export async function getTrendData(
  shopId: string,
  startDate: Date,
  endDate: Date,
  metric: keyof OperationMetrics
): Promise<Array<{ date: string; value: number }>> {
  const data = await getShopOperationData(shopId, startDate, endDate)

  return data.map(d => {
    let value = 0
    const metrics = d.metrics[metric]

    if (typeof metrics === 'object' && metrics !== null && 'total' in metrics) {
      value = (metrics as { total: number }).total
    } else if (metric === 'engagement' && d.metrics.engagement) {
      value = (d.metrics.engagement.likes || 0) +
        (d.metrics.engagement.comments || 0) +
        (d.metrics.engagement.shares || 0)
    } else if (metric === 'sales' && d.metrics.sales) {
      value = d.metrics.sales.count || 0
    }

    return {
      date: d.date.toISOString().split('T')[0],
      value,
    }
  })
}

/**
 * 删除运营数据
 */
export async function deleteOperationData(
  shopId: string,
  date: Date
): Promise<boolean> {
  const dateStr = date.toISOString().split('T')[0]

  const { error } = await getDb()
    .from('operation_data')
    .delete()
    .eq('shop_id', shopId)
    .eq('date', dateStr)

  if (error) {
    logger.db.error('deleteOperationData 失败', { code: error.code })
    return false
  }

  return true
}

/**
 * 批量导入运营数据
 */
export async function importOperationData(
  shopId: string,
  dataList: Array<{
    date: Date
    metrics: OperationMetrics
  }>,
  createdBy?: string
): Promise<number> {
  const records = dataList.map(item => ({
    shop_id: shopId,
    date: item.date.toISOString().split('T')[0],
    metrics: item.metrics,
    source: 'import',
    created_by: createdBy || null,
  }))

  const { data, error } = await getDb()
    .from('operation_data')
    .upsert(records, {
      onConflict: 'shop_id,date',
    })
    .select()

  if (error) {
    logger.db.error('importOperationData 失败', { code: error.code, message: error.message })
    return 0
  }

  return (data || []).length
}
