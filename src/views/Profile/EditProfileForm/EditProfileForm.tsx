// (如果你的文件实际在 components 目录，请相应调整路径注释)
import React, {
  useState,
  useEffect,
  useCallback,
  useImperativeHandle,
  RefObject,
} from 'react'
import { Form, Input, Radio, DatePicker, message } from 'antd'
import { AvatarUploader } from '@/components/FileUpload'
import apiClient from '@/lib/axios'
import dayjs from 'dayjs'
import './EditProfileForm.css'
import { ProfileFormData } from '../Profile.type'
import { showMessage } from '@/components/Message/MessageContainer'

// 组件 Props 定义
interface EditProfileFormProps {
  initialData: ProfileFormData & { avatar?: string }
  onSuccess: (updatedData: ProfileFormData & { avatar?: string }) => void
  setLoading: (loading: boolean) => void
  userId: string
  submitRef?: RefObject<{ submit: () => Promise<void> }>
}

const EditProfileForm: React.FC<EditProfileFormProps> = ({
  initialData,
  onSuccess,
  setLoading,
  userId,
  submitRef,
}) => {
  // Form实例
  const [form] = Form.useForm()

  // State 定义
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    initialData.avatar || null
  )

  // 当 initialData 变化时，更新表单状态
  useEffect(() => {
    form.setFieldsValue({
      nickname: initialData.nickname || '',
      realname: initialData.realname || '',
      gender: initialData.gender || '',
      birthday: initialData.birthday ? dayjs(initialData.birthday) : undefined,
      email: initialData.email || '',
      phone: initialData.phone || '',
    })
    setAvatarPreview(initialData.avatar || null)
    setAvatarFile(null)
  }, [initialData, form])

  // 头像选择变化处理
  const handleAvatarChange = useCallback(
    (file: File | null, previewUrl: string | null) => {
      setAvatarFile(file)
      setAvatarPreview(previewUrl)
    },
    []
  )

  // 核心提交逻辑 (由父组件通过 ref 调用)
  const handleSubmit = useCallback(async () => {
    try {
      // 表单验证
      await form.validateFields()

      setLoading(true)
      const formValues = form.getFieldsValue(true)

      let finalAvatarUrl = initialData.avatar

      // 1. 上传新头像 (如果选择了)
      if (avatarFile) {
        const uploadFormData = new FormData()
        uploadFormData.append('avatar', avatarFile)
        try {
          const uploadResponse = await apiClient.post(
            `/users/me/avatar`,
            uploadFormData,
            {
              headers: { 'Content-Type': 'multipart/form-data' },
            }
          )
          finalAvatarUrl = uploadResponse.data.avatar
        } catch (uploadError: any) {
          console.error('头像上传失败:', uploadError)
          throw new Error(uploadError.response?.data?.message || '头像上传失败')
        }
      }

      // 2. 准备个人资料数据
      const profileUpdatePayload: Partial<ProfileFormData> = {
        ...formValues,
        // 转换日期对象为ISO字符串格式
        birthday: formValues.birthday
          ? formValues.birthday.format('YYYY-MM-DD')
          : undefined,
      }

      // 处理空生日
      if (!profileUpdatePayload.birthday) {
        delete profileUpdatePayload.birthday
      }

      // 3. 发送更新个人资料请求
      const profileResponse = await apiClient.patch(
        '/users/me/profile',
        profileUpdatePayload
      )

      // 4. 调用成功回调
      showMessage.success('保存成功')
      onSuccess({ ...profileResponse.data, avatar: finalAvatarUrl })
    } catch (err: any) {
      console.error('保存资料失败:', err)
      if (err.errorFields) {
        // 表单验证错误
        message.error('请检查表单填写是否正确')
      } else {
        showMessage.error(
          err.message ||
            err.response?.data?.message?.join(',') ||
            '保存失败，请检查输入或稍后重试。'
        )
      }
    } finally {
      setLoading(false)
    }
  }, [avatarFile, initialData.avatar, onSuccess, setLoading, form])

  // 暴露 submit 方法给父组件
  useImperativeHandle(
    submitRef,
    () => ({
      submit: handleSubmit,
    }),
    [handleSubmit]
  )

  return (
    <div className="edit-profile-form">
      {/* 头像上传组件 */}
      <div className="avatar-upload-container">
        <AvatarUploader
          imageUrl={avatarPreview || undefined}
          onFileSelected={handleAvatarChange}
          size={120}
        />
      </div>

      <Form form={form} layout="vertical" requiredMark={true}>
        <Form.Item
          name="nickname"
          label="昵称"
          rules={[{ max: 50, message: '昵称不能超过50个字符' }]}
        >
          <Input placeholder="设置一个昵称" maxLength={50} />
        </Form.Item>

        <Form.Item
          name="realname"
          label="真实姓名"
          rules={[
            { required: true, message: '请输入真实姓名' },
            { max: 50, message: '姓名不能超过50个字符' },
          ]}
        >
          <Input maxLength={50} />
        </Form.Item>

        <Form.Item
          name="gender"
          label="性别"
          rules={[{ required: true, message: '请选择性别' }]}
        >
          <Radio.Group>
            <Radio value="male">男</Radio>
            <Radio value="female">女</Radio>
          </Radio.Group>
        </Form.Item>

        <Form.Item name="birthday" label="生日">
          <DatePicker
            style={{ width: '100%' }}
            disabledDate={(current) =>
              current && current > dayjs().endOf('day')
            }
          />
        </Form.Item>

        <Form.Item
          name="email"
          label="邮箱"
          rules={[
            { required: true, message: '请输入邮箱地址' },
            { type: 'email', message: '请输入有效的邮箱地址' },
            { max: 100, message: '邮箱不能超过100个字符' },
          ]}
        >
          <Input type="email" maxLength={100} />
        </Form.Item>

        <Form.Item
          name="phone"
          label="手机号"
          rules={[
            { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号码' },
          ]}
        >
          <Input type="tel" maxLength={11} placeholder="请输入11位手机号" />
        </Form.Item>
      </Form>
    </div>
  )
}

export default EditProfileForm
