import React, { useState, useEffect } from 'react'
import apiClient from '../../lib/axios' // 确认 apiClient 路径
import './Profile.css' // <--- 修改这里：导入普通 CSS 文件
import Avatar from '@/components/Avatar/Avatar' // 假设有头像组件
import Button from '@/components/Button/Button'
import EditIcon from '@/assets/icons/edit.svg?react'
import UpdateIcon from '@/assets/icons/update.svg?react'
import QuitIcon from '@/assets/icons/quit.svg?react'
import { useNavigate } from 'react-router-dom'
// import LoadingSpinner from '@/components/LoadingSpinner/LoadingSpinner' // 引入 LoadingSpinner

// 定义前端使用的用户数据类型 (可以根据需要简化或调整)
interface UserProfileData {
  _id: string // 通常 MongoDB 会有 _id
  username: string
  nickname?: string
  realname: string
  gender: string
  birthday?: string
  description?: string
  avatar: string
  userType: 'student' | 'staff'
  studentId?: string
  staffId?: string
  departmentInfo?: {
    departmentId: string
    departmentName: string
  }
  majorInfo?: {
    majorId: string
    majorName: string
  }
  classInfo?: {
    classId: string
    className: string
  }
  staffInfo?: {
    officeLocation?: string
    titles?: string[] // 注意后端是 title，这里用了 titles 保持一致性
    managedClassIds?: string[]
  }
  email: string
  phone: string
  status: string
  createdAt: string // Mongoose timestamps
  updatedAt: string
}

function ProfileViews() {
  const [userData, setUserData] = useState<UserProfileData | null>(null)
  // const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()
  const [isLoggingOut, setIsLoggingOut] = useState(false) // 添加登出状态

  // --- 组件挂载时获取用户信息 ---
  useEffect(() => {
    const fetchUserProfile = async () => {
      // setLoading(true)
      setError(null)
      try {
        // --- 假设获取当前用户信息的 API 端点是 '/users/profile' ---
        // --- 后端需要实现这个接口，返回当前登录用户的数据 ---
        const response = await apiClient.get('/users/me')
        setUserData(response.data)
      } catch (err: any) {
        console.error('获取用户信息失败:', err)
        setError(
          err.response?.data?.message || '无法加载用户信息，请稍后重试。'
        )
      } finally {
        // setLoading(false)
      }
    }

    fetchUserProfile()
  }, []) // 空依赖数组，仅在组件挂载时执行一次

  // --- 处理登出逻辑 ---
  const handleLogout = async () => {
    setIsLoggingOut(true) // 开始登出
    try {
      // 1. 调用后端登出接口 (假设是 POST /auth/logout)
      // 即使后端只返回消息，也最好调用一下以完成后端可能需要的清理工作
      await apiClient.post('/auth/logout') // 根据你的后端接口调整路径和方法
      console.log('后端登出接口调用成功 (或已尝试调用)')
    } catch (logoutError: any) {
      // 即便后端接口调用失败，通常也应该继续前端的登出流程
      console.error('调用后端登出接口时出错:', logoutError)
      // 可以选择性地给用户一个提示，但登出流程继续
    } finally {
      // 2. 清除前端存储的 Token
      localStorage.removeItem('authToken')
      console.log('前端 Token 已清除')

      // 3. 通知 Electron 主进程执行强制登出逻辑
      //    (主进程应该负责关闭主窗口并打开登录窗口)
      if (window.ipcRenderer?.send) {
        window.ipcRenderer.send('force-logout')
        console.log('已通知主进程 force-logout')
      } else {
        console.error(
          '无法通知主进程登出，请检查 preload 脚本和主进程 IPC 设置。'
        )
        // 如果无法通知主进程，可以尝试前端强制跳转作为后备方案
        // navigate('/login');
      }
      // 不需要在这里设置 setIsLoggingOut(false)，因为窗口会被切换
    }
  }

  // --- 渲染逻辑 ---

  // if (loading) {
  //   // 确保 LoadingSpinner 组件已正确导入
  //   return <LoadingSpinner /> // 显示加载指示器
  // }

  if (error) {
    // 使用普通类名
    return <div className="error-message">错误: {error}</div> // 显示错误信息
  }

  if (!userData) {
    // 使用普通类名
    return <div className="info-message">未找到用户信息。</div> // 数据为空的情况
  }

  // --- 渲染用户信息 ---
  return (
    // 使用普通类名
    <div className="profile-container">
      <div className="profile-card">
        {/* 头部区域：展示头像、昵称等基本信息 */}
        <div className="profile-header">
          <div className="avatar-section">
            <Avatar size="80px" src={userData.avatar} />
          </div>
          <div className="baseinfo-section">
            <div className="baseinfo-section-top">
              <div className="nickname">
                {userData.nickname || userData.realname}
              </div>
            </div>
            <div className="baseinfo-section-bottom">
              <div className="user-type">
                {userData.userType === 'student' ? '学生' : '教职工'}
              </div>
              <div className="gender">
                {userData.gender === 'male' ? '男' : '女'}
              </div>
            </div>
          </div>
        </div>
        <div className="profile-info">
          {/* 基本信息 */}
          <div className="profile-info-section">
            <span className="profile-info-section-title">基本信息</span>
            <ul className="profile-info-section-item">
              <li>
                <b>真实姓名：</b>
                {userData.realname}
              </li>
              <li>
                <b>生日：</b>
                {userData.birthday || '未知'}
              </li>
            </ul>
          </div>
          {/* 学生信息 */}
          {userData.userType === 'student' && (
            <>
              <div className="profile-info-section">
                <span className="profile-info-section-title">学生信息</span>
                <ul className="profile-info-section-item">
                  <li>
                    <b>学号：</b>
                    {userData.studentId}
                  </li>
                  <li>
                    <b>学院：</b>
                    {userData.departmentInfo?.departmentName || '未知'}
                  </li>
                  <li>
                    <b>专业：</b>
                    {userData.majorInfo?.majorName || '未知'}
                  </li>
                  <li>
                    <b>班级：</b>
                    {userData.classInfo?.className || '未知'}
                  </li>
                </ul>
              </div>
            </>
          )}
          {/* 教职工信息 */}
          {userData.userType === 'staff' && (
            <>
              <span className="profile-info-section-title">教职工信息</span>
              <ul className="profile-info-section-item">
                <li>
                  <b>工号：</b>
                  {userData.staffId}
                </li>
                <li>
                  <b>学院：</b>
                  {userData.departmentInfo?.departmentName || '未知'}
                </li>
                <li>
                  <b>职称：</b>
                  {userData.staffInfo?.titles?.join(', ') || '未知'}
                </li>
                <li>
                  <b>办公地点：</b>
                  {userData.staffInfo?.officeLocation || '未知'}
                </li>
              </ul>
            </>
          )}
          {/* 联系方式 */}
          <div className="profile-info-section">
            <span className="profile-info-section-title">联系方式</span>
            <ul className="profile-info-section-item">
              <li>
                <b>邮箱：</b>
                {userData.email}
              </li>
              <li>
                <b>手机号：</b>
                {userData.phone}
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div className="profile-controls">
        <Button>
          <EditIcon></EditIcon>
          编辑资料
        </Button>
        <Button theme="success">
          <UpdateIcon></UpdateIcon>
          修改密码
        </Button>
        <Button theme="danger" onClick={handleLogout} disabled={isLoggingOut}>
          <QuitIcon></QuitIcon>
          {isLoggingOut ? '退出中...' : '退出登录'}
        </Button>
      </div>
    </div>
  )
}

export default ProfileViews
