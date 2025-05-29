// src/components/CustomHeader.tsx
import React from 'react'
import './CustomHeader.css' // Reverted import to .css
import MinimizeIcon from '@/assets/icons/minimize.svg?react'
import MaximizeIcon from '@/assets/icons/maximize.svg?react'
import CloseIcon from '@/assets/icons/close.svg?react'
import Avatar from '@/components/Avatar/Avatar'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext' // UserProfile will be available via useAuth().user

interface CustomHeaderProps {
  title: string
}

// The temporary UserWithProfile interface is no longer needed
// interface UserWithProfile {
//   avatar?: string;
//   username?: string; 
//   [key: string]: any; 
// }

const CustomHeader: React.FC<CustomHeaderProps> = ({ title }) => {
  // user object from useAuth() is now expected to be of type UserProfile | null
  const { user } = useAuth() 

  const navigate = useNavigate()
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

  const handleAvatarClick = () => {
    navigate('/profile')
  }

  return (
    <div className="custom-header">
      <div className="custom-header-left">
        <div className="app-title">{title}</div>
      </div>
      <div className="custom-header-right">
        <div className="user-info-container">
          {user?.displayName && <span className="user-display-name">{user.displayName}</span>}
          <Avatar
            className="user-avatar"
            src={user?.avatar} 
            size={32} 
            onClick={handleAvatarClick}
          />
        </div>
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
