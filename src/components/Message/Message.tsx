import React, { useEffect } from 'react';
import './Message.css';
import SuccessIcon from '@/assets/icons/success.svg?react';
import ErrorIcon from '@/assets/icons/error.svg?react';
import InfoIcon from '@/assets/icons/info.svg?react';
import WarningIcon from '@/assets/icons/warning.svg?react';
import CloseIcon from '@/assets/icons/close.svg?react';

export type MessageType = 'success' | 'error' | 'info' | 'warning';

export interface MessageItemProps {
  /** 唯一 ID */
  id: string;
  /** 消息类型 */
  type: MessageType;
  /** 消息内容 */
  content: string;
  /** 自动关闭的延迟时间（毫秒），0 或 undefined 表示不自动关闭 */
  duration?: number;
  /** 关闭时的回调函数，传递消息 ID */
  onClose: (id: string) => void;
}

const Message: React.FC<MessageItemProps> = ({
  id,
  type,
  content,
  duration,
  onClose,
}) => {

  // 处理自动关闭
  useEffect(() => {
    if (duration && duration > 0) {
      const timer = setTimeout(() => {
        onClose(id); // 调用关闭回调
      }, duration);
      // 清理函数
      return () => clearTimeout(timer);
    }
  }, [id, duration, onClose]); // 依赖项

  const handleManualClose = () => {
    onClose(id); // 手动关闭
  };

  const IconComponent = {
    success: SuccessIcon,
    error: ErrorIcon,
    info: InfoIcon,
    warning: WarningIcon,
  }[type];

  return (
    <div className={`message message-${type}`}>
      {IconComponent && <IconComponent className="message-icon" />}
      <span className="message-content">{content}</span>
      {/* 添加手动关闭按钮 */}
      <button className="message-close-btn" onClick={handleManualClose} aria-label="关闭消息">
        <CloseIcon />
      </button>
    </div>
  );
};

export default Message;