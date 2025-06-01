import React, { useState, useEffect } from 'react';
import { Card, message } from 'antd';
import MessageIcon from '@/assets/icons/message.svg?react';
import NotificationIcon from '@/assets/icons/notification.svg?react';
import FriendIcon from '@/assets/icons/friend.svg?react';
import '@/themes/themes.css';
import './Skin.css';

interface ThemePreviewProps {
  isDarkMode: boolean;
  isActive: boolean;
  onClick: () => void;
}

// 主题预览卡片组件
const ThemePreview: React.FC<ThemePreviewProps> = ({ isDarkMode, isActive, onClick }) => {
  return (
    <div 
      className={`theme-preview ${isActive ? 'active' : ''}`}
      onClick={onClick}
      data-theme={isDarkMode ? 'dark' : 'light'}
    >
      <div className="preview-header">
        <div className="preview-title">{isDarkMode ? '暗色主题' : '亮色主题'}</div>
      </div>
      <div className="preview-content">
        <div className="preview-sidebar">
          <div className="preview-menu-item active">
            <MessageIcon />
            <span>消息</span>
          </div>
          <div className="preview-menu-item">
            <NotificationIcon />
            <span>通知</span>
          </div>
          <div className="preview-menu-item">
            <FriendIcon />
            <span>好友</span>
          </div>
        </div>
        <div className="preview-main">
          <div className="preview-chat">
            <div className="preview-message received">
              <div className="preview-avatar"></div>
              <div className="preview-bubble">你好！</div>
            </div>
            <div className="preview-message sent">
              <div className="preview-bubble">你好，很高兴认识你！</div>
              <div className="preview-avatar"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

function SkinViews() {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  // 初始化时获取当前主题
  useEffect(() => {
    const darkModeValue = localStorage.getItem('darkMode');
    setIsDarkMode(darkModeValue === 'true');
    
    // 应用保存的主题
    if (darkModeValue === 'true') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
    }
  }, []);

  // 切换主题
  const handleThemeChange = (isDark: boolean) => {
    setIsDarkMode(isDark);
    localStorage.setItem('darkMode', String(isDark));
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    message.success(`已切换到${isDark ? '暗色' : '亮色'}主题`);
  };

  return (
    <div className="skin-container">
      <Card className="theme-card">
        <div className="theme-header">
          <h2>主题设置</h2>
          <p className="theme-description">选择一个主题以预览和应用</p>
        </div>
        <div className="theme-previews">
          <ThemePreview 
            isDarkMode={false} 
            isActive={!isDarkMode}
            onClick={() => handleThemeChange(false)} 
          />
          <ThemePreview 
            isDarkMode={true} 
            isActive={isDarkMode}
            onClick={() => handleThemeChange(true)} 
          />
        </div>
      </Card>
    </div>
  );
}

export default SkinViews;
