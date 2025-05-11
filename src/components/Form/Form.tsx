// src/components/Form/Form.tsx (修改后的完整代码)
import React, {
  useCallback,
  ReactNode,
  ChangeEvent,
  FocusEventHandler,
  useRef,
  useEffect,
  forwardRef,
} from 'react'
import EyeOnIcon from '@/assets/icons/eye_on.svg?react'
import EyeOffIcon from '@/assets/icons/eye_off.svg?react'
import SearchIcon from '@/assets/icons/search.svg?react'
import './Form.css' // 引入 CSS 文件

import AntdSelectField from '@/components/Form/AntdSelectField'

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
export interface InputFieldProps {
  id?: string // 可选的 id 属性
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
  pattern?: string // 正则表达式模式
  max?: string // 最大值 (适用于日期等类型)
  theme?: 'default' | 'search'
  autoFocus?: boolean // 是否自动获取焦点
  dropdownContent?: React.ReactNode
  isDropdownVisible?: boolean
  // !! 关键：onChange 由父组件提供，用于更新父组件的状态 !!
  onChange: (name: string, value: string) => void
  onFocus?: FocusEventHandler
  onBlur?: FocusEventHandler
}
const InputField = React.memo(
  forwardRef<HTMLInputElement, InputFieldProps>( // 使用 forwardRef
    (
      {
        id,
        name,
        label,
        type = 'text',
        className,
        required,
        disabled,
        placeholder,
        pattern,
        max,
        theme,
        autoFocus,
        value,
        dropdownContent,
        isDropdownVisible,
        onChange,
        onFocus,
        onBlur,
        // onOutsideClick, // 从 props 解构，但 InputField 内部不再需要 useEffect 来处理它
        ...rest
      },
      ref // 第二个参数是 ref
    ) => {
      const handleChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
          const newValue = event.target.value
          onChange(name, newValue)
        },
        [name, onChange]
      )

      const [isShowPassword, setShowPassword] = React.useState(false)
      const togglePasswordVisibility = () => {
        setShowPassword((prev) => !prev)
      }

      const inputType =
        type === 'password' ? (isShowPassword ? 'text' : 'password') : type

      // InputField 内部不再需要自己的 handleClickOutside useEffect，
      // 因为这个逻辑现在由 Login.tsx 在其作用域内处理。

      return (
        <div
          className={`input-group ${className || ''} ${
            theme ? `theme-${theme}` : ''
          }`}
          // wrapperRef 如果 InputField 内部需要引用其根 div，可以保留
          // 但对于父组件的 ref，我们使用 forwardRef 传递的 ref
        >
          {label && <label htmlFor={id ?? name}>{label}</label>}
          <div className="input-wrapper">
            {theme === 'search' && <SearchIcon className="search-icon" />}
            <input
              ref={ref} // 将转发的 ref 应用于实际的 input 元素
              type={inputType}
              id={id ?? name}
              name={name}
              value={value}
              required={required}
              disabled={disabled}
              placeholder={placeholder}
              className="input-inner"
              pattern={pattern}
              max={max}
              autoFocus={autoFocus}
              onChange={handleChange}
              onFocus={onFocus}
              onBlur={onBlur}
              {...rest}
            />
            {rest.maxLength && value && ( // 确保 value 存在再计算 length
              <span className="input-count">
                {value.length}
                {rest.maxLength ? `/${rest.maxLength}` : ''}
              </span>
            )}
            {type === 'password' && (
              <button
                type="button"
                className="toggle-password-visibility"
                onClick={togglePasswordVisibility}
                aria-label={isShowPassword ? 'Hide password' : 'Show password'}
              >
                {isShowPassword ? <EyeOnIcon /> : <EyeOffIcon />}
              </button>
            )}
          </div>
          {isDropdownVisible && dropdownContent}
        </div>
      )
    }
  )
)

// --- TextAreaField 组件 ---
interface TextAreaFieldProps {
  name: string // textarea 的 name 属性
  label?: string // 标签文本
  value: string // 文本值
  onChange: (name: string, value: string) => void // 值变化回调
  className?: string // 自定义CSS类名
  placeholder?: string // 占位符
  rows?: number // 默认行数
  minRows?: number // 最小行数
  maxRows?: number // 最大行数
  maxLength?: number // 最大字符数
  required?: boolean // 是否必填
  disabled?: boolean // 是否禁用
  resizable?: 'both' | 'horizontal' | 'vertical' | 'none' // 调整大小方向
  minWidth?: string // 最小宽度
  minHeight?: string // 最小高度
  maxWidth?: string // 最大宽度
  maxHeight?: string // 最大高度
  showCount?: boolean // 是否显示字数统计
}
const TextAreaField: React.FC<TextAreaFieldProps> = React.memo(
  ({
    name,
    label,
    value,
    onChange,
    className,
    placeholder,
    rows = 3,
    minRows,
    maxRows,
    maxLength,
    required,
    disabled,
    resizable = 'both',
    minWidth,
    minHeight,
    maxWidth,
    maxHeight,
    showCount = false,
  }) => {
    // 处理文本变化
    const handleChange = useCallback(
      (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = event.target.value
        onChange(name, newValue)
      },
      [name, onChange]
    )

    // 计算样式
    const textareaStyle: React.CSSProperties = {
      resize: resizable,
      minWidth,
      minHeight,
      maxWidth,
      maxHeight,
    }

    // 计算当前字符和最大字符数显示
    const charCount = value ? value.length : 0
    const countDisplay = maxLength
      ? `${charCount}/${maxLength}`
      : `${charCount}字`

    return (
      <div className={`textarea-group ${className || ''}`}>
        {label && <label htmlFor={name}>{label}</label>}
        <div className="textarea-wrapper">
          <textarea
            id={name}
            name={name}
            value={value}
            onChange={handleChange}
            placeholder={placeholder}
            rows={rows}
            maxLength={maxLength}
            required={required}
            disabled={disabled}
            style={textareaStyle}
            className="textarea-inner"
          />
          {showCount && (
            <div
              className={`char-count ${
                maxLength && charCount >= maxLength ? 'limit-reached' : ''
              }`}
            >
              {countDisplay}
            </div>
          )}
        </div>
      </div>
    )
  }
)

// --- SelectField 组件 (下拉选择框) ---
// interface SelectFieldProps {
//   id?: string; // 可选的 id 属性
//   name: string;
//   label?: string;
//   options: Array<{ value: string | number; label: string }>; // 选项数组
//   value: string | number | ReadonlyArray<string | number>; // 当前选中的值(单选)或值数组(多选)
//   onChange: (name: string, value: string | string[] | number | number[]) => void; // 更新父组件状态的回调
//   multiple?: boolean; // 是否允许多选
//   required?: boolean;
//   disabled?: boolean;
//   placeholder?: string; // 未选择时的占位符
//   className?: string; // 自定义 CSS 类
// }
// const SelectField: React.FC<SelectFieldProps> = React.memo(
//   ({
//     id,
//     name,
//     label,
//     options,
//     value,
//     onChange,
//     multiple = false,
//     required,
//     disabled,
//     placeholder,
//     className,
//   }) => {
//     const handleChange = useCallback(
//       (event: ChangeEvent<HTMLSelectElement>) => {
//         let processedNewValue: string | string[] | number | number[];

//         if (multiple) {
//           const selectedOptionValues = Array.from(
//             event.target.selectedOptions
//           ).map((option) => option.value); // HTMLOptionElement.value is always string

//           processedNewValue = selectedOptionValues.map((selectedValueString) => {
//             const originalOption = options.find(
//               (opt) => opt.value.toString() === selectedValueString
//             );
//             if (originalOption && typeof originalOption.value === 'number') {
//               return Number(selectedValueString);
//             }
//             return selectedValueString;
//           }) as string[] | number[];
//         } else {
//           const selectedValueString = event.target.value; // HTMLSelectElement.value is always string
//           const originalOption = options.find(
//             (opt) => opt.value.toString() === selectedValueString
//           );
//           if (originalOption && typeof originalOption.value === 'number') {
//             processedNewValue = Number(selectedValueString);
//           } else {
//             processedNewValue = selectedValueString;
//           }
//         }
//         onChange(name, processedNewValue);
//       },
//       [name, multiple, onChange, options] // `options` is needed for type conversion
//     );

//     // Prepare the value for the <select> element.
//     // HTMLSelectElement's `value` (for single select) or `selectedOptions` (for multi-select)
//     // work with string values.
//     let selectElementValue: string | string[];
//     if (multiple) {
//       // Ensure `value` is an array and all its elements are strings for the select element
//       selectElementValue = Array.isArray(value)
//         ? value.map((v) => v.toString())
//         : []; // Default to empty array if `value` is not an array in multiple mode
//     } else {
//       // Ensure `value` is a string for the select element
//       selectElementValue =
//         value !== undefined && value !== null ? value.toString() : "";
//     }

//     return (
//       <div className={`input-group select-group ${className || ""}`}>
//         {label && <label htmlFor={id ?? name}>{label}</label>}
//         <select
//           id={id ?? name}
//           name={name}
//           value={selectElementValue} // Use the processed string value(s)
//           onChange={handleChange}
//           multiple={multiple}
//           required={required}
//           disabled={disabled}
//           className="select-inner"
//         >
//           {/* Placeholder option for single select mode */}
//           {placeholder && !multiple && (
//             <option value="" disabled={required}> {/* Placeholder value is typically empty string */}
//               {placeholder}
//             </option>
//           )}

//           {/* Render actual options */}
//           {options.map((option) => (
//             // The `value` attribute of an <option> element must be a string.
//             <option
//               key={option.value.toString()} // Key should be unique and string
//               value={option.value.toString()} // Option value must be string
//             >
//               {option.label}
//             </option>
//           ))}
//         </select>
//       </div>
//     );
//   }
// );

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

export {
  Form,
  InputField,
  TextAreaField,
  AntdSelectField as SelectField,
  RadioGroup,
}
