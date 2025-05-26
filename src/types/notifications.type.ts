// campus-forward-desktop/src/types/notifications.type.ts
export interface BaseNotification {
  id: string
  title: string
  timestamp: string // Or Date
}

export interface ReceivedNotificationListItem extends BaseNotification {
  contentSummary: string
  status: 'read' | 'unread'
  type: 'system' | 'announcement' | 'social' | 'message' | string // Example types
  sender?: {
    // Optional: if sender info is readily available for list
    id: string
    name: string
    avatar?: string
  }
}

export interface SentNotificationListItem extends BaseNotification {
  contentSummary: string
  recipientsSummary: string // e.g., "Alice, Bob and 2 others" or "All Students"
}

export interface NotificationDetail {
  id: string
  informId: string
  title: string
  contentFull: string
  description: string
  timestamp: string
  type?: string
  sender?: {
    name: string
    id: string
    avatar?: string
  }
  importance: 'high' | 'medium' | 'low'
  isRead?: boolean
  isPinned?: boolean
  deadline?: string
  attachments?: Array<{
    fileName: string
    url: string
  }>
}

// Union type for items in the list, if needed, though usually lists are specific
export type NotificationListItem =
  | ReceivedNotificationListItem
  | SentNotificationListItem
