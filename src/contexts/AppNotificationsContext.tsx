import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from 'react'
import { useWebSocketContext } from './WebSocketProvider' // 使用你现有的 WebSocketProvider
import axios from '@/lib/axios'
import {
  ReceivedFriendRequest,
  FriendRequestStatusType,
} from '@/types/friends.type'
import { message } from 'antd'

interface AppNotificationsContextProps {
  pendingReceivedRequestsCount: number
  fetchAndUpdatePendingCount: () => Promise<void>
  notificationsVersion: number
  bumpNotificationsVersion: () => void
  unreadNotificationsCount: number
  fetchAndUpdateUnreadNotifications: () => Promise<void>
}

const AppNotificationsContext = createContext<
  AppNotificationsContextProps | undefined
>(undefined)

export const AppNotificationsProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { on: socketOn, isConnected } = useWebSocketContext() // 从你的 WebSocketProvider 获取 on 和 isConnected

  const [pendingReceivedRequestsCount, setPendingReceivedRequestsCount] =
    useState(0) // 好友请求计数state

  const [notificationsVersion, setNotificationsVersion] = useState(0) // 通知版本号state
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0) // 未读通知计数state

  // 获取并更新待处理好友请求计数
  const fetchAndUpdatePendingCount = useCallback(async () => {
    console.log('AppNotificationsProvider: Fetching pending requests count...')
    try {
      const response = await axios.get<ReceivedFriendRequest[]>(
        '/friends/requests/received'
      )
      const pendingCount = response.data.filter(
        (req) => req.status === 'pending'
      ).length
      console.log(
        'AppNotificationsProvider: Pending count updated to',
        pendingCount
      )
      setPendingReceivedRequestsCount(pendingCount)
    } catch (error) {
      console.error(
        'AppNotificationsProvider: Failed to fetch pending requests count',
        error
      )
    }
  }, [])

  // 更新通知版本号
  const bumpNotificationsVersion = useCallback(() => {
    setNotificationsVersion((v) => v + 1)
  }, [])

  // 拉取未读通知数量
  const fetchAndUpdateUnreadNotifications = useCallback(async () => {
    try {
      // 假设后端有这个接口
      const response = await axios.get<{ count: number }>(
        '/informs/receipt/unread/count'
      )
      setUnreadNotificationsCount(response.data.count)
    } catch (error) {
      console.error(
        'AppNotificationsProvider: Failed to fetch unread notifications count',
        error
      )
    }
  }, [])

  useEffect(() => {
    // 当 WebSocket 连接成功并且 socketOn 方法可用时，获取初始计数
    // @ts-ignore
    if (isConnected && socketOn) {
      fetchAndUpdatePendingCount()
    }
  }, [isConnected, socketOn, fetchAndUpdatePendingCount])

  useEffect(() => {
    if (!socketOn || !isConnected) {
      // 确保 socketOn 可用且已连接才注册监听器
      return
    }

    console.log(
      'AppNotificationsProvider: Attempting to register WS listeners.'
    )

    // 新好友请求推送监听
    const handleNewFriendRequest = (data: ReceivedFriendRequest) => {
      console.log('AppNotificationsProvider (WS): newFriendRequest', data)
      message.info(
        `${
          data?.sender?.nickname || data?.sender?.username || '有人'
        } 请求添加你为好友`
      )
      fetchAndUpdatePendingCount()
    }

    // 好友请求状态推送更新监听
    const handleFriendRequestUpdate = (updateData: {
      requestId: string
      status: FriendRequestStatusType
    }) => {
      console.log(
        'AppNotificationsProvider (WS): friendRequestUpdate',
        updateData
      )
      if (updateData.status === 'accepted') {
        message.success('一个好友请求已被接受')
      } else if (updateData.status === 'rejected') {
        message.warning('一个好友请求已被拒绝')
      }
      fetchAndUpdatePendingCount()
    }

    // 通知推送监听
    const handleNewInform = (data: any) => {
      console.log('AppNotificationsProvider (WS): newInform', data)
      // 你可以弹窗、红点、刷新列表等
      message.info(`新通知：${data.title || '您有新通知'}`)
      // 这里可以触发全局状态更新或重新拉取通知列表
      bumpNotificationsVersion()
      fetchAndUpdateUnreadNotifications()
    }

    // 使用从 WebSocketProvider 获取的 on 方法注册监听器
    const unsubNewReq = socketOn('newFriendRequest', handleNewFriendRequest)
    const unsubUpdate = socketOn(
      'friendRequestUpdate',
      handleFriendRequestUpdate
    )
    const unsubNewInform = socketOn('newInform', handleNewInform)

    // 组件卸载或依赖变化时清理监听器
    return () => {
      console.log('AppNotificationsProvider: Cleaning up WS listeners.')
      unsubNewReq?.() // 调用取消订阅函数
      unsubUpdate?.() // 调用取消订阅函数
      unsubNewInform?.() // 调用取消订阅函数
    }
  }, [socketOn, isConnected, fetchAndUpdatePendingCount]) // 依赖 isConnected 确保连接后才执行

  return (
    <AppNotificationsContext.Provider
      value={{
        pendingReceivedRequestsCount,
        fetchAndUpdatePendingCount,
        notificationsVersion,
        bumpNotificationsVersion,
        unreadNotificationsCount,
        fetchAndUpdateUnreadNotifications,
      }}
    >
      {children}
    </AppNotificationsContext.Provider>
  )
}

export const useAppNotificationsContext = (): AppNotificationsContextProps => {
  const context = useContext(AppNotificationsContext)
  if (context === undefined) {
    throw new Error(
      'useAppNotificationsContext must be used within an AppNotificationsProvider'
    )
  }
  return context
}
