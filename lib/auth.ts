/**
 * 认证工具库
 * 处理密码哈希、JWT token 生成和验证
 */

import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'
import { UserRole } from '@/types'

// JWT 密钥配置
// 生产环境必须设置 JWT_SECRET 环境变量,否则启动失败
const JWT_SECRET = (() => {
  const secret = process.env.JWT_SECRET

  // 开发环境允许使用默认密钥(仅用于本地开发)
  if (process.env.NODE_ENV === 'development' && !secret) {
    console.warn('⚠️  使用默认 JWT_SECRET,仅限开发环境! 生产环境必须设置环境变量')
    return 'ai-skills-workbench-dev-secret-2024'
  }

  // 生产环境必须提供密钥
  if (!secret) {
    throw new Error(
      'CRITICAL SECURITY ERROR: JWT_SECRET environment variable is required in production. ' +
      'Please set JWT_SECRET in your .env.local or deployment environment.'
    )
  }

  // 验证密钥强度(至少32个字符)
  if (secret.length < 32) {
    throw new Error(
      'SECURITY ERROR: JWT_SECRET must be at least 32 characters long for security. ' +
      `Current length: ${secret.length}`
    )
  }

  return secret
})()

const TOKEN_EXPIRY = '7d' // 7天过期
const REFRESH_THRESHOLD = 24 * 60 * 60 // 剩余不到1天时刷新
const COOKIE_NAME = 'auth_token'

export interface JWTPayload {
  userId: string
  username: string
  role: UserRole
  iat?: number
  exp?: number
}

/**
 * 密码哈希
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

/**
 * 验证密码
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

/**
 * 生成 JWT token
 */
export function generateToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY })
}

/**
 * 验证 JWT token
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload
  } catch {
    return null
  }
}

/**
 * 设置认证 cookie
 */
export async function setAuthCookie(token: string): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60, // 7天
    path: '/',
  })
}

/**
 * 获取认证 cookie
 */
export async function getAuthCookie(): Promise<string | undefined> {
  const cookieStore = await cookies()
  return cookieStore.get(COOKIE_NAME)?.value
}

/**
 * 清除认证 cookie
 */
export async function clearAuthCookie(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}

/**
 * 获取当前登录用户
 */
export async function getCurrentUser(): Promise<JWTPayload | null> {
  const token = await getAuthCookie()
  if (!token) return null
  return verifyToken(token)
}

/**
 * 检查 Token 是否需要刷新
 * 如果剩余时间不到阈值，返回 true
 */
export function shouldRefreshToken(payload: JWTPayload): boolean {
  if (!payload.exp) return false
  const now = Math.floor(Date.now() / 1000)
  const timeRemaining = payload.exp - now
  return timeRemaining < REFRESH_THRESHOLD && timeRemaining > 0
}

/**
 * 刷新 Token
 * 生成新 token 并设置 cookie
 */
export async function refreshToken(payload: JWTPayload): Promise<string> {
  const newToken = generateToken({
    userId: payload.userId,
    username: payload.username,
    role: payload.role,
  })
  await setAuthCookie(newToken)
  return newToken
}

/**
 * 检查用户是否有指定权限
 */
export function hasPermission(userRole: UserRole, requiredRole: UserRole): boolean {
  const roleHierarchy: Record<UserRole, number> = {
    admin: 3,
    member: 2,
    viewer: 1,
  }
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole]
}

/**
 * 权限检查：是否是管理员
 */
export function isAdmin(role: UserRole): boolean {
  return role === 'admin'
}
