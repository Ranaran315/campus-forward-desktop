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
  visible: boolean;
  x: number;
  y: number;
  onClose: () => void;
} 