// src/views/RegisterPage/RegisterPage.tsx
import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import apiClient from '../../lib/axios' // 确认路径正确
import type { RegisterFormData } from '../../types/user.types' // 更新后的类型
import type { RegisterResponse } from '../../types/auth.types' // 确认路径和类型正确
import { Form, InputField, RadioGroup } from '@/components/Form/Form' // 引入你的组件
import CustomTitlebar from '@/components/CustomTitlebar/CustomTitlebar'
import Button from '@/components/Button/Button' // 假设你有一个 Button 组件
import './Register.css'

// 总步骤数 (根据你的设计调整)
const TOTAL_STEPS = 6

function RegisterPage() {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState<Partial<RegisterFormData>>({
    userType: 'student',
    gender: 'male', // 默认值
    departmentInfo: { departmentId: '', departmentName: '' }, // 初始化嵌套对象
    classInfo: { classId: '', className: '' },
    staffInfo: { titles: [], officeLocation: '', managedClassIds: [] },
    email: '', // 初始化顶层字段
    phone: '',
  })
  const [password, setPassword] = useState('') // 单独管理密码输入
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  // --- 处理函数 ---
  const handleNext = () => {
    setError(null) // 清除错误
    // --- 在进入下一步前进行当前步骤的简单校验 ---
    if (step === 1 && !formData.userType) {
      setError('请选择用户类型')
      return
    }
    if (step === 2) {
      if (!formData.identifier) {
        setError('请输入学号或工号')
        return
      }
      if (!password || password.length < 6) {
        setError('密码长度不能少于6位')
        return
      }
      if (password !== confirmPassword) {
        setError('两次输入的密码不一致')
        return
      }
    }
    if (step === 3 && !formData.realname) {
      setError('请输入真实姓名')
      return
    }
    if (step === 4) {
      if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email)) {
        // 简单邮箱格式检查
        setError('请输入有效的邮箱地址')
        return
      }
    }
    if (
      step === 5 &&
      (!formData.departmentInfo?.departmentId ||
        !formData.departmentInfo?.departmentName)
    ) {
      setError('请填写完整的学院信息')
      return
    }
    if (
      step === 6 &&
      formData.userType === 'student' &&
      (!formData.classInfo?.classId || !formData.classInfo?.className)
    ) {
      setError('学生用户必须填写完整的班级信息')
      return
    }
    // ---------------------------------------------
    if (step < TOTAL_STEPS) {
      setStep((prev) => prev + 1)
    }
  }

  const handleBack = () => {
    setError(null) // 清除错误
    if (step > 1) {
      setStep((prev) => prev - 1)
    }
  }

  const handleChange = (name: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [name]: value.toString() }))
  }

  const handleNestedChange = (
    outerKey: keyof RegisterFormData,
    innerKey: string,
    value: string | string[]
  ) => {
    setFormData((prev) => {
      const currentOuter = prev[outerKey] || {}
      return {
        ...prev,
        [outerKey]: {
          ...(typeof currentOuter === 'object' && currentOuter !== null
            ? currentOuter
            : {}),
          [innerKey]: value,
        },
      }
    })
  }

  // 最终提交
  const handleSubmit = async () => {
    console.log(formData)
    // 最后确认密码一致性
    if (password !== confirmPassword) {
      setError('两次输入的密码不一致')
      setStep(2) // 跳回密码输入步骤
      return
    }
    setError(null)
    setLoading(true)

    // 准备提交的数据，确保包含 password
    const submitData: Partial<RegisterFormData> & { password?: string } = {
      ...formData,
      password: password, // 添加最终确认的密码
    }

    // 清理与用户类型不符的数据
    if (submitData.userType === 'student') delete submitData.staffInfo
    else if (submitData.userType === 'staff') delete submitData.classInfo

    try {
      // 注意：后端期望的 DTO 可能与 RegisterFormData 有细微差别，需要确保一致
      const response = await apiClient.post<RegisterResponse>(
        '/auth/register',
        submitData
      )
      console.log('注册成功:', response.data)
      alert('注册成功！即将跳转到登录页面。')
      navigate('/login')
    } catch (err: any) {
      console.error('注册出错:', err)
      if (err.response?.data?.message) {
        setError(
          Array.isArray(err.response.data.message)
            ? `注册失败: ${err.response.data.message.join(', ')}`
            : `注册失败: ${err.response.data.message}`
        )
      } else {
        setError('注册失败，请稍后重试或联系管理员')
      }
      // 可以根据错误信息判断是否需要跳回之前的步骤
      // if (error related to username/email/id) setStep(2);
    } finally {
      setLoading(false)
    }
  }

  // --- 渲染当前步骤的表单内容 ---
  const renderStepContent = () => {
    switch (step) {
      case 1: // 选择用户类型
        return (
          <RadioGroup
            name="userType"
            options={[
              { value: 'student', label: '学生' },
              { value: 'staff', label: '教职工' },
            ]}
            value={formData.userType || 'student'}
            onChange={handleChange}
            layout="button" // 使用按钮样式
            direction="vertical"
          />
        )
      case 2: // 输入学号/工号和密码
        return (
          <>
            <InputField
              name="identifier"
              label={formData.userType === 'student' ? '学号' : '工号'}
              value={formData.identifier || ''}
              onChange={handleChange}
              required
              placeholder={`请输入${
                formData.userType === 'student' ? '学号' : '工号'
              }`}
            />
            <InputField
              name="password" // 用本地 state 控制
              label="设置密码"
              type="password"
              value={password}
              onChange={(_name, value) => setPassword(value)}
              required
              minLength={6}
              placeholder="请输入至少6位密码"
            />
            <InputField
              name="confirmPassword" // 用本地 state 控制
              label="确认密码"
              type="password"
              value={confirmPassword}
              onChange={(_name, value) => setConfirmPassword(value)}
              required
              minLength={6}
              placeholder="请再次输入密码"
            />
          </>
        )
      case 3: // 真实姓名、昵称、性别
        return (
          <>
            <InputField
              name="realname"
              label="真实姓名"
              placeholder="请输入真实姓名"
              value={formData.realname || ''}
              onChange={handleChange}
              required
            />
            <InputField
              name="nickname"
              label="昵称 (可选)"
              placeholder="默认使用真实姓名"
              value={formData.nickname || ''}
              onChange={handleChange}
            />
            <RadioGroup
              name="gender"
              label="性别"
              options={[
                { value: 'male', label: '男' },
                { value: 'female', label: '女' },
              ]}
              value={formData.gender || 'male'}
              onChange={handleChange}
              layout="standard" // 标准样式
              required
            />
          </>
        )
      case 4: // 联系方式 (Email, Phone)
        return (
          <>
            <InputField
              name="email"
              label="邮箱"
              type="email"
              value={formData.email || ''}
              onChange={handleChange}
              required
              placeholder="请输入常用邮箱"
            />
            <InputField
              name="phone"
              label="手机号 (可选)"
              type="tel"
              value={formData.phone || ''}
              onChange={handleChange}
              placeholder="请输入手机号码"
            />
          </>
        )
      case 5: // 组织信息 (学院)
        return (
          <>
            <InputField
              name="departmentInfo.departmentId" // 使用点表示嵌套
              label="学院 ID"
              value={formData.departmentInfo?.departmentId || ''}
              onChange={(_name, value) =>
                handleNestedChange('departmentInfo', 'departmentId', value)
              }
              required
              placeholder="请输入学院 ID"
            />
            <InputField
              name="departmentInfo.departmentName"
              label="学院名称"
              value={formData.departmentInfo?.departmentName || ''}
              onChange={(_name, value) =>
                handleNestedChange('departmentInfo', 'departmentName', value)
              }
              required
              placeholder="请输入学院全称"
            />
          </>
        )
      case 6: // 特定信息 (班级 或 教职工)
        return (
          <>
            {formData.userType === 'student' && (
              <>
                <InputField
                  name="classInfo.classId"
                  label="班级 ID"
                  value={formData.classInfo?.classId || ''}
                  onChange={(_name, value) =>
                    handleNestedChange('classInfo', 'classId', value)
                  }
                  required={formData.userType === 'student'}
                  placeholder="请输入班级 ID"
                />
                <InputField
                  name="classInfo.className"
                  label="班级名称"
                  value={formData.classInfo?.className || ''}
                  onChange={(_name, value) =>
                    handleNestedChange('classInfo', 'className', value)
                  }
                  required={formData.userType === 'student'}
                  placeholder="请输入班级全称"
                />
              </>
            )}
            {formData.userType === 'staff' && (
              <>
                <InputField
                  name="staffInfo.officeLocation" // 注意 name 属性匹配 handleNestedChange
                  label="办公地点 (可选)"
                  value={formData.staffInfo?.officeLocation || ''}
                  onChange={(_name, value) =>
                    handleNestedChange('staffInfo', 'officeLocation', value)
                  }
                  placeholder="例如：科技楼A栋101"
                />
                {/* 职称 Titles 可能需要更复杂的输入组件 */}
                <div>
                  <label>职称 (可选，可多选，示例)</label>
                  {/* // 这里应该用一个支持多选输入的组件，或者简单的文本框 */}
                  <input
                    type="text"
                    placeholder="例如：教授,辅导员 (用逗号隔开)"
                    onChange={(e) =>
                      handleNestedChange(
                        'staffInfo',
                        'titles',
                        e.target.value
                          .split(',')
                          .map((t) => t.trim())
                          .filter((t) => t)
                      )
                    }
                  />
                </div>
              </>
            )}
          </>
        )
      default:
        return <div>未知步骤</div>
    }
  }

  // --- 渲染主 JSX ---
  return (
    <div className="register-container">
      <CustomTitlebar title="新用户注册" />
      <div className="register-layout">
        {/* Row 1: Step Indicator */}
        <div className="step-indicator">
          步骤 {step} / {TOTAL_STEPS}:{' '}
          {step === 1
            ? '选择您的身份'
            : step === 2
            ? '设置登录信息'
            : step === 3
            ? '填写基本资料'
            : step === 4
            ? '填写联系方式'
            : step === 5
            ? '填写组织信息'
            : step === 6
            ? formData.userType === 'student'
              ? '填写班级信息'
              : '填写教职工信息'
            : ''}
        </div>

        {/* Row 2: Form Content */}
        <Form>
          {renderStepContent()}
          {/* 显示错误信息 */}
          {error && <p className="error-message">{error}</p>}
        </Form>

        {/* Row 3: Navigation Buttons */}
        <div
          className={`navigation-controls ${
            step === 1 || TOTAL_STEPS ? 'step_only' : ''
          }`}
        >
          {step > 1 && (
            <Button onClick={handleBack} disabled={loading}>
              上一步
            </Button>
          )}
          {step < TOTAL_STEPS ? (
            <Button onClick={handleNext} disabled={loading}>
              下一步
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={loading} theme="success">
              {loading ? '注册中...' : '完成注册'}
            </Button>
          )}
        </div>

        {/* Row 4: Back to Login */}
        <div className="back-to-login">
          <Link to="/login">返回登录</Link>
        </div>
      </div>
    </div>
  )
}

export default RegisterPage
