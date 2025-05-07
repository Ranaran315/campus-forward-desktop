import { useEffect, useState } from 'react'
import Avatar from '@/components/Avatar/Avatar'
import Button from '@/components/Button/Button'
import { showMessage } from '@/components/Message/MessageContainer'
import axios from '@/lib/axios'
import './FriendRequestsPanel.css'
import {
  ReceivedFriendRequest,
  SentFriendRequest,
  FriendRequestStatusType,
} from '@/types/friends.type'
import ConfirmDialog from '@/components/Modal/ConfirmDialog/ConfirmDialog'
import DeletIcon from '@/assets/icons/delete.svg?react'
import { formatTimeAgo } from '@/utils/dateUtils'

// 定义 Props
interface FriendRequestsPanelProps {
  activeTab: 'received' | 'sent'
  setActiveTab: (tab: 'received' | 'sent') => void
  receivedRequests: ReceivedFriendRequest[]
  sentRequests: SentFriendRequest[]
  isLoading: boolean
  onRequestHandled: () => void
}

const FriendRequestsPanel: React.FC<FriendRequestsPanelProps> = ({
  activeTab,
  setActiveTab,
  receivedRequests,
  sentRequests,
  isLoading,
  onRequestHandled,
}) => {
  const [processingIds, setProcessingIds] = useState<string[]>([])
  // 删除确认框的状态
  const [isConfirmDeleteDialogOpen, setIsConfirmDeleteDialogOpen] =
    useState(false)
  const [requestToDeleteId, setRequestToDeleteId] = useState<string | null>(
    null
  )
  const [isDeleting, setIsDeleting] = useState(false)

  const handleRequest = async (
    requestId: string,
    action: 'accepted' | 'rejected'
  ) => {
    console.log(`处理好友请求: ${requestId}, 动作: ${action}`)
    if (processingIds.includes(requestId)) return
    setProcessingIds((prev) => [...prev, requestId])
    try {
      await axios.patch(`/friends/requests/${requestId}`, { action: action })
      showMessage.success(action === 'accepted' ? '已添加为好友' : '已拒绝请求')
      onRequestHandled()
    } catch (error: any) {
      console.error(`处理好友请求失败:`, error)
      const errorMsg =
        error.response?.data?.message ||
        `${action === 'accepted' ? '接受' : '拒绝'}请求失败`
      showMessage.error(errorMsg)
    } finally {
      setProcessingIds((prev) => prev.filter((id) => id !== requestId))
    }
  }

  // 获取请求状态文本
  const getStatusText = (
    status: FriendRequestStatusType,
    type: 'received' | 'sent'
  ): string => {
    if (type === 'received') {
      switch (status) {
        case 'pending':
          return '等待处理'
        case 'accepted':
          return '已接受'
        case 'rejected':
          return '已拒绝'
        case 'ignored':
          return '已忽略'
        default:
          return '未知状态'
      }
    } else {
      // sent
      switch (status) {
        case 'pending':
          return '等待对方答复'
        case 'accepted':
          return '对方已接受'
        case 'rejected':
          return '对方已拒绝'
        case 'ignored':
          return '对方已忽略' // 或不显示 ignored
        default:
          return '未知状态'
      }
    }
  }

  // 打开删除确认对话框
  const openDeleteConfirmDialog = (requestId: string) => {
    setRequestToDeleteId(requestId)
    setIsConfirmDeleteDialogOpen(true)
  }

  // 关闭删除确认对话框
  const closeDeleteConfirmDialog = () => {
    setRequestToDeleteId(null)
    setIsConfirmDeleteDialogOpen(false)
  }

  // 处理删除确认
  const handleDeleteConfirmed = async () => {
    if (!requestToDeleteId) return

    setIsDeleting(true)
    try {
      await axios.delete(`/friends/requests/${requestToDeleteId}`)
      showMessage.success('好友请求记录已删除')
      onRequestHandled()
      closeDeleteConfirmDialog()
    } catch (error: any) {
      console.error('删除好友请求记录失败:', error)
      const errorMsg = error.response?.data?.message || '删除失败'
      showMessage.error(errorMsg)
    } finally {
      setIsDeleting(false)
    }
  }

  useEffect(() => {
    console.log(
      'FriendRequestsPanel: receivedRequests prop updated',
      receivedRequests
    )
    // 仔细检查这里的数据，特别是 WebSocket 推送后新增的数据
  }, [receivedRequests])

  // 渲染收到的请求列表
  const renderReceivedRequests = () => (
    <div className="request-list">
      {receivedRequests.length === 0 && !isLoading && (
        <div className="no-requests">
          <div className="no-requests-icon">📬</div>
          <p>暂无收到的好友请求</p>
        </div>
      )}
      {receivedRequests.map((request) => (
        <div
          key={request._id}
          className={`request-item status-${request.status}`}
        >
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
                {formatTimeAgo(request.createdAt)}
              </div>
            </div>
            <div className="request-status-badge">
              {getStatusText(request.status, 'received')}
            </div>
          </div>
          {request.message && (
            <div className="request-message">
              <div className="message-label">验证信息:</div>
              <div className="message-content">{request.message}</div>
            </div>
          )}
          {request.status === 'pending' && ( // 只对未处理的请求显示操作按钮
            <div className="request-actions">
              <Button
                theme="primary"
                onClick={() => handleRequest(request._id, 'accepted')}
                disabled={processingIds.includes(request._id)}
              >
                {processingIds.includes(request._id) ? '处理中...' : '接受'}
              </Button>
              <Button
                theme="secondary"
                onClick={() => handleRequest(request._id, 'rejected')}
                disabled={processingIds.includes(request._id)}
              >
                拒绝
              </Button>
            </div>
          )}
          {request.status !== 'pending' && (
            <div className="request-actions request-actions-delete">
              <Button
                theme="danger"
                onClick={() => openDeleteConfirmDialog(request._id)}
                disabled={processingIds.includes(request._id) || isDeleting}
                title="删除此记录"
              >
                <DeletIcon></DeletIcon>删除
              </Button>
            </div>
          )}
        </div>
      ))}
    </div>
  )

  // 渲染发送的请求
  const renderSentRequests = () => (
    <div className="request-list">
      {sentRequests.length === 0 && !isLoading && (
        <div className="no-requests">
          <div className="no-requests-icon">📤</div>
          <p>暂无发送的好友请求</p>
        </div>
      )}
      {sentRequests.map((request) => (
        <div
          key={request._id}
          className={`request-item status-${request.status}`}
        >
          <div className="request-header">
            <Avatar
              src={request.receiver.avatar}
              alt={request.receiver.nickname || request.receiver.username}
              size={56}
            />
            <div className="request-sender-info">
              <div className="sender-name">
                {request.receiver.nickname || request.receiver.username}
              </div>
              <div className="sender-username">
                @{request.receiver.username}
              </div>
              <div className="request-time">
                {formatTimeAgo(request.createdAt)}
              </div>
            </div>
            <div className="request-status-badge">
              {getStatusText(request.status, 'sent')}
            </div>
          </div>
          {request.message && (
            <div className="request-message">
              <div className="message-label">附言:</div>
              <div className="message-content">{request.message}</div>
            </div>
          )}
          {request.status !== 'pending' && (
            <div className="request-actions request-actions-delete">
              <Button
                theme="danger"
                onClick={() => openDeleteConfirmDialog(request._id)}
                disabled={processingIds.includes(request._id) || isDeleting}
                title="删除此记录"
              >
                <DeletIcon></DeletIcon>删除
              </Button>
            </div>
          )}
        </div>
      ))}
    </div>
  )

  return (
    <div className="friend-requests-panel">
      <div className="panel-header">
        <div className="tabs">
          <button
            className={`tab-button ${activeTab === 'received' ? 'active' : ''}`}
            onClick={() => setActiveTab('received')}
          >
            收到的请求
          </button>
          <button
            className={`tab-button ${activeTab === 'sent' ? 'active' : ''}`}
            onClick={() => setActiveTab('sent')}
          >
            发送的请求
          </button>
        </div>
      </div>

      {isLoading && <div className="loading-placeholder">加载请求中...</div>}
      {!isLoading && activeTab === 'received' && renderReceivedRequests()}
      {!isLoading && activeTab === 'sent' && renderSentRequests()}

      <ConfirmDialog
        isOpen={isConfirmDeleteDialogOpen}
        title="确认删除"
        message="确定要删除这条好友请求记录吗？此操作不可撤销。"
        onConfirm={handleDeleteConfirmed}
        onCancel={closeDeleteConfirmDialog}
        confirmText="删除"
        isConfirming={isDeleting}
      />
    </div>
  )
}

export default FriendRequestsPanel
