// src/views/LoginPage/LoginPage.tsx
import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import apiClient from '../../lib/axios' // 导入封装好的 axios 实例
import './Login.css'
import { Form, InputField } from '@/components/Form/Form'
import CustomTitlebar from '@/components/CustomTitlebar/CustomTitlebar'
import Button from '@/components/Button/Button'
import Avatar from '@/components/Avatar/Avatar'
import { LoginResponse } from '@/types/auth.types'

interface SavedAccountInfo {
  username: string // 学号/工号
  avatar?: string // 头像 URL (可选)
  password?: string // 用户上次输入的密码 (极不安全!)
}
const SAVED_ACCOUNTS_KEY = 'savedLoginAccounts' // localStorage key

function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [isButtonDisabled, setIsButtonDisabled] = useState(true)

  const [savedAccounts, setSavedAccounts] = useState<SavedAccountInfo[]>([])
  const [selectedUsername, setSelectedUsername] = useState<string>('') // 当前选中的用户名
  const [currentAvatar, setCurrentAvatar] = useState<string | undefined>(
    undefined
  ) // 当前显示的头像

  // --- 加载已保存的账户 ---
  useEffect(() => {
    try {
      const storedAccounts = localStorage.getItem(SAVED_ACCOUNTS_KEY)
      if (storedAccounts) {
        const parsedAccounts: SavedAccountInfo[] = JSON.parse(storedAccounts)
        setSavedAccounts(parsedAccounts)
        // 默认选中第一个账户 (如果存在)
        if (parsedAccounts.length > 0) {
          handleAccountSelect(parsedAccounts[0].username) // 触发选中逻辑
        }
      }
    } catch (e) {
      console.error('Failed to load or parse saved accounts:', e)
      localStorage.removeItem(SAVED_ACCOUNTS_KEY) // 清理无效数据
    }
  }, []) // 空依赖数组，仅在组件挂载时运行

  // --- 处理账户选择 ---
  const handleAccountSelect = (selectedUser: string) => {
    setSelectedUsername(selectedUser)
    const account = savedAccounts.find((acc) => acc.username === selectedUser)
    if (account) {
      setUsername(account.username)
      // 自动填充密码 (不安全!)
      setPassword(account.password || '')
      setCurrentAvatar(account.avatar)
      setIsButtonDisabled(!(account.username && account.password)) // 根据填充结果更新按钮状态
    } else {
      // 如果找不到账户信息（理论上不应发生），清空密码和头像
      setPassword('')
      setCurrentAvatar(undefined)
      setIsButtonDisabled(!username) // 只检查用户名
    }
  }

  const handleLoginButtonClick = async () => {
    console.log('登录请求参数:', username, password)
    setError(null)
    setLoading(true)
    try {
      const response = await apiClient.post<LoginResponse>('/auth/login', {
        username,
        password,
      })
      const { access_token, user: userInfo } = response.data

      if (access_token && userInfo) {
        // 1. 存储 Token 到 localStorage (供当前会话 API 使用)
        localStorage.setItem('authToken', access_token)
        console.log('登录成功，Token 已存储。')

        // 2. 保存/更新账户信息到 localStorage
        try {
          const currentAccounts = [...savedAccounts]
          const existingAccountIndex = currentAccounts.findIndex(
            (acc) => acc.username === userInfo.username
          )
          const newAccountInfo: SavedAccountInfo = {
            username: userInfo.username,
            avatar: userInfo.avatar, // 假设 userInfo 中有 avatar 字段
            password: password, // 存储用户输入的密码 (极不安全!)
          }

          if (existingAccountIndex > -1) {
            // 更新现有账户
            currentAccounts[existingAccountIndex] = newAccountInfo
          } else {
            // 添加新账户
            currentAccounts.push(newAccountInfo)
          }
          setSavedAccounts(currentAccounts) // 更新状态
          localStorage.setItem(
            SAVED_ACCOUNTS_KEY,
            JSON.stringify(currentAccounts)
          )
          console.log('账户信息已保存/更新。')
        } catch (e) {
          console.error('Failed to save account info:', e)
        }

        // 3. 通知主进程登录成功
        if (window.ipcRenderer?.send) {
          window.ipcRenderer.send('login-success', access_token)
          console.log('已通知主进程登录成功。')
        } else {
          console.error('electronAPI 或 sendLoginSuccess 不可用！')
          setError('登录成功但无法切换窗口，请联系管理员。')
        }
      } else {
        setError('登录失败：缺少 token 或用户信息。')
      }
    } catch (err: any) {
      console.error('登录出错:', err)
      // !!! 关键改动：检查原始错误状态码 !!!
      setError(err.backendMessage || '登录失败，请稍后重试。')
    } finally {
      setLoading(false)
    }
  }

  // --- 更新按钮禁用状态 ---
  useEffect(() => {
    setIsButtonDisabled(!(username && password))
  }, [username, password])

  // @Todo：多账户登录
  // --- 准备 SelectField 的 options ---
  const accountOptions = savedAccounts.map((acc) => ({
    value: acc.username,
    label: acc.username, // 或者使用昵称等 acc.nickname || acc.username
  }))

  return (
    <div className="login-container">
      <CustomTitlebar></CustomTitlebar>
      <div className="login-layout">
        <div className="login-title">
          <span>飞书</span>
        </div>
        <Avatar size="80px"></Avatar>
        <Form className="login-form">
          <InputField
            name="username"
            type="text"
            required
            disabled={loading}
            placeholder="请输入学号/工号"
            value={username}
            onChange={(name, value) => setUsername(value)}
          />
          <InputField
            name="password"
            type="password"
            required
            disabled={loading}
            placeholder="请输入密码"
            value={password}
            onChange={(name, value) => setPassword(value)}
          />
          <p className="error-info">{error && error}</p>
          <Button
            type="button"
            onClick={handleLoginButtonClick}
            disabled={isButtonDisabled || loading}
          >
            {loading ? '登录中...' : '登 录'}
          </Button>
        </Form>
        <Link to="/register" className="to-register">
          还没有账户？ 立即注册
        </Link>
      </div>
    </div>
  )
}

export default LoginPage
