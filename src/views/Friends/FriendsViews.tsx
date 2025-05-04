import { useEffect, useState } from 'react'
import axios from '@/lib/axios'
import Avatar from '@/components/Avatar/Avatar'
import { InputField } from '@/components/Form/Form'
import { showMessage } from '@/components/Message/MessageContainer'
import { debounce } from 'lodash'
import SearchIcon from "@/assets/icons/search.svg?react"
import AddFriendIcon from "@/assets/icons/add_friend.svg?react"
import RemindIcon from "@/assets/icons/remind.svg?react"
import ArrowDownIcon from "@/assets/icons/arrow_down.svg?react"
import ArrowRightIcon from "@/assets/icons/arrow_right.svg?react"
import "./FriendsViews.css"
import AddFriendPanel from './AddFriendPanel'

// 类型定义
interface Friend {
  _id: string
  friend: {
    _id: string
    username: string
    nickname: string
    avatar?: string
    gender?: string
  }
  remark?: string
  category: string
}

interface CategoryGroup {
  category: string
  friends: Friend[]
  isExpanded: boolean
}

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

function FriendsViews() {
  // 状态定义
  const [categoryGroups, setCategoryGroups] = useState<CategoryGroup[]>([])
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null)
  const [selectedView, setSelectedView] = useState<'details' | 'requests'>('details')
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([])
  const [isAddingCategory, setIsAddingCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [selectedTab, setSelectedTab] = useState<'details' | 'requests' | 'addFriend'>('details')

  // 查看添加好友页面
  const viewAddFriend = () => {
    setSelectedTab('addFriend')
    setSelectedFriend(null)
  }

  // 自定义回调函数，用于请求发送后的处理
  const handleRequestSent = () => {
    // 可以添加一些逻辑，例如刷新请求列表
    fetchFriendRequests()
  }

  // 获取好友列表(按分类)
  const fetchFriends = async () => {
    try {
      setIsLoading(true)
      const response = await axios.get('/friends')

      // 处理好友数据，按分类分组
      const friendsByCategory: Record<string, Friend[]> = {}
      response.data.forEach((friend: Friend) => {
        const category: string = friend.category || '我的好友'
        if (!friendsByCategory[category]) {
          friendsByCategory[category] = [] as Friend[]
        }
        friendsByCategory[category].push(friend)
      })

      // 转换为组件需要的数据格式
      const groups = Object.keys(friendsByCategory).map(category => ({
        category,
        friends: friendsByCategory[category],
        isExpanded: true // 默认展开
      }))

      setCategoryGroups(groups)
    } catch (error) {
      console.error('获取好友列表失败:', error)
      showMessage.error('获取好友列表失败')
    } finally {
      setIsLoading(false)
    }
  }

  // 获取好友请求
  const fetchFriendRequests = async () => {
    try {
      const response = await axios.get('/friends/requests/received')
      setPendingRequests(response.data)
    } catch (error) {
      console.error('获取好友请求失败:', error)
    }
  }

  // 处理搜索
  const handleSearch = debounce((query) => {
    setSearchQuery(query)
  }, 300)

  // 切换分类展开/折叠
  const toggleCategory = (category: string) => {
    setCategoryGroups(prev =>
      prev.map(group =>
        group.category === category
          ? { ...group, isExpanded: !group.isExpanded }
          : group
      )
    )
  }

  // 处理好友点击
  const handleFriendClick = (friend: Friend) => {
    setSelectedFriend(friend)
    setSelectedView('details')
  }

  // 查看好友请求
  const viewFriendRequests = () => {
    setSelectedView('requests')
    setSelectedFriend(null)
  }

  // 创建新分类
  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      showMessage.error('分类名称不能为空')
      return
    }

    try {
      await axios.post('/friends/categories', {
        category: newCategoryName,
        friendIds: []
      })

      showMessage.success(`已创建分类 "${newCategoryName}"`)
      setIsAddingCategory(false)
      setNewCategoryName('')
      fetchFriends()
    } catch (error) {
      console.error('创建分类失败:', error)
      showMessage.error('创建分类失败')
    }
  }

  // 过滤好友列表
  const getFilteredGroups = () => {
    if (!searchQuery) return categoryGroups

    return categoryGroups.map(group => ({
      ...group,
      friends: group.friends.filter(friend => {
        const displayName = friend.remark || friend.friend.nickname || friend.friend.username
        return displayName.toLowerCase().includes(searchQuery.toLowerCase())
      })
    })).filter(group => group.friends.length > 0)
  }

  // 获取显示名称
  const getDisplayName = (friend: Friend) => {
    return friend.remark || friend.friend.nickname || friend.friend.username
  }

  // 初始加载
  useEffect(() => {
    fetchFriends()
    fetchFriendRequests()

    // 定期刷新好友请求
    const requestInterval = setInterval(() => {
      fetchFriendRequests()
    }, 60000) // 每分钟检查一次新请求

    return () => clearInterval(requestInterval)
  }, [])

  return (
    <div className="friends-container">
      <aside className="friends-sidebar">
        {/* 头部区域：搜索框和添加好友按钮 */}
        <div className="friends-header">
          <div className="search-box">
            <InputField
              name='search'
              theme="search"
              type="text"
              placeholder="搜索好友"
              value={searchQuery}
              onChange={handleSearch}
            />
          </div>
          <button className={`add-friend-btn ${selectedTab === 'addFriend' ? 'active' : ''}`} onClick={viewAddFriend}>
            <AddFriendIcon />
          </button>
        </div>

        {/* 功能区域：好友通知 */}
        <div className="friends-functions">
          <div
            className={`function-item ${selectedView === 'requests' ? 'active' : ''} ${pendingRequests.length > 0 ? 'has-badge' : ''}`}
            onClick={viewFriendRequests}
          >
            <RemindIcon />
            <span className="function-text">好友通知</span>
            <div className="function-item-right">
              {pendingRequests.length > 0 && (
                <span className="badge">{pendingRequests.length}</span>
              )}
              <ArrowRightIcon></ArrowRightIcon>
            </div>
          </div>
        </div>

        {/* 好友分类操作区 */}
        <div className="category-controls">
          <h3 className="section-title">我的好友</h3>
          <button
            className="category-add-btn"
            onClick={() => setIsAddingCategory(true)}
          >
            {/* <Icon icon="mdi:folder-plus-outline" /> */}
          </button>
        </div>

        {isAddingCategory && (
          <div className="add-category-form">
            <input
              type="text"
              placeholder="新分类名称"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              autoFocus
            />
            <div className="form-actions">
              <button className="confirm-btn" onClick={handleCreateCategory}>确定</button>
              <button className="cancel-btn" onClick={() => setIsAddingCategory(false)}>取消</button>
            </div>
          </div>
        )}

        {/* 好友列表区域 */}
        {isLoading ? (
          <div className="loading-container">
            {/* <Icon icon="mdi:loading" className="loading-icon spin" /> */}
            <span>加载中...</span>
          </div>
        ) : (
          <div className="friends-list-container">
            {getFilteredGroups().length === 0 ? (
              <div className="empty-state">
                {searchQuery ? '没有找到匹配的好友' : '暂无好友'}
              </div>
            ) : (
              getFilteredGroups().map(group => (
                <div key={group.category} className="category-group">
                  <div
                    className="category-header"
                    onClick={() => toggleCategory(group.category)}
                  >
                    {
                      group.isExpanded ? (
                        <ArrowDownIcon></ArrowDownIcon>
                      ) : (
                        <ArrowRightIcon></ArrowRightIcon>
                      )
                    }
                    {/* <Icon 
                      icon={group.isExpanded ? "mdi:chevron-down" : "mdi:chevron-right"} 
                      className="category-icon" 
                    /> */}
                    <span className="category-name">{group.category}</span>
                    <span className="friend-count">{group.friends.length}</span>
                  </div>

                  {group.isExpanded && (
                    <ul className="friend-list">
                      {group.friends.map(friend => (
                        <li
                          key={friend._id}
                          className={`friend-item ${selectedFriend?._id === friend._id && selectedView === 'details' ? 'active' : ''}`}
                          onClick={() => handleFriendClick(friend)}
                        >
                          <Avatar
                            src={friend.friend.avatar}
                            alt={getDisplayName(friend)}
                            size={40}
                          />
                          <div className="friend-info">
                            <span className="friend-name">{getDisplayName(friend)}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </aside>

      {/* 右侧区域将在下一步实现 */}
      <main className="friends-layout">
        {selectedTab === 'details' && selectedFriend && (
          <div className="friend-profile">
            {/* 现有的好友详情内容 */}
          </div>
        )}

        {selectedTab === 'requests' && (
          <div className="friend-requests-panel">
            <h2 className="panel-title">好友请求</h2>
            {/* 这里是好友请求列表内容，后续完善 */}
          </div>
        )}

        {selectedTab === 'addFriend' && (
          <AddFriendPanel onRequestSent={handleRequestSent}></AddFriendPanel>
        )}

        {selectedTab !== 'addFriend' && !selectedFriend && selectedTab !== 'requests' && (
          <div className="no-friend-selected">
            <div className="placeholder-message">选择一个联系人查看详情</div>
          </div>
        )}
      </main>
    </div>
  )
}

export default FriendsViews