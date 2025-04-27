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
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.error('认证失败 (401)，可能需要重新登录。')
      localStorage.removeItem('authToken')
      // 通知主进程处理登出
      if (window.ipcRenderer?.send) {
        window.ipcRenderer.send('force-logout')
      }
      // !!! 关键改动：重新抛出原始错误，或者一个带有标识的错误 !!!
      // 这样调用者就能知道具体是 401 错误了
      return Promise.reject(error) // 直接将原始 error 抛出
      // 或者可以包装一下:
      // const authError = new Error('Authentication Failed (401)');
      // authError.originalError = error; // 可以附加原始错误信息
      // return Promise.reject(authError);
    }
    // 其他错误继续正常抛出
    return Promise.reject(error)
  }
)

export default apiClient
