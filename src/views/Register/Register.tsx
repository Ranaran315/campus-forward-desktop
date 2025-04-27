// src/views/RegisterPage/RegisterPage.tsx
import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import apiClient from '../../lib/axios'
import type { RegisterFormData } from '../../types/user.types' // 导入类型
import type { RegisterResponse } from '../../types/auth.types' // 导入类型
import './Register.css'

function RegisterPage() {
  const [formData, setFormData] = useState<RegisterFormData>({
    userType: 'student',
    identifier: '',
    password: '',
    realname: '',
    gender: 'male',
    departmentInfo: { departmentId: '', departmentName: '' },
    email: '',
    phone: '',
    classInfo: { classId: '', className: '' }, // 初始化以避免未定义错误
    staffInfo: { titles: [], officeLocation: '', managedClassIds: [] }, // 初始化
  })
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  // 通用输入处理
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  // 处理嵌套对象输入
  const handleNestedChange = (
    outerKey: keyof RegisterFormData,
    innerKey: string,
    value: string | string[]
  ) => {
    setFormData((prev) => ({
      ...prev,
      [outerKey]: { ...(prev[outerKey] as object), [innerKey]: value },
    }))
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (formData.password !== confirmPassword) {
      setError('两次输入的密码不一致')
      return
    }
    setError(null)
    setLoading(true)

    // 准备提交的数据，移除确认密码，清理可选对象
    const submitData: Partial<RegisterFormData> & { password: string } = {
      ...formData,
    }
    if (submitData.userType === 'student') {
      delete submitData.staffInfo // 学生不需要 staffInfo
      if (!submitData.classInfo?.classId || !submitData.classInfo?.className) {
        setError('学生必须提供完整的班级信息')
        setLoading(false)
        return
      }
    } else {
      // staff
      delete submitData.classInfo // 教职工不需要 classInfo
      // staffInfo 可选，但如果提供了部分，要确保结构完整
      submitData.staffInfo = submitData.staffInfo || {}
    }

    try {
      const response = await apiClient.post<RegisterResponse>(
        '/auth/register',
        submitData
      )
      console.log('注册成功:', response.data)
      alert('注册成功！请返回登录。')
      navigate('/login') // 跳转到登录页
    } catch (err: any) {
      console.error('注册出错:', err)
      if (err.response && err.response.data?.message) {
        if (Array.isArray(err.response.data.message)) {
          setError(`注册失败: ${err.response.data.message.join(', ')}`)
        } else {
          setError(`注册失败: ${err.response.data.message}`)
        }
      } else {
        setError('注册失败，请检查输入或联系管理员')
      }
    } finally {
      setLoading(false)
    }
  }

  // --- JSX ---
  return (
    <div /* className="register-container" */ style={styles.container}>
      <h2 style={styles.title}>用户注册</h2>
      <form onSubmit={handleSubmit} style={styles.form}>
        {/* 用户类型 */}
        <div style={styles.inputGroup}>
          <label htmlFor="userType" style={styles.label}>
            用户类型:
          </label>
          <select
            name="userType"
            id="userType"
            value={formData.userType}
            onChange={handleChange}
            disabled={loading}
            style={styles.input}
          >
            <option value="student">学生</option>
            <option value="staff">教职工</option>
          </select>
        </div>
        {/* 学号/工号 */}
        <div style={styles.inputGroup}>
          <label htmlFor="identifier" style={styles.label}>
            {formData.userType === 'student' ? '学号:' : '工号:'}
          </label>
          <input
            type="text"
            name="identifier"
            id="identifier"
            value={formData.identifier}
            onChange={handleChange}
            required
            disabled={loading}
            style={styles.input}
          />
        </div>
        {/* 真实姓名 */}
        <div style={styles.inputGroup}>
          <label htmlFor="realname" style={styles.label}>
            真实姓名:
          </label>
          <input
            type="text"
            name="realname"
            id="realname"
            value={formData.realname}
            onChange={handleChange}
            required
            disabled={loading}
            style={styles.input}
          />
        </div>
        {/* 昵称 */}
        <div style={styles.inputGroup}>
          <label htmlFor="nickname" style={styles.label}>
            昵称:
          </label>
          <input
            type="text"
            name="nickname"
            id="nickname"
            value={formData.nickname || ''}
            onChange={handleChange}
            disabled={loading}
            style={styles.input}
          />
        </div>
        {/* 密码 */}
        <div style={styles.inputGroup}>
          <label htmlFor="password" style={styles.label}>
            密码:
          </label>
          <input
            type="password"
            name="password"
            id="password"
            value={formData.password}
            onChange={handleChange}
            required
            minLength={6}
            disabled={loading}
            style={styles.input}
          />
        </div>
        {/* 确认密码 */}
        <div style={styles.inputGroup}>
          <label htmlFor="confirmPassword" style={styles.label}>
            确认密码:
          </label>
          <input
            type="password"
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={6}
            disabled={loading}
            style={styles.input}
          />
        </div>
        {/* 性别 */}
        <div style={styles.inputGroup}>
          <label htmlFor="gender" style={styles.label}>
            性别:
          </label>
          <select
            name="gender"
            id="gender"
            value={formData.gender}
            onChange={handleChange}
            required
            disabled={loading}
            style={styles.input}
          >
            <option value="male">男</option>
            <option value="female">女</option>
            <option value="other">其他</option>
          </select>
        </div>
        {/* 邮箱 */}
        <div style={styles.inputGroup}>
          <label htmlFor="contactInfo.email" style={styles.label}>
            邮箱:
          </label>
          <input
            type="email"
            name="contactInfo.email"
            id="contactInfo.email"
            value={formData.email}
            onChange={handleChange}
            required
            disabled={loading}
            style={styles.input}
          />
        </div>
        {/* 电话 (可选) */}
        <div style={styles.inputGroup}>
          <label htmlFor="contactInfo.phone" style={styles.label}>
            电话:
          </label>
          <input
            type="tel"
            name="contactInfo.phone"
            id="contactInfo.phone"
            value={formData.phone || ''}
            onChange={handleChange}
            disabled={loading}
            style={styles.input}
          />
        </div>
        {/* 学院信息 */}
        <div style={styles.inputGroup}>
          <label htmlFor="departmentInfo.departmentId" style={styles.label}>
            学院ID:
          </label>
          <input
            type="text"
            name="departmentInfo.departmentId"
            id="departmentInfo.departmentId"
            value={formData.departmentInfo.departmentId}
            onChange={handleChange}
            required
            disabled={loading}
            style={styles.input}
          />
        </div>
        <div style={styles.inputGroup}>
          <label htmlFor="departmentInfo.departmentName" style={styles.label}>
            学院名称:
          </label>
          <input
            type="text"
            name="departmentInfo.departmentName"
            id="departmentInfo.departmentName"
            value={formData.departmentInfo.departmentName}
            onChange={handleChange}
            required
            disabled={loading}
            style={styles.input}
          />
        </div>

        {/* 学生信息 */}
        {formData.userType === 'student' && (
          <>
            <div style={styles.inputGroup}>
              <label htmlFor="classInfo.classId" style={styles.label}>
                班级ID:
              </label>
              <input
                type="text"
                id="classInfo.classId"
                value={formData.classInfo?.classId || ''}
                onChange={(e) =>
                  handleNestedChange('classInfo', 'classId', e.target.value)
                }
                required={formData.userType === 'student'}
                disabled={loading}
                style={styles.input}
              />
            </div>
            <div style={styles.inputGroup}>
              <label htmlFor="classInfo.className" style={styles.label}>
                班级名称:
              </label>
              <input
                type="text"
                id="classInfo.className"
                value={formData.classInfo?.className || ''}
                onChange={(e) =>
                  handleNestedChange('classInfo', 'className', e.target.value)
                }
                required={formData.userType === 'student'}
                disabled={loading}
                style={styles.input}
              />
            </div>
          </>
        )}

        {/* 教职工信息 (简单示例) */}
        {formData.userType === 'staff' && (
          <div style={styles.inputGroup}>
            <label htmlFor="staffInfo.officeLocation" style={styles.label}>
              办公地点:
            </label>
            <input
              type="text"
              id="staffInfo.officeLocation"
              value={formData.staffInfo?.officeLocation || ''}
              onChange={(e) =>
                handleNestedChange(
                  'staffInfo',
                  'officeLocation',
                  e.target.value
                )
              }
              disabled={loading}
              style={styles.input}
            />
          </div>
          // 职称(titles)等可能需要更复杂的输入组件
        )}

        {/* 错误提示 */}
        {error && (
          <p
            style={{ color: 'red', textAlign: 'center', marginBottom: '10px' }}
          >
            {error}
          </p>
        )}
        {/* 按钮 */}
        <button type="submit" disabled={loading} style={styles.button}>
          {loading ? '注册中...' : '注 册'}
        </button>
      </form>
      <p style={{ textAlign: 'center', marginTop: '15px' }}>
        已有账户？ <Link to="/login">返回登录</Link>
      </p>
    </div>
  )
}

// --- 使用和 LoginPage 相同的简单样式 ---
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    maxWidth: '450px',
    margin: '30px auto',
    padding: '30px',
    border: '1px solid #ccc',
    borderRadius: '5px',
    backgroundColor: '#f9f9f9',
  },
  title: { textAlign: 'center', marginBottom: '25px' },
  form: { display: 'flex', flexDirection: 'column' },
  inputGroup: { marginBottom: '12px' },
  label: {
    marginBottom: '4px',
    display: 'block',
    fontWeight: 'bold',
    fontSize: '14px',
  },
  input: {
    width: '100%',
    padding: '10px',
    border: '1px solid #ccc',
    borderRadius: '3px',
    boxSizing: 'border-box',
  },
  button: {
    padding: '10px 15px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '3px',
    cursor: 'pointer',
    fontSize: '16px',
    marginTop: '10px',
  },
}

export default RegisterPage
