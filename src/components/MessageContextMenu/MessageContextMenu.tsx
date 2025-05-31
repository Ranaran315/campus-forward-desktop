import React from 'react';
import { MenuItemType, MessageContextMenuProps } from '@/types/menu';
import ContextMenu from '@/components/ContextMenu/ContextMenu';

// 导入本地图标
import CopyIcon from '@/assets/icons/copy.svg?react';
import ShareIcon from '@/assets/icons/share.svg?react';
import RemarkIcon from '@/assets/icons/remark.svg?react';
import QuoteIcon from '@/assets/icons/quote.svg?react';
import DeleteIcon from '@/assets/icons/delete.svg?react';
import OpenFileIcon from '@/assets/icons/open_file.svg?react';
import DownloadIcon from '@/assets/icons/download.svg?react';
import SaveAsIcon from '@/assets/icons/save_as.svg?react';
import FolderIcon from '@/assets/icons/folder.svg?react';

const MessageContextMenu: React.FC<MessageContextMenuProps> = ({
  type,
  isSent,
  fileName,
  filePath,
  visible,
  x,
  y,
  onClose,
}) => {
  // 基础菜单项
  const baseMenuItems: MenuItemType[] = [
    {
      key: 'copy',
      label: '复制',
      icon: <CopyIcon />,
      onClick: () => {
        onClose();
      },
    },
    {
      key: 'forward',
      label: '转发',
      icon: <ShareIcon />,
      onClick: () => {
        onClose();
      },
    },
    {
      key: 'quote',
      label: '引用',
      icon: <QuoteIcon />,
      onClick: () => {
        onClose();
      },
    },
  ];

  // 如果是发送者，添加删除选项
  if (isSent) {
    baseMenuItems.push({
      key: 'delete',
      label: '删除',
      icon: <DeleteIcon />,
      danger: true,
      onClick: () => {
        onClose();
      },
    });
  }

  // 文件特有的菜单项
  const fileMenuItems: MenuItemType[] = [
    {
      key: 'open',
      label: '使用默认应用打开',
      icon: <OpenFileIcon />,
      onClick: () => {
        onClose();
      },
    },
    {
      key: 'save',
      label: '保存',
      icon: <DownloadIcon />,
      onClick: () => {
        onClose();
      },
    },
    {
      key: 'saveAs',
      label: '另存为',
      icon: <SaveAsIcon />,
      onClick: () => {
        onClose();
      },
    },
    {
      key: 'openFolder',
      label: '打开所在文件夹',
      icon: <FolderIcon />,
      onClick: () => {
        onClose();
      },
    },
  ];

  // 图片特有的菜单项
  const imageMenuItems: MenuItemType[] = [
    {
      key: 'save',
      label: '保存图片',
      icon: <SaveAsIcon />,
      onClick: () => {
        onClose();
      },
    },
    {
      key: 'openFolder',
      label: '打开所在文件夹',
      icon: <FolderIcon />,
      onClick: () => {
        onClose();
      },
    },
  ];

  // 根据消息类型组合菜单项
  let menuItems = [...baseMenuItems];
  if (type === 'file') {
    menuItems = [...fileMenuItems, ...baseMenuItems];
  } else if (type === 'image') {
    menuItems = [...imageMenuItems, ...baseMenuItems];
  }

  return (
    <ContextMenu
      items={menuItems}
      x={x}
      y={y}
      visible={visible}
      onClose={onClose}
    />
  );
};

export default MessageContextMenu; 