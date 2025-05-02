// (如果你的文件实际在 components 目录，请相应调整路径注释)
import React, { useState, useEffect, useCallback, useImperativeHandle, RefObject } from 'react'; // 引入 useImperativeHandle, RefObject
import { Form, InputField, RadioGroup } from '@/components/Form/Form'; // 假设这些组件存在且路径正确
// 不再需要 Button
// import Button from '@/components/Button/Button';
import AvatarUpload from '@/components/AvatarUpload/AvatarUpload'; // 假设头像上传组件存在且路径正确
import apiClient from '@/lib/axios'; // 你的 axios 实例
import './EditProfileForm.css'; // 确保 CSS 文件存在
import { ProfileFormData } from '../Profile.type';


// --- 组件 Props 定义 ---
interface EditProfileFormProps {
  initialData: ProfileFormData & { avatar?: string }; // 包含头像 URL 的初始数据
  onSuccess: (updatedData: ProfileFormData & { avatar?: string }) => void; // 成功回调
  onError: (message: string) => void; // 失败回调
  setLoading: (loading: boolean) => void; // 更新父组件加载状态的函数
  userId: string; // 当前用户 ID，可能用于某些操作
  submitRef?: RefObject<{ submit: () => Promise<void> }>; // 父组件触发提交的 ref
}

const EditProfileForm: React.FC<EditProfileFormProps> = ({
    initialData,
    onSuccess,
    onError,
    setLoading,
    userId, // userId 可能在未来用于更复杂逻辑，暂时保留
    submitRef
}) => {
  // --- State 定义 ---
  const [formData, setFormData] = useState<ProfileFormData>(initialData);
  const [error, setError] = useState<string | null>(null); // 表单内部错误提示
  const [avatarFile, setAvatarFile] = useState<File | null>(null); // 新选择的头像文件
  const [avatarPreview, setAvatarPreview] = useState<string | null>(initialData.avatar || null); // 头像预览 URL

  // --- Effect: 当 initialData 变化时，更新表单状态 ---
  useEffect(() => {
    setFormData({
        nickname: initialData.nickname || '',
        realname: initialData.realname || '',
        gender: initialData.gender || '',
        // 确保 birthday 是 YYYY-MM-DD 格式或空字符串
        birthday: initialData.birthday ? initialData.birthday.split('T')[0] : '',
        email: initialData.email || '',
        phone: initialData.phone || '',
    });
    setAvatarPreview(initialData.avatar || null);
    setError(null); // 重置错误
    setAvatarFile(null); // 重置文件选择
  }, [initialData]);

  // --- 输入框内容变化处理 ---
  const handleInputChange = useCallback((name: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null); // 用户输入时清除错误
  }, []);

  // --- 头像选择变化处理 ---
  const handleAvatarChange = useCallback((file: File | null, previewUrl: string | null) => {
      setAvatarFile(file);
      setAvatarPreview(previewUrl);
      setError(null); // 用户选择时清除错误
  }, []);

  // --- 核心提交逻辑 (由父组件通过 ref 调用) ---
  const handleSubmit = useCallback(async () => {
    setError(null); // 清除旧错误
    setLoading(true); // 通知父组件开始加载

    try {
        let finalAvatarUrl = initialData.avatar; // 默认使用旧头像

        // 1. 上传新头像 (如果选择了)
        if (avatarFile) {
            const uploadFormData = new FormData();
            uploadFormData.append('avatar', avatarFile);
            try {
                const uploadResponse = await apiClient.post(`/users/me/avatar`, uploadFormData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                finalAvatarUrl = uploadResponse.data.avatar; // 获取后端返回的新 URL
            } catch (uploadError: any) {
                console.error('头像上传失败:', uploadError);
                // 将头像上传失败视为整体失败
                throw new Error(uploadError.response?.data?.message || '头像上传失败');
            }
        }

        // 2. 准备并校验个人资料数据
        const profileUpdatePayload: Partial<ProfileFormData> = { ...formData }; // 使用 Partial 避免必须包含所有字段
        // 处理空生日：如果为空字符串，从对象中删除，避免发送空值给后端
        if (!profileUpdatePayload.birthday) {
            delete profileUpdatePayload.birthday;
        } else {
            // 可选：确保生日格式正确 (如果需要)
            // const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
            // if (!dateRegex.test(profileUpdatePayload.birthday)) {
            //     throw new Error("生日格式不正确 (应为 YYYY-MM-DD)");
            // }
        }

        // 必填字段校验
        if (!profileUpdatePayload.realname?.trim()) {
            throw new Error("真实姓名不能为空。");
        }
        if (!profileUpdatePayload.email?.trim()) {
            throw new Error("邮箱不能为空。");
        }
        // 可选：手机号格式校验
        const phoneRegex = /^1[3-9]\d{9}$/;
        if (profileUpdatePayload.phone && !phoneRegex.test(profileUpdatePayload.phone)) {
            throw new Error("请输入有效的手机号码。");
        }

        // 3. 发送更新个人资料请求
        const profileResponse = await apiClient.patch('/users/me/profile', profileUpdatePayload);

        // 4. 调用成功回调，传递更新后的数据 (包括可能更新的头像 URL)
        onSuccess({ ...profileResponse.data, avatar: finalAvatarUrl });

    } catch (err: any) {
      // 捕获所有错误 (包括上传、校验、请求)
      console.error('保存资料失败:', err);
      const errorMessage = err.response?.data?.message || err.message || '保存失败，请检查输入或稍后重试。';
      setError(errorMessage); // 在表单内显示错误
      onError(errorMessage); // 通知父组件错误
    } finally {
      setLoading(false); // 通知父组件加载结束
    }
  }, [avatarFile, formData, initialData.avatar, onError, onSuccess, setLoading]); // 添加依赖

  // --- 使用 useImperativeHandle 暴露 submit 方法给父组件 ---
  useImperativeHandle(submitRef, () => ({
      submit: handleSubmit
  }), [handleSubmit]); // 依赖 handleSubmit

  // --- 性别选项 ---
  const genderOptions = [
    { value: 'male', label: '男' },
    { value: 'female', label: '女' },
    // { value: 'other', label: '其他' }, // 如果需要可以取消注释
  ];

  // --- 渲染表单 ---
  return (
    // 不再需要 Form 的 onSubmit 属性
    <div className="edit-profile-form">
      {/* 显示表单内部错误 */}
      {error && <div className="form-error-message">{error}</div>}

      {/* 头像上传组件 */}
      <AvatarUpload
         currentAvatar={avatarPreview}
         onChange={handleAvatarChange}
         label="更换头像"
      />

      {/* 表单字段 */}
      <InputField
        name="nickname"
        label="昵称"
        value={formData.nickname || ''}
        onChange={handleInputChange}
        placeholder="设置一个昵称"
        maxLength={50}
        // disabled 状态由父组件通过 Modal 控制
      />
      <InputField
        name="realname"
        label="真实姓名"
        value={formData.realname}
        onChange={handleInputChange}
        required // 标记为必填 (视觉上)
        maxLength={50}
      />
       <RadioGroup
         name="gender"
         label="性别"
         options={genderOptions}
         value={formData.gender}
         onChange={handleInputChange}
         layout="button" // 或 'standard'
         required
       />
       <InputField
         name="birthday"
         label="生日"
         type="date" // 使用浏览器原生日期选择器
         value={formData.birthday || ''}
         onChange={handleInputChange}
         // 可以设置 max 属性为今天，防止选择未来日期
         max={new Date().toISOString().split("T")[0]}
       />
       <InputField
         name="email"
         label="邮箱"
         type="email"
         value={formData.email}
         onChange={handleInputChange}
         required
         maxLength={100}
       />
       <InputField
         name="phone"
         label="手机号"
         type="tel"
         value={formData.phone ?? ''} // 处理 null 或 undefined
         onChange={handleInputChange}
         // required // 根据业务需求决定手机号是否必填
         maxLength={11}
         pattern="^1[3-9]\d{9}$" // 前端简单格式校验
         placeholder="请输入11位手机号"
       />

      {/* --- 内部按钮已移除 --- */}
    </div>
  );
};

export default EditProfileForm;