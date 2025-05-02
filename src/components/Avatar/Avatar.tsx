// src/components/Avatar/Avatar.tsx
import React from 'react'
import DefaultAvatar from '@/assets/default_avatar.png'
import './Avatar.css' // 导入样式文件

interface AvatarProps {
  src?: string // 图片路径
  alt?: string
  className?: string
  isCircle?: boolean // 是否为圆形头像，默认为 true
  size?: string | number // 头像大小，可以是像素值或百分比
  onClick?: () => void // 点击事件处理函数
}

const Avatar: React.FC<AvatarProps> = ({
  src,
  alt = '用户头像',
  className,
  isCircle = true,
  size = '20px',
  onClick,
}) => {
  const [imageSrc, setImageSrc] = React.useState<string | null>(src || null)

  React.useEffect(() => {
    if (src) {
      // 检查图片是否存在
      const img = new Image()
      img.onload = () => {
        setImageSrc(src)
      }
      img.onerror = () => {
        setImageSrc(DefaultAvatar)
      }
      img.src = src
    } else {
      setImageSrc(DefaultAvatar)
    }
  }, [src])

  return (
    <div
      className={`avatar ${className} ${isCircle ? 'is-circle' : ''}`}
      style={{ width: size, height: size }}
      onClick={onClick}
    >
      <img src={imageSrc || DefaultAvatar} alt={alt} />
    </div>
  )
}

export default Avatar
