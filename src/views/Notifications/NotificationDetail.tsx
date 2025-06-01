// campus-forward-desktop/src/views/Notifications/NotificationDetail.tsx
import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Button,
  Tag,
  Divider,
  Space,
  message,
  Tooltip,
  Flex,
  Image,
} from 'antd'
import {
  EyeOutlined,
  EyeInvisibleOutlined,
  PushpinOutlined,
  PushpinFilled,
} from '@ant-design/icons'
import Avatar from '@/components/Avatar/Avatar'
import { NotificationDetail as NotificationDetailType } from '@/types/notifications.type'
import apiClient from '@/lib/axios'
import { useAppNotificationsContext } from '@/contexts/AppNotificationsContext'
import { getImageUrl, getAttachmentUrl } from '@/utils/imageHelper'
import { getFileIcon } from '@/utils/fileIconHelper'
import './NotificationDetail.css'

// 格式化文件大小
const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) {
    return bytes + ' B';
  } else if (bytes < 1024 * 1024) {
    return (bytes / 1024).toFixed(1) + ' KB';
  } else if (bytes < 1024 * 1024 * 1024) {
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  } else {
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
  }
};

// 可以不需要notification属性，组件内部自己获取
interface NotificationDetailProps {}

const NotificationDetail: React.FC<NotificationDetailProps> = () => {
  const { id } = useParams<{ id: string }>() // 从路由参数获取ID
  const navigate = useNavigate()

  // 组件内部状态
  const [notification, setNotification] =
    useState<NotificationDetailType | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)
  const [isPinned, setIsPinned] = useState(false)
  const [isRead, setIsRead] = useState(false)

  const { bumpNotificationsVersion, fetchAndUpdateUnreadNotifications } =
    useAppNotificationsContext()

  // 获取通知详情
  useEffect(() => {
    if (!id) return

    const fetchNotificationDetail = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await apiClient.get(`/informs/receipt/${id}/detail`)
        const receipt = response.data
        const inform = receipt.inform

        if (!inform) {
          throw new Error('无法找到通知信息，响应格式可能有变化')
        }

        const formattedDetail: NotificationDetailType = {
          id: receipt._id,
          informId: inform._id,
          title: inform.title,
          contentFull: inform.content,
          description: inform.description,
          timestamp: new Date(
            inform.publishAt || inform.createdAt
          ).toLocaleString(),
          type: inform.tags?.[0] || '',
          sender: {
            name:
              inform.sender?.nickname || inform.sender?.realname || '未知用户',
            id: inform.sender?._id,
            avatar: inform.sender?.avatar,
          },
          isRead: receipt.isRead,
          isPinned: receipt.isPinned,
          importance: inform.importance,
          deadline: inform.deadline,
          attachments: inform.attachments || [],
        }

        setNotification(formattedDetail)
        setIsPinned(receipt.isPinned)
        setIsRead(receipt.isRead)

        // 删除自动标记为已读的逻辑
      } catch (err) {
        console.error('获取通知详情失败, 错误详情:', err)
        message.error('获取通知详情失败，请稍后重试')
        setError('获取通知详情失败，请稍后重试')
      } finally {
        setLoading(false)
      }
    }

    fetchNotificationDetail()
  }, [id])

  // 切换已读/未读状态
  const handleToggleReadStatus = async () => {
    if (!id || !notification) return

    setProcessing(true)
    try {
      // 根据当前状态决定调用哪个API
      if (isRead) {
        // 标记为未读
        await apiClient.post(`/informs/receipt/${id}/unread`)
        message.success('已标记为未读')
      } else {
        // 标记为已读
        await apiClient.post(`/informs/receipt/${id}/read`)
        message.success('已标记为已读')
      }

      // 更新状态
      const newReadStatus = !isRead
      setIsRead(newReadStatus)
      setNotification((prev) =>
        prev ? { ...prev, isRead: newReadStatus } : null
      )

      bumpNotificationsVersion()
      fetchAndUpdateUnreadNotifications()
    } catch (err) {
      console.error('切换已读状态失败:', err)
      message.error('操作失败，请稍后重试')
    } finally {
      setProcessing(false)
    }
  }

  // 处理置顶/取消置顶
  const handleTogglePin = async () => {
    if (!id) return

    setProcessing(true)
    try {
      await apiClient.post(`/informs/receipt/${id}/pin`, {
        isPinned: !isPinned,
      })
      setIsPinned(!isPinned)
      setNotification((prev) =>
        prev ? { ...prev, isPinned: !isPinned } : null
      )
      message.success(isPinned ? '已取消置顶' : '已置顶')

      bumpNotificationsVersion()
    } catch (err) {
      console.error('置顶操作失败:', err)
      message.error('操作失败，请稍后重试')
    } finally {
      setProcessing(false)
    }
  }

  // 根据重要性级别返回不同的标签
  const getImportanceTag = () => {
    if (!notification) return null

    switch (notification.importance) {
      case 'high':
        return <Tag color="red">重要</Tag>
      case 'medium':
        return <Tag color="orange">紧急</Tag>
      case 'low':
        return <Tag color="blue">一般</Tag>
      default:
        return <Tag>普通</Tag>
    }
  }

  // 处理文件下载
  const handleFileDownload = async (url: string, fileName: string) => {
    try {
      const result = await window.electron.ipcRenderer.invoke('save-file', {
        url: getAttachmentUrl(url),
        fileName,
        saveType: 'default',
        fileType: 'file'
      });

      if (result.success) {
        message.success('文件保存成功');
      } else {
        throw new Error(result.error || '保存失败');
      }
    } catch (error: any) {
      console.error('文件保存失败:', error);
      message.error(error?.message || '文件保存失败');
    }
  };

  // 渲染附件
  const renderAttachment = (attachment: any) => {
    // 改进图片类型判断逻辑
    const isImage = attachment.mimetype?.startsWith('image/') || 
                   /\.(jpg|jpeg|png|gif|webp)$/i.test(attachment.fileName);
    
    if (isImage) {
      return (
        <div key={attachment.url} className="notification-attachment-image">
          <Image
            src={getAttachmentUrl(attachment.url)}
            alt={attachment.fileName}
            width={200}
            style={{ borderRadius: '8px' }}
            preview={{
              mask: '预览图片',
              maskClassName: 'image-preview-mask',
              rootClassName: 'preview-root'
            }}
          />
          <div className="image-filename">
            {attachment.fileName}
          </div>
        </div>
      );
    }

    return (
      <div 
        key={attachment.url}
        className="notification-attachment-file clickable"
        onClick={() => handleFileDownload(attachment.url, attachment.fileName)}
      >
        <div className="file-content">
          <div className="file-info">
            <img 
              src={getFileIcon(attachment.fileName)} 
              alt="文件图标"
              className="file-icon"
            />
            <span className="file-name" title={attachment.fileName}>
              {attachment.fileName}
            </span>
          </div>
          <div className="file-size">
            {formatFileSize(attachment.size)}
            <span className="download-hint">点击下载</span>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return <div className="notification-loading">加载通知内容中...</div>
  }

  if (error) {
    return <div className="notification-error">加载失败: {error}</div>
  }

  if (!notification) {
    return (
      <div className="no-notification-selected">
        <p>未找到通知或通知已被删除。</p>
        <Button onClick={() => navigate('/notifications')}>返回通知列表</Button>
      </div>
    )
  }

  return (
    <div className="notification-detail">
      <Flex
        className="notification-header"
        justify="space-between"
        align="flex-end"
      >
        <h2>{notification.title}</h2>
        <Tooltip title={isPinned ? '取消置顶' : '置顶通知'}>
          <Button
            icon={isPinned ? <PushpinFilled /> : <PushpinOutlined />}
            onClick={handleTogglePin}
            loading={processing}
          />
        </Tooltip>
      </Flex>

      <p className="notification-info">
        <Flex justify="space-between" align="center">
          <span className="sender">
            <Avatar
              src={notification.sender?.avatar}
              style={{ marginRight: '8px' }}
            ></Avatar>
            <span>{notification.sender?.name}</span>
          </span>
          <span className="time">🕒 发布时间: {notification.timestamp}</span>
        </Flex>
      </p>

      <p className="notification-tags">
        <Space>
          {getImportanceTag()}
          {notification.type && <Tag>{notification.type}</Tag>}
        </Space>
      </p>

      <Divider />

      <div className="notification-body">
        {notification.contentFull.split('\n').map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </div>

      {notification.attachments && notification.attachments.length > 0 && (
        <div className="notification-attachments">
          <h4>附件:</h4>
          <div className="attachments-list">
            {notification.attachments.map((attachment) => renderAttachment(attachment))}
          </div>
        </div>
      )}

      <div className="notification-actions">
        <Space>
          <Button
            icon={isRead ? <EyeInvisibleOutlined /> : <EyeOutlined />}
            onClick={handleToggleReadStatus}
            loading={processing}
          >
            {isRead ? '标记为未读' : '标记为已读'}
          </Button>
        </Space>
      </div>
    </div>
  )
}

export default NotificationDetail
