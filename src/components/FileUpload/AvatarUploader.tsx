import React, { useState } from 'react'
import { Upload, message, Button, Avatar } from 'antd'
import {
  UploadOutlined,
  UserOutlined,
  LoadingOutlined,
} from '@ant-design/icons'
import './AvatarUploader.css'
import { getAvatarUrl } from '@/utils/imageHelper'

interface AvatarUploaderProps {
  /**
   * 当前头像URL
   */
  imageUrl?: string

  /**
   * 头像变更回调
   * @param file 选择的文件对象
   * @param previewUrl 预览URL (可能是本地临时URL或服务端返回的URL)
   */
  onFileSelected?: (file: File | null, previewUrl: string | null) => void

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
  imageUrl,
  onFileSelected,
  size = 100,
  disabled = false,
}) => {
  const [loading, setLoading] = useState(false)
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null)

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

    // 生成本地预览 URL
    const previewUrl = URL.createObjectURL(file)
    
    // 保存本地预览URL以便直接显示
    setLocalPreviewUrl(previewUrl)
    
    // 通知父组件
    if (onFileSelected) {
      onFileSelected(file, previewUrl)
    }

    return false // 阻止自动上传
  }

  // 确定要显示的最终URL：优先显示本地预览，如果没有则使用服务器URL
  const displayUrl = localPreviewUrl || (imageUrl ? getAvatarUrl(imageUrl) : undefined)

  return (
    <div className="avatar-uploader">
      <div className="avatar-wrapper">
        <Avatar
          src={displayUrl}
          size={size}
          icon={!displayUrl ? <UserOutlined /> : undefined}
        />
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
        disabled={disabled || loading}
        accept=".jpg,.jpeg,.png"
      >
        <Button
          icon={<UploadOutlined />}
          disabled={disabled || loading}
          style={{ marginTop: 8 }}
        >
          {loading ? '上传中...' : '更换头像'}
        </Button>
      </Upload>
    </div>
  )
}

export default AvatarUploader
