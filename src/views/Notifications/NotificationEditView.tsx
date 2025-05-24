import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Form, Spin, Alert, Button, message, Space } from 'antd'
import apiClient from '@/lib/axios'
import NoticeForm from './NoticeForm'
import dayjs from 'dayjs'

const NotificationEditView: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
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

  const isDraft = data.status === 'draft'
  const isPublished = data.status === 'published'
  const isArchived = data.status === 'archived'
  const readOnly = isPublished || isArchived
  // 发布/保存草稿同之前
  const handlePublish = (vals: any) => {
    /* PUT 发布 */
  }
  const handleSaveDraft = (vals: any) => {
    /* PUT 草稿 */
  }

  // 下面是各状态下的额外操作
  const customButtons = (
    <Space style={{ marginLeft: 8 }}>
      {isDraft && (
        <Button
          danger
          onClick={() => {
            apiClient
              .delete(`/informs/${id}`)
              .then(() => {
                message.success('已删除')
                navigate(-1)
              })
              .catch(() => message.error('删除失败'))
          }}
        >
          删除
        </Button>
      )}
      {isPublished && (
        <>
          <Button
            onClick={() => {
              apiClient
                .post(`/informs/${id}/revoke`)
                .then(() => message.success('已撤销发布'))
                .catch(() => message.error('撤销失败'))
            }}
          >
            撤销发布
          </Button>
          <Button
            onClick={() => {
              apiClient
                .post(`/informs/${id}/archive`)
                .then(() => message.success('已归档'))
                .catch(() => message.error('归档失败'))
            }}
          >
            归档
          </Button>
        </>
      )}
    </Space>
  )

  return (
    <div style={{ padding: 16 }}>
      <NoticeForm
        formInstance={form}
        onCancel={() => navigate(-1)}
        cancelText="返回"
        onPublish={handlePublish}
        onSaveDraft={handleSaveDraft}
        isSubmitting={false}
        isSavingDraft={false}
        readonly={readOnly}
        customFooterButtons={customButtons} // 注入自定义按钮
      />
    </div>
  )
}

export default NotificationEditView
