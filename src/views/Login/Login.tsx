// src/views/LoginPage/LoginPage.tsx
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import apiClient from '../../lib/axios' // 导入封装好的 axios 实例
import './Login.css'
import { Form, InputField } from '@/components/Form/Form'
import CustomTitlebar from '@/components/CustomTitlebar/CustomTitlebar'
import Button from '@/components/Button/Button'
import Avatar from '@/components/Avatar/Avatar'
import { LoginResponse } from '@/types/auth.types'
import { Checkbox } from 'antd'
import RemoveIcon from '@/assets/icons/remove.svg?react'

interface SavedAccountInfo {
  username: string // 学号/工号
  avatar?: string // 头像 URL (可选)
  password?: string // 用户上次输入的密码 (极不安全!)
}
const SAVED_ACCOUNTS_KEY = 'savedLoginAccounts' // localStorage key

function LoginPage() {
  // 状态定义
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [savedAccounts, setSavedAccounts] = useState<SavedAccountInfo[]>([])
  const [currentAvatar, setCurrentAvatar] = useState<string | undefined>(
    undefined
  ) // 当前显示的头像
  const [rememberAccount, setRememberAccount] = useState(true) // 是否保存账号信息的状态
  const [isUsernameDropdownVisible, setIsUsernameDropdownVisible] =
    useState(false) // 控制用户名下拉列表的显示

  // --- 辅助函数：根据账户信息填充字段 ---
  const populateFieldsFromAccount = (account: SavedAccountInfo | undefined) => {
    if (account) {
      setUsername(account.username)
      setPassword(account.password || '') // 自动填充密码 (安全风险)
      setCurrentAvatar(account.avatar)
    } else {
      // 如果没有找到账户 (例如，在清除操作后)
      setUsername('')
      setPassword('')
      setCurrentAvatar(undefined)
    }
  }

  // --- 加载已保存的账户 ---
  useEffect(() => {
    try {
      const storedAccounts = localStorage.getItem(SAVED_ACCOUNTS_KEY)
      if (storedAccounts) {
        const parsedAccounts: SavedAccountInfo[] = JSON.parse(storedAccounts)
        setSavedAccounts(parsedAccounts)
        // 默认选中第一个账户 (如果存在)
        if (parsedAccounts.length > 0) {
          populateFieldsFromAccount(parsedAccounts[0]) // 触发选中逻辑
        }
      }
    } catch (e) {
      console.error('Failed to load or parse saved accounts:', e)
      localStorage.removeItem(SAVED_ACCOUNTS_KEY) // 清理无效数据
    }
  }, []) // 空依赖数组，仅在组件挂载时运行

  // --- 处理用户名输入变化 ---
  const handleUsernameInputChange = (_name: string, value: string) => {
    setUsername(value)
    const account = savedAccounts.find((acc) => acc.username === value)
    if (account) {
      setCurrentAvatar(account.avatar)
      // 考虑是否在输入完全匹配时填充密码，或者仅在选择后填充
      // setPassword(account.password || '');
    } else {
      setCurrentAvatar(undefined)
      setPassword('') // 如果输入内容与任何已保存账户都不匹配，则清空密码
    }
    if (value && savedAccounts.length > 0) {
      setIsUsernameDropdownVisible(true) // 输入时如果列表有内容则显示
    } else {
      setIsUsernameDropdownVisible(false)
    }
  }

  // --- 处理用户名下拉列表的选择 ---
  const handleSavedAccountClick = (
    account: SavedAccountInfo,
    e: MouseEvent
  ) => {
    console.log('选择账户:', account.username)
    const target = e.target as HTMLElement
    if (target.closest('.remove-account-icon-wrapper')) {
      return
    }
    populateFieldsFromAccount(account)
    setIsUsernameDropdownVisible(false) // 选择后隐藏下拉列表
  }

  // --- 处理用户名输入框获取焦点 ---
  const handleUsernameInputFocus = () => {
    if (savedAccounts.length > 0) {
      setIsUsernameDropdownVisible(true)
    }
  }

  // --- 处理账户选择 ---
  const handleAccountSelect = (value: string) => {
    const account = savedAccounts.find((acc) => acc.username === value)
    if (account) {
      setUsername(account.username)
      setPassword(account.password || '') // 自动填充密码 (安全风险)
      setCurrentAvatar(account.avatar)
    }
    // 如果 value 不是已保存的账户，则 username 已经通过 AutoComplete 的 onChange 更新了
  }

  // --- 处理删除已保存账户的逻辑 ---
  const handleRemoveSavedAccount = (
    accountToRemove: SavedAccountInfo,
    event: React.MouseEvent // 引入 event 参数
  ) => {
    console.log('删除账户:', accountToRemove.username)
    event.stopPropagation() // 阻止事件冒泡到 li 的 onMouseDown

    const updatedAccounts = savedAccounts.filter(
      (acc) => acc.username !== accountToRemove.username
    )
    setSavedAccounts(updatedAccounts)
    localStorage.setItem(SAVED_ACCOUNTS_KEY, JSON.stringify(updatedAccounts))

    // 如果删除的是当前选中的账户，则清空输入框和头像
    if (username === accountToRemove.username) {
      populateFieldsFromAccount(undefined) // 使用辅助函数清空
    }
    // 如果删除后列表为空，也隐藏下拉框
    if (updatedAccounts.length === 0) {
      setIsUsernameDropdownVisible(false)
    }

    console.log('已删除账户:', accountToRemove.username)
  }

  // --- 处理用户名输入框失去焦点 ---
  const handleUsernameOutsideClick = useCallback(() => {
    setTimeout(() => {
      setIsUsernameDropdownVisible(false)
    }, 100)
  }, []) // 空依赖数组，因为 setIsUsernameDropdownVisible 是稳定的

  // 点击登录按钮
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
        localStorage.setItem('authToken', access_token)
        console.log('登录成功，Token 已存储。')

        if (rememberAccount) {
          try {
            const currentAccounts = [...savedAccounts]
            const existingAccountIndex = currentAccounts.findIndex(
              (acc) => acc.username === userInfo.username
            )
            const newAccountInfo: SavedAccountInfo = {
              username: userInfo.username,
              avatar: userInfo.avatar,
              password: password || '', // 保存当前输入的密码 (安全风险)
            }

            if (existingAccountIndex > -1) {
              currentAccounts[existingAccountIndex] = newAccountInfo
            } else {
              currentAccounts.push(newAccountInfo)
            }
            setSavedAccounts(currentAccounts)
            localStorage.setItem(
              SAVED_ACCOUNTS_KEY,
              JSON.stringify(currentAccounts)
            )
            console.log('账户信息已保存/更新。')
          } catch (e) {
            console.error('Failed to save account info:', e)
          }
        } else {
          console.log('用户未选择保存账号信息。')
        }

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
      setError(err.backendMessage || '登录失败，请稍后重试。')
    } finally {
      setLoading(false)
    }
  }

  // 用于下拉列表的选项，可以根据输入内容进行过滤（可选）
  const dropdownOptions = savedAccounts

  return (
    <div className="login-container">
      <CustomTitlebar></CustomTitlebar>
      <div className="login-layout">
        <div className="login-title">
          <span>飞书</span>
        </div>
        <Avatar src={currentAvatar} size="80px"></Avatar>
        <Form className="login-form">
          <InputField
            name="username"
            type="text"
            placeholder="请输入或选择学号/工号"
            value={username}
            onChange={handleUsernameInputChange}
            onFocus={handleUsernameInputFocus}
            disabled={loading}
            isDropdownVisible={
              isUsernameDropdownVisible && dropdownOptions.length > 0
            }
            onBlur={() => {
              handleUsernameOutsideClick()
            }}
            dropdownContent={
              // 这个 ul 的样式需要确保它在 InputField 内部正确定位
              // Login.css 中的 .username-dropdown 样式应该仍然适用
              <ul className="username-dropdown">
                {dropdownOptions.map((acc) => (
                  <li
                    key={acc.username}
                    onMouseDown={(e) => {
                      handleSavedAccountClick(acc, e)
                    }}
                  >
                    <Avatar src={acc.avatar} size="20px" />
                    {acc.username}
                    <span
                      className="remove-account-icon-wrapper"
                      onMouseDown={(e) => handleRemoveSavedAccount(acc, e)}
                    >
                      <RemoveIcon></RemoveIcon>
                    </span>
                  </li>
                ))}
              </ul>
            }
          />
          <InputField
            name="password"
            type="password"
            required
            disabled={loading}
            placeholder="请输入密码"
            value={password}
            onChange={(_name, value) => setPassword(value)}
          />
          <div className="login-options">
            <Checkbox
              checked={rememberAccount}
              onChange={(e) => setRememberAccount(e.target.checked)}
              disabled={loading}
            >
              保存账号
            </Checkbox>
            {/* 你可以在这里添加 "忘记密码" 等链接 */}
          </div>
          <p className="error-info">{error && error}</p>
          <Button
            type="button"
            onClick={handleLoginButtonClick}
            disabled={loading || !username || !password}
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
