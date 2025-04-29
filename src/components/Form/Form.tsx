// src/components/Form/Form.tsx (修改后的完整代码)
import React, { useCallback, ReactNode, ChangeEvent } from 'react'
import './Form.css' // 引入 CSS 文件

// --- Form 组件  ---
interface FormProps {
  children?: ReactNode
  className?: string
  // 让 Form 组件可以接收 onSubmit 事件处理器
  onSubmit?: (event: React.FormEvent<HTMLFormElement>) => void
}
const Form: React.FC<FormProps> = ({ children, className, onSubmit }) => {
  return (
    <form className={`form ${className || ''}`} onSubmit={onSubmit}>
      {children} {/* 直接渲染子元素，不再克隆或注入 props */}
    </form>
  )
}

// --- InputField 组件 ---
interface InputFieldProps {
  name: string // Input 的 name 属性
  label?: string // Input 的标签
  type?: React.HTMLInputTypeAttribute // Input 类型 (text, password, etc.)
  className?: string // 自定义 CSS 类名
  required?: boolean // 是否必填
  disabled?: boolean // 是否禁用
  placeholder?: string // 占位符
  value: string // !! 关键：value 直接由父组件提供 !!
  minLength?: number // 最小长度
  maxLength?: number // 最大长度
  // !! 关键：onChange 由父组件提供，用于更新父组件的状态 !!
  onChange: (name: string, value: string) => void
}
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
    ...rest
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
          {...rest} // 允许传递其他属性，如 maxLength, minLength 等
        />
      </div>
    )
  }
)

// --- SelectField 组件 (下拉选择框) ---
interface SelectFieldProps {
  name: string
  label?: string
  options: Array<{ value: string | number; label: string }> // 选项数组
  value: string | number | ReadonlyArray<string> // 当前选中的值(单选)或值数组(多选)
  onChange: (name: string, value: string | string[] | number | number[]) => void // 更新父组件状态的回调
  multiple?: boolean // 是否允许多选
  required?: boolean
  disabled?: boolean
  placeholder?: string // 未选择时的占位符
  className?: string // 自定义 CSS 类
}
const SelectField: React.FC<SelectFieldProps> = React.memo(
  ({
    name,
    label,
    options,
    value,
    onChange,
    multiple = false, // 默认单选
    required,
    disabled,
    placeholder,
    className,
  }) => {
    const handleChange = useCallback(
      (event: ChangeEvent<HTMLSelectElement>) => {
        let newValue: string | string[] | number | number[]
        if (multiple) {
          // 处理多选：获取所有选中项的值
          newValue = Array.from(event.target.selectedOptions).map(
            (option) => option.value
          )
          // 如果选项值是数字，可能需要转换
          // newValue = Array.from(event.target.selectedOptions).map(option => Number.isNaN(Number(option.value)) ? option.value : Number(option.value));
        } else {
          // 处理单选
          newValue = event.target.value
          // newValue = Number.isNaN(Number(event.target.value)) ? event.target.value : Number(event.target.value);
        }
        onChange(name, newValue) // 通知父组件
      },
      [name, multiple, onChange]
    )

    return (
      <div className={`input-group select-group ${className || ''}`}>
        {label && <label htmlFor={name}>{label}</label>}
        <select
          id={name}
          name={name}
          value={value} // 绑定父组件的值
          onChange={handleChange}
          multiple={multiple}
          required={required}
          disabled={disabled}
          className="select-inner" // 应用样式
        >
          {/* 添加占位符选项（如果提供了 placeholder 且是单选） */}
          {placeholder && !multiple && (
            <option value="" disabled={required}>
              {placeholder}
            </option>
          )}

          {/* 渲染选项 */}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    )
  }
)

// --- Radio 组件 ---
interface RadioOption {
  value: string | number
  label: string // 用于显示的标签文本
  disabled?: boolean // 单独禁用某个选项
}
interface RadioGroupProps {
  name: string // 整组 radio 的 name 属性
  label?: string // 整组的标签
  options: RadioOption[] // 选项数组
  value: string | number | null // 当前选中的值
  onChange: (name: string, value: string | number) => void // 更新父组件状态的回调
  layout?: 'standard' | 'button' // 布局样式：标准或按钮
  required?: boolean // (注意: radio 的 required 行为可能需要额外JS处理)
  disabled?: boolean // 禁用整组
  className?: string // 自定义 CSS 类
  direction?: 'horizontal' | 'vertical' // 布局方向
}
const RadioGroup: React.FC<RadioGroupProps> = React.memo(
  ({
    name,
    label,
    options,
    value: groupValue, // 当前选中的值
    onChange,
    layout = 'standard', // 默认标准布局
    required, // Radio 的 required 比较特殊，通常需要表单库辅助
    disabled: groupDisabled, // 整组禁用状态
    className,
    direction = 'horizontal', // 布局方向
  }) => {
    const handleChange = useCallback(
      (event: ChangeEvent<HTMLInputElement>) => {
        const newValue = event.target.value
        // 转换回数字类型，如果原始值是数字
        // const finalValue = Number.isNaN(Number(newValue)) ? newValue : Number(newValue);
        onChange(name, newValue)
      },
      [name, onChange]
    )

    // 根据布局类型选择 CSS 类
    const layoutClass =
      layout === 'button' ? 'radio-group-button' : 'radio-group-standard'

    return (
      // 使用 fieldset 和 legend 语义更佳
      <fieldset
        className={`radio-group ${layoutClass} ${className || ''}`}
        disabled={groupDisabled}
      >
        {label && <legend className="group-label">{label}</legend>}
        <div className={`options-container ${direction}`}>
          {options.map((option) => {
            const optionId = `${name}-${option.value}` // 为 label 创建唯一 ID
            const isChecked = groupValue === option.value // 判断是否选中
            const isDisabled = groupDisabled || option.disabled // 检查单个选项是否也禁用

            return (
              <div
                key={optionId}
                className={`radio-option ${
                  layout === 'button' ? 'radio-button-option' : ''
                } ${isDisabled ? 'disabled' : ''}`}
              >
                <input
                  type="radio"
                  id={optionId}
                  name={name}
                  value={option.value}
                  checked={isChecked}
                  onChange={handleChange}
                  required={required && !groupValue} // 尝试基础的 required 实现
                  disabled={isDisabled}
                  className="radio-input-hidden" // 通过 CSS 隐藏实际的 radio
                />
                {/* label 用于点击和样式 */}
                <label
                  htmlFor={optionId}
                  className={`radio-label ${
                    layout === 'button' ? 'button-label' : 'standard-label'
                  } ${isChecked ? 'checked' : ''}`}
                >
                  {option.label}
                </label>
              </div>
            )
          })}
        </div>
      </fieldset>
    )
  }
)

export { Form, InputField, SelectField, RadioGroup }
