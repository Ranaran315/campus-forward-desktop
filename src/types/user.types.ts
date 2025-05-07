// src/types/user.types.ts

export enum UserType {
  STUDENT = 'student',
  STAFF = 'staff',
}

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
  nickname?: string
  realname: string
  avatar?: string
  name: string // 或者 realname
  gender: 'male' | 'female'
  phone: string
  email: string
  roles: string[]
  departmentInfo: {
    departmentId: string
    departmentName: string
  }
  classInfo?: {
    // 学生需要
    classId: string
    className: string
  }
  majorInfo: {
    // 专业信息
    majorId: string // 专业ID
    majorName: string // 专业名称
  }
  staffInfo?: Object // @TODO: 定义更具体的类型
  userType: UserType
  birthday?: string // ISO 8601 格式的日期字符串
}
