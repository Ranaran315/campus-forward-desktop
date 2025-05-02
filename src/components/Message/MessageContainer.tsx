import React, { useState, useCallback, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import Message, { MessageItemProps, MessageType } from './Message';
import './MessageContainer.css'; // 创建对应的 CSS 文件
import { CSSTransition, TransitionGroup } from 'react-transition-group';

// 定义消息数据结构 (不包含 onClose)
interface MessageData extends Omit<MessageItemProps, 'onClose'> {}

// 存储容器实例的方法，用于全局调用
let addMessageHandler: (message: MessageData) => void;

// --- MessageContainer 组件 ---
const MessageContainer: React.FC = () => {
  const [messages, setMessages] = useState<MessageData[]>([]);

  // 添加消息的函数
  const addMessage = useCallback((message: MessageData) => {
    setMessages((prevMessages) => [...prevMessages, message]);

    // 如果设置了持续时间，在时间到后自动移除 (也可以在 Message 组件内部处理)
    if (message.duration && message.duration > 0) {
      setTimeout(() => {
        removeMessage(message.id);
      }, message.duration);
    }
  }, []);

  // 移除消息的函数
  const removeMessage = useCallback((id: string) => {
    setMessages((prevMessages) => prevMessages.filter((msg) => msg.id !== id));
  }, []);

  // 将 addMessage 方法暴露给全局 API
  useEffect(() => {
    addMessageHandler = addMessage;
    // 可选：组件卸载时清理
    // return () => { addMessageHandler = undefined; }
  }, [addMessage]);

  // 使用 Portal 将消息渲染到 body 末尾
  return ReactDOM.createPortal(
    <div className="message-container">
      <TransitionGroup>
      {messages.map((msg) => (
        <CSSTransition key={msg.id} timeout={300} classNames="message-transition">
          <Message
          key={msg.id}
          id={msg.id}
          type={msg.type}
          content={msg.content}
          duration={msg.duration} // 传递 duration，让 Message 内部处理自动关闭更佳
          onClose={removeMessage} // 传递移除函数
        />
        </CSSTransition>
      ))}
      </TransitionGroup>
    </div>,
    document.body // 渲染到 body
  );
};

// --- 全局 API 函数 ---

// 生成唯一 ID 的简单方法
const generateId = (): string => {
  return Math.random().toString(36).substring(2, 9);
};

// 定义 API 函数的参数类型
interface ShowMessageOptions {
  content: string;
  type?: MessageType;
  duration?: number; // 毫秒，0 表示不自动关闭
}

export const showMessage = (options: ShowMessageOptions | string) => {
  if (!addMessageHandler) {
    console.warn('MessageContainer尚未准备好或未渲染。');
    return;
  }

  let messageData: MessageData;
  if (typeof options === 'string') {
    messageData = {
      id: generateId(),
      content: options,
      type: 'info', // 默认类型
      duration: 3000, // 默认持续时间
    };
  } else {
    messageData = {
      id: generateId(),
      content: options.content,
      type: options.type || 'info',
      duration: options.duration === undefined ? 3000 : options.duration, // 默认 3000ms，0 表示不自动关闭
    };
  }

  addMessageHandler(messageData);
};

// 添加便捷方法
showMessage.success = (content: string, duration?: number) => showMessage({ content, type: 'success', duration });
showMessage.error = (content: string, duration?: number) => showMessage({ content, type: 'error', duration });
showMessage.warning = (content: string, duration?: number) => showMessage({ content, type: 'warning', duration });
showMessage.info = (content: string, duration?: number) => showMessage({ content, type: 'info', duration });


// 导出容器组件，需要在应用根部渲染一次
export default MessageContainer;
