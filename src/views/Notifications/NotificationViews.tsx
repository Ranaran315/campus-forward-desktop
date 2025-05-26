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
import { Route, Routes, useNavigate } from 'react-router-dom'
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
  const [selectedNotificationId, setSelectedNotificationId] = useState<string | null>(null)
  const [newForm] = Form.useForm()
  const navigate = useNavigate()

  const handleSelectNotification = useCallback((id: string) => {
    setSelectedNotificationId(id)
    navigate(`/notifications/${id}`)
  }, [navigate])

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
          <Route path=":id" element={<NotificationDetailDisplay />} />
          <Route path="*" element={<div>页面不存在</div>} />
        </Routes>
      </main>
    </div>
  )
}

export default NotificationViews
