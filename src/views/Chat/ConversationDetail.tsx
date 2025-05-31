import React, { useState, useEffect, useRef } from 'react';
import Avatar from '@/components/Avatar/Avatar';
import type { ConversationSummary } from './ChatViews';
import { Button, Spin, Alert, message as AntMessage, Image } from 'antd';
import { DownOutlined, FileOutlined, LoadingOutlined } from '@ant-design/icons';
import apiClient from '@/lib/axios';
import './ConversationDetail.css';
import { useWebSocketContext } from '@/contexts/WebSocketProvider';
import { useAuth } from '@/contexts/AuthContext';
import { formatMessageTime } from '@/utils/dateUtils';
import { getImageUrl, getAttachmentUrl, getAvatarUrl } from '@/utils/imageHelper';
import ImageIcon from '@/assets/icons/image.svg?react'
import FileIcon from '@/assets/icons/file.svg?react'
import ExpressionIcon from '@/assets/icons/expression.svg?react'
import AtIcon from '@/assets/icons/at.svg?react'

// Interface for individual messages in the chat
interface MessageAttachment {
  url: string;
  fileName: string;
  size: number;
}

interface DisplayMessage {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
  avatar?: string;
  isSent: boolean;
  type: 'text' | 'image' | 'file';
  attachments?: MessageAttachment[];
}

// Define BackendChatMessage interface (adjust based on actual backend response)
interface BackendChatMessage {
  _id: string;
  sender: string | { _id: string; username?: string; realname?: string; avatar?: string };
  content: string;
  createdAt: string;
  type: 'text' | 'image' | 'file';
  attachments?: MessageAttachment[];
  conversation?: string | { _id: string };
  conversationId?: string;
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
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

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

  // 修改文件上传处理
  const handleFileUpload = async (files: FileList | null, type: 'file' | 'image') => {
    if (!files || files.length === 0 || !conversation) return;

    const file = files[0];
    
    // 检查文件大小
    const maxSize = type === 'image' ? 5 * 1024 * 1024 : 20 * 1024 * 1024;
    if (file.size > maxSize) {
      AntMessage.error(`文件大小不能超过${maxSize / 1024 / 1024}MB`);
      return;
    }

    // 检查文件类型
    const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const allowedFileTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'application/zip',
      'application/x-zip-compressed'
    ];

    if (type === 'image' && !allowedImageTypes.includes(file.type)) {
      AntMessage.error('只支持 JPG、PNG、GIF、WEBP 格式的图片');
      return;
    }

    if (type === 'file' && !allowedFileTypes.includes(file.type)) {
      AntMessage.error('不支持的文件类型');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      // 根据类型选择不同的上传端点
      const uploadEndpoint = type === 'image' ? '/chat/upload/image' : '/chat/upload/file';
      const uploadResponse = await apiClient.post(uploadEndpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      if (!uploadResponse.data.success) {
        throw new Error(uploadResponse.data.message || '上传失败');
      }

      const fileData = uploadResponse.data;

      // 发送消息
      const messagePayload = {
        type,
        content: type === 'image' ? '[图片消息]' : `[文件] ${file.name}`,
        conversationId: conversation.id,
        attachments: [{
          url: fileData.url,
          fileName: file.name,
          size: file.size
        }]
      };

      console.log('Sending message payload:', messagePayload);

      const response = await apiClient.post('/chat/messages', messagePayload);
      console.log('Message sent response:', response.data);
      
      // 清空文件输入
      if (type === 'image' && imageInputRef.current) {
        imageInputRef.current.value = '';
      }
      if (type === 'file' && fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // 显示上传成功提示
      AntMessage.success(type === 'image' ? '图片发送成功' : '文件发送成功');
      
    } catch (error: any) {
      console.error('Failed to upload file:', error);
      const errorMessage = error?.response?.data?.message || 
                          (Array.isArray(error?.response?.data) ? error.response.data.join(', ') : error?.message) || 
                          '文件上传失败';
      AntMessage.error(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  // 修改消息转换函数
  const transformBackendMessage = (msg: BackendChatMessage): DisplayMessage => {
    let senderId = '';
    let senderAvatar: string | undefined = undefined;

    if (typeof msg.sender === 'string') {
      senderId = msg.sender;
    } else if (msg.sender && typeof msg.sender === 'object' && msg.sender._id) {
      senderId = msg.sender._id;
      senderAvatar = msg.sender.avatar ? getAvatarUrl(msg.sender.avatar) : undefined;
    }

    return {
      id: msg._id,
      senderId: senderId,
      text: msg.content,
      timestamp: formatMessageTime(msg.createdAt),
      avatar: senderAvatar,
      isSent: senderId === authenticatedUser?.sub,
      type: msg.type || 'text',
      attachments: msg.attachments
    };
  };

  // 修改获取消息的逻辑
  useEffect(() => {
    if (conversation) {
      const fetchMessages = async () => {
        setChatLoading(true);
        setChatError(null);
        try {
          const response = await apiClient.get<BackendChatMessage[]>(
            `/chat/conversations/${conversation.id}/messages?limit=50`
          );
          
          const backendMessages: BackendChatMessage[] = (response as any).data || [];
          const transformedMessages = backendMessages.map(transformBackendMessage);
          const reversedMessages = transformedMessages.reverse();
          setChatMessages(reversedMessages);
        } catch (err: any) {
          const errorMsg = err.backendMessage || err.message || '获取聊天记录失败';
          setChatError(errorMsg);
          setChatMessages([]);
        } finally {
          setChatLoading(false);
        }
      };

      fetchMessages();
    } else {
      setChatMessages([]);
      setChatLoading(false);
      setChatError(null);
    }
  }, [conversation, authenticatedUser?.sub]);

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

  // 修改WebSocket消息处理
  useEffect(() => {
    if (!on || !conversation?.id) {
      return;
    }

    const handleNewChatMessage = (message: BackendChatMessage) => {
      console.log('[WebSocket MSG Received]', message);

      let msgConversationId: string | undefined = undefined;

      if (message.conversation && typeof message.conversation === 'object' && message.conversation._id) {
        msgConversationId = message.conversation._id;
      } else if (typeof message.conversation === 'string') {
        msgConversationId = message.conversation;
      } else if (message.conversationId) {
        msgConversationId = message.conversationId;
      }

      if (msgConversationId && conversation?.id && msgConversationId === conversation.id) {
        const newDisplayMessage = transformBackendMessage(message);
        
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
  }, [on, conversation?.id, authenticatedUser?.sub]);

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

  // 渲染消息内容
  const renderMessageContent = (message: DisplayMessage) => {
    switch (message.type) {
      case 'image':
        return message.attachments?.map((attachment, index) => (
          <div key={index} className="message-image">
            <Image
              src={getImageUrl(attachment.url)}
              alt="图片消息"
              width={200}
              style={{ borderRadius: '8px' }}
              preview={{
                mask: '预览图片',
                maskClassName: 'image-preview-mask',
                rootClassName: 'preview-root'
              }}
            />
          </div>
        ));
      case 'file':
        return message.attachments?.map((attachment, index) => (
          <div key={index} className="message-file">
            <FileOutlined />
            <a href={getAttachmentUrl(attachment.url)} target="_blank" rel="noopener noreferrer">
              {attachment.fileName}
            </a>
            <span className="file-size">
              ({(attachment.size / 1024).toFixed(2)} KB)
            </span>
          </div>
        ));
      default:
        return <div className="message-text">{message.text}</div>;
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
            <div className="loading-container">
              <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
            </div>
          )}
          {chatError && !chatLoading && (
            <div className="error-container">
              <Alert message="错误" description={chatError} type="error" showIcon />
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
                    {renderMessageContent(msg)}
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
            <span>
              <ExpressionIcon />
            </span>
            <span 
              onClick={() => !uploading && imageInputRef.current?.click()}
              className={uploading ? 'disabled' : ''}
            >
              {uploading ? <LoadingOutlined /> : <ImageIcon />}
              <input
                type="file"
                ref={imageInputRef}
                style={{ display: 'none' }}
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={(e) => handleFileUpload(e.target.files, 'image')}
                disabled={uploading}
              />
            </span>
            <span 
              onClick={() => !uploading && fileInputRef.current?.click()}
              className={uploading ? 'disabled' : ''}
            >
              {uploading ? <LoadingOutlined /> : <FileIcon />}
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.zip"
                onChange={(e) => handleFileUpload(e.target.files, 'file')}
                disabled={uploading}
              />
            </span>
            <span>
              <AtIcon />
            </span>
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
              disabled={uploading}
            ></textarea>
            <div className="send-button-container">
              <Button 
                type="primary" 
                className="antd-send-button" 
                onClick={handleSendMessage}
                disabled={uploading}
              >
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