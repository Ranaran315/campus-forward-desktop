import apiClient from '@/lib/axios'
import appConfig from '@/config/appConfig'

/**
 * 文件上传服务
 * 处理各种文件上传的逻辑与API调用
 */
export class FileUploadService {
  /**
   * 上传文件并返回文件路径
   * @param file 要上传的文件
   * @param type 文件类型（如'avatars', 'attachments'等）
   * @returns 上传结果，包含相对路径
   */
  static async uploadFile(file: File, type: string) {
    const formData = new FormData()
    formData.append('file', file)

    const res = await apiClient.post(`/upload/${type}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })

    return res.data
  }

  /**
   * 获取文件的完整URL
   * @param path 文件相对路径
   * @returns 完整的文件URL
   */
  static getFileUrl(path: string) {
    if (!path) return ''

    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path
    }

    const normalizedPath = path.startsWith('/') ? path : `/${path}`
    return `${appConfig.STATIC_BASE_URL}${normalizedPath}`
  }

  /**
   * 上传头像
   * @param file 头像文件
   * @returns 上传结果
   */
  static async uploadAvatar(file: File) {
    return this.uploadFile(file, 'avatars')
  }

  /**
   * 上传通知附件
   * @param file 附件文件
   * @returns 上传结果
   */
  static async uploadNoticeAttachment(file: File) {
    return this.uploadFile(file, 'inform-attachments')
  }

  /**
   * 上传聊天文件
   * @param file 附件文件
   * @returns 上传结果
   */
  static async uploadChatFile(file: File) {
    return this.uploadFile(file, 'chat-files')
  }
}
