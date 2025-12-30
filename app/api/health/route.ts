/**
 * 健康检查 API
 * GET /api/health
 *
 * 返回系统健康状态和基本信息
 */

import { NextResponse } from 'next/server'

export async function GET() {
  const startTime = Date.now()

  // 基本状态
  const health = {
    status: 'ok' as 'ok' | 'degraded' | 'error',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    checks: {
      api: true,
      memory: true,
    },
    responseTime: 0,
  }

  // 内存检查
  const memUsage = process.memoryUsage()
  const memUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024)
  if (memUsedMB > 512) {
    health.checks.memory = false
    health.status = 'degraded'
  }

  // 计算响应时间
  health.responseTime = Date.now() - startTime

  return NextResponse.json(health)
}
