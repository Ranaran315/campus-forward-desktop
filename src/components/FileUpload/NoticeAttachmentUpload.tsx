import React from 'react'
import { UploadFile, Upload, Button, message } from 'antd'
import { UploadOutlined } from '@ant-design/icons'
import { FileUploadService } from '@/services/FileUploadService'
import './NoticeAttachmentUpload.css'

interface NoticeAttachmentUploadProps {
  value?: UploadFile[]
  onChange?: (fileList: UploadFile[]) => void
  maxSize?: number
  multiple?: boolean
  disabled?: boolean
}

/**
 * 通知附件上传组件
 * 专门用于处理通知相关的附件上传
 */
const NoticeAttachmentUpload: React.FC<NoticeAttachmentUploadProps> = ({
  value = [],
  onChange,
  maxSize = 10,
  multiple = true,
  disabled = false,
}) => {
  // 文件上传前检查
  const beforeUpload = (file: File) => {
    const isLimitExceeded = file.size / 1024 / 1024 > maxSize
    if (isLimitExceeded) {
      message.error(`文件大小不能超过 ${maxSize}MB!`)
      return Upload.LIST_IGNORE
    }
    return true
  }

  // 从Form.Item获取值，处理onChange回调
  const handleChange = ({ fileList }: { fileList: UploadFile[] }) => {
    if (onChange) {
      onChange(fileList)
    }
  }

  // 自定义上传实现
  const customRequest = async (options: any) => {
    const { file, onSuccess, onError, onProgress } = options

    try {
      // 模拟进度
      onProgress && onProgress({ percent: 50 })

      // 调用服务上传文件
      const result = await FileUploadService.uploadNoticeAttachment(file)

      onProgress && onProgress({ percent: 100 })
      onSuccess(result, file)
    } catch (error: any) {
      onError(error)
      message.error(`附件上传失败: ${error.message}`)
    }
  }

  // 文件类型限制
  const acceptTypes =
    '.jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar,.txt'
  return (
    <div className="notice-attachment-upload">
      <Upload
        name="file"
        listType="picture"
        fileList={value}
        beforeUpload={beforeUpload}
        onChange={handleChange}
        customRequest={customRequest}
        multiple={multiple}
        disabled={disabled}
        accept={acceptTypes}
      >
        <Button icon={<UploadOutlined />} disabled={disabled}>
          上传附件
        </Button>
      </Upload>
    </div>
  )
}

export default NoticeAttachmentUpload
