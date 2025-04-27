// src/components/Button/Button.tsx
import React, { ReactNode } from 'react'
import './Button.css' // 导入按钮的样式

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  theme?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning'
  children: ReactNode
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void
}

const Button: React.FC<ButtonProps> = ({
  children,
  theme = 'primary',
  className,
  onClick,
  disabled = false,
  ...rest
}) => {
  const themeClass = theme ? `button-${theme}` : ''
  const classes = `button ${themeClass} ${className || ''} ${
    disabled ? 'is-disabled' : ''
  }`

  return (
    <button className={classes} onClick={onClick} disabled={disabled} {...rest}>
      {children}
    </button>
  )
}

export default Button
