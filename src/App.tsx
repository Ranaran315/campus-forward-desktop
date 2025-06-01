import {
  Link,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom'
import './App.css'
import './Ant.css'
import "@/themes/themes.css"
// 登录注册
import LoginViews from './views/Login/Login'
import RegisterViews from './views/Register/Register'
// 主应用头部
import CustomHeader from '@/components/CustomHeader/CustomHeader'
// 主应用路由
import ChatViews from '@/views/Chat/ChatViews'
import NotificationViews from '@/views/Notifications/NotificationViews'
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
import AdminIcon from '@/assets/icons/admin.svg?react'
// 全局组件
import MessageContainer from '@/components/Message/MessageContainer'
import { WebSocketProvider } from './contexts/WebSocketProvider'
import {
  AppNotificationsProvider,
  useAppNotificationsContext,
} from './contexts/AppNotificationsContext'
// 后台管理系统
import ProtectedRouteAdmin from './views/Admin/ProtectedRouteAdmin'
import AdminLayout from './views/Admin/AdminLayout'
import DashboardPage from './views/Admin/DashboardPage'
import UserManagementPage from './views/Admin/UserManagementPage'
import RoleManagementPage from './views/Admin/RoleManagementPage'

import { AuthProvider, useAuth } from './contexts/AuthContext'
import CollegeManagementPage from './views/Admin/CollegeManagementPage'
import MajorManagementPage from './views/Admin/MajorManagementPage'
import AcademicClassManagementPage from './views/Admin/AcademicClassManagementPage'

// --- 路由守卫组件 ---
// 这个组件用于保护需要登录才能访问的路由
const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return null // 或者可以返回一个加载指示器
  }

  if (!isAuthenticated) {
    // 如果没有 token，则重定向到登录页面
    // replace 属性可以防止用户通过浏览器后退回到受保护页面
    console.log('ProtectedRoute: 未检测到 token，重定向到 /login')
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // 已认证（通过 <Outlet />）
  return <Outlet />
}

// --- 主应用布局组件 ---
function AppLayout() {
  // 获取当前路由路径
  const location = useLocation()
  const currentPath = location.pathname
  const { pendingReceivedRequestsCount, unreadNotificationsCount } =
    useAppNotificationsContext()
  const { checkPermission, isLoading: authLoading, user } = useAuth()

  // 只有在 authLoading 完成后才进行权限检查
  console.log(
    'AppLayout: checkPermission',
    checkPermission('admin_panel:access')
  )
  const canAccessAdminPanel =
    !authLoading && checkPermission('admin_panel:access')

  return (
    <div>
      <CustomHeader title="飞信" />
      <div className="app-layout">
        <aside className="sidebar">
          <div className="sidebar-item sidebar-top">
            <Link
              to="/chat"
              className={`sidebar-button ${
                currentPath.startsWith('/chat') || (currentPath === '/') ? 'active' : ''
              }`}
            >
              <MessageIcon className="sidebar-icon" />
              <span>消息</span>
            </Link>
            <Link
              to="/notifications"
              className={`sidebar-button ${
                currentPath.startsWith('/notifications') ? 'active' : ''
              }`}
            >
              <NotificationIcon className="sidebar-icon" />
              <span>通知</span>
              {unreadNotificationsCount > 0 && (
                <span className="sidebar-badge">
                  {unreadNotificationsCount}
                </span>
              )}
            </Link>
            {/* <Link
              to="/calendar"
              className={`sidebar-button ${
                currentPath === '/calendar' ? 'active' : ''
              }`}
            >
              <CalendarIcon className="sidebar-icon" />
              <span>日程</span>
            </Link> */}
            <Link
              to="/contacts"
              className={`sidebar-button ${
                currentPath === '/contacts' ? 'active' : ''
              }`}
            >
              <FriendIcon className="sidebar-icon" />
              <span>好友</span>
              {pendingReceivedRequestsCount > 0 && (
                <span className="sidebar-badge">
                  {pendingReceivedRequestsCount}
                </span>
              )}
            </Link>
          </div>
          <div className="sidebar-item sidebar-bottom">
            {canAccessAdminPanel && (
              <Link
                to="/admin" // 指向后台管理系统的根路径
                className={`sidebar-button ${
                  location.pathname.startsWith('/admin') ? 'active' : ''
                }`}
              >
                {/* 您可以使用 SettingIcon 或其他合适的图标 */}
                <AdminIcon className="sidebar-icon" />
                <span>后台管理</span>
              </Link>
            )}
            <Link
              to="/profile"
              className={`sidebar-button ${
                currentPath === '/profile' ? 'active' : ''
              }`}
            >
              <ProfileIcon className="sidebar-icon" />
              <span>个人资料</span>
            </Link>
            <Link
              to="/skin"
              className={`sidebar-button ${
                currentPath === '/skin' ? 'active' : ''
              }`}
            >
              <SkinIcon className="sidebar-icon" />
              <span>调色盘</span>
            </Link>
            <Link
              to="/setting"
              className={`sidebar-button ${
                currentPath.startsWith('/setting') ? 'active' : ''
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
    <AuthProvider>
      <MessageContainer></MessageContainer>
      <Routes>
        <Route path="/login" element={<LoginViews></LoginViews>}></Route>
        <Route
          path="/register"
          element={<RegisterViews></RegisterViews>}
        ></Route>

        {/* 主应用路由 */}
        <Route element={<ProtectedRoute></ProtectedRoute>}>
          <Route
            path="/"
            element={
              <WebSocketProvider>
                <AppNotificationsProvider>
                  <AppLayout />
                </AppNotificationsProvider>
              </WebSocketProvider>
            }
          >
            <Route path="chat" element={<ChatViews />} />
            <Route path="notifications/*" element={<NotificationViews />} />
            <Route path="calendar" element={<CalendarViews />} />
            <Route path="contacts" element={<FriendsViews />} />
            <Route path="profile" element={<ProfileViwes />} />
            <Route path="skin" element={<SkinViews />} />
            <Route path="setting/*" element={<SettingViews />} />
            <Route index element={<Navigate to="/chat" replace />} />
          </Route>
        </Route>

        {/* 后台管理应用路由 */}
        <Route element={<ProtectedRouteAdmin />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<DashboardPage />} />{' '}
            {/* /admin 默认显示仪表盘 */}
            <Route path="users" element={<UserManagementPage />} />
            <Route path="roles" element={<RoleManagementPage />} />
            <Route path="colleges" element={<CollegeManagementPage />} />
            <Route path="majors" element={<MajorManagementPage />} />
            <Route
              path="academic-classes"
              element={<AcademicClassManagementPage />}
            />
            {/* 在这里添加更多后台管理的子路由 */}
            <Route path="*" element={<Navigate to="/admin" replace />} />{' '}
            {/* 后台管理区域内的未匹配路径重定向到仪表盘 */}
          </Route>
        </Route>
      </Routes>
    </AuthProvider>
  )
}

export default App
