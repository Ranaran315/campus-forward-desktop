import React from 'react';
import { MenuItemType, MessageContextMenuProps } from '@/types/menu';
import ContextMenu from '@/components/ContextMenu/ContextMenu';
import { message } from 'antd';

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
  text,
}) => {
  // 处理复制功能
  const handleCopy = async () => {
    try {
      if (type === 'text' && text) {
        // 复制文本
        await navigator.clipboard.writeText(text);
        message.success('文本已复制到剪贴板');
      } else if (type === 'file' && fileName) {
        // 复制文件名
        await navigator.clipboard.writeText(fileName);
        message.success('文件名已复制到剪贴板');
      } else if (type === 'image' && filePath) {
        // 复制图片链接
        await navigator.clipboard.writeText(filePath);
        message.success('图片链接已复制到剪贴板');
      }
    } catch (error) {
      console.error('复制失败:', error);
      message.error('复制失败');
    }
    onClose();
  };

  // 处理文件保存
  const handleSaveFile = async (saveType: 'default' | 'saveAs') => {
    try {
      if (!filePath) {
        throw new Error('文件路径不存在');
      }

      const result = await window.electron.ipcRenderer.invoke('save-file', {
        url: filePath,
        fileName: fileName || 'unknown',
        saveType,
        fileType: type
      });

      if (result.success) {
        message.success(saveType === 'default' ? '文件保存成功' : '文件另存为成功');
      } else {
        throw new Error(result.error || '保存失败');
      }
    } catch (error: any) {
      console.error('保存文件失败:', error);
      message.error(error.message || '保存文件失败');
    }
    onClose();
  };

  // 处理使用默认应用打开文件
  const handleOpenWithDefaultApp = async () => {
    try {
      if (!filePath) {
        throw new Error('文件路径不存在');
      }

      const result = await window.electron.ipcRenderer.invoke('open-file', {
        filePath
      });

      if (!result.success) {
        throw new Error(result.error || '打开失败');
      }
    } catch (error: any) {
      console.error('打开文件失败:', error);
      message.error(error.message || '打开文件失败');
    }
    onClose();
  };

  // 处理打开文件所在文件夹
  const handleOpenContainingFolder = async () => {
    try {
      if (!filePath) {
        throw new Error('文件路径不存在');
      }

      const result = await window.electron.ipcRenderer.invoke('show-in-folder', {
        filePath
      });

      if (!result.success) {
        throw new Error(result.error || '打开文件夹失败');
      }
    } catch (error: any) {
      console.error('打开文件夹失败:', error);
      message.error(error.message || '打开文件夹失败');
    }
    onClose();
  };

  // 基础菜单项
  const baseMenuItems: MenuItemType[] = [
    {
      key: 'copy',
      label: type === 'text' ? '复制' : type === 'file' ? '复制文件名' : '复制图片链接',
      icon: <CopyIcon />,
      onClick: handleCopy,
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
      label: '打开方式...',
      icon: <OpenFileIcon />,
      onClick: handleOpenWithDefaultApp,
    },
    {
      key: 'save',
      label: '保存',
      icon: <DownloadIcon />,
      onClick: () => handleSaveFile('default'),
    },
    {
      key: 'saveAs',
      label: '另存为',
      icon: <SaveAsIcon />,
      onClick: () => handleSaveFile('saveAs'),
    },
    {
      key: 'openFolder',
      label: '打开所在文件夹',
      icon: <FolderIcon />,
      onClick: handleOpenContainingFolder,
    },
  ];

  // 图片特有的菜单项
  const imageMenuItems: MenuItemType[] = [
    {
      key: 'save',
      label: '保存图片',
      icon: <SaveAsIcon />,
      onClick: () => handleSaveFile('default'),
    },
    {
      key: 'openFolder',
      label: '打开所在文件夹',
      icon: <FolderIcon />,
      onClick: handleOpenContainingFolder,
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