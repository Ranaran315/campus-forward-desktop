import React, { useEffect, useState } from 'react'
import axios from '@/lib/axios'
import Avatar from '@/components/Avatar/Avatar'
import Button from '@/components/Button/Button'
import { Friend } from '@/types/friends.type' // 确保 Friend 和 UserBaseInfo 类型定义正确
import './FriendProfile.css'
import MessageIcon from '@/assets/icons/message.svg?react'
import EditIcon from '@/assets/icons/edit.svg?react'
import DeleteIcon from '@/assets/icons/delete.svg?react'
import RemarkIcon from '@/assets/icons/remark.svg?react'
import { showMessage } from '@/components/Message/MessageContainer'
import { normalizeAge, normalizeGender } from '@/utils/normalizationUtils'
import { formatDateTime } from '@/utils/dateUtils'

interface FriendProfileProps {
  friendInitial: Friend
  onSendMessage: (friendUserId: string) => void
  onEditRemark: (friendUserId: string, currentRemark?: string) => void // <--- 修改为 friendUserId
  onDeleteFriend: (friendUserId: string, friendName: string) => void // <--- 修改为 friendUserId
}

const FriendProfile: React.FC<FriendProfileProps> = ({
  friendInitial,
  onSendMessage,
  onEditRemark,
  onDeleteFriend,
}) => {
  const [currentFriendData, setCurrentFriendData] = useState<Friend | null>(
    friendInitial
  )
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (friendInitial && friendInitial._id) {
      // friendInitial._id 是 relationId
      const fetchLatestFriendInfo = async () => {
        setIsLoading(true)
        try {
          const response = await axios.get<Friend>(
            `/friends/relation/${friendInitial._id}`
          )
          setCurrentFriendData(response.data)
        } catch (error) {
          console.error('Failed to fetch latest friend info:', error)
          showMessage.error('无法加载最新的好友信息')
          // 失败时，仍然使用 friendInitial (或置空以显示错误)
          setCurrentFriendData(friendInitial) // 或者 setCurrentFriendData(null)
        } finally {
          setIsLoading(false)
        }
      }
      fetchLatestFriendInfo()
    } else {
      setCurrentFriendData(friendInitial)
    }
  }, [friendInitial])

  if (isLoading && !currentFriendData) {
    return (
      <div className="friend-profile-container">
        <p>正在加载好友信息...</p>
      </div>
    )
  }

  if (!currentFriendData || !currentFriendData.friend) {
    return (
      <div className="friend-profile-empty">
        <p>无法加载好友信息。</p>
      </div>
    )
  }

  const { friend: friendDetails, remark } = currentFriendData // friendDetails 包含 _id (userId)
  const displayName = friendDetails.nickname || friendDetails.username

  return (
    <div className="friend-profile-container">
      <div className="profile-header">
        <Avatar src={friendDetails.avatar} alt={displayName} size={80} />
        <div className="profile-name-section">
          <div className="profile-display-name">{displayName}</div>
          <p className="profile-username">@{friendDetails.username}</p>
        </div>
      </div>

      <div className="profile-details">
        <div className="profile-detail-item">
          <ul>
            <li>
              {normalizeGender(friendDetails.gender, friendDetails.userType)}
            </li>
            <li>🎂 {formatDateTime(friendDetails.birthday)}</li>
            <li>{normalizeAge(friendDetails.birthday)}</li>
          </ul>
        </div>
        {friendDetails.userType === 'student' && (
          <div className="profile-detail-item">
            <ul>
              <li>{friendDetails.departmentInfo?.departmentName || '未知'}</li>
              <li>{friendDetails.majorInfo?.majorName || '未知'}</li>
              <li>{friendDetails.classInfo?.className || '未知'}</li>
            </ul>
          </div>
        )}
        <div className="profile-detail-item">
          <div className="profile-detail-item-left">
            <RemarkIcon />
            备注
          </div>
          <div className="profile-detail-item-right">{remark || '无备注'}</div>
        </div>
        {/* 你可以添加显示好友分组的逻辑，如果 currentFriendData.category 存在 */}
        {currentFriendData.category && (
          <div className="profile-detail-item">
            <div className="profile-detail-item-left">
              {/* <CategoryIcon />  假设有分类图标 */}
              分组
            </div>
            <div className="profile-detail-item-right">
              {currentFriendData.category === 'default'
                ? '我的好友'
                : currentFriendData.category}
            </div>
          </div>
        )}
      </div>

      <div className="profile-actions">
        <Button
          theme="primary"
          onClick={() => onSendMessage(friendDetails._id)} // friendDetails._id is the friend's User ID
          className="action-button"
        >
          <MessageIcon /> 发消息
        </Button>
        <Button
          theme="secondary"
          onClick={() => onEditRemark(friendDetails._id, remark)} // <--- 传递 friendDetails._id (userId)
          className="action-button"
        >
          <EditIcon /> 修改备注
        </Button>
        <Button
          theme="danger"
          onClick={() => onDeleteFriend(friendDetails._id, displayName)} // <--- 传递 friendDetails._id (userId)
          className="action-button"
        >
          <DeleteIcon /> 删除好友
        </Button>
      </div>
    </div>
  )
}

export default FriendProfile
