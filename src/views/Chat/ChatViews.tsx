import { useState, useEffect } from 'react'
import './ChatViews.css'
// Avatar import is no longer directly needed here if not used in ChatViews itself
// import Avatar from '@/components/Avatar/Avatar'; 
// import type { Message } from './ChatViews'; // Removed this problematic import
import MessageList from './MessageList'
import MessageDetails from './MessageDetails'
import { useLocation, useNavigate } from 'react-router-dom'
import { formatDateTime } from '@/utils/dateUtils'

export interface Message {
  id: string
  sender: string
  avatar: string
  timestamp: string
  content: string
  unread?: boolean
}

// Define interfaces for backend data structures (simplified based on assumptions)
interface BackendUser {
  _id: string
  username: string
  nickname?: string
  avatar?: string
}

interface BackendMessageData { // Renamed to avoid conflict with FrontendMessage
  _id: string
  sender: string
  content: string
  createdAt: string
}

interface BackendConversation {
  _id: string
  type: 'private' | 'group'
  participants: BackendUser[]
  lastMessage?: BackendMessageData
  updatedAt: string
  // Add other fields if necessary, e.g., unreadCount for the current user
}

// Define or import your current user ID logic
// For example, const currentUserId = useAuth().user?._id;
const getCurrentUserId = (): string => {
  // Placeholder: Replace with actual logic to get current user ID
  // This might come from a context, store, or a dedicated auth hook
  const storedUser = localStorage.getItem('userInfo') // Example: If user info is in localStorage
  if (storedUser) {
    try {
      const parsedUser = JSON.parse(storedUser)
      return parsedUser?._id || 'currentUserPlaceholderId' // Fallback if _id is not found
    } catch (e) {
      console.error("Failed to parse user from localStorage", e)
      return 'currentUserPlaceholderId'
    }
  }
  return 'currentUserPlaceholderId'
}

// Renamed existing interface to avoid confusion
export interface FrontendMessage {
  id: string
  sender: string
  avatar: string
  timestamp: string
  content: string
  unread?: boolean
  // Optional: to store the raw backend data if needed for other operations
  // rawConversationData?: BackendConversation;
}

// Hardcoded messageList for initial display - this should ideally come from an API
const initialMessageListData: FrontendMessage[] = [
  // ... (keep existing hardcoded data or fetch from API in a separate useEffect)
  {
    id: '1',
    sender: '张三',
    avatar: '',
    timestamp: '昨天 10:30',
    content: '关于下个阶段的项目计划，我们明天上午开个会讨论一下。',
    unread: true,
  },
  // ... other hardcoded messages
]

function transformBackendConversationToFrontendMessage(
  conversation: BackendConversation,
  currentUserId: string
): FrontendMessage {
  const otherParticipant = conversation.participants.find(p => p._id !== currentUserId)
  return {
    id: conversation._id,
    sender: otherParticipant?.nickname || otherParticipant?.username || '未知用户',
    avatar: otherParticipant?.avatar || 'https://i.pravatar.cc/150?u=' + (otherParticipant?._id || 'unknown'), // Fallback avatar
    timestamp: formatDateTime(conversation.lastMessage?.createdAt || conversation.updatedAt),
    content: conversation.lastMessage?.content || '开始聊天吧...',
    unread: false, // Placeholder - real unread logic needed
    // rawConversationData: conversation, // Optional
  }
}

function ChatViews() {
  const [messageList, setMessageList] = useState<FrontendMessage[]>(initialMessageListData)
  const [selectedMessage, setSelectedMessage] = useState<FrontendMessage | null>(null)

  const location = useLocation()
  const navigate = useNavigate()
  const currentUserId = getCurrentUserId() // Get current user ID

  useEffect(() => {
    // Logic to fetch initial conversations list if not passed via props or state
    // Example: fetchUserConversations().then(data => setMessageList(data.map(c => transformBackendConversationToFrontendMessage(c, currentUserId))));
  }, [currentUserId]) // Fetch on mount or when user ID changes

  useEffect(() => {
    if (location.state?.newConversation) {
      const backendConvo = location.state.newConversation as BackendConversation
      const newFeMessage = transformBackendConversationToFrontendMessage(backendConvo, currentUserId)

      setMessageList(prevList => {
        const existingIndex = prevList.findIndex(m => m.id === newFeMessage.id)
        if (existingIndex !== -1) {
          // Conversation exists, update it and move to top
          const updatedList = [...prevList]
          updatedList.splice(existingIndex, 1)
          return [newFeMessage, ...updatedList]
        } else {
          // New conversation, add to top
          return [newFeMessage, ...prevList]
        }
      })
      setSelectedMessage(newFeMessage)

      // Clear the state from location to prevent re-processing on refresh
      navigate('.', { replace: true, state: {} })
    }
  }, [location.state, navigate, currentUserId])

  const handleMessageClick = (clickedMessage: FrontendMessage) => {
    setSelectedMessage(clickedMessage)
    // Mark as read logic would go here
    // Potentially update the message in messageList to set unread to false
    setMessageList(prevList =>
      prevList.map(m =>
        m.id === clickedMessage.id ? { ...m, unread: false } : m
      )
    )
  }

  return (
    <div className="message-layout">
      <MessageList 
        messages={messageList} 
        selectedMessageId={selectedMessage?.id || null} 
        onMessageSelect={handleMessageClick} 
      />
      <MessageDetails message={selectedMessage} />
    </div>
  )
}

export default ChatViews
