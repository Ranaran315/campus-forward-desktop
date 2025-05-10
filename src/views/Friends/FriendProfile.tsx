import React, { useCallback, useEffect, useState } from 'react'
import axios from '@/lib/axios'
import Avatar from '@/components/Avatar/Avatar'
import Button from '@/components/Button/Button'
import { Friend, FriendCategoryInfo } from '@/types/friends.type' // 确保 Friend 和 UserBaseInfo 类型定义正确
import './FriendProfile.css'
import MessageIcon from '@/assets/icons/message.svg?react'
import EditIcon from '@/assets/icons/edit.svg?react'
import DeleteIcon from '@/assets/icons/delete.svg?react'
import RemarkIcon from '@/assets/icons/remark.svg?react'
import GroupIcon from '@/assets/icons/group.svg?react'
import { showMessage } from '@/components/Message/MessageContainer'
import { normalizeAge, normalizeGender } from '@/utils/normalizationUtils'
import { formatDateTime } from '@/utils/dateUtils'
import { SelectField } from '@/components/Form/Form'

interface FriendProfileProps {
  friendInitial: Friend
  onSendMessage: (friendUserId: string) => void
  onEditRemark: (friendUserId: string, currentRemark?: string) => void
  onDeleteFriend: (friendUserId: string, friendName: string) => void
  onCategoryUpdated: () => void // 分类更新后的回调函数
}

const FriendProfile: React.FC<FriendProfileProps> = ({
  friendInitial,
  onSendMessage,
  onEditRemark,
  onDeleteFriend,
  onCategoryUpdated,
}) => {
  const [currentFriendData, setCurrentFriendData] = useState<Friend | null>(
    friendInitial
  )
  const [isLoading, setIsLoading] = useState(false)
  // 好友分类状态管理
  const [availableCategories, setAvailableCategories] = useState<
    FriendCategoryInfo[]
  >([])
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(false)
  const [isUpdatingCategory, setIsUpdatingCategory] = useState(false)

  // 获取最新好友信息
  const fetchLatestFriendInfo = useCallback(
    async (relationId: string) => {
      console.log(
        'FriendProfile: Fetching latest info for relationId:',
        relationId
      )
      setIsLoading(true)
      try {
        const response = await axios.get<Friend>(
          `/friends/relation/${relationId}`
        )
        setCurrentFriendData(response.data)
      } catch (error) {
        console.error('Failed to fetch latest friend info:', error)
        showMessage.error('无法加载最新的好友信息')
        setCurrentFriendData((prevData) => prevData || friendInitial)
      } finally {
        setIsLoading(false)
      }
    },
    [friendInitial]
  )

  // 获取最新好友信息
  useEffect(() => {
    const relationId = friendInitial?._id // 获取 relationId
    if (relationId) {
      fetchLatestFriendInfo(relationId)
    } else {
      // 如果没有 relationId，则直接使用 friendInitial (可能是 null 或未选中的情况)
      setCurrentFriendData(friendInitial)
    }
  }, [friendInitial?._id, friendInitial]) // 主要依赖 relationId，friendInitial 作为次要依赖以处理其为 null 的情况

  // 获取好友分类
  useEffect(() => {
    const fetchCategories = async () => {
      setIsCategoriesLoading(true)
      try {
        const response = await axios.get<FriendCategoryInfo[]>(
          '/friends/categories'
        )
        setAvailableCategories(response.data)
      } catch (error) {
        console.error('Failed to fetch friend categories:', error)
        showMessage.error('无法加载好友分组列表')
      } finally {
        setIsCategoriesLoading(false)
      }
    }
    fetchCategories()
  }, [])

  // 好友分类选择器
  const handleCategoryChange = async (
    name: string,
    newCategoryId: string | string[] | number | number[]
  ) => {
    if (
      typeof newCategoryId !== 'string' ||
      !currentFriendData ||
      !currentFriendData.friend
    ) {
      showMessage.error('无效的分类ID')
      return
    }

    const friendUserId = currentFriendData.friend._id
    const oldCategoryId = currentFriendData.category?._id

    if (newCategoryId === oldCategoryId) {
      return // 没有改变，则不执行操作
    }

    setIsUpdatingCategory(true)
    try {
      await axios.patch(`/friends/${friendUserId}/category`, {
        category: newCategoryId,
      })
      showMessage.success('好友分组已更新')
      // 更新成功后，刷新好友信息以获取最新的分类
      if (currentFriendData._id) {
        // currentFriendData._id is relationId
        fetchLatestFriendInfo(currentFriendData._id)
      }
      onCategoryUpdated()
    } catch (error: any) {
      console.error('Failed to update friend category:', error)
      showMessage.error(error.response?.data?.message || '更新好友分组失败')
    } finally {
      setIsUpdatingCategory(false)
    }
  }

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

  const {
    friend: friendDetails,
    remark,
    category: friendCategory,
  } = currentFriendData // friendDetails 包含 _id (userId)
  const displayName = friendDetails.nickname || friendDetails.username // 显示昵称或用户名

  // 好友分类选项
  const categoryOptions = availableCategories.map((cat) => ({
    value: cat._id,
    label: cat.name,
  }))

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
        <div className="profile-detail-item">
          <div className="profile-detail-item-left">
            <GroupIcon />
            分组
          </div>
          <div className="profile-detail-item-right">
            <SelectField
              name="friendCategory"
              options={categoryOptions}
              value={friendCategory?._id || ''} // 如果没有分类，给一个空字符串或特定值
              onChange={handleCategoryChange}
              disabled={isUpdatingCategory || categoryOptions.length === 0}
              placeholder="选择分组"
              className="friend-category-select" // 可以添加自定义样式
              loading={isCategoriesLoading || isUpdatingCategory}
              size="small"
            />
          </div>
        </div>
        {/* 你可以添加显示好友分组的逻辑，如果 currentFriendData.category 存在 */}
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
