import { Link, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import './App.css'
import CustomHeader from '@/components/CustomHeader/CustomHeader'
import MessageViews from '@/views/Message/Message'
import NotificationViews from '@/views/Notifications/Notifications'
import CalendarViews from '@/views/Calendar/Calendar'
import ContactsViews from '@/views/Contacts/Contacts'
import MessageIcon from '@/assets/icons/message.svg?react'
import ContactIcon from '@/assets/icons/contact.svg?react'
import CalendarIcon from '@/assets/icons/calendar.svg?react'
import NotificationIcon from '@/assets/icons/notification.svg?react'
import SkinIcon from '@/assets/icons/skin.svg?react'
import SettingIcon from '@/assets/icons/setting.svg?react'

function AppLayout() {
  // 获取当前路由路径
  const location = useLocation()
  const currentPath = location.pathname

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-item sidebar-top">
          <Link
            to="/"
            className={`sidebar-button ${currentPath === '/' ? 'active' : ''}`}
          >
            <MessageIcon className="sidebar-icon" />
            <span>消息</span>
          </Link>
          <Link
            to="/notifications"
            className={`sidebar-button ${
              currentPath === '/notifications' ? 'active' : ''
            }`}
          >
            <NotificationIcon className="sidebar-icon" />
            <span>通知</span>
          </Link>
          <Link
            to="/calendar"
            className={`sidebar-button ${
              currentPath === '/calendar' ? 'active' : ''
            }`}
          >
            <CalendarIcon className="sidebar-icon" />
            <span>日程</span>
          </Link>
          <Link
            to="/contacts"
            className={`sidebar-button ${
              currentPath === '/contacts' ? 'active' : ''
            }`}
          >
            <ContactIcon className="sidebar-icon" />
            <span>通讯录</span>
          </Link>
        </div>
        <div className="sidebar-item sidebar-bottom">
          <Link to="/skin" className="sidebar-button skin">
            <SkinIcon className="sidebar-icon" />
            <span>皮肤</span>
          </Link>
          <Link to="/setting" className="sidebar-button settings">
            <SettingIcon className="sidebar-icon" />
            <span>设置</span>
          </Link>
        </div>
      </aside>
      <main className="content">
        <Outlet /> {/* 路由匹配的子组件将渲染在这里 */}
      </main>
    </div>
  )
}

function App() {
  return (
    <>
      <CustomHeader title="飞书" />
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<MessageViews />} /> {/* 默认子路由 */}
          <Route path="notifications" element={<NotificationViews />} />
          <Route path="calendar" element={<CalendarViews />} />
          <Route path="contacts" element={<ContactsViews />} />
        </Route>
      </Routes>
    </>
  )
}

export default App
