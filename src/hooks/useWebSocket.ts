// filepath: d:\大学资料\论文毕设\毕设\campus-forward-desktop\src\hooks\useWebSocket.ts
import { useState, useEffect, useRef, useCallback } from 'react'
import io, { Socket } from 'socket.io-client'

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'

interface UseWebSocketOptions {
  onConnect?: () => void
  onDisconnect?: (reason: Socket.DisconnectReason) => void
  onError?: (error: Error) => void
  // 可以添加更多通用事件处理器
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const socketRef = useRef<Socket | null>(null) // 使用 ref 存储 socket 实例

  const { onConnect, onDisconnect, onError } = options

  useEffect(() => {
    const token = localStorage.getItem('authToken')
    if (!token) {
      console.warn('WebSocket Hook: No auth token found.')
      return
    }

    // 防止重复连接
    if (socketRef.current) {
      return
    }

    const newSocket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
      reconnectionAttempts: 5, // 尝试重连
      reconnectionDelay: 3000, // 重连间隔
    })

    socketRef.current = newSocket // 存储到 ref
    setSocket(newSocket) // 也存储到 state，以便外部访问

    const handleConnect = () => {
      console.log('WebSocket connected via hook:', newSocket.id)
      setIsConnected(true)
      onConnect?.()
    }

    const handleDisconnect = (reason: Socket.DisconnectReason) => {
      console.log('WebSocket disconnected via hook:', reason)
      setIsConnected(false)
      onDisconnect?.(reason)
      // 清理 ref，允许在需要时重新连接
      socketRef.current = null
      setSocket(null)
    }

    const handleError = (error: Error) => {
      console.error('WebSocket connection error via hook:', error)
      setIsConnected(false)
      onError?.(error)
      // 清理 ref
      socketRef.current = null
      setSocket(null)
    }

    newSocket.on('connect', handleConnect)
    newSocket.on('disconnect', handleDisconnect)
    newSocket.on('connect_error', handleError)

    // 清理函数
    return () => {
      console.log('Disconnecting WebSocket via hook cleanup...')
      newSocket.off('connect', handleConnect)
      newSocket.off('disconnect', handleDisconnect)
      newSocket.off('connect_error', handleError)
      newSocket.disconnect()
      socketRef.current = null
      setSocket(null)
      setIsConnected(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // 依赖项为空，仅在挂载和卸载时运行

  // 封装事件监听函数
  const on = useCallback(
    (event: string, listener: (...args: any[]) => void) => {
      socketRef.current?.on(event, listener)
      // 返回一个取消监听的函数
      return () => {
        socketRef.current?.off(event, listener)
      }
    },
    []
  ) // 依赖 socketRef.current 的变化，但 ref 本身不会触发重渲染

  // 封装事件发送函数 (如果需要)
  const emit = useCallback((event: string, ...args: any[]) => {
    socketRef.current?.emit(event, ...args)
  }, [])

  return { socket: socketRef.current, isConnected, on, emit } // 返回 ref.current
}
