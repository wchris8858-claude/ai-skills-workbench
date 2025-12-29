/**
 * Focus Management Utilities
 *
 * Helpers for managing focus and keyboard navigation
 */

import { useEffect, useRef, useCallback } from 'react'

/**
 * Focus trap for modal dialogs
 */
export function useFocusTrap(enabled: boolean = true) {
  const containerRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!enabled || !containerRef.current) return

    const container = containerRef.current
    const focusableElements = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )

    if (focusableElements.length === 0) return

    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    // Store previously focused element
    const previouslyFocusedElement = document.activeElement as HTMLElement

    // Focus first element
    firstElement?.focus()

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault()
          lastElement?.focus()
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault()
          firstElement?.focus()
        }
      }
    }

    container.addEventListener('keydown', handleTabKey)

    return () => {
      container.removeEventListener('keydown', handleTabKey)
      // Restore focus
      previouslyFocusedElement?.focus()
    }
  }, [enabled])

  return containerRef
}

/**
 * Auto-focus element on mount
 */
export function useAutoFocus<T extends HTMLElement>(
  enabled: boolean = true
): React.RefObject<T> {
  const ref = useRef<T>(null)

  useEffect(() => {
    if (enabled && ref.current) {
      ref.current.focus()
    }
  }, [enabled])

  return ref
}

/**
 * Restore focus to trigger element
 */
export function useFocusReturn() {
  const triggerRef = useRef<HTMLElement | null>(null)

  const storeFocus = useCallback(() => {
    triggerRef.current = document.activeElement as HTMLElement
  }, [])

  const restoreFocus = useCallback(() => {
    triggerRef.current?.focus()
    triggerRef.current = null
  }, [])

  return { storeFocus, restoreFocus }
}

/**
 * Skip to main content link
 */
export function createSkipLink() {
  if (typeof window === 'undefined') return

  const existingLink = document.getElementById('skip-to-main')
  if (existingLink) return

  const skipLink = document.createElement('a')
  skipLink.id = 'skip-to-main'
  skipLink.href = '#main-content'
  skipLink.textContent = '跳转到主内容'
  skipLink.className = 'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md'

  skipLink.addEventListener('click', (e) => {
    e.preventDefault()
    const mainContent = document.getElementById('main-content')
    if (mainContent) {
      mainContent.focus()
      mainContent.scrollIntoView()
    }
  })

  document.body.insertBefore(skipLink, document.body.firstChild)
}

/**
 * Keyboard navigation for lists
 */
export function useKeyboardNavigation<T extends HTMLElement>(
  itemCount: number,
  options: {
    orientation?: 'vertical' | 'horizontal'
    loop?: boolean
    onSelect?: (index: number) => void
  } = {}
) {
  const { orientation = 'vertical', loop = true, onSelect } = options
  const containerRef = useRef<T>(null)
  const currentIndex = useRef(0)

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const isVertical = orientation === 'vertical'
      const nextKey = isVertical ? 'ArrowDown' : 'ArrowRight'
      const prevKey = isVertical ? 'ArrowUp' : 'ArrowLeft'

      if (e.key === nextKey) {
        e.preventDefault()
        currentIndex.current = loop
          ? (currentIndex.current + 1) % itemCount
          : Math.min(currentIndex.current + 1, itemCount - 1)
        focusItem(currentIndex.current)
      } else if (e.key === prevKey) {
        e.preventDefault()
        currentIndex.current = loop
          ? (currentIndex.current - 1 + itemCount) % itemCount
          : Math.max(currentIndex.current - 1, 0)
        focusItem(currentIndex.current)
      } else if (e.key === 'Home') {
        e.preventDefault()
        currentIndex.current = 0
        focusItem(0)
      } else if (e.key === 'End') {
        e.preventDefault()
        currentIndex.current = itemCount - 1
        focusItem(itemCount - 1)
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        onSelect?.(currentIndex.current)
      }
    },
    [itemCount, loop, orientation, onSelect]
  )

  const focusItem = (index: number) => {
    if (!containerRef.current) return

    const items = containerRef.current.querySelectorAll<HTMLElement>(
      '[role="option"], [role="menuitem"], [role="tab"]'
    )
    items[index]?.focus()
  }

  return { containerRef, handleKeyDown }
}

/**
 * Roving tabindex for composite widgets
 */
export function useRovingTabIndex(itemCount: number) {
  const activeIndex = useRef(0)

  const getTabIndex = useCallback(
    (index: number) => (index === activeIndex.current ? 0 : -1),
    []
  )

  const setActiveIndex = useCallback((index: number) => {
    activeIndex.current = index
  }, [])

  return { getTabIndex, setActiveIndex }
}
