// campus-forward-desktop/src/views/Notifications/NotificationDetail.tsx
import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button, Tag, Divider, Space, message, Tooltip } from 'antd'
import {
  EyeOutlined,
  DeleteOutlined,
  PushpinOutlined,
  PushpinFilled,
} from '@ant-design/icons'
import { NotificationDetail as NotificationDetailType } from '@/types/notifications.type'
import apiClient from '@/lib/axios'

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

  // 获取通知详情
  useEffect(() => {
    if (!id) return

    const fetchNotificationDetail = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await apiClient.get(`/informs/receipt/${id}`)

        // 1. 检查响应格式
        const receipt = response.data

        // 2. 找到inform
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

        // 如果通知未读，自动标记为已读
        if (!receipt.isRead) {
          markAsRead(receipt._id)
        }
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

  // 标记为已读
  const markAsRead = async (receiptId: string) => {
    try {
      await apiClient.post(`/informs/${receiptId}/read`)
      // 不需要显示消息，这是自动操作
    } catch (err) {
      console.error('标记已读失败:', err)
    }
  }

  // 处理标记为已读按钮点击
  const handleMarkAsRead = async () => {
    if (!id || !notification || notification.isRead) return

    setProcessing(true)
    try {
      await apiClient.post(`/informs/${id}/read`)
      message.success('已标记为已读')
      setNotification((prev) => (prev ? { ...prev, isRead: true } : null))
    } catch (err) {
      console.error('标记已读失败:', err)
      message.error('操作失败，请稍后重试')
    } finally {
      setProcessing(false)
    }
  }

  // 处理删除通知
  const handleDelete = async () => {
    if (!id) return

    setProcessing(true)
    try {
      await apiClient.delete(`/informs/${id}/receipt`)
      message.success('已从列表中移除')
      // 删除后返回通知列表
      navigate('/notifications')
    } catch (err) {
      console.error('删除通知失败:', err)
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
      await apiClient.post(`/informs/${id}/pin`, { isPinned: !isPinned })
      setIsPinned(!isPinned)
      setNotification((prev) =>
        prev ? { ...prev, isPinned: !isPinned } : null
      )
      message.success(isPinned ? '已取消置顶' : '已置顶')
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
        return <Tag color="orange">一般</Tag>
      case 'low':
      default:
        return <Tag color="blue">普通</Tag>
    }
  }

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
    <div className="notification-content">
      <div className="notification-header">
        <h2>{notification.title}</h2>
        <div className="notification-meta">
          <Space>
            {getImportanceTag()}
            {notification.type && <Tag>{notification.type}</Tag>}
          </Space>
        </div>
      </div>

      <p className="notification-info">
        <span className="sender">
          发件人: {notification.sender?.name || '系统通知'}
        </span>
        <span className="time">发布时间: {notification.timestamp}</span>
        {notification.deadline && (
          <span className="deadline">
            截止时间: {new Date(notification.deadline).toLocaleString()}
          </span>
        )}
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
          <ul>
            {notification.attachments.map((attachment, index) => (
              <li key={index}>
                <a
                  href={attachment.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {attachment.fileName}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="notification-actions">
        <Space>
          {!notification.isRead && (
            <Button
              icon={<EyeOutlined />}
              onClick={handleMarkAsRead}
              loading={processing}
            >
              标记为已读
            </Button>
          )}
          <Tooltip title={isPinned ? '取消置顶' : '置顶通知'}>
            <Button
              icon={isPinned ? <PushpinFilled /> : <PushpinOutlined />}
              onClick={handleTogglePin}
              loading={processing}
            />
          </Tooltip>
          <Button
            icon={<DeleteOutlined />}
            onClick={handleDelete}
            loading={processing}
            danger
          >
            删除
          </Button>
        </Space>
      </div>
    </div>
  )
}

export default NotificationDetail
