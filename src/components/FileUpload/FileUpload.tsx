import React, { useState } from 'react'
import { Upload, Button, message, UploadProps, UploadFile } from 'antd'
import { UploadOutlined } from '@ant-design/icons'
import apiClient from '@/lib/axios'
import './FileUpload.css'

export interface FileUploadProps {
  /**
   * 上传类型，对应后端不同的业务目录
   * 'avatar' | 'chat' | 'inform-attachments' | 'images' 等
   */
  uploadType: string

  /**
   * 文件列表变化的回调
   */
  onChange?: (fileList: UploadFile[]) => void

  /**
   * 自定义上传按钮文字
   */
  buttonText?: string

  /**
   * Upload组件的listType
   */
  listType?: UploadProps['listType']

  /**
   * 最大文件尺寸(MB)
   */
  maxSize?: number

  /**
   * 是否允许多文件上传
   */
  multiple?: boolean

  /**
   * 允许的文件类型
   */
  accept?: string

  /**
   * 默认文件列表
   */
  defaultFileList?: UploadFile[]

  /**
   * 自定义请求
   */
  customRequest?: UploadProps['customRequest']
}

const FileUpload: React.FC<FileUploadProps> = ({
  uploadType = 'other',
  onChange,
  buttonText = '上传文件',
  listType = 'text',
  maxSize = 10,
  multiple = false,
  accept,
  defaultFileList = [],
  customRequest,
}) => {
  const [fileList, setFileList] = useState<UploadFile[]>(defaultFileList)

  // 检查文件大小
  const beforeUpload = (file: File) => {
    const isLimitExceeded = file.size / 1024 / 1024 > maxSize
    if (isLimitExceeded) {
      message.error(`文件大小不能超过 ${maxSize}MB!`)
      return Upload.LIST_IGNORE
    }
    return true
  }

  // 处理文件列表变化
  const handleChange: UploadProps['onChange'] = ({ fileList: newFileList }) => {
    setFileList(newFileList)
    if (onChange) {
      onChange(newFileList)
    }
  }

  // 自定义上传操作
  const handleCustomRequest =
    customRequest ||
    (async ({ file, onSuccess, onError }) => {
      try {
        const formData = new FormData()
        formData.append('file', file)

        const response = await apiClient.post(
          `/upload/${uploadType}`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          }
        )

        if (response?.data?.success) {
          onSuccess && onSuccess(response.data)
        } else {
          throw new Error(response?.data?.message || '上传失败')
        }
      } catch (error: any) {
        console.error('文件上传失败:', error)
        onError && onError(error)
        message.error(`文件上传失败: ${error.message || '未知错误'}`)
      }
    })

  // 上传组件属性
  const uploadProps: UploadProps = {
    name: 'file',
    multiple,
    listType,
    fileList,
    beforeUpload,
    onChange: handleChange,
    customRequest: handleCustomRequest as any,
    accept,
  }
  return (
    <div className="file-upload-container">
      <Upload {...uploadProps}>
        <Button icon={<UploadOutlined />}>{buttonText}</Button>
      </Upload>
    </div>
  )
}

export default FileUpload
