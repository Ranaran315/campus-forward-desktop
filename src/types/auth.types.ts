// src/types/auth.types.ts

// 定义后端返回的用户对象结构
export interface BackendUser {
  id: string;
  username: string;
  nickname?: string;
  avatar?: string;
  // password?: string; // 后端通常不应在登录响应中返回密码字段
  // 如果您的后端 /auth/login 响应中的 user 对象确实包含 roles 和 permissions，请取消注释以下行：
  // roles?: string[];
  // permissions?: string[];
}

export interface LoginResponse {
  access_token: string;
  user?: BackendUser; // 使用新定义的 BackendUser 类型
}

// 可以在这里添加 RegisterResponse 类型等
export interface RegisterResponse {
  message: string;
  userId: string; // 假设后端返回用户 ID
}
