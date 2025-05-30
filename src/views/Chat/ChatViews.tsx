import { useState, useEffect } from 'react'
import './ChatViews.css'
// Avatar import is no longer directly needed here if not used in ChatViews itself
// 如果ChatViews本身未使用Avatar，则不再需要在此处直接导入Avatar组件
// import Avatar from '@/components/Avatar/Avatar'; 
// import type { Message } from './ChatViews'; // Removed this problematic import // 移除了这个有问题的导入
import ConversationList from './ConversationList'
import ConversationDetail from './ConversationDetail'
import { useLocation, useNavigate } from 'react-router-dom'
import { formatDateTime } from '@/utils/dateUtils'
import apiClient from '@/lib/axios'; // Import apiClient
import { Spin, Alert } from 'antd'; // Import Spin and Alert

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

// Define or import your current user ID logic
// 定义或导入获取当前用户ID的逻辑
// For example, const currentUserId = useAuth().user?._id;
// 例如, const currentUserId = useAuth().user?._id;
const getCurrentUserId = (): string => {
  // Placeholder: Replace with actual logic to get current user ID
  // 占位符：替换为获取当前用户ID的实际逻辑
  // This might come from a context, store, or a dedicated auth hook
  // 这可能来自上下文（context）、状态管理库（store）或专门的认证钩子（auth hook）
  const storedUser = localStorage.getItem('userInfo') // 示例：如果用户信息存储在localStorage中
  if (storedUser) {
    try {
      const parsedUser = JSON.parse(storedUser)
      const userIdToReturn = parsedUser?._id || 'currentUserPlaceholderId';
      // console.log('[DEBUG] getCurrentUserId: Parsed user ID from localStorage:', userIdToReturn);
      return userIdToReturn;
    } catch (e) {
      console.error("Failed to parse user from localStorage", e) // 解析localStorage中的用户信息失败
      // console.log('[DEBUG] getCurrentUserId: Failed to parse, returning placeholder.');
      return 'currentUserPlaceholderId'
    }
  }
  // console.log('[DEBUG] getCurrentUserId: No stored user, returning placeholder.');
  return 'currentUserPlaceholderId'
}

// Renamed from FrontendMessage to FrontendConversation
export interface FrontendConversation {
  id: string
  sender: string // This sender represents the other user or group name for display
  avatar?: string; // 确保是可选的
  timestamp: string
  content: string // Last message content
  unread?: boolean
}

// Renamed function
function transformBackendConversationToFrontendConversation(
  conversation: BackendConversation,
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
    unread: false, 
  }
}

function ChatViews() {
  // Renamed state variables
  const [conversationList, setConversationList] = useState<FrontendConversation[]>([]) 
  const [selectedConversation, setSelectedConversation] = useState<FrontendConversation | null>(null)
  const [conversationsLoading, setConversationsLoading] = useState<boolean>(true); 
  const [conversationsError, setConversationsError] = useState<string | null>(null); 

  const location = useLocation()
  const navigate = useNavigate()
  const currentUserId = getCurrentUserId() 
  // console.log('[DEBUG] ChatViews: Initial currentUserId from getCurrentUserId():', currentUserId);

  useEffect(() => {
    // Logic to fetch initial conversations list if not passed via props or state
    // 获取初始会话列表的逻辑（如果未通过props或state传递）
    // Example: fetchUserConversations().then(data => setConversationList(data.map(c => transformBackendConversationToFrontendConversation(c, currentUserId))));
    // 示例: fetchUserConversations().then(data => setConversationList(data.map(c => transformBackendConversationToFrontendConversation(c, currentUserId))));
    const fetchConversations = async () => {
      // If currentUserId is still a placeholder, we might not want to actually fetch
      // 如果currentUserId仍然是占位符，我们可能不想实际获取数据
      // but for debugging the "not sending request" issue, let's proceed.
      // 但为了调试"未发送请求"的问题，我们继续执行
      // The backend should handle unauthorized or invalid user IDs.
      // 后端应处理未经授权或无效的用户ID
      if (!currentUserId) { // Basic check: if currentUserId is null or empty string // 基本检查：如果currentUserId为null或空字符串
          console.warn("Current user ID is not available, skipping fetch."); // 当前用户ID不可用，跳过获取
          setConversationsLoading(false); // 停止加载
          setConversationsError("无法获取当前用户ID，无法加载会话。");
          setConversationList([]);
          return;
      }

      setConversationsLoading(true);
      setConversationsError(null);
      try {
        const response = await apiClient.get<BackendConversation[]>('/chat/conversations');
        // Linter indicates 'response' is AxiosResponse<BackendConversation[], any>.
        // Linter提示 'response' 是 AxiosResponse<BackendConversation[], any> 类型
        // Data should be in response.data due to Axios structure, even if interceptor modifies it.
        // 由于Axios的结构，数据应该在 response.data 中，即使拦截器修改了它
        const actualData: BackendConversation[] = (response as any)?.data || []; 
        
        if (Array.isArray(actualData)) {
            // Use renamed function
            const transformedFrontendConversations = actualData.map(conv => 
              transformBackendConversationToFrontendConversation(conv, currentUserId)
            );
            setConversationList(transformedFrontendConversations);
        } else {
            console.error("Fetched conversations data is not an array:", actualData); // 获取到的会话数据不是数组
            setConversationList([]);
            setConversationsError('获取到的会话数据格式不正确');
        }
      } catch (err: any) {
        const errorMsg = err.backendMessage || err.message || '获取会话列表失败';
        console.error("Error fetching conversations:", err); // Log the full error // 记录完整错误
        setConversationsError(errorMsg);
        setConversationList([]);
      } finally {
        setConversationsLoading(false);
      }
    };

    // Call fetchConversations, relying on the internal check or backend to handle invalid ID
    // 调用 fetchConversations，依赖内部检查或后端来处理无效ID
    // The original condition was: if (currentUserId && currentUserId !== 'currentUserPlaceholderId')
    // 原始条件是: if (currentUserId && currentUserId !== 'currentUserPlaceholderId')
    fetchConversations();
    
  }, [currentUserId]); // Fetch on mount or when user ID changes // 组件挂载或用户ID更改时获取数据

  useEffect(() => {
    if (location.state?.newConversation) {
      const backendConvo = location.state.newConversation as BackendConversation
      // Use renamed function
      const newFeConversation = transformBackendConversationToFrontendConversation(backendConvo, currentUserId)

      setConversationList(prevList => {
        const existingIndex = prevList.findIndex(c => c.id === newFeConversation.id)
        if (existingIndex !== -1) {
          // Conversation exists, update it and move to top
          // 会话已存在，更新并移到顶部
          const updatedList = [...prevList]
          updatedList.splice(existingIndex, 1)
          return [newFeConversation, ...updatedList]
        } else {
          // New conversation, add to top
          // 新会话，添加到顶部
          return [newFeConversation, ...prevList]
        }
      })
      setSelectedConversation(newFeConversation) // Use renamed state setter

      // Clear the state from location to prevent re-processing on refresh
      // 从location中清除state，以防止刷新时重新处理
      navigate('.', { replace: true, state: {} })
    }
  }, [location.state, navigate, currentUserId])

  // Renamed handler
  const handleConversationClick = (clickedConversation: FrontendConversation) => {
    setSelectedConversation(clickedConversation) // Use renamed state setter
    setConversationList(prevList =>
      prevList.map(c =>
        c.id === clickedConversation.id ? { ...c, unread: false } : c
      )
    )
  }

  return (
    <div className="message-layout">
      {conversationsLoading ? (
        <div className="message-list-container-loading" style={{ width: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRight: '1px solid #f0f0f0' }}>
          <Spin tip="加载会话中..." />
        </div>
      ) : conversationsError ? (
        <div className="message-list-container-error" style={{ width: '300px', padding: '20px', borderRight: '1px solid #f0f0f0' }}>
          <Alert message="加载失败" description={conversationsError} type="error" showIcon />
        </div>
      ) : (
        <ConversationList 
          conversations={conversationList} // Use renamed state
          selectedConversationId={selectedConversation?.id || null} // Use renamed state
          onConversationSelect={handleConversationClick} // Use renamed handler
        />
      )}
      <ConversationDetail conversation={selectedConversation} />
    </div>
  )
}

export default ChatViews
