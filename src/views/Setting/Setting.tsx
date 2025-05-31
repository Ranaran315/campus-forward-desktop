import React from 'react';
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import storage from '@/assets/icons/storage.svg?react';
import './Setting.css';
import StorageManagement from './components/StorageManagement';

const Setting: React.FC = () => {
  const location = useLocation();

  // 菜单项配置
  const menuItems = [
    {
      key: 'storage',
      icon: storage,
      label: '存储管理',
      path: '/setting/storage'
    }
  ];

  return (
    <div className="settings-container">
      <div className="settings-sidebar">
        {menuItems.map(item => (
          <Link
            key={item.key}
            to={item.path}
            className={`settings-sidebar-item ${location.pathname === item.path ? 'active' : ''}`}
          >
            <span className="settings-sidebar-icon">
              <item.icon />
            </span>
            <span className="settings-sidebar-label">{item.label}</span>
          </Link>
        ))}
      </div>
      <div className="settings-main">
        <Routes>
          <Route path="/storage" element={<StorageManagement />} />
          <Route path="/" element={<Navigate to="/setting/storage" replace />} />
        </Routes>
      </div>
    </div>
  );
};

export default Setting;
