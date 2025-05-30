import React from 'react';
import Avatar from '@/components/Avatar/Avatar';
import type { Message } from './ChatViews';
import './MessageList.css';

interface MessageListProps {
  messages: Message[];
  selectedMessageId: string | null;
  onMessageSelect: (message: Message) => void;
}

const MessageList: React.FC<MessageListProps> = ({ messages, selectedMessageId, onMessageSelect }) => {
  return (
    <aside className="message-list-container">
      <h2>消息</h2>
      <ul className="message-list">
        {messages.map((message) => (
          <li
            key={message.id}
            className={`message-item ${
              selectedMessageId === message.id ? 'active' : ''
            }`}
            onClick={() => onMessageSelect(message)}
          >
            <div className="message-item-left">
              <Avatar src={message.avatar} size={35}></Avatar>
            </div>
            <div className="message-item-right">
              <div className="message-item-desc">
                <div className="sender">{message.sender}</div>
                <div className="timestamp">{message.timestamp}</div>
              </div>
              <div className="message-item-detail">
                <div className="message-content">{message.content}</div>
                {/* {message.unread && <span className="unread-badge">1</span>} */}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </aside>
  );
};

export default MessageList; 