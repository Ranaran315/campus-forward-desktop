import React, { useState } from 'react'
import { Upload, message, Button, Avatar } from 'antd'
import {
  UploadOutlined,
  UserOutlined,
  LoadingOutlined,
} from '@ant-design/icons'
import { FileUploadService } from '@/services/FileUploadService'
import './AvatarUploader.css'

interface AvatarUploaderProps {
  /**
   * 当前头像URL
   */
  value?: string

  /**
   * 头像变更回调
   */
  onChange?: (url: string) => void

  /**
   * 头像大小
   */
  size?: number

  /**
   * 是否禁用
   */
  disabled?: boolean
}

/**
 * 头像上传组件
 */
const AvatarUploader: React.FC<AvatarUploaderProps> = ({
  value,
  onChange,
  size = 100,
  disabled = false,
}) => {
  const [loading, setLoading] = useState(false)

  // 上传前检查文件大小和类型
  const beforeUpload = (file: File) => {
    const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png'
    if (!isJpgOrPng) {
      message.error('请上传JPG或PNG格式的图片!')
      return Upload.LIST_IGNORE
    }

    const isLt2M = file.size / 1024 / 1024 < 2
    if (!isLt2M) {
      message.error('图片大小不能超过2MB!')
      return Upload.LIST_IGNORE
    }

    return true
  }

  // 自定义上传实现
  const customRequest = async (options: any) => {
    const { file, onSuccess, onError } = options
    setLoading(true)

    try {
      const result = await FileUploadService.uploadAvatar(file)

      if (result.url && onChange) {
        onChange(result.url)
      }

      onSuccess(result, file)
      message.success('头像上传成功!')
    } catch (error: any) {
      onError(error)
      message.error(`头像上传失败: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="avatar-uploader">
      <div className="avatar-wrapper">
        {value ? (
          <Avatar src={value} size={size} icon={<UserOutlined />} />
        ) : (
          <Avatar size={size} icon={<UserOutlined />} />
        )}
        {loading && (
          <div className="loading-overlay">
            <LoadingOutlined style={{ fontSize: 24 }} />
          </div>
        )}
      </div>

      <Upload
        name="avatar"
        showUploadList={false}
        beforeUpload={beforeUpload}
        customRequest={customRequest}
        disabled={disabled || loading}
        accept=".jpg,.jpeg,.png"
      >
        <Button
          icon={<UploadOutlined />}
          disabled={disabled || loading}
          size="small"
          style={{ marginTop: 8 }}
        >
          {loading ? '上传中...' : '更换头像'}
        </Button>
      </Upload>
    </div>
  )
}

export default AvatarUploader
