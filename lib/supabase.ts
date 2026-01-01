import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { logger } from '@/lib/logger'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// 创建一个 mock client 用于未配置 Supabase 时
const createMockClient = () => {
  const mockResponse = { data: null, error: { message: 'Supabase not configured' } }
  const mockQuery = {
    select: () => mockQuery,
    insert: () => mockQuery,
    update: () => mockQuery,
    delete: () => mockQuery,
    eq: () => mockQuery,
    neq: () => mockQuery,
    or: () => mockQuery,
    in: () => mockQuery,
    order: () => mockQuery,
    limit: () => mockQuery,
    single: () => Promise.resolve(mockResponse),
    then: (resolve: (value: typeof mockResponse) => void) => resolve(mockResponse),
  }

  return {
    from: () => mockQuery,
    rpc: () => Promise.resolve(mockResponse),
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      signInWithOtp: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
      signOut: () => Promise.resolve({ error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    },
    storage: {
      from: () => ({
        upload: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
        download: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
        getPublicUrl: () => ({ data: { publicUrl: '' } }),
      }),
    },
  } as unknown as SupabaseClient
}

// 检查是否配置了 Supabase
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

// 检查是否配置了 Service Role Key（用于绕过 RLS）
export const isSupabaseAdminConfigured = Boolean(supabaseUrl && supabaseServiceKey)

// 根据配置情况创建真实或 mock 客户端（使用 anon key，受 RLS 限制）
export const supabase: SupabaseClient = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createMockClient()

// 服务端客户端（使用 Service Role Key，绕过 RLS）
// 注意：只能在服务端使用，不要在客户端组件中导入
let supabaseAdmin: SupabaseClient | null = null

export function getSupabaseAdmin(): SupabaseClient {
  if (!isSupabaseAdminConfigured) {
    logger.warn('SUPABASE_SERVICE_ROLE_KEY 未配置，将使用 anon key（受 RLS 限制）')
    return supabase
  }

  if (!supabaseAdmin) {
    supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })
  }

  return supabaseAdmin
}