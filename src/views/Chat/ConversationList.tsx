import React from 'react';
import Avatar from '@/components/Avatar/Avatar';
import type { FrontendConversation as Conversation } from './ChatViews';
import './ConversationList.css';

interface ConversationListProps {
  conversations: Conversation[];
  selectedConversationId: string | null;
  onConversationSelect: (conversation: Conversation) => void;
}

const ConversationList: React.FC<ConversationListProps> = ({ conversations, selectedConversationId, onConversationSelect }) => {
  return (
    <aside className="message-list-container">
      <h2>会话</h2>
      <ul className="message-list">
        {conversations.map((conversation) => (
          <li
            key={conversation.id}
            className={`message-item ${
              selectedConversationId === conversation.id ? 'active' : ''
            }`}
            onClick={() => onConversationSelect(conversation)}
          >
            <div className="message-item-left">
              <Avatar src={conversation.avatar} size={35}></Avatar>
            </div>
            <div className="message-item-right">
              <div className="message-item-desc">
                <div className="sender">{conversation.sender}</div>
                <div className="timestamp">{conversation.timestamp}</div>
              </div>
              <div className="message-item-detail">
                <div className="message-content">{conversation.content}</div>
                {/* {conversation.unread && <span className="unread-badge">1</span>} */}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </aside>
  );
};

export default ConversationList; 