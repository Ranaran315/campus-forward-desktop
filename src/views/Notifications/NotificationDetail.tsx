// campus-forward-desktop/src/views/Notifications/NotificationDetail.tsx
import React, { useState } from 'react';
import { NotificationDetail as NotificationDetailType } from '@/types/notifications.type';
import { Button, Tag, Divider, Space, message, Tooltip } from 'antd';
import { EyeOutlined, DeleteOutlined, PushpinOutlined, PushpinFilled } from '@ant-design/icons';
import apiClient from '@/lib/axios';

interface NotificationDetailProps {
  notification: NotificationDetailType | null;
  loading?: boolean;
  error?: string | null;
  onMarkAsRead?: (id: string) => void;
  onDelete?: (id: string) => void;
}

const NotificationDetail: React.FC<NotificationDetailProps> = ({ 
  notification, 
  loading, 
  error,
  onMarkAsRead,
  onDelete
}) => {
  const [processing, setProcessing] = useState(false);
  const [isPinned, setIsPinned] = useState(notification?.isPinned || false);

  if (loading) {
    return <div className="notification-loading">加载通知内容中...</div>;
  }

  if (error) {
    return <div className="notification-error">加载失败: {error}</div>;
  }

  if (!notification) {
    return (
      <div className="no-notification-selected">
        <p>请选择一条通知以查看详情。</p>
      </div>
    );
  }

  // 处理标记为已读
  const handleMarkAsRead = async () => {
    if (!notification.id || notification.isRead) return;
    
    setProcessing(true);
    try {
      await apiClient.post(`/informs/${notification.id}/read`);
      message.success('已标记为已读');
      if (onMarkAsRead) onMarkAsRead(notification.id);
    } catch (err) {
      console.error('标记已读失败:', err);
      message.error('操作失败，请稍后重试');
    } finally {
      setProcessing(false);
    }
  };

  // 处理删除通知
  const handleDelete = async () => {
    if (!notification.id) return;
    
    setProcessing(true);
    try {
      await apiClient.delete(`/informs/${notification.id}/receipt`);
      message.success('已从列表中移除');
      if (onDelete) onDelete(notification.id);
    } catch (err) {
      console.error('删除通知失败:', err);
      message.error('操作失败，请稍后重试');
    } finally {
      setProcessing(false);
    }
  };

  // 处理置顶/取消置顶
  const handleTogglePin = async () => {
    if (!notification.id) return;
    
    setProcessing(true);
    try {
      await apiClient.post(`/informs/${notification.id}/pin`, { isPinned: !isPinned });
      setIsPinned(!isPinned);
      message.success(isPinned ? '已取消置顶' : '已置顶');
    } catch (err) {
      console.error('置顶操作失败:', err);
      message.error('操作失败，请稍后重试');
    } finally {
      setProcessing(false);
    }
  };

  // 根据重要性级别返回不同的标签
  const getImportanceTag = () => {
    switch (notification.importance) {
      case 'high':
        return <Tag color="red">重要</Tag>;
      case 'medium':
        return <Tag color="orange">一般</Tag>;
      case 'low':
      default:
        return <Tag color="blue">普通</Tag>;
    }
  };

  return (
    <div className="notification-content">
      <div className="notification-header">
        <h2>{notification.title}</h2>
        <div className="notification-meta">
          <Space>
            {getImportanceTag()}
            {notification.type && <Tag>{notification.type}</Tag>}
          </Space>
        </div>
      </div>
      
      <p className="notification-info">
        <span className="sender">发件人: {notification.sender?.name || '系统通知'}</span>
        <span className="time">发布时间: {notification.timestamp}</span>
        {notification.deadline && (
          <span className="deadline">截止时间: {new Date(notification.deadline).toLocaleString()}</span>
        )}
      </p>
      
      <Divider />
      
      <div className="notification-body">
        {notification.contentFull.split('\n').map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </div>
      
      {notification.attachments && notification.attachments.length > 0 && (
        <div className="notification-attachments">
          <h4>附件:</h4>
          <ul>
            {notification.attachments.map((attachment, index) => (
              <li key={index}>
                <a href={attachment.url} target="_blank" rel="noopener noreferrer">
                  {attachment.fileName}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      <div className="notification-actions">
        <Space>
          {!notification.isRead && (
            <Button 
              icon={<EyeOutlined />} 
              onClick={handleMarkAsRead}
              loading={processing}
            >
              标记为已读
            </Button>
          )}
          <Tooltip title={isPinned ? "取消置顶" : "置顶通知"}>
            <Button 
              icon={isPinned ? <PushpinFilled /> : <PushpinOutlined />} 
              onClick={handleTogglePin}
              loading={processing}
            />
          </Tooltip>
          <Button 
            icon={<DeleteOutlined />} 
            onClick={handleDelete}
            loading={processing}
            danger
          >
            删除
          </Button>
        </Space>
      </div>
    </div>
  );
};

export default NotificationDetail;
