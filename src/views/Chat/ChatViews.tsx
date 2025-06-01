import { useState, useEffect } from 'react'
import './ChatViews.css'
// Avatar import is no longer directly needed here if not used in ChatViews itself
// 如果ChatViews本身未使用Avatar，则不再需要在此处直接导入Avatar组件
// import Avatar from '@/components/Avatar/Avatar'; 
// import type { Message } from './ChatViews'; // Removed this problematic import // 移除了这个有问题的导入
import ConversationSidebar from './ConversationSidebar'
import ConversationDetail from './ConversationDetail'
import { useLocation, useNavigate } from 'react-router-dom'
import { formatDateTime } from '@/utils/dateUtils'
import apiClient from '@/lib/axios'; // Import apiClient
import { Spin, Alert } from 'antd'; // Import Spin and Alert
import { useWebSocketContext } from '@/contexts/WebSocketProvider'; // Import WebSocket context
import { useAuth } from '@/contexts/AuthContext' // 导入 useAuth

// Renamed from Message to ConversationSummary
export interface ConversationSummary { // 类型被 ConversationDetail.tsx 用作 ConversationSummaryMessage
  id: string
  sender: string // This sender might represent the other user or group name
  avatar?: string; // 确保是可选的
  timestamp: string
  content: string // Last message content or summary
  unread?: boolean
}

// Define interfaces for backend data structures (simplified based on assumptions)
// 定义后端数据结构的接口（基于假设进行了简化）
interface BackendUser {
  _id: string
  username: string
  nickname?: string
  avatar?: string // 后端本身就可能是可选的
}

// 假设的群组资料接口 (应与后端Group schema匹配)
interface BackendGroupProfile {
  _id: string;
  name: string;       // 群名
  avatar?: string;     // 群头像，也是可选的
  // 可以添加其他群相关字段，如 memberCount
}

interface BackendMessageData { // 重命名以避免与 FrontendMessage 冲突
  _id: string
  sender: string // 发送者ID
  content: string
  createdAt: string
}

interface BackendConversation {
  _id: string
  type: 'private' | 'group' // 会话类型：私聊或群聊
  participants: BackendUser[] // 参与者列表
  lastMessage?: BackendMessageData // 最新消息
  updatedAt: string // 最后更新时间
  displayProfile?: BackendUser | BackendGroupProfile; // 新增：用于显示的用户或群组信息
  // Add other fields if necessary, e.g., unreadCount for the current user
  // 如有必要，添加其他字段，例如当前用户的未读计数
}

// Renamed from FrontendMessage to FrontendConversation
export interface FrontendConversation {
  id: string
  sender: string // This sender represents the other user or group name for display
  avatar?: string; // 确保是可选的
  timestamp: string
  content: string // Last message content
  unreadCount: number; // 新增：未读消息计数
  isPinned: boolean;   // 新增：是否置顶
  type: 'private' | 'group'; // 添加会话类型，方便前端逻辑处理
}

// Renamed function
function transformBackendConversationToFrontendConversation(
  conversation: BackendConversation & { isPinned?: boolean, unreadCount?: number }, // 添加 isPinned 和 unreadCount 到 BackendConversation 的临时类型中断言
  currentUserId: string
): FrontendConversation {
  const profileToShow = conversation.displayProfile;
  let senderName = '未知会话';
  let senderAvatar: string | undefined = undefined;

  if (profileToShow) {
    if ('username' in profileToShow || 'nickname' in profileToShow) {
      const userProfile = profileToShow as BackendUser;
      senderName = userProfile.nickname || userProfile.username || '未知用户';
      senderAvatar = userProfile.avatar;
    } else { 
      const groupProfile = profileToShow as BackendGroupProfile;
      senderName = groupProfile.name || '未知群组';
      senderAvatar = groupProfile.avatar;
    }
  } else {
    if (conversation.type === 'private' && conversation.participants.length > 0) {
      const fallbackParticipant = conversation.participants.find(p => p._id !== currentUserId) || conversation.participants[0];
      if (fallbackParticipant) {
        senderName = fallbackParticipant.nickname || fallbackParticipant.username || '未知用户';
        senderAvatar = fallbackParticipant.avatar;
      }
    }
  }

  return {
    id: conversation._id,
    sender: senderName,
    avatar: senderAvatar,
    timestamp: formatDateTime(conversation.lastMessage?.createdAt || conversation.updatedAt),
    content: conversation.lastMessage?.content || '开始聊天吧...',
    unreadCount: conversation.unreadCount || 0, // 直接使用后端提供的 unreadCount
    isPinned: conversation.isPinned || false,     // 直接使用后端提供的 isPinned
    type: conversation.type, // 传递会话类型
  }
}

// 添加欢迎组件
function ChatWelcome() {
  return (
    <main className="chat-content-container">
      <div className="chat-welcome">
        <span>💬</span>
        <p>请选择一个会话以查看详情</p>
      </div>
    </main>
  );
}

// 使用 AuthContext 中的用户信息
function ChatViews() {
  const [conversationList, setConversationList] = useState<FrontendConversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<FrontendConversation | null>(null)
  const [conversationsLoading, setConversationsLoading] = useState<boolean>(true)
  const [conversationsError, setConversationsError] = useState<string | null>(null)

  const location = useLocation()
  const navigate = useNavigate()
  const { user: currentUser } = useAuth() // 使用 AuthContext 中的用户信息
  const { on: webSocketOn } = useWebSocketContext()

  // 获取当前用户ID
  const currentUserId = currentUser?.sub || 'currentUserPlaceholderId'

  // 添加刷新会话列表的方法
  const refreshConversations = async () => {
    setConversationsLoading(true);
    setConversationsError(null);
    try {
      const response = await apiClient.get<BackendConversation[]>('/chat/conversations');
      const actualData: BackendConversation[] = (response as any)?.data || []; 
      
      if (Array.isArray(actualData)) {
        const transformedFrontendConversations = actualData.map(conv => 
          transformBackendConversationToFrontendConversation(conv, currentUserId)
        );
        setConversationList(transformedFrontendConversations);
      } else {
        console.error("Fetched conversations data is not an array:", actualData); 
        setConversationList([]);
        setConversationsError('获取到的会话数据格式不正确');
      }
    } catch (err: any) {
      const errorMsg = err.backendMessage || err.message || '获取会话列表失败';
      console.error("Error fetching conversations:", err); 
      setConversationsError(errorMsg);
      setConversationList([]);
    } finally {
      setConversationsLoading(false);
    }
  };

  useEffect(() => {
    refreshConversations();
  }, [currentUserId]);

  useEffect(() => {
    // Ensure webSocketOn is available before trying to use it.
    if (!webSocketOn) return; 

    const handleUnreadCountUpdate = (data: { conversationId: string, unreadCount: number, targetUserId?: string }) => {
      if (data.targetUserId && data.targetUserId !== currentUserId) {
        return;
      }
      setConversationList(prevList =>
        prevList.map(conv =>
          conv.id === data.conversationId
            ? { ...conv, unreadCount: data.unreadCount }
            : conv
        )
      );
    };

    // 添加新消息处理器
    const handleNewMessage = (message: any) => {
      let msgConvId: string;
      let senderId = '';

      // 提取会话ID
      if (message.conversation && typeof message.conversation === 'object' && message.conversation._id) {
        msgConvId = message.conversation._id;
      } else if (typeof message.conversation === 'string') {
        msgConvId = message.conversation;
      } else if (message.conversationId) {
        msgConvId = message.conversationId;
      } else {
        console.warn('[ChatViews handleNewMessage] Could not extract conversationId from message:', message);
        return;
      }

      // 提取发送者ID
      if (typeof message.sender === 'string') {
        senderId = message.sender;
      } else if (message.sender && typeof message.sender === 'object') {
        // 根据后端返回的格式调整
        senderId = message.sender._id || message.sender.sub || '';
      }

      // 更新会话列表
      setConversationList(prevList => {
        const existingConv = prevList.find(c => c.id === msgConvId);
        if (existingConv) {
          const updatedConv = {
            ...existingConv,
            content: message.content,
            timestamp: new Date(message.createdAt).toISOString(),
            // 只有当当前用户不是发送者时才增加未读数
            unreadCount: senderId !== currentUserId 
              ? (existingConv.unreadCount || 0) + 1 
              : existingConv.unreadCount
          };
          const listWithoutOriginal = prevList.filter(c => c.id !== msgConvId);
          return [updatedConv, ...listWithoutOriginal];
        }
        return prevList;
      });
    };

    const unsubscribeUnreadCount = webSocketOn('unreadCountUpdated', handleUnreadCountUpdate);
    const unsubscribeNewMessage = webSocketOn('chat:newMessage', handleNewMessage);

    return () => {
      if (unsubscribeUnreadCount) unsubscribeUnreadCount();
      if (unsubscribeNewMessage) unsubscribeNewMessage();
    };
  }, [webSocketOn, currentUserId, setConversationList]);

  useEffect(() => {
    // REMOVED pre-checks for currentUserId
    // If currentUserId is placeholder, transformBackendConversationToFrontendConversation will receive it.

    // It is still safer to ensure currentUserId is not a placeholder before sensitive operations
    // but per your request, the explicit blocking check is removed.
    if (currentUserId === 'currentUserPlaceholderId') {
        // Optionally, log a warning or handle differently if placeholder is used in critical logic
        console.warn('[NewConversationEffect] currentUserId is a placeholder. Processing new conversation with this ID.');
    }

    if (location.state?.newConversation) {
      const backendConvo = location.state.newConversation as BackendConversation
      // currentUserId is used here
      const newFeConversation = transformBackendConversationToFrontendConversation(backendConvo, currentUserId)

      setConversationList(prevList => {
        const existingIndex = prevList.findIndex(c => c.id === newFeConversation.id)
        if (existingIndex !== -1) {
          const updatedList = [...prevList]
          updatedList.splice(existingIndex, 1)
          return [newFeConversation, ...updatedList]
        } else {
          return [newFeConversation, ...prevList]
        }
      })
      setSelectedConversation(newFeConversation)
      navigate('.', { replace: true, state: {} })
    }
  }, [location.state, navigate, currentUserId]); // Dependencies remain.

  const handleConversationUpdate = (conversationId: string, updates: Partial<FrontendConversation>) => {
    setConversationList(prevList =>
      prevList.map(conv =>
        conv.id === conversationId ? { ...conv, ...updates } : conv
      )
      // 如果置顶状态改变，可能需要重新排序
      .sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        // 对于 timestamp 的排序，可能需要转换回 Date 对象或数值进行比较
        // 假设 formatDateTime 返回的已经是可比较的字符串或你有原始的 Date 对象
        // 为了简化，暂时不在这里处理时间戳重排序，除非 updates 包含 timestamp
        return 0; // 保持原有顺序，除非置顶状态改变
      })
    );
    // 如果选中的会话被更新，也更新 selectedConversation
    if (selectedConversation?.id === conversationId) {
      setSelectedConversation(prevSel => prevSel ? { ...prevSel, ...updates } : null);
    }
  };

  const handleConversationRemove = (conversationId: string) => {
    setConversationList(prevList => prevList.filter(conv => conv.id !== conversationId));
    if (selectedConversation?.id === conversationId) {
      setSelectedConversation(null); // 如果移除的是当前选中的会话，则清空选中
    }
  };

  // 处理会话点击，包括未读消息的处理
  const handleConversationClick = async (clickedConversation: FrontendConversation) => {
    setSelectedConversation(clickedConversation);

    // 只有当有未读消息时才进行处理
    if (clickedConversation.unreadCount > 0) {
      const originalUnreadCount = clickedConversation.unreadCount;

      // 乐观更新UI
      setConversationList(prevList =>
        prevList.map(c =>
          c.id === clickedConversation.id ? { ...c, unreadCount: 0 } : c
        )
      );

      try {
        // 调用后端API更新未读状态
        await apiClient.post(`/chat/conversations/${clickedConversation.id}/read`);
      } catch (error) {
        console.error('Failed to mark conversation as read:', error);
        // 如果API调用失败，回滚UI状态
        setConversationList(prevList =>
          prevList.map(c =>
            c.id === clickedConversation.id ? { ...c, unreadCount: originalUnreadCount } : c
          )
        );
      }
    }
  };

  return (
    <div className="chat-layout">
      {conversationsLoading ? (
        <div className="chat-list-container-loading" style={{ width: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRight: '1px solid #f0f0f0' }}>
          <Spin tip="加载会话中..." />
        </div>
      ) : conversationsError ? (
        <div className="chat-list-container-error" style={{ width: '300px', padding: '20px', borderRight: '1px solid #f0f0f0' }}>
          <Alert message="加载失败" description={conversationsError} type="error" showIcon />
        </div>
      ) : (
        <ConversationSidebar
          conversations={conversationList}
          selectedConversationId={selectedConversation?.id || null}
          onConversationSelect={handleConversationClick}
          onConversationUpdate={handleConversationUpdate}
          onConversationRemove={handleConversationRemove}
          onRefreshConversations={refreshConversations}
        />
      )}
      {selectedConversation ? (
        <ConversationDetail conversation={selectedConversation} />
      ) : (
        <ChatWelcome />
      )}
    </div>
  )
}

export default ChatViews
