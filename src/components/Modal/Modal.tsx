import React, { ReactNode } from 'react';
import './Modal.css';
import CloseIcon from '@/assets/icons/close.svg?react';
import Button, { ButtonTheme } from '@/components/Button/Button'; // Import Button and its theme type

interface ModalProps {
  isOpen: boolean;
  onClose: () => void; // Renamed from onCancel for clarity, used by close icon and default cancel
  title?: string;
  children: ReactNode;

  // --- Footer Customization ---
  /** Render a completely custom footer, overrides default buttons */
  customFooter?: ReactNode;
  /** Show the footer area (defaults to true if customFooter is not provided) */
  showFooter?: boolean;

  // --- Default Button Control (used if customFooter is not provided and showFooter is true) ---
  /** Show the default Cancel button (defaults to true) */
  showCancelButton?: boolean;
  /** Show the default Confirm button (defaults to true) */
  showConfirmButton?: boolean;
  /** Text for the Cancel button (defaults to '取消') */
  cancelText?: string;
  /** Text for the Confirm button (defaults to '确认') */
  confirmText?: string;
  /** Theme for the Cancel button (defaults to 'secondary') */
  cancelButtonTheme?: ButtonTheme;
  /** Theme for the Confirm button (defaults to 'primary') */
  confirmButtonTheme?: ButtonTheme;
  /** Callback function when Confirm button is clicked */
  onConfirm?: () => void;
  /** Optional specific callback for Cancel button (defaults to onClose) */
  onCancel?: () => void;
  /** Loading state for the Confirm button (defaults to false) */
  isConfirmLoading?: boolean;
  /** Disabled state for the Cancel button (defaults to false) */
  isCancelDisabled?: boolean;
   /** Disabled state for the Confirm button (defaults to false) */
  isConfirmDisabled?: boolean;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  customFooter,
  showFooter = true, // Default to true if customFooter isn't set
  showCancelButton = true,
  showConfirmButton = true,
  cancelText = '取消',
  confirmText = '确认',
  cancelButtonTheme = 'secondary',
  confirmButtonTheme = 'primary',
  onConfirm,
  onCancel, // Specific cancel handler
  isConfirmLoading = false,
  isCancelDisabled = false,
  isConfirmDisabled = false,
}) => {
  if (!isOpen) {
    return null;
  }

  const handleContentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  // Determine the actual cancel handler
  const handleCancel = onCancel || onClose;

  // Determine if the default footer should be rendered
  const shouldRenderDefaultFooter = !customFooter && showFooter;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={handleContentClick}>
        <div className="modal-header">
          {title && <h3 className="modal-title">{title}</h3>}
          <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            <CloseIcon />
          </button>
        </div>
        <div className="modal-body">
          {children}
        </div>

        {/* Render Footer: Custom or Default */}
        {customFooter ? (
          <div className="modal-footer">{customFooter}</div>
        ) : shouldRenderDefaultFooter ? (
          <div className="modal-footer">
            {showCancelButton && (
              <Button
                theme={cancelButtonTheme}
                onClick={handleCancel}
                disabled={isCancelDisabled || isConfirmLoading} // Also disable cancel when confirm is loading
              >
                {cancelText}
              </Button>
            )}
            {showConfirmButton && (
              <Button
                theme={confirmButtonTheme}
                onClick={onConfirm}
                disabled={isConfirmDisabled || isConfirmLoading}
                // Optionally add loading state visual to Button component if it supports it
              >
                {isConfirmLoading ? '处理中...' : confirmText}
              </Button>
            )}
          </div>
        ) : null /* No footer rendered */}
      </div>
    </div>
  );
};

export default Modal;