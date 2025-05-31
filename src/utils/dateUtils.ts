import { format, formatDistanceToNow, isValid, parseISO, isToday, isYesterday, isSameWeek, isSameYear, differenceInCalendarDays } from 'date-fns'
import { zhCN } from 'date-fns/locale'

/**
 * 将日期字符串或 Date 对象格式化为相对当前时间的描述（例如："几秒前"，"2 天前"）。
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

/**
 * 根据特定规则格式化会话列表中的时间显示。
 * - 今天: HH:mm
 * - 昨天: 昨天 HH:mm
 * - 前天: 前天 HH:mm
 * - 本周内 (非以上情况): 周X (如: 周一)
 * - 今年内 (非以上情况): MM/dd
 * - 非今年: yyyy/MM/dd
 * @param dateInput - 可以是日期字符串 (ISO 8601 格式推荐) 或 Date 对象。
 * @returns 格式化后的时间字符串，如果日期无效则返回 "未知时间"。
 */
export const formatMessageTime = (
  dateInput: string | Date | undefined | null
): string => {
  if (!dateInput) {
    return '未知时间';
  }

  const date = typeof dateInput === 'string' ? parseISO(dateInput) : dateInput;
  if (!isValid(date)) {
    return '未知时间';
  }

  const now = new Date();

  try {
    if (isToday(date)) {
      return format(date, 'HH:mm', { locale: zhCN });
    }
    if (isYesterday(date)) {
      return `昨天 ${format(date, 'HH:mm', { locale: zhCN })}`;
    }
    // differenceInCalendarDays(now, date) === 2 表示前天
    if (differenceInCalendarDays(now, date) === 2) {
      return `前天 ${format(date, 'HH:mm', { locale: zhCN })}`;
    }
    // 注意：isSameWeek 的 locale 参数影响周的起始日，zhCN 通常是周一
    if (isSameWeek(date, now, { locale: zhCN })) {
      return format(date, 'EEEEEE', { locale: zhCN }); // EEEEEE -> 周一, 周二
    }
    if (isSameYear(date, now)) {
      return format(date, 'MM/dd', { locale: zhCN });
    }
    return format(date, 'yyyy/MM/dd', { locale: zhCN });
  } catch (error) {
    console.error('Error formatting conversation list time:', error);
    return '未知时间';
  }
};

// 你可以在这里根据需要添加更多的时间格式化函数
// 例如：
// export const formatDate = (dateInput: string | Date): string => {
//   return formatDateTime(dateInput, 'yyyy年MM月dd日');
// };

// export const formatTime = (dateInput: string | Date): string => {
//   return formatDateTime(dateInput, 'HH:mm');
// };
