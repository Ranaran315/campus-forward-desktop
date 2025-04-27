// src/types/user.types.ts

// 与后端 CreateUserDto 对应的注册表单数据接口
export interface RegisterFormData {
  userType: 'student' | 'staff'
  identifier: string
  password: string
  realname: string
  nickname?: string
  gender: 'male' | 'female' | 'other' // 明确类型
  departmentInfo: {
    departmentId: string
    departmentName: string
  }
  classInfo?: {
    // 学生需要
    classId: string
    className: string
  }
  staffInfo?: {
    // 教职工需要 (所有字段可选)
    titles?: string[]
    officeLocation?: string // 修正拼写
    managedClassIds?: string[]
  }
  phone: string
  email: string
}

// 可以定义 UserProfile 类型等用于显示用户信息
export interface UserProfile {
  _id: string
  username: string
  name: string // 或者 realname
  email: string
  roles: string[]
  userType: 'student' | 'staff'
  nickname?: string
  // ... 其他需要显示的字段
}
