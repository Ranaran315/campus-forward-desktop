import { ReactNode } from 'react';

export interface MenuItemType {
  key: string;
  label: string;
  icon?: ReactNode;
  onClick?: () => void;
  danger?: boolean;
  disabled?: boolean;
  children?: MenuItemType[];
}

export type MessageType = 'text' | 'image' | 'file';

export interface MessageContextMenuProps {
  type: MessageType;
  isSent: boolean;
  fileName?: string;
  filePath?: string;
  text?: string;
  visible: boolean;
  x: number;
  y: number;
  onClose: () => void;
}

export interface DisplayProfile {
  name?: string;
  nickname?: string;
  username?: string;
  avatar?: string;
}

export interface FrontendConversation {
  id: string;
  type: 'private' | 'group';
  sender: string;
  content: string;
  timestamp: string;
  avatar?: string;
  unreadCount: number;
  isPinned: boolean;
  customName?: string;
  displayProfile?: DisplayProfile;
} 