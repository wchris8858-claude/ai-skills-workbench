/**
 * ARIA Live Region Announcer
 *
 * Manages screen reader announcements for dynamic content updates
 */

export type AriaLivePoliteness = 'polite' | 'assertive' | 'off'

export interface AriaLiveOptions {
  politeness?: AriaLivePoliteness
  atomic?: boolean
  relevant?: 'additions' | 'removals' | 'text' | 'all'
  delay?: number
}

class AriaLiveAnnouncer {
  private liveRegions: Map<AriaLivePoliteness, HTMLDivElement>

  constructor() {
    this.liveRegions = new Map()
    if (typeof window !== 'undefined') {
      this.initialize()
    }
  }

  /**
   * Initialize ARIA live regions
   */
  private initialize(): void {
    const politenessLevels: AriaLivePoliteness[] = ['polite', 'assertive']

    politenessLevels.forEach((level) => {
      const region = document.createElement('div')
      region.setAttribute('aria-live', level)
      region.setAttribute('aria-atomic', 'true')
      region.setAttribute('role', 'status')
      region.className = 'sr-only'
      region.style.cssText = `
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border-width: 0;
      `
      document.body.appendChild(region)
      this.liveRegions.set(level, region)
    })
  }

  /**
   * Announce a message to screen readers
   */
  announce(message: string, options: AriaLiveOptions = {}): void {
    if (typeof window === 'undefined') return

    const {
      politeness = 'polite',
      atomic = true,
      relevant = 'additions',
      delay = 100,
    } = options

    const region = this.liveRegions.get(politeness)
    if (!region) return

    // Update attributes
    region.setAttribute('aria-atomic', atomic.toString())
    region.setAttribute('aria-relevant', relevant)

    // Clear and announce with delay to ensure screen readers pick it up
    region.textContent = ''
    setTimeout(() => {
      region.textContent = message
    }, delay)
  }

  /**
   * Announce loading state
   */
  announceLoading(message: string = '正在加载'): void {
    this.announce(message, { politeness: 'polite' })
  }

  /**
   * Announce success
   */
  announceSuccess(message: string): void {
    this.announce(message, { politeness: 'polite' })
  }

  /**
   * Announce error
   */
  announceError(message: string): void {
    this.announce(message, { politeness: 'assertive' })
  }

  /**
   * Announce page navigation
   */
  announceNavigation(pageName: string): void {
    this.announce(`导航到${pageName}`, { politeness: 'polite' })
  }

  /**
   * Cleanup live regions
   */
  cleanup(): void {
    this.liveRegions.forEach((region) => {
      region.remove()
    })
    this.liveRegions.clear()
  }
}

// Global instance
export const ariaLiveAnnouncer = new AriaLiveAnnouncer()

/**
 * Hook for using ARIA live announcer
 */
export function useAriaLive() {
  return {
    announce: (message: string, options?: AriaLiveOptions) =>
      ariaLiveAnnouncer.announce(message, options),
    announceLoading: (message?: string) =>
      ariaLiveAnnouncer.announceLoading(message),
    announceSuccess: (message: string) =>
      ariaLiveAnnouncer.announceSuccess(message),
    announceError: (message: string) => ariaLiveAnnouncer.announceError(message),
    announceNavigation: (pageName: string) =>
      ariaLiveAnnouncer.announceNavigation(pageName),
  }
}
