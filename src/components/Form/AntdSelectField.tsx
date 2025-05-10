import React from 'react'
import { Select } from 'antd'
import type { SelectProps } from 'antd'
// 确保在您的项目入口文件（如 App.tsx 或 main.tsx）或此处引入 Ant Design 的全局样式
// 如果已经在全局引入，则此处可以省略
// import 'antd/dist/antd.css'; // Ant Design v4

// 定义与原 SelectFieldProps 类似的接口，方便替换和理解
interface AntdSelectFieldProps {
  id?: string
  name: string // 用于 onChange 回调，以识别是哪个字段变化
  label?: string
  options: Array<{ value: string | number; label: string; disabled?: boolean }> // Ant Design Select 的 options 格式兼容此结构
  value?: string | number | string[] | number[] // Ant Design Select 的 value
  onChange: (name: string, value: any) => void // 回调函数，传递字段名和选中的值
  size?: SelectProps['size'] // Ant Design Select 的 size 属性
  multiple?: boolean // antd Select 使用 mode="multiple"
  disabled?: boolean
  placeholder?: string
  className?: string // 用于外层容器的自定义 class
  selectClassName?: string // 用于 Ant Design Select 组件本身的自定义 class
  loading?: boolean
  allowClear?: boolean
  style?: React.CSSProperties // 用于外层容器的样式
  selectStyle?: React.CSSProperties // 用于 Ant Design Select 组件本身的样式
  filterOption?:
    | boolean
    | ((
        inputValue: string,
        option?: { label: string; value: string | number }
      ) => boolean)
}

const AntdSelectField: React.FC<AntdSelectFieldProps> = ({
  id,
  name,
  label,
  options,
  value,
  onChange,
  multiple = false,
  disabled,
  placeholder,
  className,
  selectClassName,
  loading,
  allowClear = false,
  style,
  size,
  selectStyle = { width: '100%' }, // 默认宽度100%，可覆盖
  filterOption = true, // 默认为 true，开启按 label 搜索
}) => {
  const handleChange = (selectedValue: any, option: any) => {
    // Ant Design 的 onChange 直接返回选中的 value (或 value 数组)
    // 我们将 name 和 selectedValue 传递给父组件的 onChange 处理函数
    onChange(name, selectedValue)
  }

  // Ant Design Select 的 filterOption 默认行为是比较 option.value。
  // 如果需要根据 option.label 来搜索，可以自定义 filterOption 函数。
  // 当 filterOption 为 true 时，它会使用 label 进行不区分大小写的包含性搜索。
  const defaultFilterOption = (
    inputValue: string,
    option?: { label: string; value: string | number }
  ) => {
    if (option && option.label) {
      return option.label.toLowerCase().includes(inputValue.toLowerCase())
    }
    return false
  }

  return (
    <div
      className={`input-group antd-select-group ${className || ''}`}
      style={style}
    >
      {label && <label htmlFor={id ?? name}>{label}</label>}
      <Select
        id={id ?? name}
        style={selectStyle}
        size={size}
        value={value}
        options={options} // antd options可以直接使用 {value, label} 结构
        onChange={handleChange}
        mode={multiple ? 'multiple' : undefined}
        disabled={disabled}
        placeholder={placeholder}
        className={selectClassName}
        loading={loading}
        allowClear={allowClear}
        filterOption={
          typeof filterOption === 'function'
            ? filterOption
            : filterOption
            ? defaultFilterOption
            : false
        }
        // 您可以根据需要添加更多 Ant Design Select 的 props
        // showSearch // 如果需要搜索功能，可以明确开启
      />
    </div>
  )
}

export default AntdSelectField
