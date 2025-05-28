import appConfig from '@/config/appConfig'

/**
 * 获取完整的图片URL
 * @param path 图片路径
 * @returns 完整的图片URL
 */
export function getImageUrl(path: string | undefined | null): string {
  if (!path) return ''

  // 如果已经是完整URL（包含http或https），则直接返回
  if (
    path.startsWith('http://') ||
    path.startsWith('https://') ||
    path.startsWith('blob:') ||
    path.startsWith('data:')
  ) {
    return path
  }

  // 确保路径以/开头
  const normalizedPath = path.startsWith('/') ? path : `/${path}`

  return `${appConfig.STATIC_BASE_URL}${normalizedPath}`
}

/**
 * 获取头像URL
 * @param avatarPath 头像路径
 * @returns 完整的头像URL
 */
export function getAvatarUrl(path: string | undefined | null): string {
  return getImageUrl(path)
}

/**
 * 获取附件URL
 * @param attachmentPath 附件路径
 * @returns 完整的附件URL
 */
export function getAttachmentUrl(
  attachmentPath: string | undefined | null
): string {
  return getImageUrl(attachmentPath)
}
