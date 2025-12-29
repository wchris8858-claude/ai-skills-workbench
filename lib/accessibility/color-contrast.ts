/**
 * Color Contrast Utilities
 *
 * Ensure WCAG 2.1 AA/AAA compliance for text contrast
 */

/**
 * Convert hex color to RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null
}

/**
 * Calculate relative luminance
 * https://www.w3.org/WAI/GL/wiki/Relative_luminance
 */
function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const sRGB = c / 255
    return sRGB <= 0.03928 ? sRGB / 12.92 : Math.pow((sRGB + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
}

/**
 * Calculate contrast ratio between two colors
 * https://www.w3.org/WAI/GL/wiki/Contrast_ratio
 */
export function getContrastRatio(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1)
  const rgb2 = hexToRgb(color2)

  if (!rgb1 || !rgb2) return 0

  const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b)
  const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b)

  const lighter = Math.max(lum1, lum2)
  const darker = Math.min(lum1, lum2)

  return (lighter + 0.05) / (darker + 0.05)
}

/**
 * Check if contrast meets WCAG AA standard
 * - Normal text: 4.5:1
 * - Large text (18pt+ or 14pt+ bold): 3:1
 */
export function meetsWCAG_AA(
  foreground: string,
  background: string,
  isLargeText: boolean = false
): boolean {
  const ratio = getContrastRatio(foreground, background)
  const threshold = isLargeText ? 3 : 4.5
  return ratio >= threshold
}

/**
 * Check if contrast meets WCAG AAA standard
 * - Normal text: 7:1
 * - Large text: 4.5:1
 */
export function meetsWCAG_AAA(
  foreground: string,
  background: string,
  isLargeText: boolean = false
): boolean {
  const ratio = getContrastRatio(foreground, background)
  const threshold = isLargeText ? 4.5 : 7
  return ratio >= threshold
}

/**
 * Get contrast level description
 */
export function getContrastLevel(
  foreground: string,
  background: string,
  isLargeText: boolean = false
): 'AAA' | 'AA' | 'Fail' {
  if (meetsWCAG_AAA(foreground, background, isLargeText)) return 'AAA'
  if (meetsWCAG_AA(foreground, background, isLargeText)) return 'AA'
  return 'Fail'
}

/**
 * Suggest accessible text color based on background
 */
export function getAccessibleTextColor(background: string): string {
  const rgb = hexToRgb(background)
  if (!rgb) return '#000000'

  const luminance = getLuminance(rgb.r, rgb.g, rgb.b)
  // If background is light, use dark text; if dark, use light text
  return luminance > 0.5 ? '#000000' : '#FFFFFF'
}

/**
 * Validate color palette for accessibility
 */
export interface ColorPair {
  foreground: string
  background: string
  usage: string
  isLargeText?: boolean
}

export interface ColorValidationResult {
  pair: ColorPair
  ratio: number
  level: 'AAA' | 'AA' | 'Fail'
  passes: boolean
}

export function validateColorPalette(
  pairs: ColorPair[],
  standard: 'AA' | 'AAA' = 'AA'
): ColorValidationResult[] {
  return pairs.map((pair) => {
    const ratio = getContrastRatio(pair.foreground, pair.background)
    const level = getContrastLevel(
      pair.foreground,
      pair.background,
      pair.isLargeText
    )
    const passes =
      standard === 'AAA'
        ? meetsWCAG_AAA(pair.foreground, pair.background, pair.isLargeText)
        : meetsWCAG_AA(pair.foreground, pair.background, pair.isLargeText)

    return { pair, ratio, level, passes }
  })
}
