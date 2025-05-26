import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Form, Spin, Alert } from 'antd'
import apiClient from '@/lib/axios'
import NoticeForm from './NoticeForm'
import dayjs from 'dayjs'

const NotificationEditView: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    apiClient
      .get(`/informs/${id}`)
      .then((res) => {
        const info = res.data.data || res.data // 根据后端返回结构调整
        const initial = {
          ...info,
          deadline: info.deadline ? dayjs(info.deadline) : undefined,
          scopeType:
            info.targetScope === 'SPECIFIC_USERS'
              ? undefined
              : info.targetScope.toLowerCase(),
          objectType: info.userTypeFilter ?? undefined,
          specificUserIds:
            info.targetScope === 'SPECIFIC_USERS' ? info.targetUsers : [],
        }
        setData(info)
        form.setFieldsValue(initial)
      })
      .catch((err) => {
        setError(err.response?.data?.message || '加载失败')
      })
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <Spin size="large" style={{ margin: 50 }} />
  if (error)
    return <Alert type="error" message={error} style={{ margin: 20 }} />

  return (
    <div style={{ padding: 16 }}>
      <NoticeForm status={data.status} formInstance={form} />
    </div>
  )
}

export default NotificationEditView
