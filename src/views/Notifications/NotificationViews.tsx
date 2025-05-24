// campus-forward-desktop/src/views/Notifications/NotificationViews.tsx
import { useState, useEffect, useCallback } from 'react'
import NotificationSidebar from './NotificationSidebar' // Corrected import path
import NotificationDetailDisplay from './NotificationDetail'
import NewNotification from './NoticeForm' // Import NewNotification
import MyPublishedNoticesView from './MyCreatedNoticeView' // Import MyPublishedNoticesView
import { NotificationDetail as NotificationDetailType } from '@/types/notifications.type'
import './NotificationViews.css'
import { Form, message } from 'antd' // Import Form and message from antd
import apiClient from '@/lib/axios' // Import apiClient
import { Route, Routes } from 'react-router-dom'
import NotificationEditView from './NotificationEditView'

function NotificationWelcome() {
  return (
    <>
      <div className="notification-welcome">
        <span>🔔</span>
        请选择一条通知以查看详情
      </div>
    </>
  )
}

function NotificationViews() {
  const [selectedNotificationId, setSelectedNotificationId] = useState<
    string | null
  >(null)
  const [selectedNotificationDetail, setSelectedNotificationDetail] =
    useState<NotificationDetailType | null>(null)

  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState<string | null>(null)

  const [newForm] = Form.useForm()


  // 当选中的通知ID变化时，获取通知详情
  useEffect(() => {
    if (!selectedNotificationId) {
      setSelectedNotificationDetail(null)
      return
    }
    
    const fetchNotificationDetail = async () => {
      setDetailLoading(true)
      setDetailError(null)
      
      try {
        const response = await apiClient.get(`/informs/${selectedNotificationId}`)
        const notificationData = response.data.data
        
        // 转换数据为组件所需格式
        const formattedDetail: NotificationDetailType = {
          id: notificationData._id,
          title: notificationData.title,
          contentFull: notificationData.content,
          timestamp: new Date(notificationData.createdAt).toLocaleString(),
          type: notificationData.tags?.[0] || '',
          // 根据API返回数据结构设置发送者和接收者信息
          sender: notificationData.sender,
          sentBy: notificationData.sender?.name,
          recipients: notificationData.recipients
        }
        
        setSelectedNotificationDetail(formattedDetail)
      } catch (err) {
        console.error('获取通知详情失败:', err)
        setDetailError('获取通知详情失败，请稍后重试')
      } finally {
        setDetailLoading(false)
      }
    }
    
    fetchNotificationDetail()
  }, [selectedNotificationId])

  const handleSelectNotification = useCallback((id: string) => {
    setSelectedNotificationId(id)
  }, [])

  return (
    <div className="notification-page-container">
      <NotificationSidebar
        selectedNotificationId={selectedNotificationId}
        onNotificationSelect={handleSelectNotification}
      />
      <main className="notification-detail-view">
        <Routes>
          <Route index element={<NotificationWelcome />} />
          <Route
            path="new"
            element={<NewNotification formInstance={newForm} />}
          />
          <Route path="my-created" element={<MyPublishedNoticesView />} />
          <Route path="edit/:id" element={<NotificationEditView />} />
          {/* <Route path=":id" element={<NotificationDetailDisplay />} /> */}
          <Route path="*" element={<div>页面不存在</div>} />
        </Routes>
      </main>
    </div>
  )
}

export default NotificationViews
