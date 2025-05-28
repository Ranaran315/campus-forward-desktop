// src/components/Avatar/Avatar.tsx
import React from 'react'
import { Avatar as AntAvatar, AvatarProps as AntAvatarProps } from 'antd'
import { UserOutlined } from '@ant-design/icons'
import { getAvatarUrl } from '@/utils/imageHelper'

interface AvatarProps extends Omit<AntAvatarProps, 'src'> {
  src?: string | null
}

/**
 * 头像组件，自动处理URL前缀
 */
const Avatar: React.FC<AvatarProps> = ({ src, icon, ...props }) => {
  return (
    <AntAvatar
      src={src ? getAvatarUrl(src) : undefined}
      icon={!src ? icon || <UserOutlined /> : undefined}
      {...props}
      onError={() => {
        // 加载失败时使用默认头像
        const target = document.createElement('img')
        target.src = '/assets/images/default-avatar.png'
        return false
      }}
    />
  )
}

export default Avatar
