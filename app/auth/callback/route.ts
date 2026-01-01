import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    try {
      await supabase.auth.exchangeCodeForSession(code)
    } catch (error) {
      logger.error('Error exchanging code for session', error)
      return NextResponse.redirect(
        new URL('/login?error=auth_failed', requestUrl.origin)
      )
    }
  }

  // 登录成功后重定向到首页
  return NextResponse.redirect(new URL('/', requestUrl.origin))
}
