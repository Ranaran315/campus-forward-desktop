import { format, formatDistanceToNow, isValid, parseISO } from 'date-fns'
import { zhCN } from 'date-fns/locale'

/**
 * 将日期字符串或 Date 对象格式化为相对当前时间的描述（例如：“几秒前”，“2 天前”）。
 * @param dateInput - 可以是日期字符串 (ISO 8601 格式推荐) 或 Date 对象。
 * @param addSuffix - 是否添加后缀，默认为 true (例如 "前", "后")。
 * @returns 格式化后的相对时间字符串，如果日期无效则返回 "未知时间"。
 */
export const formatTimeAgo = (
  dateInput: string | Date | undefined | null,
  addSuffix: boolean = true
): string => {
  if (!dateInput) {
    return '未知时间'
  }

  const date = typeof dateInput === 'string' ? parseISO(dateInput) : dateInput

  if (!isValid(date)) {
    return '未知时间'
  }

  try {
    return formatDistanceToNow(date, {
      addSuffix: addSuffix,
      locale: zhCN,
    })
  } catch (error) {
    console.error('Error formatting time ago:', error)
    return '未知时间'
  }
}

/**
 * 将日期字符串或 Date 对象格式化为指定的绝对日期时间格式。
 * @param dateInput - 可以是日期字符串 (ISO 8601 格式推荐) 或 Date 对象。
 * @param formatString - date-fns 的格式化字符串 (例如："yyyy-MM-dd HH:mm:ss")。
 * @returns 格式化后的绝对日期时间字符串，如果日期无效则返回 "无效日期"。
 */
export const formatDateTime = (
  dateInput: string | Date | undefined | null,
  formatString: string = 'yyyy-MM-dd HH:mm:ss'
): string => {
  if (!dateInput) {
    return '未知'
  }

  const date = typeof dateInput === 'string' ? parseISO(dateInput) : dateInput

  if (!isValid(date)) {
    return '未知'
  }

  try {
    return format(date, formatString, {
      locale: zhCN,
    })
  } catch (error) {
    console.error('Error formatting date time:', error)
    return '未知'
  }
}

// 你可以在这里根据需要添加更多的时间格式化函数
// 例如：
// export const formatDate = (dateInput: string | Date): string => {
//   return formatDateTime(dateInput, 'yyyy年MM月dd日');
// };

// export const formatTime = (dateInput: string | Date): string => {
//   return formatDateTime(dateInput, 'HH:mm');
// };
