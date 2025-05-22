import React, { useState } from 'react'
import './NotificationSidebar.css'
import { InputField } from '@/components/Form/Form'
import FilterIcon from '@/assets/icons/filter.svg?react'
import AddIcon from '@/assets/icons/add.svg?react'
import EditIcon from '@/assets/icons/edit.svg?react'
import ArrowRight from '@/assets/icons/arrow_right.svg?react'
import { UserProfile } from '@/types/user.types'
import Avatar from '@/components/Avatar/Avatar'
import Button from '@/components/Button/Button'

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

// 静态通知数据示例
const staticNotifications: NotificationItem[] = [
  {
    id: '1',
    title: '五一劳动节放假通知',
    summary: '根据国家法定节假日安排，结合我校实际情况...',
    timestamp: '2025-04-28',
    unread: true,
    sender: {
      _id: 'admin',
      name: '系统管理员',
      avatar: '/assets/avatars/admin.png',
    },
    tags: ['假期通知'],
    importance: 'high',
  },
  {
    id: '2',
    title: '关于开展校园安全大检查的通知',
    summary: '为进一步加强校园安全管理，消除安全隐患...',
    timestamp: '2025-05-10',
    sender: {
      _id: 'admin',
      name: '系统管理员',
      avatar: '/assets/avatars/admin.png',
    },
    tags: ['安全通知'],
    importance: 'high',
  },
  {
    id: '3',
    title: '图书馆闭馆通知',
    summary: '因内部系统升级，图书馆将于下周一闭馆一天...',
    timestamp: '2025-05-15',
    unread: true,
    sender: {
      _id: 'admin',
      name: '系统管理员',
      avatar: '/assets/avatars/admin.png',
    },
    tags: ['图书馆通知'],
    importance: 'medium',
  },
  {
    id: '4',
    title: '学术讲座邀请：AI与未来教育',
    summary: '特邀李明教授分享人工智能在教育领域的最新进展...',
    timestamp: '2025-05-20',
    sender: {
      _id: 'admin',
      name: '系统管理员aaaaaaaaaaaaaaaaa',
      avatar: '/assets/avatars/admin.png',
    },
    tags: ['学术活动', '讲座', 'AI', '学时'],
    importance: 'low',
  },
]

interface NotificationsSidebarProps {
  onNotificationSelect: (notificationId: string) => void
  selectedNotificationId: string | null
  onPublishNewNoticeClick: () => void // Added prop for parent to handle form display
  onShowMyPublishedNoticesClick: () => void // Added prop for "My Published Notices"
}

const NotificationsSidebar: React.FC<NotificationsSidebarProps> = ({
  onNotificationSelect,
  selectedNotificationId,
  onPublishNewNoticeClick, // Destructure the new prop
  onShowMyPublishedNoticesClick, // Destructure the new prop
}) => {
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearchChange = (_name: string, value: string) => {
    // Mark name as unused
    setSearchQuery(value)
  }

  const filteredNotifications = staticNotifications.filter(
    (notification) =>
      notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notification.summary.toLowerCase().includes(searchQuery.toLowerCase())
  )

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
            className="function-item"
            onClick={onShowMyPublishedNoticesClick} // Use the passed prop
          >
            <EditIcon />
            <span className="function-text">我发布的通知</span>
            <ArrowRight style={{ marginLeft: 'auto' }} />
          </div>
        </div>

        <div className="notifications-list-container">
          {filteredNotifications.length === 0 ? (
            <div className="empty-state">
              {searchQuery ? '没有找到匹配的通知' : '暂无通知'}
            </div>
          ) : (
            filteredNotifications.map((notification) => (
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
            onClick={onPublishNewNoticeClick} // Changed to call the prop from parent
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
