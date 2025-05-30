import React, { useState, useEffect, useRef } from 'react';
import Avatar from '@/components/Avatar/Avatar';
import type { ConversationSummary } from './ChatViews';
import { Button, Spin, Alert } from 'antd'; // Added Ant Design Button, Spin, Alert import
import { DownOutlined } from '@ant-design/icons'; // Added Ant Design Icon import
import apiClient from '@/lib/axios'; // Import apiClient
import './ConversationDetail.css';

// Interface for individual messages in the chat
interface DisplayMessage {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
  avatar?: string;
}

// Define BackendChatMessage interface (adjust based on actual backend response)
interface BackendChatMessage {
  _id: string;
  sender: string | { _id: string; username?: string; realname?: string; avatar?: string }; // Sender can be ID or populated object
  content: string;
  createdAt: string; // ISO date string
  // Add any other fields your backend sends for a chat message
}

// Current user definition (replace with actual logged-in user data)
const currentUser = {
  id: 'currentUser123',
  name: '我',
  avatar: 'https://i.pravatar.cc/150?u=currentUser123', // Example avatar
};

interface MessageDetailsProps {
  conversation: ConversationSummary | null;
}

const MIN_FOOTER_HEIGHT = 120; // Example: Toolbar + 1 row input + padding
const MAX_FOOTER_HEIGHT = 400; // Example: Max reasonable height

const MessageDetails: React.FC<MessageDetailsProps> = ({ conversation }) => {
  const [chatMessages, setChatMessages] = useState<DisplayMessage[]>([]);
  const footerRef = useRef<HTMLElement>(null);
  const [footerHeight, setFooterHeight] = useState<number>(MIN_FOOTER_HEIGHT);
  const [isResizing, setIsResizing] = useState(false);
  const [startY, setStartY] = useState(0);
  const [startHeight, setStartHeight] = useState(0);
  const [chatLoading, setChatLoading] = useState<boolean>(false);
  const [chatError, setChatError] = useState<string | null>(null);

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
          const backendMessages: BackendChatMessage[] = (response as any).data || []; 

          const transformedMessages: DisplayMessage[] = backendMessages.map((msg: BackendChatMessage) => {
            let senderId = '';
            let senderAvatar = undefined;

            if (typeof msg.sender === 'string') {
              senderId = msg.sender;
            } else if (msg.sender && typeof msg.sender === 'object') {
              senderId = msg.sender._id;
              senderAvatar = msg.sender.avatar; // Use avatar from sender object if available
            }

            return {
              id: msg._id,
              senderId: senderId,
              text: msg.content,
              timestamp: new Date(msg.createdAt).toLocaleString(), // Basic timestamp formatting
              avatar: senderAvatar || `https://i.pravatar.cc/150?u=${senderId}`, // Fallback to pravatar
            };
          });
          setChatMessages(transformedMessages);
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
    setIsResizing(true);
    setStartY(e.clientY);
    if (footerRef.current) {
      setStartHeight(footerRef.current.offsetHeight);
    }
  };

  useEffect(() => {
    const handleMouseMoveResize = (e: MouseEvent) => {
      if (!isResizing || !footerRef.current) return;
      const deltaY = e.clientY - startY;
      let newHeight = startHeight - deltaY; // Drag up = smaller height, Drag down = larger
      
      newHeight = Math.max(MIN_FOOTER_HEIGHT, Math.min(newHeight, MAX_FOOTER_HEIGHT));
      
      setFooterHeight(newHeight);
      // Direct style manipulation for smoother feedback during drag
      footerRef.current.style.height = `${newHeight}px`;
    };

    const handleMouseUpResize = () => {
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
    <main className="message-content-container">
      <div className="chat-detail-view">
        <header className="chat-header">
          <Avatar src={conversation.avatar || 'https://i.pravatar.cc/150?u=' + conversation.id} size={35} />
          <div className="chat-header-name">{conversation.sender}</div>
          <div className="chat-header-actions">
            {/* Placeholder for more action icons e.g. <button>More</button> */}
          </div>
        </header>

        <section className="chat-message-area">
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
            const isSent = msg.senderId === currentUser.id;
            return (
              <div key={msg.id} className={`message-wrapper ${isSent ? 'sent' : 'received'}`}>
                {!isSent && (
                  <Avatar src={msg.avatar} size={30} className="message-avatar" />
                )}
                <div className={`message-bubble ${isSent ? 'sent' : 'received'}`}>
                  <div className="message-text-content">
                    <div className="message-text">{msg.text}</div>
                    <div className="message-timestamp">{msg.timestamp}</div>
                  </div>
                </div>
                {isSent && (
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
            ></textarea>
            <div className="send-button-container">
              <Button type="primary" className="antd-send-button">
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