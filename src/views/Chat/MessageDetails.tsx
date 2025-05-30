import React, { useState, useEffect, useRef } from 'react';
import Avatar from '@/components/Avatar/Avatar';
import type { Message as ConversationSummaryMessage } from './ChatViews'; // Renamed to avoid confusion
import { Button } from 'antd'; // Added Ant Design Button import
import { DownOutlined } from '@ant-design/icons'; // Added Ant Design Icon import
import './MessageDetails.css';

// Interface for individual messages in the chat
interface DisplayMessage {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
  avatar?: string;
}

// Current user definition (replace with actual logged-in user data)
const currentUser = {
  id: 'currentUser123',
  name: '我',
  avatar: 'https://i.pravatar.cc/150?u=currentUser123', // Example avatar
};

interface MessageDetailsProps {
  message: ConversationSummaryMessage | null; // Using the renamed type
}

const MIN_FOOTER_HEIGHT = 120; // Example: Toolbar + 1 row input + padding
const MAX_FOOTER_HEIGHT = 400; // Example: Max reasonable height

const MessageDetails: React.FC<MessageDetailsProps> = ({ message }) => {
  const [chatMessages, setChatMessages] = useState<DisplayMessage[]>([]);
  const footerRef = useRef<HTMLElement>(null);
  const [footerHeight, setFooterHeight] = useState<number>(MIN_FOOTER_HEIGHT);
  const [isResizing, setIsResizing] = useState(false);
  const [startY, setStartY] = useState(0);
  const [startHeight, setStartHeight] = useState(0);

  useEffect(() => {
    if (message) {
      const otherUser = {
        id: message.id, // Assuming message.id from ConversationSummaryMessage is the other user's ID or a related unique ID
        name: message.sender,
        avatar: message.avatar || 'https://i.pravatar.cc/150?u=' + message.id, // Fallback avatar
      };

      // Simulate fetching/generating messages for this conversation
      const loadedMessages: DisplayMessage[] = [
        {
          id: 'msg1',
          senderId: otherUser.id,
          text: `你好 ${currentUser.name}！这是来自 ${otherUser.name} 的一条演示消息。`,
          timestamp: '昨天 10:32',
          avatar: otherUser.avatar,
        },
        {
          id: 'msg2',
          senderId: currentUser.id,
          text: '你好呀！这是一条来自当前用户的演示消息。',
          timestamp: '昨天 10:33',
          avatar: currentUser.avatar,
        },
        {
          id: 'msg3',
          senderId: otherUser.id,
          text: '关于那个项目，我们下周开会讨论一下具体细节和分工吧，你觉得什么时间方便？',
          timestamp: '昨天 10:35',
          avatar: otherUser.avatar,
        },
        {
          id: 'msg4',
          senderId: currentUser.id,
          text: '好啊，下周我都可以。你那边时间怎么样？我们可以约在周一下午或者周二上午。',
          timestamp: '昨天 10:38',
          avatar: currentUser.avatar,
        },
        {
          id: 'msg4',
          senderId: currentUser.id,
          text: '好啊，下周我都可以。你那边时间怎么样？我们可以约在周一下午或者周二上午。',
          timestamp: '昨天 10:38',
          avatar: currentUser.avatar,
        },
        {
          id: 'msg4',
          senderId: currentUser.id,
          text: '好啊，下周我都可以。你那边时间怎么样？我们可以约在周一下午或者周二上午。',
          timestamp: '昨天 10:38',
          avatar: currentUser.avatar,
        },
        // Include the last message from the conversation summary prop if it makes sense
        {
          id: 'msg5',
          senderId: otherUser.id, // Assuming the content in prop is from the other user
          text: message.content, // Content from the conversation summary
          timestamp: message.timestamp, // Timestamp from the conversation summary
          avatar: otherUser.avatar,
        },
      ];
      setChatMessages(loadedMessages);
    } else {
      setChatMessages([]); // Clear messages if no conversation is selected
    }
  }, [message]);

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

  if (!message) {
    return (
      <main className="message-content-container">
        <div className="empty-message">
          <span>
            💬
          </span>
          请选择一条消息查看详情
        </div>
      </main>
    );
  }

  return (
    <main className="message-content-container">
      <div className="chat-detail-view">
        <header className="chat-header">
          <Avatar src={message.avatar || 'https://i.pravatar.cc/150?u=' + message.id} size={35} />
          <div className="chat-header-name">{message.sender}</div>
          <div className="chat-header-actions">
            {/* Placeholder for more action icons e.g. <button>More</button> */}
          </div>
        </header>

        <section className="chat-message-area">
          {chatMessages.map((msg) => {
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