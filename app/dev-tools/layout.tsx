import { redirect } from 'next/navigation'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export default async function DevToolsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const isDev = process.env.NODE_ENV === 'development'

  // 开发环境无需登录
  if (isDev) {
    return <>{children}</>
  }

  // 生产环境需要 admin 角色
  try {
    const supabase = createServerComponentClient({ cookies })
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      redirect('/login')
    }

    // 获取用户角色
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      redirect('/')
    }
  } catch (error) {
    console.error('Auth check failed:', error)
    redirect('/login')
  }

  return <>{children}</>
}
