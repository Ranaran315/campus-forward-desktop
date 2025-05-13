import { useAuth } from '@/contexts/AuthContext'
import React from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
// import { useAuth } from '@/contexts/AuthContext'; // 假设您有一个 AuthContext 用于获取用户权限

// 检查用户是否拥有访问后台管理权限的占位符函数
// 在实际应用中，您应该从用户状态（例如 AuthContext）中获取权限信息
// 并检查是否包含类似 'admin_panel:access' 的权限。
// const checkAdminPermissions = (): boolean => {
//   // TODO: 实现真实的权限检查逻辑。
//   // 例如: const { user } = useAuth(); return user?.permissions?.includes('admin_panel:access');
//   // 目前，如果用户已登录，则允许访问。后端接口仍会进行最终的权限校验。
//   // 侧边栏的后台管理入口的显示也需要更具体的权限检查。
//   console.warn(
//     'ProtectedRouteAdmin: 正在使用简化的访问权限检查。请务必实现更完善的权限验证逻辑。'
//   );
//   return true; // 临时允许，实际应基于 'admin_panel:access' 权限
// };

const ProtectedRouteAdmin: React.FC = () => {
  const { isAuthenticated, checkPermission, isLoading, user } = useAuth()
  const location = useLocation()

  if (isLoading) {
    // 可以在这里显示一个全局加载指示器或骨架屏
    return null
  }

  if (!isAuthenticated) {
    console.log('ProtectedRouteAdmin: 未检测到 token，将重定向到 /login')
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  const hasAdminAccess = checkPermission('admin_panel:access')

  if (!hasAdminAccess) {
    // 如果用户已登录但没有后台管理权限，可以重定向到主页或未授权页面
    console.log('ProtectedRouteAdmin: 用户无后台管理权限，将重定向到 /')
    return <Navigate to="/" replace /> // 或者专门的未授权提示页面
  }

  console.log(
    `ProtectedRouteAdmin: 用户 ${user?.username} 拥有 'admin_panel:access' 权限，允许访问。`
  )
  return <Outlet /> // 如果有权限，则渲染子路由
}

export default ProtectedRouteAdmin
