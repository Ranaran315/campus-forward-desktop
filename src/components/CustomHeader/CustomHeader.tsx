// src/components/CustomHeader.tsx
import React from 'react'
import './CustomHeader.css' // 你可以创建对应的 CSS 文件
import MinimizeIcon from '@/assets/icons/minimize.svg?react'
import MaximizeIcon from '@/assets/icons/maximize.svg?react'
import CloseIcon from '@/assets/icons/close.svg?react'
import Avatar from '@/components/Avatar/Avatar'

interface CustomHeaderProps {
  title: string
}

const CustomHeader: React.FC<CustomHeaderProps> = ({ title }) => {
  const handleMinimize = () => {
    console.log('Minimize button clicked')
    window.ipcRenderer.send('minimize-window')
  }

  const handleMaximize = () => {
    window.ipcRenderer.send('maximize-window')
  }

  const handleClose = () => {
    window.ipcRenderer.send('close-window')
  }

  return (
    <div className="custom-header">
      <div className="custom-header-left">
        <div className="app-title">{title}</div>
      </div>
      <div className="custom-header-right">
        <Avatar></Avatar>
        <div className="window-controls">
          <button onClick={handleMinimize}>
            <MinimizeIcon className="window-icon" />
          </button>
          <button onClick={handleMaximize}>
            <MaximizeIcon className="window-icon" />
          </button>
          <button onClick={handleClose}>
            <CloseIcon className="window-icon" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default CustomHeader
