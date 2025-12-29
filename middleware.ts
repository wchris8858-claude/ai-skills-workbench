/**
 * Next.js Middleware
 * 处理 CORS 和其他全局请求处理
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// 允许的域名列表
const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  // 生产环境域名（从环境变量读取）
  process.env.NEXT_PUBLIC_APP_URL,
  // Vercel 预览部署
  'https://*.vercel.app',
].filter(Boolean) as string[]

/**
 * 检查 origin 是否在允许列表中
 */
function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return true // 同源请求没有 origin

  return ALLOWED_ORIGINS.some(allowed => {
    if (allowed.includes('*')) {
      // 支持通配符匹配
      const pattern = allowed.replace('*', '.*')
      return new RegExp(`^${pattern}$`).test(origin)
    }
    return allowed === origin
  })
}

export function middleware(request: NextRequest) {
  // 获取请求的 origin
  const origin = request.headers.get('origin')

  // 只对 API 路由应用 CORS
  if (request.nextUrl.pathname.startsWith('/api')) {
    // 处理预检请求 (OPTIONS)
    if (request.method === 'OPTIONS') {
      const response = new NextResponse(null, { status: 200 })

      if (origin && isOriginAllowed(origin)) {
        response.headers.set('Access-Control-Allow-Origin', origin)
        response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        response.headers.set('Access-Control-Allow-Credentials', 'true')
        response.headers.set('Access-Control-Max-Age', '86400') // 24 小时
      }

      return response
    }

    // 处理实际请求
    const response = NextResponse.next()

    if (origin && isOriginAllowed(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin)
      response.headers.set('Access-Control-Allow-Credentials', 'true')
    }

    // 添加安全头
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-XSS-Protection', '1; mode=block')

    return response
  }

  return NextResponse.next()
}

// 配置 middleware 匹配的路由
export const config = {
  matcher: [
    // 匹配所有 API 路由
    '/api/:path*',
  ],
}
