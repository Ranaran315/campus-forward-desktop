// src/views/LoginPage/LoginPage.tsx
import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import apiClient from '../../lib/axios' // 导入封装好的 axios 实例
import type { LoginResponse } from '../../types/auth.types' // 导入类型
import './Login.css'
import { Form, InputField } from '@/components/Form/Form'
import CustomTitlebar from '@/components/CustomTitlebar/CustomTitlebar'
import Button from '@/components/Button/Button'
import Avatar from '@/components/Avatar/Avatar'

function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [isButtonDisabled, setIsButtonDisabled] = useState(true)

  const handleLoginButtonClick = async () => {
    console.log('登录请求参数:', username, password)
    setError(null)
    setLoading(true)
    try {
      const response = await apiClient.post<LoginResponse>('/auth/login', {
        username,
        password,
      })
      const { access_token } = response.data

      if (access_token) {
        localStorage.setItem('authToken', access_token)
        console.log('登录成功，Token 已存储。')
        if (window.ipcRenderer?.send) {
          window.ipcRenderer.send('login-success', access_token)
          console.log('已通知主进程登录成功。')
        } else {
          console.error('electronAPI 或 sendLoginSuccess 不可用！')
          setError('登录成功但无法切换窗口，请联系管理员。')
        }
      } else {
        setError('登录失败：未收到 access_token。')
      }
    } catch (err: any) {
      console.log('登录出错:', err)
      if (err.response && err.response.data?.message) {
        if (Array.isArray(err.response.data.message)) {
          setError(`登录失败: ${err.response.data.message.join(', ')}`)
        } else {
          setError(`登录失败: ${err.response.data.message}`)
        }
      } else if (
        err.message?.includes('Unauthorized') ||
        err.response?.status === 401
      ) {
        setError('登录失败：用户名或密码无效。')
      } else {
        setError('登录失败，请检查网络或联系管理员。')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (username && password) {
      setIsButtonDisabled(false)
    } else {
      setIsButtonDisabled(true)
    }
  }, [username, password])

  return (
    <div className="login-container">
      <CustomTitlebar></CustomTitlebar>
      <div className="login-layout">
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
