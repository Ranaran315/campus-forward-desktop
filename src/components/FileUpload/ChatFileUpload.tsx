import React, { useState } from 'react'
import { UploadFile, Upload, Button, message, Modal, Image } from 'antd'
import {
  UploadOutlined,
  FileImageOutlined,
  FileOutlined,
} from '@ant-design/icons'
import { FileUploadService } from '@/services/FileUploadService'
import './ChatFileUpload.css'

interface ChatFileUploadProps {
  /**
   * 上传完成后的回调
   */
  onUploadComplete?: (fileData: any) => void

  /**
   * 最大文件尺寸(MB)
   */
  maxSize?: number

  /**
   * 是否禁用
   */
  disabled?: boolean

  /**
   * 是否显示预览
   */
  showPreview?: boolean

  /**
   * 是否仅允许图片
   */
  imagesOnly?: boolean
}

/**
 * 聊天文件上传组件
 * 用于处理聊天图片和文件的上传
 */
const ChatFileUpload: React.FC<ChatFileUploadProps> = ({
  onUploadComplete,
  maxSize = 20,
  disabled = false,
  showPreview = true,
  imagesOnly = false,
}) => {
  const [fileList, setFileList] = useState<UploadFile[]>([])
  const [previewVisible, setPreviewVisible] = useState(false)
  const [previewImage, setPreviewImage] = useState('')
  const [uploading, setUploading] = useState(false)

  // 检查文件大小和类型
  const beforeUpload = (file: File) => {
    // 检查文件大小
    const isLimitExceeded = file.size / 1024 / 1024 > maxSize
    if (isLimitExceeded) {
      message.error(`文件大小不能超过 ${maxSize}MB!`)
      return Upload.LIST_IGNORE
    }

    // 如果仅允许图片，则检查文件类型
    if (imagesOnly) {
      const isImage = file.type.startsWith('image/')
      if (!isImage) {
        message.error('只能上传图片文件!')
        return Upload.LIST_IGNORE
      }
    }

    return true
  }

  // 自定义上传实现
  const customRequest = async (options: any) => {
    const { file, onSuccess, onError, onProgress } = options
    setUploading(true)

    try {
      // 模拟上传进度
      onProgress && onProgress({ percent: 50 })

      // 调用服务上传文件
      const result = await FileUploadService.uploadChatFile(file)

      onProgress && onProgress({ percent: 100 })
      onSuccess(result, file)

      // 调用完成回调
      if (onUploadComplete) {
        onUploadComplete({
          ...result,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
        })
      }

      // 清空文件列表
      setFileList([])
      message.success('文件上传成功')
    } catch (error: any) {
      onError(error)
      message.error(`文件上传失败: ${error.message || '未知错误'}`)
    } finally {
      setUploading(false)
    }
  }

  // 处理预览
  const handlePreview = async (file: UploadFile) => {
    // 只有图片才预览
    if (!file.url && !file.preview) {
      if (file.originFileObj && file.type?.startsWith('image/')) {
        file.preview = await getBase64(file.originFileObj)
      }
    }

    // 如果是图片则显示预览
    if (
      file.type?.startsWith('image/') ||
      file.url?.match(/\.(jpeg|jpg|gif|png)$/i)
    ) {
      setPreviewImage(file.url || file.preview || '')
      setPreviewVisible(true)
    }
  }

  // 将文件转换为Base64以便预览
  const getBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = (error) => reject(error)
    })
  }

  // 生成文件图标
  const IconRenderer = (file: UploadFile) => {
    if (
      file.type?.startsWith('image/') ||
      file.url?.match(/\.(jpeg|jpg|gif|png)$/i)
    ) {
      return <FileImageOutlined />
    }
    return <FileOutlined />
  }

  // 设置接受的文件类型
  const acceptTypes = imagesOnly
    ? 'image/png,image/jpeg,image/gif,image/jpg'
    : undefined

  return (
    <div className="chat-file-upload">
      <Upload
        name="file"
        listType="picture"
        fileList={fileList}
        beforeUpload={beforeUpload}
        onChange={({ fileList }) => setFileList(fileList)}
        customRequest={customRequest}
        disabled={disabled || uploading}
        showUploadList={{
          showPreviewIcon: showPreview,
          showDownloadIcon: false,
          showRemoveIcon: true,
          removeIcon: (
            <Button type="text" size="small">
              删除
            </Button>
          ),
        }}
        onPreview={handlePreview}
        iconRender={IconRenderer}
        accept={acceptTypes}
      >
        <Button
          icon={<UploadOutlined />}
          loading={uploading}
          disabled={disabled || uploading}
        >
          {uploading ? '上传中...' : imagesOnly ? '发送图片' : '发送文件'}
        </Button>
      </Upload>

      {showPreview && (
        <Modal
          open={previewVisible}
          title="图片预览"
          footer={null}
          onCancel={() => setPreviewVisible(false)}
        >
          <Image
            alt="预览图片"
            style={{ width: '100%' }}
            src={previewImage}
            preview={false}
          />
        </Modal>
      )}
    </div>
  )
}

export default ChatFileUpload
