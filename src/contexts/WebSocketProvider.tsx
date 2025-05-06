import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  ReactNode,
} from 'react'
import io, { Socket } from 'socket.io-client'
import { showMessage } from '@/components/Message/MessageContainer' // 确保路径正确

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'

interface WebSocketContextProps {
  socket: Socket | null
  isConnected: boolean
  // 'on' 方法现在返回一个取消订阅的函数
  on: (
    event: string,
    listener: (...args: any[]) => void
  ) => (() => void) | undefined
  emit: (event: string, ...args: any[]) => void
}

const WebSocketContext = createContext<WebSocketContextProps | undefined>(
  undefined
)

export const WebSocketProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [isConnected, setIsConnected] = useState(false)
  // 使用 ref 存储 socket 实例，避免 stale closure 问题，并确保实例稳定
  const socketRef = useRef<Socket | null>(null)
  // 使用 ref 存储监听器，确保它们在重连或组件卸载/挂载时被正确处理
  const listenersRef = useRef<Map<string, Set<(...args: any[]) => void>>>(
    new Map()
  )

  // 核心连接逻辑
  useEffect(() => {
    const token = localStorage.getItem('authToken')

    // 只有在有 token 且当前没有连接时才尝试连接
    if (token && !socketRef.current) {
      console.log('WebSocketProvider: Attempting to connect...')
      const newSocket = io(SOCKET_URL, {
        auth: { token },
        transports: ['websocket'],
        reconnectionAttempts: 5, // 自动重连
        reconnectionDelay: 3000,
      })

      socketRef.current = newSocket

      const handleConnect = () => {
        console.log('WebSocket connected via Provider:', newSocket.id)
        setIsConnected(true)
        // 连接成功后，重新注册所有当前存储的监听器
        listenersRef.current.forEach((listeners, event) => {
          if (listeners.size > 0) {
            // 先移除旧监听器以防万一（重连时可能需要）
            newSocket.off(event)
            newSocket.on(event, (...args) => {
              // 执行所有为该事件注册的回调
              listenersRef.current.get(event)?.forEach((l) => l(...args))
            })
            console.log(
              `WebSocketProvider: Re-registered listener for ${event}`
            )
          }
        })
      }

      const handleDisconnect = (reason: Socket.DisconnectReason) => {
        console.log('WebSocket disconnected via Provider:', reason)
        setIsConnected(false)
        // 根据断开原因决定是否彻底清理 socketRef
        // 如果是服务器或客户端主动断开，则清理
        if (
          reason === 'io server disconnect' ||
          reason === 'io client disconnect'
        ) {
          socketRef.current?.close() // 确保关闭
          socketRef.current = null
        }
        // 注意：自动重连时，socket 实例可能不变，不需要设为 null
      }

      const handleError = (error: Error) => {
        console.error('WebSocket connection error via Provider:', error)
        showMessage.error(`WebSocket 连接错误: ${error.message}`)
        setIsConnected(false)
        // 也可以考虑在这里清理 socketRef
        // socketRef.current?.close();
        // socketRef.current = null;
      }

      newSocket.on('connect', handleConnect)
      newSocket.on('disconnect', handleDisconnect)
      newSocket.on('connect_error', handleError)

      // 组件卸载时的清理函数 (例如用户登出，Provider 被卸载)
      return () => {
        console.log('WebSocketProvider: Cleaning up connection...')
        newSocket.off('connect', handleConnect)
        newSocket.off('disconnect', handleDisconnect)
        newSocket.off('connect_error', handleError)
        // 从 socket 实例移除所有监听器
        listenersRef.current.forEach((_, event) => {
          newSocket.off(event)
        })
        newSocket.disconnect()
        socketRef.current = null
        setIsConnected(false)
        listenersRef.current.clear() // 清空存储的监听器
      }
    } else if (!token && socketRef.current) {
      // 如果 token 消失（用户登出），且当前有连接，则断开
      console.log('WebSocketProvider: No token found, disconnecting...')
      socketRef.current.disconnect()
      socketRef.current = null
      setIsConnected(false)
      listenersRef.current.clear()
    }

    // 这个 effect 应该只在 token 状态变化时重新运行（或者在 Provider 挂载/卸载时）
    // 如果依赖项为空数组，它只在挂载和卸载时运行。
    // 如果希望在 token 变化时（例如登录/登出）自动连接/断开，需要一种方式来触发这个 effect。
    // 通常，登录/登出操作会刷新页面或重新渲染 App 组件，导致 Provider 重新挂载或其父组件状态变化。
    // 如果应用状态（如 isAuthenticated）在 Provider 外部管理，可以将该状态传入 Provider 或让 Provider 监听 token 变化。
    // 为简单起见，当前依赖项为空，依赖于 Provider 的挂载/卸载来处理连接/断开。
  }, []) // 依赖项为空，表示仅在 Provider 挂载时尝试连接，卸载时清理

  // 封装 on 方法，用于添加监听器
  const on = useCallback(
    (event: string, listener: (...args: any[]) => void): (() => void) => {
      // 将监听器存入 ref
      if (!listenersRef.current.has(event)) {
        listenersRef.current.set(event, new Set())
      }
      const eventListeners = listenersRef.current.get(event)!
      const isFirstListener = eventListeners.size === 0
      eventListeners.add(listener)

      // 如果 socket 当前已连接，并且这是该事件的第一个监听器，则立即在 socket 上注册
      if (socketRef.current?.connected && isFirstListener) {
        socketRef.current.on(event, (...args) => {
          // 执行所有为该事件注册的回调
          listenersRef.current.get(event)?.forEach((l) => l(...args))
        })
        console.log(`WebSocketProvider: Registered listener for ${event}`)
      }

      // 返回一个取消订阅的函数
      return () => {
        const eventListeners = listenersRef.current.get(event)
        if (eventListeners) {
          eventListeners.delete(listener)
          // 如果 socket 当前已连接，并且没有其他监听器了，则从 socket 上移除
          if (socketRef.current?.connected && eventListeners.size === 0) {
            socketRef.current.off(event)
            listenersRef.current.delete(event) // 从 Map 中移除事件条目
            console.log(`WebSocketProvider: Unregistered listener for ${event}`)
          } else if (eventListeners.size === 0) {
            // 即使 socket 未连接，如果没有监听器了，也清理 Map
            listenersRef.current.delete(event)
          }
        }
      }
    },
    []
  ) // useCallback 保证函数引用稳定

  // 封装 emit 方法
  const emit = useCallback((event: string, ...args: any[]) => {
    socketRef.current?.emit(event, ...args)
  }, [])

  const contextValue: WebSocketContextProps = {
    socket: socketRef.current, // 提供当前的 socket 实例 (可能为 null)
    isConnected,
    on,
    emit,
  }

  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  )
}

// 自定义 Hook，方便消费 Context
export const useWebSocketContext = (): WebSocketContextProps => {
  const context = useContext(WebSocketContext)
  if (context === undefined) {
    throw new Error(
      'useWebSocketContext must be used within a WebSocketProvider'
    )
  }
  return context
}
