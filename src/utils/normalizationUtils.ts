import { UserType } from '@/types/user.types'

export function normalizeGender(gender?: string, userType?: UserType): string {
  switch (gender) {
    case 'male':
      return '👨‍🎓 男'
    case 'female':
      return '👩‍🎓 女'
    default:
      return '未知'
  }
}

export function normalizeAge(birthday?: string): string {
  if (!birthday) {
    return '未知年龄'
  }
  const birthDate = new Date(birthday)
  const today = new Date()
  const age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    return `${age - 1}岁`
  }
  return `${age}岁`
}
