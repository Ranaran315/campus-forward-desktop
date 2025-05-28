import apiClient from '@/lib/axios'

/**
 * 文件上传服务
 * 处理各种文件上传的逻辑与API调用
 */
export class FileUploadService {
  /**
   * 上传通知附件
   * @param file 文件对象
   * @returns 上传结果
   */
  static async uploadNoticeAttachment(file: File) {
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await apiClient.post(
        '/informs/upload-attachment',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      )

      if (!response.data?.success) {
        throw new Error(response.data?.message || '上传失败')
      }

      return {
        ...response.data,
        name: file.name,
        originFileObj: file,
      }
    } catch (error: any) {
      console.error('附件上传失败:', error)
      throw new Error(error.message || '附件上传失败')
    }
  }

  /**
   * 上传头像
   * @param file 头像文件
   * @returns 上传结果
   */
  static async uploadAvatar(file: File) {
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await apiClient.post('/users/me/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      return response.data
    } catch (error: any) {
      console.error('头像上传失败:', error)
      throw new Error(error.message || '头像上传失败')
    }
  }

  /**
   * 上传聊天图片或文件
   * @param file 文件对象
   * @returns 上传结果
   */
  static async uploadChatFile(file: File) {
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await apiClient.post('/chat/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      return response.data
    } catch (error: any) {
      console.error('聊天文件上传失败:', error)
      throw new Error(error.message || '聊天文件上传失败')
    }
  }

  /**
   * 通用文件上传方法
   * @param file 文件对象
   * @param type 上传类型
   * @returns 上传结果
   */
  static async uploadFile(file: File, type: string) {
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await apiClient.post(`/upload/${type}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      return response.data
    } catch (error: any) {
      console.error(`${type}类型文件上传失败:`, error)
      throw new Error(error.message || '文件上传失败')
    }
  }
}
