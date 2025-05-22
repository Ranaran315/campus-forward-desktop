// campus-forward-desktop/src/views/Notifications/NotificationDetail.tsx
import React from 'react';
import { NotificationDetail as NotificationDetailType } from '@/types/notifications.type';
// Styles are expected to be in NotificationPage.css or a dedicated NotificationDetail.css

interface NotificationDetailProps {
  notification: NotificationDetailType | null;
  activeListType: 'received' | 'sent'; // To determine how to display sender/recipient
}

const NotificationDetail: React.FC<NotificationDetailProps> = ({ notification, activeListType }) => {
  if (!notification) {
    return (
      <div className="no-notification-selected">
        <p>请选择一条通知以查看详情。</p>
      </div>
    );
  }

  return (
    <div className="notification-content">
      <h2>{notification.title}</h2>
      <p className="timestamp">
        {activeListType === 'received' && notification.sender ?
          `发件人: ${notification.sender.name}` :
          activeListType === 'sent' && notification.recipients && notification.recipients.length > 0 ?
          `收件人: ${notification.recipients.map(r => r.name).join(', ')}` :
          activeListType === 'sent' && notification.sentBy ? 
          `发送者: ${notification.sentBy}` : // Fallback for sentBy string if recipients array is not available
          null
        }
        { (notification.sender || (notification.recipients && notification.recipients.length > 0) || notification.sentBy) && ' | ' }
        时间: {notification.timestamp}
      </p>
      {notification.type && <p className="type-tag">类型: {notification.type}</p>}
      <hr />
      <div className="content-full">
        {notification.contentFull.split('\n').map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </div>
      {/* 
      <div className="notification-actions">
        <button>删除</button>
        {activeListType === 'received' && <button>标记为未读</button>}
      </div>
      */}
    </div>
  );
};

export default NotificationDetail;
