import { UserProfile } from '@/contexts/AuthContext'; // 用于参与者和发送者类型

// 与后端 CreateMessageDto 对应
export interface CreateMessageDto {
  content: string;
  contentType?: 'text' | 'image' | 'file'; // 根据后端支持情况调整
  receiverId?: string; // 私聊时使用
  groupId?: string; // 群聊时使用
  conversationId?: string; // 可选，如果前端能直接提供
}

// 与后端 MessageDocument/Schema 对应 (简化版，按需添加字段)
export interface ChatMessage {
  _id: string;
  sender: UserProfile | string; // 根据后端 populate 情况，可能是完整用户对象或仅ID
  receiver?: UserProfile | string; // 私聊
  group?: string; // 群聊的 group ID
  conversation: string; // 会话ID
  content: string;
  contentType: 'text' | 'image' | 'file';
  createdAt: string; // Date string
  updatedAt: string; // Date string
  isRead?: boolean; // (如果后端支持)
  // ... 其他消息相关字段
}

// 与后端 ConversationDocument/Schema 对应 (简化版，按需添加字段)
export interface Conversation {
  _id: string;
  type: 'private' | 'group';
  participants: (UserProfile | string)[]; // 根据后端 populate 情况
  group?: { // 如果是群聊，可能包含群信息
    _id: string;
    name: string;
    avatar?: string;
    // ... 其他群组信息
  } | string; // 也可能仅为 group ID
  lastMessage?: ChatMessage | null;
  unreadMessagesCount?: number; // 特定于当前用户的未读消息数
  createdAt: string;
  updatedAt: string;
  lastActivityAt?: string; // 用于排序
  // ... 其他会话相关字段，例如当前用户的会话设置 isVisible
  isVisible?: boolean; 
} 