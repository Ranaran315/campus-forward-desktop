// src/views/LoginPage/LoginPage.tsx
import { useCallback, useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import apiClient from '../../lib/axios' // 导入封装好的 axios 实例
import './Login.css'
import { Form, InputField } from '@/components/Form/Form'
import CustomTitlebar from '@/components/CustomTitlebar/CustomTitlebar'
import Button from '@/components/Button/Button'
import Avatar from '@/components/Avatar/Avatar'
import { LoginResponse, BackendUser } from '@/types/auth.types' // Import BackendUser
import { Checkbox } from 'antd'
import RemoveIcon from '@/assets/icons/remove.svg?react'
import { useAuth, UserProfile } from '@/contexts/AuthContext' // Import UserProfile
import { jwtDecode } from 'jwt-decode' // For decoding token to get exp/iat

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

  const auth = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

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
    } else {
      setCurrentAvatar(undefined)
      setPassword('')
    }
    if (value && savedAccounts.length > 0) {
      setIsUsernameDropdownVisible(true)
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
    setIsUsernameDropdownVisible(false)
  }

  // --- 处理用户名输入框获取焦点 ---
  const handleUsernameInputFocus = () => {
    if (savedAccounts.length > 0) {
      setIsUsernameDropdownVisible(true)
    }
  }

  // --- 处理账户选择 ---
  // const handleAccountSelect = (value: string) => { ... } // This seems unused, can be removed if so

  // --- 处理删除已保存账户的逻辑 ---
  const handleRemoveSavedAccount = (
    accountToRemove: SavedAccountInfo,
    event: React.MouseEvent
  ) => {
    console.log('删除账户:', accountToRemove.username)
    event.stopPropagation()

    const updatedAccounts = savedAccounts.filter(
      (acc) => acc.username !== accountToRemove.username
    )
    setSavedAccounts(updatedAccounts)
    localStorage.setItem(SAVED_ACCOUNTS_KEY, JSON.stringify(updatedAccounts))

    if (username === accountToRemove.username) {
      populateFieldsFromAccount(undefined)
    }
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
  }, [])

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
      const { access_token, user: userInfoFromBackend } = response.data // userInfoFromBackend is BackendUser | undefined

      if (access_token && userInfoFromBackend) {
        console.log('登录成功：', userInfoFromBackend)

        let userProfileForContext: UserProfile;
        try {
          const decodedToken = jwtDecode<{ exp?: number, iat?: number, sub: string, username: string, roles: string[], permissions: string[] }>(access_token);
          
          userProfileForContext = {
            sub: userInfoFromBackend.id || decodedToken.sub, 
            username: userInfoFromBackend.username || decodedToken.username, 
            avatar: userInfoFromBackend.avatar, 
            displayName: userInfoFromBackend.nickname || userInfoFromBackend.username, // Use nickname from backend user
            // Assuming BackendUser does not have roles/permissions, take from token.
            // If BackendUser *can* have them, prefer them: userInfoFromBackend.roles || decodedToken.roles || []
            roles: decodedToken.roles || [], 
            permissions: decodedToken.permissions || [], 
            exp: decodedToken.exp,
            iat: decodedToken.iat,
          };
        } catch (e) {
          console.error("Error decoding token or mapping user info:", e);
          setError('处理用户信息时发生错误。');
          setLoading(false);
          return;
        }

        await auth.login(access_token, userProfileForContext);

        if (rememberAccount) {
          try {
            const currentAccounts = [...savedAccounts]
            const existingAccountIndex = currentAccounts.findIndex(
              (acc) => acc.username === userInfoFromBackend.username
            )
            const newAccountInfo: SavedAccountInfo = {
              username: userInfoFromBackend.username, 
              avatar: userInfoFromBackend.avatar, 
              password: password || '', 
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

        const from = location.state?.from?.pathname || '/'
        navigate(from, { replace: true })
        console.log(`Navigating to ${from}`)

        if (window.ipcRenderer?.send) {
          window.ipcRenderer.send('login-success', access_token)
          console.log('已通知主进程登录成功。')
        } else {
          console.error('electronAPI 或 sendLoginSuccess 不可用！')
          setError('登录成功但无法切换窗口，请联系管理员。')
        }
      } else {
        // Handle missing token or user info from backend more gracefully
        const errorMessage = !access_token ? '登录失败：缺少访问令牌。' : '登录失败：缺少用户信息。';
        setError(errorMessage);
        console.error(errorMessage, response.data);
      }
    } catch (err: any) {
      console.error('登录出错:', err)
      setError(err.backendMessage || '登录失败，请稍后重试。')
    } finally {
      setLoading(false)
    }
  }

  const dropdownOptions = savedAccounts

  return (
    <div className="login-container">
      <CustomTitlebar></CustomTitlebar>
      <div className="login-layout">
        <div className="login-title">
          <span>飞信</span>
        </div>
        <Avatar src={currentAvatar} size={96}></Avatar>
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
              <ul className="username-dropdown">
                {dropdownOptions.map((acc) => (
                  <li
                    key={acc.username}
                    onMouseDown={(e) => {
                      handleSavedAccountClick(acc, e as unknown as MouseEvent)
                    }}
                  >
                    <Avatar src={acc.avatar} size={20} />
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
