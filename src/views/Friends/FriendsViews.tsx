import { useEffect, useState, useCallback } from 'react'
import axios from '@/lib/axios'
import { showMessage } from '@/components/Message/MessageContainer'
import { debounce } from 'lodash'
import './FriendsViews.css'
import AddFriendPanel from './AddFriendPanel'
import FriendsSidebar from './FriendsSidebar'
import FriendRequestsPanel from './FriendRequestsPanel'
import { useWebSocketContext } from '@/contexts/WebSocketProvider'
import {
  CategoryGroup,
  Friend,
  FriendRequest,
  FriendRequestStatusType,
  ReceivedFriendRequest,
  SentFriendRequest,
} from '@/types/friends.type'

// 类型定义

function FriendsViews() {
  // 状态定义
  const [categoryGroups, setCategoryGroups] = useState<CategoryGroup[]>([])
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  // const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([])
  const [pendingReceivedRequestsCount, setPendingReceivedRequestsCount] =
    useState(0) // 用于 badge
  const [isAddingCategory, setIsAddingCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [selectedTab, setSelectedTab] = useState<
    'details' | 'requests' | 'addFriend'
  >('details')
  // 处理好友请求的状态
  const [requestPanelActiveTab, setRequestPanelActiveTab] = useState<
    'received' | 'sent'
  >('received')
  const [receivedRequests, setReceivedRequests] = useState<
    ReceivedFriendRequest[]
  >([])
  const [sentRequests, setSentRequests] = useState<SentFriendRequest[]>([])
  const [isLoadingRequests, setIsLoadingRequests] = useState(false) // 用于请求列表的加载状态

  // --- 使用 WebSocket Hook ---
  const { isConnected, on: socketOn } = useWebSocketContext()

  // 查看添加好友页面
  const viewAddFriend = () => {
    setSelectedTab('addFriend')
    setSelectedFriend(null)
  }

  // 查看好友请求
  const viewFriendRequests = () => {
    setSelectedTab('requests')
    setSelectedFriend(null)
  }

  // 获取好友列表(按分类)
  const fetchFriends = useCallback(async () => {
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
      const groups = Object.keys(friendsByCategory).map((category) => ({
        category,
        friends: friendsByCategory[category],
        isExpanded: true, // 默认展开
      }))

      setCategoryGroups(groups)
    } catch (error) {
      console.error('获取好友列表失败:', error)
      showMessage.error('获取好友列表失败')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // 获取收到的好友请求
  const fetchReceivedRequests = useCallback(async () => {
    console.log('Fetching received requests...')
    setIsLoadingRequests(true)
    try {
      const response = await axios.get<ReceivedFriendRequest[]>(
        '/friends/requests/received'
      )
      setReceivedRequests(response.data)
      const pendingCount = response.data.filter(
        (req) => req.status === 'pending'
      ).length
      setPendingReceivedRequestsCount(pendingCount)
    } catch (error) {
      console.error('获取收到的好友请求失败:', error)
      showMessage.error('获取收到的好友请求失败')
    } finally {
      setIsLoadingRequests(false)
    }
  }, [])

  // --- 获取发送的好友请求 ---
  const fetchSentRequests = useCallback(async () => {
    console.log('Fetching sent requests...')
    setIsLoadingRequests(true)
    try {
      const response = await axios.get<SentFriendRequest[]>(
        '/friends/requests/sent'
      )
      setSentRequests(response.data)
    } catch (error) {
      console.error('获取发送的好友请求失败:', error)
      showMessage.error('获取发送的好友请求失败')
    } finally {
      setIsLoadingRequests(false)
    }
  }, [])

  // 好友请求发送后的处理
  const handleRequestSent = useCallback(() => {
    console.log('handleRequestSent triggered')
    // 总是刷新发送的请求列表
    fetchSentRequests()
    // 如果用户当前在添加好友页面，则切换到请求页面并激活“发送的请求”tab
    if (selectedTab === 'addFriend') {
      setSelectedTab('requests')
      setRequestPanelActiveTab('sent') // 这会触发下面的useEffect来加载数据
    }
  }, [fetchSentRequests, selectedTab, setSelectedTab, setRequestPanelActiveTab]) // 添加依赖

  // 处理好友请求后的回调
  const handleRequestHandled = useCallback(() => {
    if (requestPanelActiveTab === 'received') {
      fetchReceivedRequests() // 会更新 receivedRequests 和 pendingReceivedRequestsCount
    }
    if (requestPanelActiveTab === 'sent') {
      fetchSentRequests() // <--- 添加这一行
    }
    fetchFriends()
  }, [requestPanelActiveTab, fetchReceivedRequests, fetchFriends])

  // 处理搜索
  const handleSearch = debounce((query) => {
    setSearchQuery(query)
  }, 300)

  // 切换分类展开/折叠
  const toggleCategory = (category: string) => {
    setCategoryGroups((prev) =>
      prev.map((group) =>
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

  // 创建新分类
  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      showMessage.error('分类名称不能为空')
      return
    }

    try {
      await axios.post('/friends/categories', {
        category: newCategoryName,
        friendIds: [],
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

  // --- WebSocket 事件处理 ---
  useEffect(() => {
    if (!socketOn) return

    const handleNewFriendRequest = (data: ReceivedFriendRequest) => {
      console.log('WS: newFriendRequest received raw data:', data)
      // 不论 data 内容如何，都先显示一个通用通知
      showMessage.info(
        `${
          data?.sender?.nickname || data?.sender?.username || '有人'
        } 请求添加你为好友`
      )

      // 如果用户当前正在查看“收到的请求”列表，则直接刷新列表以获取最准确的数据
      // 否则，可以仅更新角标，等待用户切换到该页面时再加载完整列表
      if (selectedTab === 'requests' && requestPanelActiveTab === 'received') {
        console.log(
          'WS: newFriendRequest - User is on received requests tab, fetching fresh list.'
        )
        fetchReceivedRequests() // 重新通过 HTTP GET 获取完整的、最新的列表
      } else {
        // 如果用户不在“收到的请求”页面，可以先乐观地更新未处理请求计数
        // 或者，如果 data 包含足够信息且你信任其 _id，也可以尝试添加到 receivedRequests 状态
        // 但为了解决 undefined _id 问题，这里选择更保守的方式：仅更新计数，依赖页面切换时的加载
        // 或者，如果后端保证推送的 data._id 总是有效的，可以像之前那样直接添加到列表
        // 为了解决你描述的 undefined id 问题，这里我们优先刷新
        // 如果你希望即使不在当前页面也更新列表（例如为了其他地方的计数准确），
        // 并且能确保 data._id 有效，可以取消下面这部分注释
        /*
        setReceivedRequests((prev) => {
          // 确保 data 和 data._id 有效才添加
          if (data && data._id && !prev.find(r => r._id === data._id)) {
            const updated = [data, ...prev];
            setPendingReceivedRequestsCount(
              updated.filter((req) => req.status === 'pending').length
            );
            return updated;
          }
          return prev;
        });
        */
        // 简单地增加一个计数器，或者依赖 fetchReceivedRequests 更新计数
        // 为了确保计数准确，最好还是依赖 fetchReceivedRequests
        // 如果不立即 fetch，至少要确保 pendingReceivedRequestsCount 能被其他方式更新
        // 考虑到 fetchReceivedRequests 内部会更新 pendingCount，这里可以不直接操作
        console.log(
          'WS: newFriendRequest - User is NOT on received requests tab. Count will update on tab switch or next fetch.'
        )
        // 如果你有一个独立的未读消息计数，可以在这里更新它
        // 例如: incrementUnreadFriendRequests();
        // 但目前你的 pendingReceivedRequestsCount 是从 receivedRequests 计算的
        // 所以，如果不在当前页，这个计数暂时不会因为新请求而立即变化，除非你修改逻辑
        // 一个折中的办法是，如果不在当前页，也调用 fetchReceivedRequests，
        // 但这可能会导致不必要的 API 调用。
        // 或者，如果后端推送的 data 包含 status，可以简单地增加 pendingReceivedRequestsCount
        if (data && data.status === 'pending') {
          setPendingReceivedRequestsCount((prevCount) => prevCount + 1)
        }
      }
    }

    const handleFriendRequestUpdate = (data: {
      requestId: string
      status: FriendRequestStatusType
    }) => {
      console.log('WS: friendRequestUpdate received data:', data)
      if (!data.requestId || !data.status) {
        console.warn(
          'friendRequestUpdate: Received invalid data, missing requestId or status.',
          data
        )
        return
      }

      let needsToRecalculatePending = false
      // 更新发送列表
      setSentRequests((prev) =>
        prev.map((req) =>
          req._id === data.requestId ? { ...req, status: data.status } : req
        )
      )
      // 更新接收列表
      setReceivedRequests((prev) => {
        const updated = prev.map((req) => {
          if (req._id === data.requestId) {
            if (
              req.status === 'pending' &&
              (data.status === 'accepted' || data.status === 'rejected')
            ) {
              needsToRecalculatePending = true
            }
            return { ...req, status: data.status }
          }
          return req
        })
        if (needsToRecalculatePending) {
          setPendingReceivedRequestsCount(
            updated.filter((req) => req.status === 'pending').length
          )
        }
        return updated
      })

      if (data.status === 'accepted') {
        showMessage.success('一个好友请求已被接受')
        fetchFriends() // 好友列表也需要更新
      } else if (data.status === 'rejected') {
        showMessage.warning('一个好友请求已被拒绝')
      }
    }

    const unsubNewReq = socketOn('newFriendRequest', handleNewFriendRequest)
    const unsubUpdate = socketOn(
      'friendRequestUpdate',
      handleFriendRequestUpdate
    )

    return () => {
      unsubNewReq?.()
      unsubUpdate?.()
    }
  }, [
    socketOn,
    fetchFriends,
    fetchReceivedRequests,
    selectedTab,
    requestPanelActiveTab,
    setPendingReceivedRequestsCount,
  ]) // 添加依赖

  // --- 根据 selectedTab 和 requestPanelActiveTab 加载数据 ---
  useEffect(() => {
    // 这个 effect 会在 selectedTab 或 requestPanelActiveTab 变化时运行
    // 也会在组件首次加载时，如果初始状态满足条件，则运行
    if (selectedTab === 'requests') {
      console.log(
        `Data loading effect: selectedTab='requests', requestPanelActiveTab='${requestPanelActiveTab}'`
      )
      // setIsLoadingRequests(true); // 移动到 fetch 函数内部的开头
      if (requestPanelActiveTab === 'received') {
        fetchReceivedRequests()
      } else if (requestPanelActiveTab === 'sent') {
        fetchSentRequests()
      }
    }
  }, [
    selectedTab,
    requestPanelActiveTab,
    fetchReceivedRequests,
    fetchSentRequests,
  ]) // 依赖项

  // 初始加载
  useEffect(() => {
    fetchFriends()
    fetchReceivedRequests()
  }, [fetchFriends, fetchReceivedRequests])

  return (
    <div className="friends-container">
      <FriendsSidebar
        categoryGroups={categoryGroups}
        selectedFriend={selectedFriend}
        selectedTab={selectedTab}
        pendingRequestsCount={pendingReceivedRequestsCount}
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
          <div className="friend-profile">{/* 现有的好友详情内容 */}</div>
        )}

        {selectedTab === 'requests' && (
          <div className="friend-requests-panel">
            <FriendRequestsPanel
              activeTab={requestPanelActiveTab}
              setActiveTab={setRequestPanelActiveTab}
              receivedRequests={receivedRequests}
              sentRequests={sentRequests}
              isLoading={isLoadingRequests}
              onRequestHandled={handleRequestHandled}
            />
          </div>
        )}

        {selectedTab === 'addFriend' && (
          <AddFriendPanel onRequestSent={handleRequestSent}></AddFriendPanel>
        )}

        {selectedTab !== 'addFriend' &&
          !selectedFriend &&
          selectedTab !== 'requests' && (
            <div className="no-friend-selected">
              <div className="placeholder-message">选择一个联系人查看详情</div>
            </div>
          )}
      </main>
    </div>
  )
}

export default FriendsViews
