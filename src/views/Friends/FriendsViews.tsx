import { useEffect, useState, useCallback } from 'react'
import axios from '@/lib/axios'
import { showMessage } from '@/components/Message/MessageContainer'
import { debounce } from 'lodash'
import './FriendsViews.css'
import AddFriendPanel from './AddFriendPanel'
import FriendsSidebar from './FriendsSidebar'
import FriendRequestsPanel from './FriendRequestsPanel'
import FriendProfile from './FriendProfile' // <--- 导入 FriendProfile
import ConfirmDialog from '@/components/Modal/ConfirmDialog/ConfirmDialog' // 假设你已经有了这个
import InputDialog from '@/components/Modal/InputDialog/InputDialog' // 我们需要一个新的 InputDialog
// import { useWebSocketContext } from '@/contexts/WebSocketProvider'
import {
  CategoryGroup,
  Friend,
  ReceivedFriendRequest,
  SentFriendRequest,
} from '@/types/friends.type'
import { useAppNotificationsContext } from '@/contexts/AppNotificationsContext'

function FriendsViews() {
  // 状态定义
  const [categoryGroups, setCategoryGroups] = useState<CategoryGroup[]>([])
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  // const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([])
  const {
    pendingReceivedRequestsCount,
    fetchAndUpdatePendingCount: refreshGlobalPendingCount,
  } = useAppNotificationsContext() // 使用全局计数和刷新方法
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

  const [isConfirmDeleteFriendOpen, setIsConfirmDeleteFriendOpen] =
    useState(false)
  // friendToDelete 存储好友的 userId 和 name
  const [friendToDelete, setFriendToDelete] = useState<{
    userId: string // <--- 确保这里是 userId
    name: string
  } | null>(null)
  const [isDeletingFriend, setIsDeletingFriend] = useState(false)

  const [isEditRemarkOpen, setIsEditRemarkOpen] = useState(false)
  // friendToEditRemark 存储好友的 userId 和 currentRemark
  const [friendToEditRemark, setFriendToEditRemark] = useState<{
    userId: string // <--- 确保这里是 userId
    currentRemark?: string
  } | null>(null)
  const [newRemark, setNewRemark] = useState('')
  const [isSavingRemark, setIsSavingRemark] = useState(false)
  // Dialog 的状态
  const [isAddCategoryDialogOpen, setIsAddCategoryDialogOpen] = useState(false)
  const [newCategoryNameInput, setNewCategoryNameInput] = useState('') // InputDialog 的输入值
  const [isCreatingCategory, setIsCreatingCategory] = useState(false) // 用于 InputDialog 的确认按钮加载状态
  const [isEditCategoryNameDialogOpen, setIsEditCategoryNameDialogOpen] =
    useState(false)
  const [categoryToEdit, setCategoryToEdit] = useState<{
    id: string
    currentName: string
  } | null>(null)
  const [newCategoryNameForEdit, setNewCategoryNameForEdit] = useState('')
  const [isSavingCategoryName, setIsSavingCategoryName] = useState(false)
  const [isConfirmDeleteCategoryOpen, setIsConfirmDeleteCategoryOpen] =
    useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState<{
    id: string
    name: string
  } | null>(null)
  const [isDeletingCategory, setIsDeletingCategory] = useState(false)

  // --- 使用 WebSocket Hook ---
  // const { on: socketOn } = useWebSocketContext()

    // 获取好友列表(按分类)
  const fetchFriends = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await axios.get('/friends/by-category')

      // 转换为组件需要的数据格式
      const groupsWithExpansionState = response.data.map((group: any) => ({
        ...group,
        isExpanded: true, // 默认展开，或者根据之前的状态恢复
      }))

      setCategoryGroups(groupsWithExpansionState)
    } catch (error) {
      console.error('获取好友列表失败:', error)
      showMessage.error('获取好友列表失败')
      setCategoryGroups([]) // 出错时清空或设置为一个表示错误的状态
    } finally {
      setIsLoading(false)
    }
  }, [])

  // 查看添加好友页面
  const viewAddFriend = () => {
    setSelectedTab('addFriend')
    setSelectedFriend(null)
  }

  // --- 好友请求 ---
  // 查看好友请求
  const viewFriendRequests = () => {
    setSelectedTab('requests')
    setSelectedFriend(null)
  }

  // 获取收到的好友请求
  const fetchReceivedRequests = useCallback(async () => {
    console.log('Fetching received requests...')
    setIsLoadingRequests(true)
    try {
      const response = await axios.get<ReceivedFriendRequest[]>(
        '/friends/requests/received'
      )
      setReceivedRequests(response.data)
      // const pendingCount = response.data.filter(
      //   (req) => req.status === 'pending'
      // ).length
      // setPendingReceivedRequestsCount(pendingCount)
    } catch (error) {
      console.error('获取收到的好友请求失败:', error)
      showMessage.error('获取收到的好友请求失败')
    } finally {
      setIsLoadingRequests(false)
    }
  }, [])
  // 获取发送的好友请求
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
    refreshGlobalPendingCount() // 关键：处理后刷新全局计数
  }, [requestPanelActiveTab, fetchReceivedRequests, fetchFriends])

  // 处理搜索
  const handleSearch = debounce((query) => {
    setSearchQuery(query)
  }, 300)

  // --- 好友分类 ---
  // 打开添加分类对话框
  const handleOpenAddCategoryDialog = () => {
    setNewCategoryNameInput('') // 清空上次输入
    setIsAddCategoryDialogOpen(true)
  }
  // 关闭添加分类对话框
  const handleCloseAddCategoryDialog = () => {
    setIsAddCategoryDialogOpen(false)
    // setIsAddingCategory(false);
  }
  // 确定创建分类
  const handleCreateCategoryConfirm = async (name: string) => {
    const trimmedName = name.trim()
    if (!trimmedName) {
      showMessage.error('分类名称不能为空')
      return
    }
    setIsCreatingCategory(true)
    try {
      // 假设 API 端点是 /friends/categories
      // 你的后端可能需要一个 categoryName 字段
      await axios.post('/friends/categories', { name: trimmedName })
      showMessage.success(`分类 "${trimmedName}" 创建成功`)
      fetchFriends() // 重新获取好友列表和分类
      handleCloseAddCategoryDialog()
    } catch (error: any) {
      console.error('创建分类失败:', error)
      const errorMsg = error.response?.data?.message || '创建分类失败'
      showMessage.error(errorMsg)
    } finally {
      setIsCreatingCategory(false)
    }
  }
  // 切换分类展开/折叠
  const toggleCategory = (categoryName: string) => {
    setCategoryGroups((prev) =>
      prev.map((group) =>
        group.categoryName === categoryName
          ? { ...group, isExpanded: !group.isExpanded }
          : group
      )
    )
  }
  // 打开重命名分类对话框
  const handleOpenRenameCategoryDialogCallback = useCallback(
    (categoryId: string, currentName: string) => {
      console.log('打开重命名分类对话框:', categoryId, currentName)
      setCategoryToEdit({
        id: categoryId,
        currentName: currentName,
      })
      setNewCategoryNameForEdit(currentName)
      setIsEditCategoryNameDialogOpen(true)
    },
    []
  )
  // 保存分类名称
  const handleSaveCategoryName = async () => {
    if (!categoryToEdit || !newCategoryNameForEdit.trim()) {
      showMessage.error('分类名称不能为空')
      return
    }
    setIsSavingCategoryName(true)
    try {
      await axios.put(`/friends/categories/${categoryToEdit.id}`, {
        name: newCategoryNameForEdit.trim(),
      })
      showMessage.success('分类名称已更新')
      fetchFriends()
      setIsEditCategoryNameDialogOpen(false)
      setCategoryToEdit(null)
    } catch (error: any) {
      console.error('更新分类名称失败:', error)
      showMessage.error(error.response?.data?.message || '更新分类名称失败')
    } finally {
      setIsSavingCategoryName(false)
    }
  }
  // 打开删除分类确认对话框
  const handleOpenDeleteCategoryDialogCallback = useCallback(
    (categoryId: string, categoryName: string) => {
      setCategoryToDelete({
        id: categoryId,
        name: categoryName,
      })
      setIsConfirmDeleteCategoryOpen(true)
    },
    []
  )
  // 确认删除分类名称
  const handleDeleteCategoryConfirmed = async () => {
    if (!categoryToDelete) return
    setIsDeletingCategory(true)
    try {
      await axios.delete(`/friends/categories/${categoryToDelete.id}`)
      showMessage.success(`分类 "${categoryToDelete.name}" 已删除`)
      fetchFriends()
      setIsConfirmDeleteCategoryOpen(false)
      setCategoryToDelete(null)
    } catch (error: any) {
      console.error('删除分类失败:', error)
      showMessage.error(error.response?.data?.message || '删除分类失败')
    } finally {
      setIsDeletingCategory(false)
    }
  }
  // 更新好友分类
  const handleFriendCategoryUpdated = useCallback(() => {
    fetchFriends() // 重新获取好友列表
  }, [fetchFriends])

  // --- 好友详情---
  // 处理好友点击
  const handleFriendClick = (friend: Friend) => {
    setSelectedFriend(friend)
    setSelectedTab('details')
  }
  // 发送消息给好友
  const handleSendMessage = (friendUserId: string) => {
    // parameter name updated for clarity
    showMessage.info(`准备向好友 ${friendUserId} 发送消息 (功能待实现)`)
    console.log(`Send message to friend: ${friendUserId}`)
  }
  // 打开备注编辑弹窗
  const handleOpenEditRemark = (
    friendUserId: string,
    currentRemark?: string
  ) => {
    // <--- 接收 friendUserId
    setFriendToEditRemark({ userId: friendUserId, currentRemark }) // <--- 存储 userId
    setNewRemark(currentRemark || '')
    setIsEditRemarkOpen(true)
  }
  // 关闭备注编辑弹窗
  const handleCloseEditRemark = () => {
    setIsEditRemarkOpen(false)
    setFriendToEditRemark(null)
    setNewRemark('')
  }
  // 保存备注
  const handleSaveRemark = async () => {
    if (!friendToEditRemark || !friendToEditRemark.userId) return // Check userId
    setIsSavingRemark(true)
    try {
      // API 期望 :friendId 是 userId
      await axios.patch(`/friends/${friendToEditRemark.userId}/remark`, {
        remark: newRemark.trim(),
      })
      showMessage.success('备注已更新')
      fetchFriends() // 重新获取好友列表以更新备注
      // 如果 FriendProfile 内部也获取最新数据，可以考虑是否还需要在这里 fetchFriends
      // 但为了列表的 displayName (如果受备注影响) 更新，通常需要
      handleCloseEditRemark()

      // 更新selectedFriend的备注
      setSelectedFriend((prevFriend) => {
        if (prevFriend && prevFriend.friend._id === friendToEditRemark.userId) {
          return {
            ...prevFriend,
            remark: newRemark.trim(), // 使用新的备注更新
          }
        }
        return prevFriend
      })
    } catch (error) {
      console.error('更新备注失败:', error)
      showMessage.error('更新备注失败')
    } finally {
      setIsSavingRemark(false)
    }
  }
  // 打开删除好友确认弹窗
  const handleOpenDeleteFriendConfirm = (
    friendUserId: string,
    friendName: string
  ) => {
    // <--- 接收 friendUserId
    setFriendToDelete({ userId: friendUserId, name: friendName }) // <--- 存储 userId
    setIsConfirmDeleteFriendOpen(true)
  }
  // 关闭删除好友确认弹窗
  const handleCloseDeleteFriendConfirm = () => {
    setIsConfirmDeleteFriendOpen(false)
    setFriendToDelete(null)
  }
  // 删除好友
  const handleDeleteFriendConfirmed = async () => {
    if (!friendToDelete || !friendToDelete.userId) return // Check userId
    setIsDeletingFriend(true)
    try {
      // API 期望 :friendId 是 userId
      await axios.delete(`/friends/${friendToDelete.userId}`)
      showMessage.success(`已删除好友 ${friendToDelete.name}`)
      setSelectedFriend(null)
      fetchFriends()
      refreshGlobalPendingCount()
      handleCloseDeleteFriendConfirm()
    } catch (error) {
      console.error('删除好友失败:', error)
      showMessage.error('删除好友失败')
    } finally {
      setIsDeletingFriend(false)
    }
  }

  // --- 使用 WebSocket 处理实时数据 ---
  // useEffect(() => {
  //   if (!socketOn) return

  //   const handleNewFriendRequest = (data: ReceivedFriendRequest) => {
  //     console.log('WS: newFriendRequest received raw data:', data)
  //     // 不论 data 内容如何，都先显示一个通用通知
  //     showMessage.info(
  //       `${
  //         data?.sender?.nickname || data?.sender?.username || '有人'
  //       } 请求添加你为好友`
  //     )

  //     // 如果用户当前正在查看“收到的请求”列表，则直接刷新列表以获取最准确的数据
  //     // 否则，可以仅更新角标，等待用户切换到该页面时再加载完整列表
  //     if (selectedTab === 'requests' && requestPanelActiveTab === 'received') {
  //       console.log(
  //         'WS: newFriendRequest - User is on received requests tab, fetching fresh list.'
  //       )
  //       fetchReceivedRequests() // 重新通过 HTTP GET 获取完整的、最新的列表
  //     } else {
  //       // 如果用户不在“收到的请求”页面，可以先乐观地更新未处理请求计数
  //       // 或者，如果 data 包含足够信息且你信任其 _id，也可以尝试添加到 receivedRequests 状态
  //       // 但为了解决 undefined _id 问题，这里选择更保守的方式：仅更新计数，依赖页面切换时的加载
  //       // 或者，如果后端保证推送的 data._id 总是有效的，可以像之前那样直接添加到列表
  //       // 为了解决你描述的 undefined id 问题，这里我们优先刷新
  //       // 如果你希望即使不在当前页面也更新列表（例如为了其他地方的计数准确），
  //       // 并且能确保 data._id 有效，可以取消下面这部分注释
  //       /*
  //       setReceivedRequests((prev) => {
  //         // 确保 data 和 data._id 有效才添加
  //         if (data && data._id && !prev.find(r => r._id === data._id)) {
  //           const updated = [data, ...prev];
  //           setPendingReceivedRequestsCount(
  //             updated.filter((req) => req.status === 'pending').length
  //           );
  //           return updated;
  //         }
  //         return prev;
  //       });
  //       */
  //       // 简单地增加一个计数器，或者依赖 fetchReceivedRequests 更新计数
  //       // 为了确保计数准确，最好还是依赖 fetchReceivedRequests
  //       // 如果不立即 fetch，至少要确保 pendingReceivedRequestsCount 能被其他方式更新
  //       // 考虑到 fetchReceivedRequests 内部会更新 pendingCount，这里可以不直接操作
  //       console.log(
  //         'WS: newFriendRequest - User is NOT on received requests tab. Count will update on tab switch or next fetch.'
  //       )
  //       // 如果你有一个独立的未读消息计数，可以在这里更新它
  //       // 例如: incrementUnreadFriendRequests();
  //       // 但目前你的 pendingReceivedRequestsCount 是从 receivedRequests 计算的
  //       // 所以，如果不在当前页，这个计数暂时不会因为新请求而立即变化，除非你修改逻辑
  //       // 一个折中的办法是，如果不在当前页，也调用 fetchReceivedRequests，
  //       // 但这可能会导致不必要的 API 调用。
  //       // 或者，如果后端推送的 data 包含 status，可以简单地增加 pendingReceivedRequestsCount
  //       if (data && data.status === 'pending') {
  //         setPendingReceivedRequestsCount((prevCount) => prevCount + 1)
  //       }
  //     }
  //   }

  //   const handleFriendRequestUpdate = (data: {
  //     requestId: string
  //     status: FriendRequestStatusType
  //   }) => {
  //     console.log('WS: friendRequestUpdate received data:', data)
  //     if (!data.requestId || !data.status) {
  //       console.warn(
  //         'friendRequestUpdate: Received invalid data, missing requestId or status.',
  //         data
  //       )
  //       return
  //     }

  //     let needsToRecalculatePending = false
  //     // 更新发送列表
  //     setSentRequests((prev) =>
  //       prev.map((req) =>
  //         req._id === data.requestId ? { ...req, status: data.status } : req
  //       )
  //     )
  //     // 更新接收列表
  //     setReceivedRequests((prev) => {
  //       const updated = prev.map((req) => {
  //         if (req._id === data.requestId) {
  //           if (
  //             req.status === 'pending' &&
  //             (data.status === 'accepted' || data.status === 'rejected')
  //           ) {
  //             needsToRecalculatePending = true
  //           }
  //           return { ...req, status: data.status }
  //         }
  //         return req
  //       })
  //       if (needsToRecalculatePending) {
  //         setPendingReceivedRequestsCount(
  //           updated.filter((req) => req.status === 'pending').length
  //         )
  //       }
  //       return updated
  //     })

  //     if (data.status === 'accepted') {
  //       showMessage.success('一个好友请求已被接受')
  //       fetchFriends() // 好友列表也需要更新
  //     } else if (data.status === 'rejected') {
  //       showMessage.warning('一个好友请求已被拒绝')
  //     }
  //   }

  //   const unsubNewReq = socketOn('newFriendRequest', handleNewFriendRequest)
  //   const unsubUpdate = socketOn(
  //     'friendRequestUpdate',
  //     handleFriendRequestUpdate
  //   )

  //   return () => {
  //     unsubNewReq?.()
  //     unsubUpdate?.()
  //   }
  // }, [
  //   socketOn,
  //   fetchFriends,
  //   fetchReceivedRequests,
  //   selectedTab,
  //   requestPanelActiveTab,
  //   setPendingReceivedRequestsCount,
  // ]) // 添加依赖

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
        onFriendClick={handleFriendClick}
        onViewFriendRequests={viewFriendRequests}
        onViewAddFriend={viewAddFriend}
        onToggleCategory={toggleCategory}
        onSearch={handleSearch}
        onAddCategory={handleOpenAddCategoryDialog}
        onOpenAddCategoryDialog={handleOpenAddCategoryDialog}
        onOpenRenameCategoryDialog={handleOpenRenameCategoryDialogCallback}
        onOpenDeleteCategoryDialog={handleOpenDeleteCategoryDialogCallback}
      />

      <main className="friends-layout">
        {selectedTab === 'details' && selectedFriend && (
          <FriendProfile
            friendInitial={selectedFriend} // selectedFriend is of type Friend
            onSendMessage={handleSendMessage}
            onEditRemark={handleOpenEditRemark} // Pass the correct handler
            onDeleteFriend={handleOpenDeleteFriendConfirm} // Pass the correct handler
            onCategoryUpdated={handleFriendCategoryUpdated}
          />
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
              <div className="placeholder-icon">🤝</div>
              <div className="placeholder-message">选择一个好友查看详情</div>
            </div>
          )}
      </main>

      {/* 删除好友确认弹窗 */}
      <ConfirmDialog
        isOpen={isConfirmDeleteFriendOpen}
        title="删除好友"
        message={`确定要删除好友 "${
          friendToDelete?.name || ''
        }" 吗？此操作会解除双方的好友关系。`}
        onConfirm={handleDeleteFriendConfirmed}
        onCancel={handleCloseDeleteFriendConfirm}
        confirmText="删除"
        isConfirming={isDeletingFriend}
      />

      {/* 修改备注弹窗 (需要 InputDialog 组件) */}
      {isEditRemarkOpen && friendToEditRemark && (
        <InputDialog
          isOpen={isEditRemarkOpen}
          title="修改备注"
          label="好友备注："
          // initialValue prop is not in InputDialogProps if controlled externally
          onSave={handleSaveRemark}
          onCancel={handleCloseEditRemark}
          confirmText="保存"
          isConfirming={isSavingRemark}
          inputValue={newRemark}
          onInputChange={setNewRemark}
        />
      )}

      {/* 添加分类弹窗 */}
      <InputDialog
        isOpen={isAddCategoryDialogOpen}
        title="新建好友分组"
        label="分组名称"
        placeholder="请输入分组名称"
        inputValue={newCategoryNameInput}
        onInputChange={setNewCategoryNameInput}
        onSave={handleCreateCategoryConfirm} // 确认时调用
        onCancel={handleCloseAddCategoryDialog}
        confirmText="创建"
        isConfirming={isCreatingCategory}
        maxLength={10}
      />

      {/* 重命名分类确认弹窗 */}
      {isEditCategoryNameDialogOpen && categoryToEdit && (
        <InputDialog
          isOpen={isEditCategoryNameDialogOpen}
          title="重命名分组"
          label="新分组名称："
          inputValue={newCategoryNameForEdit}
          onInputChange={setNewCategoryNameForEdit}
          onSave={handleSaveCategoryName}
          onCancel={() => {
            setIsEditCategoryNameDialogOpen(false)
            setCategoryToEdit(null)
          }}
          confirmText="保存"
          isConfirming={isSavingCategoryName}
          maxLength={10}
        />
      )}
      {/* 删除好友分类Dialog */}
      <ConfirmDialog
        isOpen={isConfirmDeleteCategoryOpen}
        title="删除好友分组"
        message={`确定要删除分组 "${
          categoryToDelete?.name || ''
        }" 吗？分组内的好友将移至 "我的好友"。`}
        onConfirm={handleDeleteCategoryConfirmed}
        onCancel={() => {
          setIsConfirmDeleteCategoryOpen(false)
          setCategoryToDelete(null)
        }}
        confirmText="删除"
        isConfirming={isDeletingCategory}
      />
    </div>
  )
}

export default FriendsViews
