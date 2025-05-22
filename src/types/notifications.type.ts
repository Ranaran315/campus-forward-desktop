// campus-forward-desktop/src/types/notifications.type.ts
export interface BaseNotification {
  id: string;
  title: string;
  timestamp: string; // Or Date
}

export interface ReceivedNotificationListItem extends BaseNotification {
  contentSummary: string;
  status: 'read' | 'unread';
  type: 'system' | 'announcement' | 'social' | 'message' | string; // Example types
  sender?: { // Optional: if sender info is readily available for list
    id: string;
    name: string;
    avatar?: string;
  };
}

export interface SentNotificationListItem extends BaseNotification {
  contentSummary: string;
  recipientsSummary: string; // e.g., "Alice, Bob and 2 others" or "All Students"
}

export interface NotificationDetail extends BaseNotification {
  contentFull: string;
  sender?: { // For received
    id: string;
    name: string;
    avatar?: string;
  };
  recipients?: Array<{ // For sent
    id: string;
    name: string;
  }>;
  sentBy?: string; // For sent, could be "You" or specific sender if admin views others' sent items
  type?: string; // General type
  // Add other fields as necessary, e.g., attachments, actions
}

// Union type for items in the list, if needed, though usually lists are specific
export type NotificationListItem = ReceivedNotificationListItem | SentNotificationListItem;
