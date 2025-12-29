'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { UserRole } from '@/types'

interface AuthUser {
  id: string
  username: string
  email?: string
  name?: string
  role: UserRole
  isActive?: boolean
}

interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  signIn: (username: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  // 获取当前用户信息
  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me')
      const data = await res.json()
      setUser(data.user || null)
    } catch (error) {
      console.error('获取用户信息失败:', error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUser()
  }, [fetchUser])

  // 登录
  const signIn = async (username: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })

    const data = await res.json()

    if (!res.ok) {
      throw new Error(data.error || '登录失败')
    }

    setUser(data.user)
  }

  // 登出
  const signOut = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } finally {
      setUser(null)
    }
  }

  // 刷新用户信息
  const refreshUser = async () => {
    await fetchUser()
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// 权限检查 Hook
export function usePermission(requiredRole: UserRole): boolean {
  const { user } = useAuth()

  if (!user) return false

  const roleHierarchy: Record<UserRole, number> = {
    admin: 3,
    member: 2,
    viewer: 1,
  }

  return roleHierarchy[user.role] >= roleHierarchy[requiredRole]
}

// 管理员检查 Hook
export function useIsAdmin(): boolean {
  const { user } = useAuth()
  return user?.role === 'admin'
}
