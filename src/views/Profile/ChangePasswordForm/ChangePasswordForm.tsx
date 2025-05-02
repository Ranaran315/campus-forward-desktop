// (如果你的文件实际在 components 目录，请相应调整路径注释)
import React, { useState, useCallback, useImperativeHandle, RefObject } from 'react'; // 引入 useImperativeHandle, RefObject
import { Form, InputField } from '@/components/Form/Form';
// 不再需要 Button
// import Button from '@/components/Button/Button';
import apiClient from '@/lib/axios';
import './ChangePasswordForm.css';

// --- 修改 Props ---
interface ChangePasswordFormProps {
  // onSave 和 onCancel 由 Modal 处理
  onSuccess: () => void; // 成功后的回调
  onError: (message: string) => void; // 失败后的回调
  setLoading: (loading: boolean) => void; // 更新父组件加载状态的函数
  // 用于父组件触发提交的 ref
  submitRef?: RefObject<{ submit: () => Promise<void> }>;
}

const ChangePasswordForm: React.FC<ChangePasswordFormProps> = ({
  onSuccess,
  onError,
  setLoading,
  submitRef
}) => {
  const [formData, setFormData] = useState({
    oldPassword: '', // 添加旧密码字段
    newPassword: '',
    confirmPassword: '',
  });
  // 内部不再管理 isSaving 状态
  // const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null); // 表单内部错误提示
  const [successMessage, setSuccessMessage] = useState<string | null>(null); // 内部成功提示

  const handleInputChange = useCallback((name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null);
    setSuccessMessage(null);
  }, []);

  // --- 修改 handleSubmit ---
  // 这个函数将由父组件通过 ref 调用
  const handleSubmit = useCallback(async () => {
    setError(null);
    setSuccessMessage(null);

    // 前端校验
    if (!formData.oldPassword) {
      const msg = '请输入旧密码。';
      setError(msg);
      onError(msg); // 通知父组件错误
      return;
    }
    if (formData.newPassword !== formData.confirmPassword) {
      const msg = '新密码和确认密码不匹配。';
      setError(msg);
      onError(msg); // 通知父组件错误
      return;
    }
    if (formData.newPassword.length < 6) {
      const msg = '新密码长度不能少于 6 位。';
      setError(msg);
      onError(msg); // 通知父组件错误
      return;
    }

    setLoading(true); // 通知父组件开始加载

    try {
      // --- 确保后端接口需要 oldPassword ---
      await apiClient.patch('/users/me/password', {
        oldPassword: formData.oldPassword,
        newPassword: formData.newPassword,
      });
      setSuccessMessage('密码修改成功！');
      setFormData({ oldPassword: '', newPassword: '', confirmPassword: '' }); // 清空表单

      // 延迟调用成功回调，让用户看到成功消息
      setTimeout(() => {
         onSuccess(); // 通知父组件成功（父组件负责关闭 Modal）
      }, 1500);

    } catch (err: any) {
      console.error('修改密码失败:', err);
      const errorMessage = err.response?.data?.message || '修改密码失败，请检查旧密码或稍后重试。';
      setError(errorMessage); // 在表单内显示错误
      onError(errorMessage); // 通知父组件错误
    } finally {
      setLoading(false); // 通知父组件加载结束
    }
  }, [formData, onError, onSuccess, setLoading]); // 添加依赖

  // --- 使用 useImperativeHandle 暴露 submit 方法 ---
  useImperativeHandle(submitRef, () => ({
      submit: handleSubmit
  }), [handleSubmit]); // 依赖 handleSubmit

  return (
    // 不再需要 Form 的 onSubmit，因为提交由外部触发
    <div className="change-password-form">
      {error && <div className="form-error-message">{error}</div>}
      {successMessage && <div className="form-success-message">{successMessage}</div>}

      {/* 添加旧密码输入框 */}
      <InputField
        name="oldPassword"
        label="旧密码"
        type="password"
        value={formData.oldPassword}
        onChange={handleInputChange}
        required
        // disabled 状态由父组件通过 Modal 控制
      />
      <InputField
        name="newPassword"
        label="新密码"
        type="password"
        value={formData.newPassword}
        onChange={handleInputChange}
        required
        minLength={6}
      />
      <InputField
        name="confirmPassword"
        label="确认新密码"
        type="password"
        value={formData.confirmPassword}
        onChange={handleInputChange}
        required
        minLength={6}
      />
    </div>
  );
};

export default ChangePasswordForm;