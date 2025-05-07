import React from 'react'
import Button from '@/components/Button/Button'
import './ConfirmDialog.css'

interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  message: string
  onConfirm: () => void
  onCancel: () => void // Also used for backdrop click
  confirmText?: string
  cancelText?: string
  isConfirming?: boolean
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = '确认',
  cancelText = '取消',
  isConfirming = false,
}) => {
  const handleOverlayClick = () => {
    // Only allow closing via overlay if not in a confirming state
    if (!isConfirming) {
      onCancel()
    }
  }

  const handleDialogClick = (e: React.MouseEvent) => {
    // Prevent click event from bubbling up to the overlay when clicking inside the dialog
    e.stopPropagation()
  }

  return (
    <div
      className={`confirm-dialog-overlay ${isOpen ? 'open' : ''}`}
      onClick={handleOverlayClick} // Add click handler to overlay
    >
      <div className="confirm-dialog" onClick={handleDialogClick}>
        {' '}
        {/* Add click handler to dialog content */}
        <h3 className="confirm-dialog-title">{title}</h3>
        <p className="confirm-dialog-message">{message}</p>
        <div className="confirm-dialog-actions">
          <Button theme="secondary" onClick={onCancel} disabled={isConfirming}>
            {cancelText}
          </Button>
          <Button
            theme="danger"
            onClick={onConfirm}
            disabled={isConfirming}
            isLoading={isConfirming}
          >
            {isConfirming ? '处理中...' : confirmText}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmDialog
