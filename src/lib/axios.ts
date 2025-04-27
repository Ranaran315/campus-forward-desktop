// src/lib/axios.ts
import axios from 'axios'

// 建议在项目根目录创建 .env 文件，并写入 VITE_API_URL=http://localhost:3000
// 然后在这里使用 import.meta.env.VITE_API_URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080' // 确认后端 API 根地址

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// --- 拦截器 ---
// 请求拦截器：自动附加 Token
apiClient.interceptors.request.use(
  (config) => {
    // 从 localStorage 读取 Token (简单方式)
    const token = localStorage.getItem('authToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// 响应拦截器：处理 401 错误 (Token 失效/未认证)
apiClient.interceptors.response.use(
  (response) => response, // 成功响应直接返回
  (error) => {
    if (error.response && error.response.status === 401) {
      console.error('认证失败 (401)，需要重新登录。')
      localStorage.removeItem('authToken') // 清除无效 Token

      // 通知主进程处理强制登出和窗口切换
      if (window.ipcRenderer?.send) {
        window.ipcRenderer.send('force-logout')
      } else {
        // Fallback 或给出错误提示
        console.error('无法通知主进程强制登出。')
        // 也可以尝试简单的 hash 跳转，但不一定总能正确处理窗口
        // window.location.hash = '/login';
      }
      // 返回一个特定的错误或让调用者处理
      return Promise.reject(new Error('认证失败，请重新登录'))
    }
    // 其他错误继续抛出
    return Promise.reject(error)
  }
)

export default apiClient
