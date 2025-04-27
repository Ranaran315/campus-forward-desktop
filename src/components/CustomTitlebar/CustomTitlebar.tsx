// src/components/CustomTitlebar/CustomTitlebar.tsx
import React from 'react'
import './CustomTitlebar.css' // 使用 CSS Modules
// 引入你的关闭、最小化图标 SVG 或组件
import CloseIcon from '@/assets/icons/close.svg?react'
import MinimizeIcon from '@/assets/icons/minimize.svg?react'

interface CustomTitlebarProps {
  title?: string
}

const CustomTitlebar: React.FC<CustomTitlebarProps> = ({ title = '' }) => {
  const handleMinimize = () => {
    window.ipcRenderer.send('minimize-login-window')
  }

  const handleClose = () => {
    window.ipcRenderer.send('close-login-window')
  }

  return (
    // `draggable` 类应用 -webkit-app-region: drag
    <div className="custom-titlebar">
      <div className="custom-titlebar-controls">
        {/* `noDrag` 类应用 -webkit-app-region: no-drag */}
        <button onClick={handleMinimize}>
          <MinimizeIcon className="window-icon" />
        </button>
        <button onClick={handleClose}>
          <CloseIcon className="window-icon" />
        </button>
      </div>
    </div>
  )
}

export default CustomTitlebar
