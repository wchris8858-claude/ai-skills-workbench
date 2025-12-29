'use client'

/**
 * Accessibility Provider
 *
 * Global accessibility features and preferences
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { createSkipLink } from '@/lib/accessibility/focus-management'

interface AccessibilityContextValue {
  reducedMotion: boolean
  highContrast: boolean
  fontSize: 'normal' | 'large' | 'x-large'
  setFontSize: (size: 'normal' | 'large' | 'x-large') => void
  announceMessage: (message: string, priority?: 'polite' | 'assertive') => void
}

const AccessibilityContext = createContext<AccessibilityContextValue | null>(
  null
)

export function useAccessibility() {
  const context = useContext(AccessibilityContext)
  if (!context) {
    throw new Error(
      'useAccessibility must be used within AccessibilityProvider'
    )
  }
  return context
}

interface AccessibilityProviderProps {
  children: ReactNode
}

export function AccessibilityProvider({
  children,
}: AccessibilityProviderProps) {
  const [reducedMotion, setReducedMotion] = useState(false)
  const [highContrast, setHighContrast] = useState(false)
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'x-large'>(
    'normal'
  )

  // Detect prefers-reduced-motion
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(mediaQuery.matches)

    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches)
    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [])

  // Detect prefers-contrast
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-contrast: high)')
    setHighContrast(mediaQuery.matches)

    const handler = (e: MediaQueryListEvent) => setHighContrast(e.matches)
    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [])

  // Apply font size to root element
  useEffect(() => {
    const root = document.documentElement
    root.classList.remove('text-normal', 'text-large', 'text-x-large')
    root.classList.add(`text-${fontSize}`)
  }, [fontSize])

  // Apply reduced motion class
  useEffect(() => {
    const root = document.documentElement
    if (reducedMotion) {
      root.classList.add('reduce-motion')
    } else {
      root.classList.remove('reduce-motion')
    }
  }, [reducedMotion])

  // Apply high contrast class
  useEffect(() => {
    const root = document.documentElement
    if (highContrast) {
      root.classList.add('high-contrast')
    } else {
      root.classList.remove('high-contrast')
    }
  }, [highContrast])

  // Create skip link
  useEffect(() => {
    createSkipLink()
  }, [])

  // Announce message to screen readers
  const announceMessage = (
    message: string,
    priority: 'polite' | 'assertive' = 'polite'
  ) => {
    const announcement = document.createElement('div')
    announcement.setAttribute('role', 'status')
    announcement.setAttribute('aria-live', priority)
    announcement.className = 'sr-only'
    announcement.textContent = message

    document.body.appendChild(announcement)
    setTimeout(() => {
      document.body.removeChild(announcement)
    }, 1000)
  }

  return (
    <AccessibilityContext.Provider
      value={{
        reducedMotion,
        highContrast,
        fontSize,
        setFontSize,
        announceMessage,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  )
}
