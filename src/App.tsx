import {
  Link,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom'
import './App.css'
// 登录注册
import LoginViews from './views/Login/Login'
import RegisterViews from './views/Register/Register'
// 主应用头部
import CustomHeader from '@/components/CustomHeader/CustomHeader'
// 主应用路由
import ChatViews from '@/views/Chat/ChatViews'
import NotificationViews from '@/views/Notifications/Notifications'
import CalendarViews from '@/views/Calendar/Calendar'
import FriendsViews from '@/views/Friends/FriendsViews'
import ProfileViwes from '@/views/Profile/Profile'
import SkinViews from '@/views/Skin/Skin'
import SettingViews from '@/views/Setting/Setting'
// sidebar 图标
import MessageIcon from '@/assets/icons/message.svg?react'
import FriendIcon from '@/assets/icons/friend.svg?react'
import CalendarIcon from '@/assets/icons/calendar.svg?react'
import NotificationIcon from '@/assets/icons/notification.svg?react'
import ProfileIcon from '@/assets/icons/profile.svg?react'
import SkinIcon from '@/assets/icons/skin.svg?react'
import SettingIcon from '@/assets/icons/setting.svg?react'
// 全局组件
import MessageContainer from '@/components/Message/MessageContainer'
import { WebSocketProvider } from './contexts/WebSocketProvider'

// --- 路由守卫组件 ---
// 这个组件用于保护需要登录才能访问的路由
const ProtectedRoute: React.FC = () => {
  const token = localStorage.getItem('authToken') // 简单地从 localStorage 检查 token

  if (!token) {
    // 如果没有 token，则重定向到登录页面
    // replace 属性可以防止用户通过浏览器后退回到受保护页面
    console.log('ProtectedRoute: 未检测到 token，重定向到 /login')
    return <Navigate to="/login" replace />
  }

  // 如果有 token，则渲染其子路由（通过 <Outlet />）
  return <Outlet />
}

// --- 主应用布局组件 ---
function AppLayout() {
  // 获取当前路由路径
  const location = useLocation()
  const currentPath = location.pathname

  return (
    <div>
      <CustomHeader title="飞书" />
      <div className="app-layout">
        <aside className="sidebar">
          <div className="sidebar-item sidebar-top">
            <Link
              to="/"
              className={`sidebar-button ${
                currentPath === '/' ? 'active' : ''
              }`}
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
              <FriendIcon className="sidebar-icon" />
              <span>好友</span>
            </Link>
          </div>
          <div className="sidebar-item sidebar-bottom">
            <Link
              to="/profile"
              className={`sidebar-button ${
                currentPath === '/profile' ? 'active' : ''
              }`}
            >
              <SkinIcon className="sidebar-icon" />
              <span>个人资料</span>
            </Link>
            <Link
              to="/skin"
              className={`sidebar-button ${
                currentPath === '/skin' ? 'active' : ''
              }`}
            >
              <ProfileIcon className="sidebar-icon" />
              <span>调色盘</span>
            </Link>
            <Link
              to="/setting"
              className={`sidebar-button ${
                currentPath === '/setting' ? 'active' : ''
              }`}
            >
              <SettingIcon className="sidebar-icon" />
              <span>设置</span>
            </Link>
          </div>
        </aside>
        <main className="content">
          <Outlet /> {/* 路由匹配的子组件将渲染在这里 */}
        </main>
      </div>
    </div>
  )
}

function App() {
  return (
    <>
      <MessageContainer></MessageContainer>
      <Routes>
        <Route path="/login" element={<LoginViews></LoginViews>}></Route>
        <Route
          path="/register"
          element={<RegisterViews></RegisterViews>}
        ></Route>

        <Route element={<ProtectedRoute></ProtectedRoute>}>
          <Route
            path="/"
            element={
              <WebSocketProvider>
                <AppLayout />
              </WebSocketProvider>
            }
          >
            <Route index element={<ChatViews />} /> {/* 默认子路由 */}
            <Route path="notifications" element={<NotificationViews />} />
            <Route path="calendar" element={<CalendarViews />} />
            <Route path="contacts" element={<FriendsViews />} />
            <Route path="profile" element={<ProfileViwes />} />
            <Route path="skin" element={<SkinViews />} />
            <Route path="setting" element={<SettingViews />} />
          </Route>
        </Route>
      </Routes>
    </>
  )
}

export default App
