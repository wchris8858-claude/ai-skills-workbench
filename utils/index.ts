import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date)
}

export function formatTime(date: Date): string {
  return new Intl.DateTimeFormat('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str
  return str.slice(0, length) + '...'
}

export function validateEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email)
}

export function isWhitelistedEmail(email: string): boolean {
  const whitelistDomains = process.env.NEXT_PUBLIC_AUTH_WHITELIST_DOMAINS?.split(',') || []
  const whitelistEmails = process.env.NEXT_PUBLIC_AUTH_WHITELIST_EMAILS?.split(',') || []

  if (whitelistEmails.includes(email)) return true

  const domain = email.split('@')[1]
  if (whitelistDomains.includes(domain)) return true

  return false
}