// src/types/auth.types.ts
export interface LoginResponse {
  access_token: string
  // 可能还包含 user 信息，根据后端实际返回情况定义
  user?: {
    id: string
    username: string
    nickname?: string
    avatar?: string
    password?: string
  }
}

// 可以在这里添加 RegisterResponse 类型等
export interface RegisterResponse {
  message: string
  userId: string // 假设后端返回用户 ID
}
