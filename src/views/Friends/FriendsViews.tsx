import { useEffect, useState } from 'react'
import axios from '@/lib/axios'
import { showMessage } from '@/components/Message/MessageContainer'
import { debounce } from 'lodash'
import "./FriendsViews.css"
import AddFriendPanel from './AddFriendPanel'
import FriendsSidebar from './FriendsSidebar'
import FriendRequestsPanel from './FriendRequestsPanel'

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
  }

  // 查看好友请求
  const viewFriendRequests = () => {
    setSelectedTab('requests')
    setSelectedFriend(null)
  }

  // 处理好友请求后的回调
  const handleRequestHandled = () => {
    // 刷新好友请求列表和好友列表
    fetchFriendRequests()
    fetchFriends()
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
      <FriendsSidebar
        categoryGroups={categoryGroups}
        selectedFriend={selectedFriend}
        selectedTab={selectedTab}
        pendingRequests={pendingRequests}
        isLoading={isLoading}
        searchQuery={searchQuery}
        isAddingCategory={isAddingCategory}
        newCategoryName={newCategoryName}
        onFriendClick={handleFriendClick}
        onViewFriendRequests={viewFriendRequests}
        onViewAddFriend={viewAddFriend}
        onToggleCategory={toggleCategory}
        onSearch={handleSearch}
        onAddCategory={() => setIsAddingCategory(true)}
        onCancelAddCategory={() => setIsAddingCategory(false)}
        onNewCategoryNameChange={setNewCategoryName}
        onCreateCategory={handleCreateCategory}
      />

      <main className="friends-layout">
        {selectedTab === 'details' && selectedFriend && (
          <div className="friend-profile">
            {/* 现有的好友详情内容 */}
          </div>
        )}

        {selectedTab === 'requests' && (
          <div className="friend-requests-panel">
            <FriendRequestsPanel
              requests={pendingRequests}
              onRequestHandled={handleRequestHandled}
            />
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