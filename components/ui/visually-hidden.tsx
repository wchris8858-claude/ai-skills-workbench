/**
 * Visually Hidden Component
 *
 * Hides content visually but keeps it accessible to screen readers
 */

import { cn } from '@/lib/utils'

interface VisuallyHiddenProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode
  /**
   * Make visible when focused (for skip links)
   */
  focusable?: boolean
}

export function VisuallyHidden({
  children,
  focusable = false,
  className,
  ...props
}: VisuallyHiddenProps) {
  return (
    <span
      className={cn(
        'sr-only',
        focusable &&
          'focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md',
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}

/**
 * Screen Reader Only Text
 * Alternative name for clarity
 */
export const ScreenReaderOnly = VisuallyHidden
