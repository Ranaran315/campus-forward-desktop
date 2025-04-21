// src/components/CustomHeader.tsx
import React from 'react'
import './CustomHeader.css' // 你可以创建对应的 CSS 文件

interface CustomHeaderProps {
  title: string
}

const CustomHeader: React.FC<CustomHeaderProps> = ({ title }) => {
  const handleMinimize = () => {
    window.electron.ipcRenderer.send('minimize-window')
  }

  const handleMaximize = () => {
    window.electron.ipcRenderer.send('maximize-window')
  }

  const handleClose = () => {
    window.electron.ipcRenderer.send('close-window')
  }

  return (
    <div className="custom-header">
      <div className="app-title">{title}</div>
      <div className="window-controls">
        <button onClick={handleMinimize}>−</button>
        <button onClick={handleMaximize}>o</button>
        <button onClick={handleClose}>×</button>
      </div>
    </div>
  )
}

export default CustomHeader
