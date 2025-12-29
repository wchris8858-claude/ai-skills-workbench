/**
 * 前端图片压缩工具
 * 在上传前压缩图片以减少传输大小和 API 调用成本
 */

export interface CompressionOptions {
  maxWidth?: number      // 最大宽度，默认 1920
  maxHeight?: number     // 最大高度，默认 1080
  quality?: number       // 压缩质量 0-1，默认 0.8
  maxSizeKB?: number     // 最大文件大小 KB，默认 500
}

const DEFAULT_OPTIONS: Required<CompressionOptions> = {
  maxWidth: 1920,
  maxHeight: 1080,
  quality: 0.8,
  maxSizeKB: 500,
}

/**
 * 压缩图片文件
 * @param file 原始图片文件
 * @param options 压缩选项
 * @returns 压缩后的 File 对象
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<File> {
  const opts = { ...DEFAULT_OPTIONS, ...options }

  // 如果文件已经足够小，直接返回
  if (file.size <= opts.maxSizeKB * 1024) {
    return file
  }

  return new Promise((resolve, reject) => {
    const img = new Image()
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      reject(new Error('无法创建 canvas context'))
      return
    }

    img.onload = () => {
      // 计算压缩后的尺寸
      let { width, height } = img

      if (width > opts.maxWidth) {
        height = (height * opts.maxWidth) / width
        width = opts.maxWidth
      }

      if (height > opts.maxHeight) {
        width = (width * opts.maxHeight) / height
        height = opts.maxHeight
      }

      canvas.width = width
      canvas.height = height

      // 绘制压缩后的图片
      ctx.drawImage(img, 0, 0, width, height)

      // 尝试不同质量级别直到满足大小要求
      let quality = opts.quality
      const minQuality = 0.3

      const tryCompress = () => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('图片压缩失败'))
              return
            }

            // 如果还是太大且质量还能降低，继续压缩
            if (blob.size > opts.maxSizeKB * 1024 && quality > minQuality) {
              quality -= 0.1
              tryCompress()
              return
            }

            // 创建新的 File 对象
            const compressedFile = new File(
              [blob],
              file.name.replace(/\.[^/.]+$/, '.jpg'),
              { type: 'image/jpeg' }
            )

            resolve(compressedFile)
          },
          'image/jpeg',
          quality
        )
      }

      tryCompress()
    }

    img.onerror = () => {
      reject(new Error('图片加载失败'))
    }

    // 从文件创建图片 URL
    img.src = URL.createObjectURL(file)
  })
}

/**
 * 压缩图片并转换为 base64
 * @param file 原始图片文件
 * @param options 压缩选项
 * @returns 压缩后的 base64 字符串（包含 data URL 前缀）
 */
export async function compressImageToBase64(
  file: File,
  options: CompressionOptions = {}
): Promise<string> {
  const opts = { ...DEFAULT_OPTIONS, ...options }

  return new Promise((resolve, reject) => {
    const img = new Image()
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      reject(new Error('无法创建 canvas context'))
      return
    }

    img.onload = () => {
      // 计算压缩后的尺寸
      let { width, height } = img

      if (width > opts.maxWidth) {
        height = (height * opts.maxWidth) / width
        width = opts.maxWidth
      }

      if (height > opts.maxHeight) {
        width = (width * opts.maxHeight) / height
        height = opts.maxHeight
      }

      canvas.width = width
      canvas.height = height

      // 绘制压缩后的图片
      ctx.drawImage(img, 0, 0, width, height)

      // 尝试不同质量级别
      let quality = opts.quality
      const minQuality = 0.3

      const tryCompress = (): string => {
        const dataUrl = canvas.toDataURL('image/jpeg', quality)

        // 估算 base64 大小（base64 比原始大约 33%）
        const estimatedSize = (dataUrl.length * 3) / 4

        if (estimatedSize > opts.maxSizeKB * 1024 && quality > minQuality) {
          quality -= 0.1
          return tryCompress()
        }

        return dataUrl
      }

      const result = tryCompress()
      URL.revokeObjectURL(img.src)
      resolve(result)
    }

    img.onerror = () => {
      URL.revokeObjectURL(img.src)
      reject(new Error('图片加载失败'))
    }

    img.src = URL.createObjectURL(file)
  })
}

/**
 * 获取图片文件信息
 */
export function getImageInfo(file: File): {
  name: string
  size: number
  sizeFormatted: string
  type: string
} {
  const sizeKB = file.size / 1024
  const sizeMB = sizeKB / 1024

  return {
    name: file.name,
    size: file.size,
    sizeFormatted: sizeMB >= 1
      ? `${sizeMB.toFixed(2)} MB`
      : `${sizeKB.toFixed(0)} KB`,
    type: file.type,
  }
}
