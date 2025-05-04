import { useState } from 'react'
import Avatar from '@/components/Avatar/Avatar'
import Button from '@/components/Button/Button'
import { showMessage } from '@/components/Message/MessageContainer'
import axios from '@/lib/axios'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import "./FriendRequestsPanel.css"

// 类型定义
interface FriendRequest {
  _id: string
  sender: {
    _id: string
    username: string
    nickname: string
    avatar?: string
  }
  message?: string
  createdAt: string
}

interface FriendRequestsPanelProps {
  requests: FriendRequest[]
  onRequestHandled: () => void // 当请求被处理（接受/拒绝）后的回调
}

const FriendRequestsPanel: React.FC<FriendRequestsPanelProps> = ({ requests, onRequestHandled }) => {
  const [processingIds, setProcessingIds] = useState<string[]>([]) // 跟踪正在处理的请求ID
  
  // 处理好友请求（接受/拒绝）
  const handleRequest = async (requestId: string, action: 'accept' | 'reject') => {
    if (processingIds.includes(requestId)) {
      return; // 避免重复处理
    }
    
    setProcessingIds(prev => [...prev, requestId]);
    
    try {
      await axios.patch(`/friends/requests/${requestId}`, { status: action });
      
      showMessage.success(action === 'accept' ? '已添加为好友' : '已拒绝请求');
      onRequestHandled(); // 通知父组件刷新数据
    } catch (error) {
      console.error(`处理好友请求失败:`, error);
      showMessage.error(`${action === 'accept' ? '接受' : '拒绝'}请求失败`);
    } finally {
      setProcessingIds(prev => prev.filter(id => id !== requestId));
    }
  };

  // 格式化时间
  const formatTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: zhCN });
    } catch (error) {
      return '未知时间';
    }
  };
  
  return (
    <div className="friend-requests-panel">
      <h2 className="panel-title">好友请求</h2>
      
      {requests.length === 0 ? (
        <div className="no-requests">
          <div className="no-requests-icon">📭</div>
          <p>暂无好友请求</p>
        </div>
      ) : (
        <div className="request-list">
          {requests.map(request => (
            <div key={request._id} className="request-item">
              <div className="request-header">
                <Avatar
                  src={request.sender.avatar}
                  alt={request.sender.nickname || request.sender.username}
                  size={56}
                />
                <div className="request-sender-info">
                  <div className="sender-name">
                    {request.sender.nickname || request.sender.username}
                  </div>
                  <div className="sender-username">@{request.sender.username}</div>
                  <div className="request-time">
                    {formatTime(request.createdAt)}
                  </div>
                </div>
              </div>
              
              {request.message && (
                <div className="request-message">
                  <div className="message-label">验证信息:</div>
                  <div className="message-content">{request.message}</div>
                </div>
              )}
              
              <div className="request-actions">
                <Button
                  theme="primary"
                  onClick={() => handleRequest(request._id, 'accept')}
                  disabled={processingIds.includes(request._id)}
                >
                  {processingIds.includes(request._id) ? '处理中...' : '接受'}
                </Button>
                <Button
                  theme="secondary"
                  onClick={() => handleRequest(request._id, 'reject')}
                  disabled={processingIds.includes(request._id)}
                >
                  拒绝
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FriendRequestsPanel;