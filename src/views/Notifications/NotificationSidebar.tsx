import React, { useState, useEffect } from 'react'
import './NotificationSidebar.css'
import { InputField } from '@/components/Form/Form'
import FilterIcon from '@/assets/icons/filter.svg?react'
import AddIcon from '@/assets/icons/add.svg?react'
import EditIcon from '@/assets/icons/edit.svg?react'
import ArrowRight from '@/assets/icons/arrow_right.svg?react'
import { UserProfile } from '@/types/user.types'
import Avatar from '@/components/Avatar/Avatar'
import Button from '@/components/Button/Button'
import { matchPath, useLocation, useNavigate } from 'react-router-dom'
import apiClient from '@/lib/axios'

interface NotificationItem {
  id: string
  title: string
  summary: string // 简要内容
  timestamp: string
  unread?: boolean
  sender: Partial<UserProfile>
  tags?: string[]
  importance?: 'high' | 'medium' | 'low'
}

interface NotificationsSidebarProps {
  onNotificationSelect: (notificationId: string) => void
  selectedNotificationId: string | null
  isMyPublishedButtonActive?: boolean
}

const NotificationsSidebar: React.FC<NotificationsSidebarProps> = ({
  onNotificationSelect,
  selectedNotificationId,
}) => {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [searchQuery, setSearchQuery] = useState('')
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isMyPublishedButtonActive =
    matchPath({ path: '/notifications/my-created', end: false }, pathname) !=
    null

  const handleSearchChange = (_name: string, value: string) => {
    // Mark name as unused
    setSearchQuery(value)
  }

  // 获取通知列表
  useEffect(() => {
    const fetchNotifications = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await apiClient.get('/informs/my-informs', {
          params: {
            // 可以添加分页和筛选参数
            page: 1,
            limit: 20,
            searchQuery: searchQuery || undefined,
          },
        })

        // 注意：后端返回的是 response.data.data
        const notificationItems = response.data.data || []

        const notifications = notificationItems.map((item: any) => {
          // 从回执和通知数据中提取信息
          const inform = item.informId
          const sender = inform.senderId

          return {
            id: item._id, // 回执ID
            informId: inform._id, // 通知本身的ID
            title: inform.title,
            summary: inform.description || inform.content?.substring(0, 100),
            timestamp: new Date(
              inform.publishAt || inform.createdAt
            ).toLocaleDateString(),
            unread: !item.isRead,
            isRead: item.isRead,
            isPinned: item.isPinned,
            sender: {
              name: sender.nickname || sender.realname || '未知用户',
              id: sender._id,
              avatar: sender.avatar, // 头像URL
            },
            tags: inform.tags || [],
            importance: inform.importance,
            deadline: inform.deadline,
            receivedAt: new Date(item.receivedAt).toLocaleDateString(),
          }
        })

        setNotifications(notifications)

        // 如果需要获取发送者信息，可以额外发送请求
        // 或者在后端确保senderId被正确填充为用户对象
      } catch (err) {
        console.error('获取通知列表失败:', err)
        setError('获取通知列表失败，请稍后重试')
      } finally {
        setLoading(false)
      }
    }

    fetchNotifications()
  }, [searchQuery]) // 当搜索条件变化时重新获取

  return (
    <aside className="notifications-sidebar">
      <>
        <div className="notifications-header">
          <div className="search-box">
            <InputField
              name="searchNotifications"
              type="text"
              placeholder="搜索通知"
              value={searchQuery}
              onChange={handleSearchChange}
              theme="search"
            />
          </div>
          <button className="filter-btn" title="筛选通知">
            <FilterIcon />
          </button>
        </div>

        <div className="notifications-functions">
          <div
            className={`function-item ${
              isMyPublishedButtonActive ? 'active' : ''
            }`}
            onClick={() => navigate('/notifications/my-created')}
          >
            <EditIcon />
            <span className="function-text">我创建的通知</span>
            <ArrowRight style={{ marginLeft: 'auto' }} />
          </div>
        </div>

        <div className="notifications-list-container">
          {loading ? (
            <div className="loading-indicator">加载中...</div>
          ) : error ? (
            <div className="error-message">{error}</div>
          ) : notifications.length === 0 ? (
            <div className="empty-state">
              {searchQuery ? '没有找到匹配的通知' : '暂无通知'}
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`notification-item ${
                  notification.unread ? 'unread' : ''
                } ${
                  selectedNotificationId === notification.id ? 'active' : ''
                }`}
                onClick={() => onNotificationSelect(notification.id)}
              >
                <div className="notification-item-header">
                  <h3 className="notification-title">{notification.title}</h3>
                  {notification.unread && <span className="unread-dot"></span>}
                </div>
                <div className="notification-content">
                  <div className="notification-summary">
                    {notification.summary}
                  </div>
                </div>
                <div className="notification-bottom">
                  <span className="notification-timestamp">
                    {notification.timestamp}
                  </span>
                  <span className="notification-sender">
                    <Avatar
                      src={notification.sender.avatar}
                      size="20px"
                    ></Avatar>
                    <span className="notification-sender-name">
                      {notification.sender.name}
                    </span>
                  </span>
                </div>
                <ul className="notification-tags">
                  {notification.tags?.map((tag, index) => (
                    <li key={index} className="notification-tag">
                      {tag}
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </div>

        <div className="publish-footer">
          <Button
            className="publish-btn"
            onClick={() => navigate('/notifications/new')} // Changed to call the prop from parent
          >
            <AddIcon />
            <span>发布通知</span>
          </Button>
        </div>
      </>
    </aside>
  )
}

export default NotificationsSidebar
