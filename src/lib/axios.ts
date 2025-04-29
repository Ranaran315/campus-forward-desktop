import axios, { AxiosError } from 'axios' // 导入 AxiosError 类型

// 定义后端标准响应接口
interface BackendStandardResponse<T = any> {
  statusCode: number
  message: string
  data: T | null
}

// 定义拦截器抛出的错误类型（可选，但有助于类型提示）
interface CustomAxiosError extends AxiosError {
  isAuthError?: boolean
  backendMessage?: string
  backendError?: BackendStandardResponse<unknown> // 包含原始后端错误体
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// --- 拦截器 ---
// 请求拦截器：自动附加 Token (保持不变)
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// 响应拦截器：处理标准响应格式和错误
apiClient.interceptors.response.use(
  (response) => {
    // --- 关键改动 ---
    // 请求成功，后端返回的是标准格式 { statusCode, message, data }
    // 返回完整的 AxiosResponse，同时附加标准数据供调用者使用
    response.data = response.data as BackendStandardResponse
    return response
  },
  (error: AxiosError) => {
    const customError: CustomAxiosError = error // 转换为自定义错误类型

    if (error.response) {
      // 后端返回了错误响应 (e.g., 4xx, 5xx)
      const status = error.response.status
      // 后端返回的错误信息通常在 error.response.data 中
      // 假设错误响应也遵循 { statusCode, message, data/error } 格式
      const backendErrorData = error.response
        .data as BackendStandardResponse<any>
      const backendMessage = backendErrorData?.message || error.message // 优先用后端消息

      customError.backendMessage = backendMessage // 附加后端消息
      customError.backendError = backendErrorData // 附加后端完整错误体

      if (status === 401) {
        console.error(`认证失败 (401): ${backendMessage}`)
        localStorage.removeItem('authToken')
        if (window.ipcRenderer?.send) {
          window.ipcRenderer.send('force-logout')
        }
        customError.isAuthError = true // 标记为认证错误
        // 依然需要 reject，让调用者知道请求失败了
        return Promise.reject(customError)
      }

      // 处理其他后端错误 (400, 403, 404, 500 etc.)
      console.error(`请求错误 (${status}): ${backendMessage}`, backendErrorData)
      // 抛出带有后端信息的错误
      return Promise.reject(customError)
    } else if (error.request) {
      // 请求已发出，但没有收到响应 (网络错误等)
      console.error('网络错误或无响应:', error.request)
      customError.message = '网络错误，请检查连接或稍后再试'
      return Promise.reject(customError)
    } else {
      // 设置请求时发生错误
      console.error('请求设置错误:', error.message)
      return Promise.reject(customError) // 抛出原始错误或其他自定义错误
    }
  }
)

export default apiClient
export type { BackendStandardResponse, CustomAxiosError } // 导出类型供其他地方使用
