import React, { useEffect, useState } from 'react'
import {
  Form,
  Input,
  Select,
  DatePicker,
  Checkbox,
  Button,
  Upload,
  Row,
  Col,
  Radio, // Added Radio
  Tag,
  FormInstance,
  message,
  Space,
} from 'antd'
import { UploadOutlined, UserOutlined } from '@ant-design/icons' // Added UserOutlined
import apiClient, { BackendStandardResponse } from '@/lib/axios'
import { showMessage } from '@/components/Message/MessageContainer'
import SelectUsersModal, {
  User as ModalUser,
} from '../../components/Modal/SelectUsersModal/SelectUsersModal' // Added
import { useNavigate } from 'react-router-dom'

const { Option } = Select
const { TextArea } = Input

interface UserRole {
  // This can be removed if ModalUser is used or a more general User type is defined/imported
  code: string
  name: string
}

// Define types for scope and object selections
type ScopeType =
  | 'college'
  | 'managed_classes'
  | 'major'
  | 'role'
  | 'specific_users'

interface NoticeFormProps {
  formInstance: FormInstance
  status?: 'draft' | 'published' | 'archived'
}

const NoticeForm: React.FC<NoticeFormProps> = ({ formInstance, status }) => {
  const [senderIdentities, setSenderIdentities] = useState<
    { id: string; name: string }[]
  >([])
  const [audienceSelectionMode, setAudienceSelectionMode] = useState<
    'scope' | 'specific_users'
  >('scope')
  const [isSelectUsersModalVisible, setIsSelectUsersModalVisible] =
    useState(false) // Added
  const [selectedUsers, setSelectedUsers] = useState<ModalUser[]>([])
  const [isSavingDraft, setIsSavingDraft] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const navigate = useNavigate()

  const isNew = !status
  const isDraft = status === 'draft'
  const isPublished = status === 'published'
  const isArchived = status === 'archived'

  const id = isNew ? undefined : formInstance.getFieldValue('_id')

  // 获取发布者身份列表
  useEffect(() => {
    const fetchSenderIdentities = async () => {
      try {
        const response = await apiClient.get<
          BackendStandardResponse<UserRole[]>
        >('/roles/mine/sendable')

        if (response && response.data) {
          // 确保 response.data 存在且不为 null
          // @ts-ignore
          const formattedIdentities = response.data.map((role: UserRole) => ({
            id: role.code,
            name: role.name,
          }))
          setSenderIdentities(formattedIdentities)
        } else {
          // 如果 response.data 为 null 或 undefined，但请求成功（例如后端返回了空数组的成功响应）
          // 或者是拦截器处理后，data 结构不符合预期
          setSenderIdentities([]) // 设置为空数组或根据业务逻辑处理
          console.warn(
            'Received success response but data is null or undefined for sender identities.'
          )
        }
      } catch (error: any) {
        console.error('Failed to fetch sender identities:', error)
        showMessage.error('获取发布者身份失败，请稍后再试。')
      }
    }

    fetchSenderIdentities()
  }, [])

  // 初始化表单
  useEffect(() => {
    const ids: string[] = formInstance.getFieldValue('specificUserIds') || []
    if (ids.length > 0) {
      setAudienceSelectionMode('specific_users')
      // 如果需要显示用户名，批量请求一下用户信息
      // apiClient
      //   .post<{ data: ModalUser[] }>('/users/batch', { ids })
      //   .then((res) => setSelectedUsers(res.data.data))
    }
  }, [])

  const scopeTypeOptions = [
    { value: 'college' as ScopeType, label: '所在学院' },
    { value: 'managed_classes' as ScopeType, label: '管理班级' },
    { value: 'major' as ScopeType, label: '专业' },
    { value: 'role' as ScopeType, label: '角色' },
    // { value: 'specific_users' as ScopeType, label: '特定用户' }, // Removed, now a mode
  ]

  const handleCancel = () => {
    if (isNew) {
      navigate('/notifications')
    } else {
      navigate(-1)
    }
  }

  // 处理受众选择模式变化
  const handleAudienceSelectionModeChange = (e: any) => {
    const newMode = e.target.value
    setAudienceSelectionMode(newMode)
    // Clear form fields of the other mode when switching and set defaults for the new mode
    if (newMode === 'scope') {
      formInstance.setFieldsValue({
        specificUserIds: [], // Clear specific users
        scopeType: 'college', // Default scope type
        objectType: 'students', // Default object type
      })
      setSelectedUsers([]) // Added: Clear selected user objects
    } else {
      // newMode === 'specific_users'
      formInstance.setFieldsValue({
        scopeType: undefined, // Clear scope type
        objectType: undefined, // Clear object type
        specificUserIds: [], // Ensure specificUserIds is an array for the form item
      })
      setSelectedUsers([]) // Added: Clear selected user objects
    }
  }

  // 点击“选择具体用户”按钮时的处理函数
  const handleOpenSelectUsersModal = () => {
    setIsSelectUsersModalVisible(true) // Updated
  }

  // 首先添加一个处理表单数据的通用函数
  const prepareNoticeData = (
    values: any,
    audienceSelectionMode: 'scope' | 'specific_users',
    selectedUsers: ModalUser[]
  ) => {
    const noticeData: any = {
      title: values.title,
      content: values.content,
      description: values.description,
      importance: values.importance || 'low',
      allowReplies:
        values.allowComments === undefined ? true : values.allowComments,
      attachments: values.attachments
        ? values.attachments.map((att: any) => ({
            fileName: att.name,
            url: att.response?.url || att.url,
            status: att.status,
          }))
        : [],
      targetScope: '',
      targetIds: [],
      userTypeFilter: null,
      // needsFeedback: values.needsFeedback || false,
      // needsConfirmation: values.needsConfirmation || false,
    }

    // 处理截止日期
    if (values.deadline) {
      if (
        typeof values.deadline.isValid === 'function' &&
        values.deadline.isValid() &&
        typeof values.deadline.toISOString === 'function'
      ) {
        noticeData.deadline = values.deadline.toISOString()
      }
    }

    // 处理目标受众
    if (audienceSelectionMode === 'specific_users') {
      noticeData.targetScope = 'SPECIFIC_USERS'
      noticeData.targetIds = selectedUsers.map((u) => u.id) || []
    } else {
      // 范围选择模式 - 简化处理
      noticeData.targetScope = 'ALL' // 默认发送给所有人
      noticeData.userTypeFilter = values.objectType || 'all'
    }

    // 处理标签
    if (values.tags && Array.isArray(values.tags) && values.tags.length > 0) {
      noticeData.tags = values.tags
    }

    // 清理未定义的属性
    Object.keys(noticeData).forEach((key) => {
      if (noticeData[key] === undefined) {
        delete noticeData[key]
      }
      if (key === 'attachments' && !noticeData[key]) {
        noticeData[key] = []
      }
    })

    return noticeData
  }

  // 点击“存为草稿”按钮时的处理函数
  const handleSaveDraftClick = () => {
    formInstance
      .validateFields()
      .then((values: any) => {
        const draftData = prepareNoticeData(
          values,
          audienceSelectionMode,
          selectedUsers
        )
        console.log('保存草稿时发送的数据:', draftData)
        handleSaveDraft(draftData)
      })
      .catch((errorInfo: any) => {
        console.log('表单验证失败:', errorInfo)
        message.error('请检查表单填写是否完整正确！')
      })
  }

  // 保存为草稿
  const handleSaveDraft = async (draftData: any) => {
    setIsSavingDraft(true)
    try {
      const response = await apiClient.post('/informs/draft', draftData)
      message.success('草稿保存成功!')
      // 可选：保存成功后返回列表或清空表单
      if (isNew) {
        navigate(`/notifications/edit/${response.data._id}`)
      }
    } catch (error: any) {
      console.error('Failed to save draft:', error)
      let errorMessage = '草稿保存失败，请稍后再试。'
      if (error.response?.data?.message) {
        if (Array.isArray(error.response.data.message)) {
          errorMessage = error.response.data.message.join('; ')
        } else {
          errorMessage = error.response.data.message
        }
      }
      message.error(errorMessage)
    } finally {
      setIsSavingDraft(false)
    }
  }

  // 发布通知
  const handlePublish = async (values: any) => {
    setIsSubmitting(true)
    try {
      const noticeData = prepareNoticeData(
        values,
        audienceSelectionMode,
        selectedUsers
      )
      console.log('发布通知时发送的数据:', noticeData)

      if (id) {
        // 如果已有ID，说明是编辑现有草稿，直接发布
        await apiClient.post(`/informs/${id}/publish`)
        message.success('通知发布成功!')
        navigate('/notifications/my-created')
      } else {
        // 如果是新建，先创建草稿，再发布
        const draftResponse = await apiClient.post('/informs/draft', noticeData)
        const createdDraftId = draftResponse.data.data._id

        // 然后发布这个草稿
        await apiClient.post(`/informs/${createdDraftId}/publish`)
        message.success('通知发布成功!')
        navigate('/notifications/my-created')
      }
    } catch (error: any) {
      console.error('Failed to publish notice:', error)
      let errorMessage = '通知发布失败，请稍后再试。'
      if (error.response?.data?.message) {
        if (Array.isArray(error.response.data.message)) {
          errorMessage = error.response.data.message.join('; ')
        } else {
          errorMessage = error.response.data.message
        }
      }
      message.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  // 处理选择用户的操作
  const handleSelectUsersOk = (usersFromModal: ModalUser[]) => {
    setSelectedUsers(usersFromModal)
    formInstance.setFieldsValue({
      specificUserIds: usersFromModal.map((u) => u.id),
    })
    formInstance.validateFields(['specificUserIds'])
    setIsSelectUsersModalVisible(false)
  }

  // 处理取消选择用户的操作
  const handleSelectUsersCancel = () => {
    setIsSelectUsersModalVisible(false)
  }

  // 处理删除已选择的用户
  const handleRemoveSelectedUser = (userIdToRemove: string) => {
    const newSelectedUsers = selectedUsers.filter(
      (user) => user.id !== userIdToRemove
    )
    setSelectedUsers(newSelectedUsers)
    formInstance.setFieldsValue({
      specificUserIds: newSelectedUsers.map((u) => u.id),
    })
    formInstance.validateFields(['specificUserIds'])
  }

  // 处理删除草稿
  const handleDeleteDraft = async () => {
    apiClient
      .delete(`/informs/${id}`)
      .then(() => {
        message.success('已删除')
        navigate(-1)
      })
      .catch(() => message.error('删除失败'))
  }

  // 撤销已发布的通知
  const handleRevokePublished = async () => {
    try {
      await apiClient.post(`/informs/${id}/revoke`)
      message.success('已撤销发布')
      navigate(-1)
    } catch {
      message.error('撤销失败')
    }
  }

  // 归档已发布的通知
  const handleArchived = async () => {
    try {
      await apiClient.post(`/informs/${id}/archive`)
      message.success('已归档')
      navigate(-1)
    } catch {
      message.error('归档失败')
    }
  }

  return (
    <Form
      form={formInstance}
      layout="vertical"
      name="publish_notice_form"
      onFinish={handlePublish}
      disabled={isArchived}
    >
      {!(isPublished || isArchived) && (
        <>
          <Form.Item
            name="senderIdentity"
            label="发布者身份"
            rules={[{ required: true, message: '请选择发布者身份!' }]}
          >
            <Select placeholder="选择发布者身份">
              {senderIdentities.map((identity) => (
                <Option key={identity.id} value={identity.id}>
                  {identity.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label="目标受众" required style={{ marginBottom: '8px' }}>
            <Radio.Group
              onChange={handleAudienceSelectionModeChange}
              value={audienceSelectionMode}
            >
              <Radio value="scope">按范围选择</Radio>
              <Radio value="specific_users">选择特定用户</Radio>
            </Radio.Group>
          </Form.Item>

          {audienceSelectionMode === 'scope' && (
            <Row gutter={16} style={{ marginTop: 0 }}>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="scopeType"
                  label="范围类型"
                  // initialValue={'college'} // Set via handleAudienceSelectionModeChange
                  rules={[
                    {
                      required: audienceSelectionMode === 'scope',
                      message: '请选择范围类型!',
                    },
                  ]}
                >
                  <Select placeholder="选择范围类型">
                    {scopeTypeOptions.map((option) => (
                      <Option key={option.value} value={option.value}>
                        {option.label}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="objectType"
                  label="对象类型"
                  // initialValue="students" // Set via handleAudienceSelectionModeChange
                  rules={[
                    {
                      required: audienceSelectionMode === 'scope',
                      message: '请选择对象类型!',
                    },
                  ]}
                >
                  <Select placeholder="选择对象类型">
                    <Option value="all">所有用户</Option>
                    <Option value="students">学生</Option>
                    <Option value="staff">教职工</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
          )}

          {audienceSelectionMode === 'specific_users' && (
            <Row gutter={16} style={{ marginTop: '16px' }}>
              <Col span={24}>
                <Form.Item
                  name="specificUserIds"
                  // label prop removed to allow custom layout for asterisk and button
                  rules={[
                    {
                      required: audienceSelectionMode === 'specific_users',
                      validator: async (_, value) => {
                        if (
                          audienceSelectionMode === 'specific_users' &&
                          (!value || value.length === 0)
                        ) {
                          return Promise.reject(new Error('请选择具体用户!'))
                        }
                        return Promise.resolve()
                      },
                    },
                  ]}
                >
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    {audienceSelectionMode === 'specific_users' && (
                      <span
                        style={{
                          color: 'red',
                          marginRight: '4px',
                          fontSize: '14px',
                        }}
                      >
                        *
                      </span>
                    )}
                    <Button
                      onClick={handleOpenSelectUsersModal}
                      icon={<UserOutlined />}
                    >
                      选择具体用户
                    </Button>
                  </div>
                  {/* Display selected users using Ant Design Tags */}
                  {audienceSelectionMode === 'specific_users' &&
                    selectedUsers.length > 0 && (
                      <div style={{ marginTop: '8px' }}>
                        {selectedUsers.map((user) => (
                          <Tag
                            key={user.id}
                            closable
                            onClose={() => handleRemoveSelectedUser(user.id)}
                            style={{
                              marginRight: '4px',
                              marginBottom: '4px',
                              marginTop: '4px',
                            }}
                          >
                            {user.name}
                          </Tag>
                        ))}
                      </div>
                    )}
                </Form.Item>
              </Col>
            </Row>
          )}
        </>
      )}

      <Form.Item
        name="title"
        label="标题"
        rules={[{ required: true, message: '请输入通知标题!' }]}
      >
        <Input placeholder="输入通知标题" />
      </Form.Item>

      <Form.Item
        name="description"
        label="摘要/描述 (可选)"
        rules={[{ max: 250, message: '摘要内容不能超过250个字符' }]}
      >
        <TextArea
          rows={2}
          placeholder="输入通知的简短摘要或描述，将显示在列表视图中"
        />
      </Form.Item>

      <Form.Item
        name="content"
        label="正文内容"
        rules={[{ required: true, message: '请输入通知正文内容!' }]}
      >
        <TextArea rows={6} placeholder="输入通知的详细内容" />
      </Form.Item>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="tags" label="标签">
            <Select mode="tags" placeholder="输入并按回车添加标签"></Select>
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="importance"
            label="重要程度"
            rules={[{ required: true, message: '请选择重要程度!' }]}
          >
            <Select placeholder="选择重要程度">
              <Option value="high">紧急</Option>
              <Option value="medium">重要</Option>
              <Option value="low">一般</Option>
            </Select>
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="deadline" label="截止日期">
            <DatePicker style={{ width: '100%' }} placeholder="选择截止日期" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="attachments" label="附件">
            <Upload beforeUpload={() => false} listType="picture">
              <Button icon={<UploadOutlined />}>上传附件</Button>
            </Upload>
          </Form.Item>
        </Col>
      </Row>

      {/* <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="needsFeedback" valuePropName="checked">
            <Checkbox>需要反馈</Checkbox>
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="needsConfirmation" valuePropName="checked">
            <Checkbox>需要确认已读</Checkbox>
          </Form.Item>
        </Col>
      </Row> */}

      <Form.Item>
        <Space>
          <Button disabled={false} onClick={handleCancel}>
            {isNew ? '取消' : '返回'}
          </Button>
          {(isNew || isDraft) && (
            <>
              <Button onClick={handleSaveDraftClick} loading={isSavingDraft}>
                存为草稿
              </Button>
              <Button type="primary" htmlType="submit" loading={isSubmitting}>
                发布
              </Button>
            </>
          )}
          {isDraft && (
            <>
              <Button danger onClick={handleDeleteDraft}>
                删除
              </Button>
            </>
          )}
          {isPublished && (
            <>
              <Button onClick={handleRevokePublished}>撤销</Button>
              <Button onClick={handleArchived}>归档</Button>
            </>
          )}
        </Space>
      </Form.Item>
      <SelectUsersModal
        visible={isSelectUsersModalVisible}
        onOk={handleSelectUsersOk}
        onCancel={handleSelectUsersCancel}
        initialSelectedUsers={selectedUsers}
      />
    </Form>
  )
}

export default NoticeForm
