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
import Modal from '@/components/Modal/Modal' // Import custom Modal
import PublishNoticeForm from './PublishNoticeForm' // Import the form
import { Form, message } from 'antd' // Import Form and message from antd for the form instance and notifications

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
}

const NotificationsSidebar: React.FC<NotificationsSidebarProps> = ({
  onNotificationSelect,
  selectedNotificationId,
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false)
  const [publishForm] = Form.useForm() // Ant Design Form instance for PublishNoticeForm
  const [isConfirmLoading, setIsConfirmLoading] = useState(false)

  const handleSearchChange = (name: string, value: string) => {
    setSearchQuery(value)
  }

  const openPublishModal = () => {
    setIsPublishModalOpen(true)
  }

  const closePublishModal = () => {
    setIsPublishModalOpen(false)
    publishForm.resetFields()
  }

  const handlePublishNotice = async () => {
    setIsConfirmLoading(true)
    try {
      const values = await publishForm.validateFields()
      // TODO: Implement actual API call to publish the notice
      console.log('Publishing notice with values:', values)
      message.success('通知已成功发布！') // Ant Design message
      closePublishModal()
    } catch (errorInfo) {
      console.log('Failed to publish notice:', errorInfo)
      message.error('请检查表单信息是否完整正确。') // Ant Design message
    }
    setIsConfirmLoading(false)
  }

  const filteredNotifications = staticNotifications.filter(
    (notification) =>
      notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notification.summary.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <aside className="notifications-sidebar">
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
          onClick={() => console.log('查看我发布的通知')} // 替换为实际回调
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
              } ${selectedNotificationId === notification.id ? 'active' : ''}`}
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
                  <Avatar src={notification.sender.avatar} size="20px"></Avatar>
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
          onClick={openPublishModal} // Changed to open the modal
        >
          <AddIcon />
          <span>发布通知</span>
        </Button>
      </div>

      <Modal
        isOpen={isPublishModalOpen}
        onClose={closePublishModal}
        title="发布新通知"
        onConfirm={handlePublishNotice}
        confirmText="发布"
        cancelText="取消"
        isConfirmLoading={isConfirmLoading}
        // customFooter={ // Example of how you might use custom footer if needed
        //   <div style={{ textAlign: 'right' }}>
        //     <Button theme="secondary" onClick={closePublishModal} style={{ marginRight: '8px' }}>取消</Button>
        //     <Button theme="primary" onClick={handlePublishNotice}>发布</Button>
        //   </div>
        // }
      >
        <PublishNoticeForm
          formInstance={publishForm}
          // onPublish and onCancel props on PublishNoticeForm are not strictly needed here
          // as Modal's onConfirm/onClose will trigger the logic.
          // However, keeping them for consistency if PublishNoticeForm expects them.
          onPublish={handlePublishNotice}
          onCancel={closePublishModal}
        />
      </Modal>
    </aside>
  )
}

export default NotificationsSidebar
