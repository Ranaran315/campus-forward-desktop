// src/components/Form/Form.tsx (修改后的完整代码)
import React, { useCallback, ReactNode } from 'react'
import './Form.css' // 引入 CSS 文件

// --- Form 组件接口 ---
interface FormProps {
  children?: ReactNode
  className?: string
  // 让 Form 组件可以接收 onSubmit 事件处理器
  onSubmit?: (event: React.FormEvent<HTMLFormElement>) => void
}

// --- InputField 组件接口 ---
interface InputFieldProps {
  name: string // Input 的 name 属性
  label?: string // Input 的标签
  type?: React.HTMLInputTypeAttribute // Input 类型 (text, password, etc.)
  className?: string // 自定义 CSS 类名
  required?: boolean // 是否必填
  disabled?: boolean // 是否禁用
  placeholder?: string // 占位符
  value: string // !! 关键：value 直接由父组件提供 !!
  // !! 关键：onChange 由父组件提供，用于更新父组件的状态 !!
  onChange: (name: string, value: string) => void
}

// --- Form 组件 (简化后) ---
// 它现在只负责渲染 <form> 标签和子元素，不管理状态
const Form: React.FC<FormProps> = ({ children, className, onSubmit }) => {
  return (
    <form className={`form ${className || ''}`} onSubmit={onSubmit}>
      {children} {/* 直接渲染子元素，不再克隆或注入 props */}
    </form>
  )
}

// --- InputField 组件 (简化后，无内部状态) ---
// 它现在是一个完全受控的组件
const InputField: React.FC<InputFieldProps> = React.memo(
  ({
    name,
    label,
    type = 'text',
    className,
    required,
    disabled,
    placeholder,
    value, // 直接使用父组件传入的 value
    onChange, // 直接使用父组件传入的 onChange
  }) => {
    // 处理原生 input 的 onChange 事件
    const handleChange = useCallback(
      (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const newValue = event.target.value
        // 调用从父组件传入的 onChange 方法，传递 name 和新的 value
        onChange(name, newValue)
      },
      [name, onChange] // 依赖项是 name 和父组件传入的 onChange 函数
    )

    return (
      <div className={`input-group ${className || ''}`}>
        {label && <label htmlFor={name}>{label}</label>}
        <input
          type={type}
          id={name} // id 用于 label 关联
          name={name} // name 属性
          value={value} // !! input 的值完全由父组件的 prop 控制 !!
          onChange={handleChange} // !! input 的改变事件触发父组件的更新 !!
          required={required}
          disabled={disabled}
          placeholder={placeholder}
          className="input-inner" // 你可以添加更多样式控制
        />
      </div>
    )
  }
)

// 导出两个组件
export { Form, InputField }
