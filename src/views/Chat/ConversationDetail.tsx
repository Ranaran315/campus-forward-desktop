import React, { useState, useEffect, useRef } from 'react';
import Avatar from '@/components/Avatar/Avatar';
import type { ConversationSummary } from './ChatViews';
import { Button, Spin, Alert, message as AntMessage } from 'antd'; // Added Ant Design Button, Spin, Alert, message import
import { DownOutlined } from '@ant-design/icons'; // Added Ant Design Icon import
import apiClient from '@/lib/axios'; // Import apiClient
import './ConversationDetail.css';
import { useWebSocketContext } from '@/contexts/WebSocketProvider'; // Import WebSocket context
import { useAuth } from '@/contexts/AuthContext'; // Import useAuth
import { formatMessageTime } from '@/utils/dateUtils';

// Interface for individual messages in the chat
interface DisplayMessage {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
  avatar?: string;
  isSent: boolean;
}

// Define BackendChatMessage interface (adjust based on actual backend response)
interface BackendChatMessage {
  _id: string;
  sender: string | { _id: string; username?: string; realname?: string; avatar?: string }; // Sender can be ID or populated object
  content: string;
  createdAt: string; // ISO date string
  isSent: boolean; // Added isSent from backend
  conversation?: string | { _id: string }; // For WebSocket message structure
  conversationId?: string; // Alternative for WebSocket message structure
  // Add any other fields your backend sends for a chat message
}

interface MessageDetailsProps {
  conversation: ConversationSummary | null;
}

const MIN_FOOTER_HEIGHT = 200; // Example: Toolbar + 1 row input + padding
const MAX_FOOTER_HEIGHT = 500; // Example: Max reasonable height

const MessageDetails: React.FC<MessageDetailsProps> = ({ conversation }) => {
  const [chatMessages, setChatMessages] = useState<DisplayMessage[]>([]);
  const footerRef = useRef<HTMLElement>(null);
  const [footerHeight, setFooterHeight] = useState<number>(MIN_FOOTER_HEIGHT);
  const [isResizing, setIsResizing] = useState(false);
  const [startY, setStartY] = useState(0);
  const [startHeight, setStartHeight] = useState(0);
  const [chatLoading, setChatLoading] = useState<boolean>(false);
  const [chatError, setChatError] = useState<string | null>(null);

  const [newMessageText, setNewMessageText] = useState<string>(''); // State for new message input
  const { on, isConnected } = useWebSocketContext(); // Get WebSocket context
  const chatMessageAreaRef = useRef<HTMLElement>(null); // Ref for chat message area
  const { user: authenticatedUser } = useAuth(); // Get authenticated user, removed unused authIsLoading

  // Scroll to bottom function
  const scrollToBottom = () => {
    if (chatMessageAreaRef.current) {
      chatMessageAreaRef.current.scrollTop = chatMessageAreaRef.current.scrollHeight;
    }
  };

  // Effect to scroll to bottom when chatMessages change
  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  useEffect(() => {
    if (conversation) {
      const fetchMessages = async () => {
        setChatLoading(true);
        setChatError(null);
        try {
          const response = await apiClient.get<BackendChatMessage[]>(`/chat/conversations/${conversation.id}/messages?limit=50`);
          
          // If 'response' is AxiosResponse<BackendChatMessage[], any>, then data is in response.data
          // If interceptor correctly makes it T, then response is BackendChatMessage[]
          // Linter suggests response is AxiosResponse, so use response.data
          // Assuming the backend directly returns an array of messages. If it's nested (e.g., { messages: [...] }), adjust accordingly.
          const backendMessages: BackendChatMessage[] = (response as any).data || []; 

          const transformedMessages: DisplayMessage[] = backendMessages.map((msg: BackendChatMessage) => {
            let senderId = '';
            let senderName = '未知用户'; // Fallback name
            let senderAvatar: string | undefined = undefined; // Default avatar

            if (typeof msg.sender === 'string') {
              senderId = msg.sender;
              // senderName might remain '未知用户' or you might have a way to fetch it if needed
            } else if (msg.sender && typeof msg.sender === 'object') {
              senderId = msg.sender._id;
              senderName = msg.sender.username || msg.sender.realname || '未知用户';
              senderAvatar = msg.sender.avatar; 
            }

            return {
              id: msg._id,
              senderId: senderId,
              text: msg.content, // msg.content maps to text
              timestamp: formatMessageTime(msg.createdAt),
              avatar: senderAvatar, // Fallback avatar
              isSent: msg.isSent, // Directly use isSent from backend
            };
          });
          // Reverse the messages so that oldest are first, newest are last (for flex-direction: column-reverse)
          const reversedMessages = transformedMessages.reverse(); 
          setChatMessages(reversedMessages);
        } catch (err: any) {
          const errorMsg = err.backendMessage || err.message || '获取聊天记录失败';
          setChatError(errorMsg);
          setChatMessages([]); // Clear messages on error
        } finally {
          setChatLoading(false);
        }
      };

      fetchMessages();
    } else {
      setChatMessages([]); // Clear messages if no conversation is selected
      setChatLoading(false);
      setChatError(null);
    }
  }, [conversation]);

  const handleMouseDownResize = (e: React.MouseEvent) => {
    e.preventDefault();
    console.log('Mouse down on resize handle');
    setIsResizing(true);
    setStartY(e.clientY);
    if (footerRef.current) {
      const currentHeight = footerRef.current.offsetHeight;
      console.log('Starting resize, current height:', currentHeight);
      setStartHeight(currentHeight);
    }
  };

  useEffect(() => {
    const handleMouseMoveResize = (e: MouseEvent) => {
      if (!isResizing || !footerRef.current) return;
      
      const deltaY = e.clientY - startY;
      let newHeight = startHeight - deltaY;
      newHeight = Math.max(MIN_FOOTER_HEIGHT, Math.min(newHeight, MAX_FOOTER_HEIGHT));
      
      console.log('Resizing - Delta Y:', deltaY, 'New Height:', newHeight);
      setFooterHeight(newHeight);
      
      // 强制立即更新DOM
      requestAnimationFrame(() => {
        if (footerRef.current) {
          footerRef.current.style.height = `${newHeight}px`;
          console.log('Applied height:', footerRef.current.style.height);
        }
      });
    };

    const handleMouseUpResize = () => {
      console.log('Mouse up, finished resizing');
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMoveResize);
      document.addEventListener('mouseup', handleMouseUpResize);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMoveResize);
      document.removeEventListener('mouseup', handleMouseUpResize);
    };
  }, [isResizing, startY, startHeight]);

  // WebSocket effect for receiving new messages
  useEffect(() => {
    if (!on || !conversation?.id) {
      return;
    }

    const handleNewChatMessage = (message: BackendChatMessage) => {
      console.log('[WebSocket MSG Received] Raw message:', JSON.parse(JSON.stringify(message))); // Log a deep copy

      let msgConversationId: string | undefined = undefined;

      if (message.conversation && typeof message.conversation === 'object' && message.conversation._id) {
        msgConversationId = message.conversation._id;
        console.log('[WebSocket MSG Process] Extracted conversationId from message.conversation._id:', msgConversationId);
      } else if (typeof message.conversation === 'string') {
        msgConversationId = message.conversation;
        console.log('[WebSocket MSG Process] Extracted conversationId from message.conversation (string):', msgConversationId);
      } else if (message.conversationId) {
        msgConversationId = message.conversationId;
        console.log('[WebSocket MSG Process] Extracted conversationId from message.conversationId:', msgConversationId);
      } else {
        console.warn('[WebSocket MSG Process] Could not extract conversationId from message:', message);
      }

      if (msgConversationId && conversation?.id && msgConversationId === conversation.id) {
        
        let senderId = '';
        let senderAvatar: string | undefined = undefined;

        if (typeof message.sender === 'string') {
          senderId = message.sender;
        } else if (message.sender && typeof message.sender === 'object' && message.sender._id) { // Ensure _id exists for objects
          senderId = message.sender._id;
          senderAvatar = message.sender.avatar;
        } 

        const newDisplayMessage: DisplayMessage = {
          id: message._id,
          senderId: senderId,
          text: message.content,
          timestamp: formatMessageTime(message.createdAt),
          avatar: senderAvatar,
          isSent: senderId === authenticatedUser?.sub,
        };

        
        setChatMessages(prevMessages => {
          if (prevMessages.find(m => m.id === newDisplayMessage.id)) {
           
            return prevMessages;
          }
         
          return [...prevMessages, newDisplayMessage];
        });
      }
    };

    const unsubscribe = on('chat:newMessage', handleNewChatMessage);

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [on, conversation?.id, setChatMessages, authenticatedUser?.sub]);

  const handleSendMessage = async () => {
    const trimmedText = newMessageText.trim();
    if (!trimmedText || !conversation) {
      return;
    }

    const payload = {
      type: 'text',
      content: trimmedText,
      conversationId: conversation.id,
    };

    try {
      // Optimistic update can be added here if desired
      // For now, wait for WebSocket to deliver the message
      await apiClient.post('/chat/messages', payload);
      setNewMessageText('');
      // scrollToBottom(); // Let useEffect handle scroll on chatMessages change
    } catch (error: any) {
      console.error('Failed to send message:', error);
      AntMessage.error(error?.response?.data?.message || error?.backendMessage || '发送消息失败');
    }
  };

  if (!conversation) {
    return (
      <main className="message-content-container">
        <div className="empty-message">
          <span>
            💬
          </span>
          请选择一条会话查看详情
        </div>
      </main>
    );
  }

  return (
    <main className="chat-content-container">
      <div className="chat-detail-view">
        <header className="chat-header">
          <Avatar src={conversation.avatar} size={35} />
          <div className="chat-header-name">{conversation.sender}</div>
          <div className="chat-header-actions">
            {/* Placeholder for more action icons e.g. <button>More</button> */}
          </div>
        </header>

        <section className="chat-message-area" ref={chatMessageAreaRef}>
          {chatLoading && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <Spin tip="加载消息中..." />
            </div>
          )}
          {chatError && !chatLoading && (
            <div style={{ padding: '20px' }}>
              <Alert message="加载错误" description={chatError} type="error" showIcon />
            </div>
          )}
          {!chatLoading && !chatError && chatMessages.length === 0 && conversation && (
             <div className="empty-message" style={{height: '100%'}}>
                <span>🤔</span>
                暂无消息记录。
            </div>
          )}
          {!chatLoading && !chatError && chatMessages.map((msg) => {

            return (
              <div key={msg.id} className={`message-wrapper ${msg.isSent ? 'sent' : 'received'}`}>
                {!msg.isSent && (
                  <Avatar src={msg.avatar} size={30} className="message-avatar" />
                )}
                <div className={`message-bubble ${msg.isSent ? 'sent' : 'received'}`}>
                  <div className="message-text-content">
                    <div className="message-text">{msg.text}</div>
                    <div className="message-timestamp">{msg.timestamp}</div>
                  </div>
                </div>
                {msg.isSent && (
                  <Avatar src={msg.avatar} size={30} className="message-avatar" />
                )}
              </div>
            );
          })}
        </section>

        <footer 
          className="chat-input-area" 
          ref={footerRef} 
          style={{ height: `${footerHeight}px` }}
        >
          <div className="resize-handle" onMouseDown={handleMouseDownResize}></div>
          <div className="toolbar-icons">
            <span>😃</span>
            <span>✂️</span>
            <span>📁</span>
            <span>🖼️</span>
            <span>@</span>
            <span>🎤</span>
            <span>🤖</span>
          </div>
          <div className="input-field-wrapper">
            <textarea 
              className="message-input" 
              placeholder="输入消息..." 
              rows={3}
              value={newMessageText}
              onChange={(e) => setNewMessageText(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            ></textarea>
            <div className="send-button-container">
              <Button type="primary" className="antd-send-button" onClick={handleSendMessage}>
                发送
                <DownOutlined style={{ fontSize: '12px', marginLeft: '4px' }} />
              </Button>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
};

export default MessageDetails; 