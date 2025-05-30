import React, { useState } from 'react';
import Avatar from '@/components/Avatar/Avatar';
import type { FrontendConversation as Conversation } from './ChatViews';
import ContextMenu, { ContextMenuItem } from '@/components/ContextMenu/ContextMenu';
import { PushpinOutlined, PushpinFilled, DeleteOutlined } from '@ant-design/icons';
import MessageReadIcon from '@/assets/icons/message_read.svg?react';
import MessageUnreadIcon from '@/assets/icons/message_unread.svg?react';
import './ConversationList.css';
import { formatConversationListTime } from '@/utils/dateUtils';
import apiClient from '@/lib/axios';
import { message as antdMessage } from 'antd';

interface ConversationListProps {
  conversations: Conversation[];
  selectedConversationId: string | null;
  onConversationSelect: (conversation: Conversation) => void;
  onConversationUpdate: (conversationId: string, updates: Partial<Conversation>) => void;
  onConversationRemove: (conversationId: string) => void;
}

interface ContextMenuState {
  x: number;
  y: number;
  visible: boolean;
  selectedConv: Conversation | null;
}

const ConversationList: React.FC<ConversationListProps> = ({ conversations, selectedConversationId, onConversationSelect, onConversationUpdate, onConversationRemove }) => {
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

  const handleItemContextMenu = (event: React.MouseEvent, conversation: Conversation) => {
    event.preventDefault();
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      visible: true,
      selectedConv: conversation,
    });
  };

  const handleCloseContextMenu = () => {
    setContextMenu(null);
  };

  const handlePinToggle = async (conversation: Conversation) => {
    if (!conversation) return;
    try {
      await apiClient.put(`/chat/conversations/${conversation.id}/pin`, { isPinned: !conversation.isPinned });
      onConversationUpdate(conversation.id, { isPinned: !conversation.isPinned });
      antdMessage.success(conversation.isPinned ? '已取消置顶' : '已置顶');
    } catch (error) {
      console.error('Failed to toggle pin state:', error);
      antdMessage.error('操作失败');
    }
  };

  const handleReadToggle = async (conversation: Conversation) => {
    if (!conversation) return;
    const currentlyUnread = conversation.unreadCount > 0;
    try {
      if (currentlyUnread) {
        await apiClient.post(`/chat/conversations/${conversation.id}/read`);
        onConversationUpdate(conversation.id, { unreadCount: 0 });
        antdMessage.success('已标记为已读');
      } else {
        onConversationUpdate(conversation.id, { unreadCount: 1 });
        antdMessage.success('已标记为未读');
      }
    } catch (error) {
      console.error('Failed to toggle read state:', error);
      if (currentlyUnread) {
        antdMessage.error('标记已读失败');
      } else {
        antdMessage.error('操作失败');
      }
    }
  };

  const handleRemove = async (conversation: Conversation) => {
    if (!conversation) return;
    try {
      await apiClient.delete(`/chat/conversations/${conversation.id}`);
      onConversationRemove(conversation.id);
      antdMessage.success('已从列表移除');
    } catch (error) {
      console.error('Failed to remove conversation:', error);
      antdMessage.error('移除失败');
    }
  };

  const menuItems: ContextMenuItem[] = contextMenu?.selectedConv ? [
    {
      label: contextMenu.selectedConv.isPinned ? '取消置顶' : '置顶会话',
      icon: contextMenu.selectedConv.isPinned ? <PushpinFilled /> : <PushpinOutlined />,
      onClick: () => handlePinToggle(contextMenu.selectedConv!),
    },
    {
      label: contextMenu.selectedConv.unreadCount > 0 ? '标记为已读' : '标记为未读',
      icon: contextMenu.selectedConv.unreadCount > 0 ? <MessageReadIcon width={16} height={16} /> : <MessageUnreadIcon width={16} height={16} />,
      onClick: () => handleReadToggle(contextMenu.selectedConv!),
    },
    { isSeparator: true },
    {
      label: '从列表中移除',
      icon: <DeleteOutlined />,
      customClassName: 'context-menu-item-danger',
      onClick: () => handleRemove(contextMenu.selectedConv!),
    },
  ] : [];

  return (
    <aside className="conversation-list-container">
      <h2>会话</h2>
      <ul className="conversation-list">
        {conversations.map((conversation) => (
          <li
            key={conversation.id}
            className={`conversation-item ${
              selectedConversationId === conversation.id ? 'active' : ''
            } ${conversation.isPinned ? 'pinned' : ''}`}
            onClick={() => onConversationSelect(conversation)}
            onContextMenu={(e) => handleItemContextMenu(e, conversation)}
          >
            <div className="conversation-item-left">
              <Avatar src={conversation.avatar} size={35}></Avatar>
            </div>
            <div className="conversation-item-right">
              <div className="conversation-item-desc">
                <div className="sender">{conversation.sender}</div>
                <div className="timestamp">{formatConversationListTime(conversation.timestamp)}</div>
              </div>
              <div className="conversation-item-detail">
                <div className="conversation-content">{conversation.content}</div>
                {conversation.unreadCount > 0 && (
                  <span className="unread-badge">
                    {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                  </span>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
      {contextMenu?.visible && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          visible={contextMenu.visible}
          items={menuItems}
          onClose={handleCloseContextMenu}
        />
      )}
    </aside>
  );
};

export default ConversationList; 