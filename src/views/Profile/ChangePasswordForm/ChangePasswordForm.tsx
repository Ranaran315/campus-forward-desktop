// (如果你的文件实际在 components 目录，请相应调整路径注释)
import React, { useState, useCallback, useImperativeHandle, RefObject } from 'react';
import { Form, Input, Alert } from 'antd'; // 导入 Ant Design 组件
import apiClient from '@/lib/axios';
import './ChangePasswordForm.css';
import { showMessage } from '@/components/Message/MessageContainer';

// --- Props 定义 ---
interface ChangePasswordFormProps {
  onSuccess: () => void;
  setLoading: (loading: boolean) => void;
  submitRef?: RefObject<{ submit: () => Promise<void> }>;
}

const ChangePasswordForm: React.FC<ChangePasswordFormProps> = ({
  onSuccess,
  setLoading,
  submitRef
}) => {
  // 使用 Ant Design 的表单实例
  const [form] = Form.useForm();
  const [error, setError] = useState<string | null>(null);

  // --- 核心提交逻辑 ---
  const handleSubmit = useCallback(async () => {
    setError(null);
    
    try {
      // 使用 Ant Design 表单验证
      const values = await form.validateFields();
      
      // 前端校验
      if (values.newPassword !== values.confirmPassword) {
        setError('新密码和确认密码不匹配。');
        return;
      }
      
      setLoading(true);
      
      await apiClient.patch('/users/me/password', {
        newPassword: values.newPassword,
      });
      
      showMessage.success('密码修改成功！');
      
      // 延迟调用成功回调，让用户看到成功消息
      setTimeout(() => {
        form.resetFields(); // 清空表单
        onSuccess();
      }, 1500);
      
    } catch (err: any) {
      // 区分表单验证错误和API错误
      if (err.errorFields) {
        // 表单验证失败，不需要额外处理，Ant Design 会显示错误信息
        return;
      }
      
      showMessage.error(
        err.response?.data?.message?.join(',') || 
        '修改密码失败，请稍后重试。'
      );
      
      console.error('修改密码失败:', err);
      
      const errorMessage = 
        err.response?.data?.message || 
        '修改密码失败，请检查旧密码或稍后重试。';
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [form, onSuccess, setLoading]);
  
  // --- 暴露 submit 方法给父组件 ---
  useImperativeHandle(submitRef, () => ({
    submit: handleSubmit
  }), [handleSubmit]);

  return (
    <div className="change-password-form">
      <Form
        form={form}
        layout="vertical"
        requiredMark={true}
      >
        <Form.Item
          name="newPassword"
          label="新密码"
          rules={[
            { required: true, message: '请输入新密码' },
            { min: 6, message: '密码长度不能少于6位' },
            { max: 20, message: '密码长度不能超过20位' }
          ]}
        >
          <Input.Password 
            placeholder="请输入新密码" 
            maxLength={20}
          />
        </Form.Item>
        
        <Form.Item
          name="confirmPassword"
          label="确认新密码"
          dependencies={['newPassword']} // 依赖新密码字段
          rules={[
            { required: true, message: '请再次输入新密码' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('newPassword') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error('两次输入的密码不一致'));
              },
            }),
          ]}
        >
          <Input.Password 
            placeholder="请再次输入新密码" 
            maxLength={20}
          />
        </Form.Item>
      </Form>
      
      {/* 显示API错误信息 */}
      {error && (
        <Alert 
          message={error} 
          type="error" 
          showIcon 
          style={{ marginTop: 16 }}
          closable
        />
      )}
    </div>
  );
};

export default ChangePasswordForm;