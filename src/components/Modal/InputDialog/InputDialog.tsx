import React from 'react'
import Button from '@/components/Button/Button'
import { InputField } from '@/components/Form/Form' // 假设你有这个
import './InputDialog.css' // 稍后创建 CSS

interface InputDialogProps {
  isOpen: boolean
  title: string
  label?: string
  initialValue?: string
  confirmText?: string
  cancelText?: string
  isConfirming?: boolean
  onSave: (value: string) => void // 修改为 onSave，直接传递最终值
  onCancel: () => void
  // 为了让 InputDialog 内部管理输入状态，或者由外部控制
  inputValue: string // 由外部控制
  onInputChange: (value: string) => void // 由外部控制
  placeholder?: string
  maxLength?: number // 限制输入长度
}

const InputDialog: React.FC<InputDialogProps> = ({
  isOpen,
  title,
  label,
  // initialValue = '', // 如果由外部控制，initialValue 可以通过 inputValue 首次传入
  confirmText = '确认',
  cancelText = '取消',
  isConfirming = false,
  onSave,
  onCancel,
  inputValue,
  onInputChange,
  placeholder = '请输入内容',
  maxLength,
}) => {
  // const [currentValue, setCurrentValue] = useState(initialValue);

  // useEffect(() => {
  //   if (isOpen) {
  //     setCurrentValue(initialValue); // 对话框打开时重置为初始值
  //   }
  // }, [isOpen, initialValue]);

  if (!isOpen) {
    return null
  }

  const handleConfirm = () => {
    onSave(inputValue)
  }

  return (
    <div className="input-dialog-overlay">
      <div className="input-dialog">
        <h3 className="input-dialog-title">{title}</h3>
        {label && (
          <label className="input-dialog-label" htmlFor="dialog-input">
            {label}
          </label>
        )}
        <InputField
          id="dialog-input"
          name="dialogInput"
          type="text"
          value={inputValue}
          onChange={(_, value) => onInputChange(value)} // InputField 的 onChange 可能返回 (name, value)
          placeholder={placeholder}
          autoFocus
          className="input-dialog-field"
          maxLength={maxLength} // 限制输入长度
        />
        <div className="input-dialog-actions">
          <Button theme="secondary" onClick={onCancel} disabled={isConfirming}>
            {cancelText}
          </Button>
          <Button
            theme="primary"
            onClick={handleConfirm}
            disabled={isConfirming} /*isLoading={isConfirming}*/
          >
            {isConfirming ? '处理中...' : confirmText}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default InputDialog
