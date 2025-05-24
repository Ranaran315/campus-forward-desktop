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
} from 'antd'
import { UploadOutlined, UserOutlined } from '@ant-design/icons' // Added UserOutlined
import apiClient, { BackendStandardResponse } from '@/lib/axios'
import { showMessage } from '@/components/Message/MessageContainer'
import SelectUsersModal, {
  User as ModalUser,
} from '../../components/Modal/SelectUsersModal/SelectUsersModal' // Added

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
  onCancel: () => void
  onPublish: (values: any) => void
  isSubmitting?: boolean
  readonly?: boolean
  customFooterButtons?: React.ReactNode
  cancelText?: string
}

const NoticeForm: React.FC<NoticeFormProps> = ({
  formInstance,
  onCancel,
  onPublish,
  isSubmitting = false,
  readonly = false,
  customFooterButtons,
  cancelText,
}) => {
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

  const scopeTypeOptions = [
    { value: 'college' as ScopeType, label: '所在学院' },
    { value: 'managed_classes' as ScopeType, label: '管理班级' },
    { value: 'major' as ScopeType, label: '专业' },
    { value: 'role' as ScopeType, label: '角色' },
    // { value: 'specific_users' as ScopeType, label: '特定用户' }, // Removed, now a mode
  ]

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

  const handleOpenSelectUsersModal = () => {
    setIsSelectUsersModalVisible(true) // Updated
  }

  // 点击“存为草稿”按钮时的处理函数
  const handleSaveDraftClick = () => {
    formInstance
      .validateFields()
      .then((values) => {
        console.log('Form values before processing for draft:', values)

        const draftData: any = {
          title: values.title,
          content: values.content,
          description: values.description, // Added description
          importance: values.importance,
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
        }

        // 截止日期：如果表单提供了 deadline 值，则转换为 ISO 字符串；否则省略该字段
        if (values.deadline) {
          console.log(
            'Type of values.deadline before toISOString:',
            typeof values.deadline
          ) // 新增日志：记录 deadline 类型
          // values.deadline 应该是 Ant Design DatePicker 返回的 Moment 对象
          // 检查它是否是一个有效的日期对象并且有 toISOString 方法
          if (
            typeof values.deadline.isValid === 'function' &&
            values.deadline.isValid() &&
            typeof values.deadline.toISOString === 'function'
          ) {
            draftData.deadline = values.deadline.toISOString()
            console.log('Result of toISOString():', draftData.deadline) // 新增日志：记录 toISOString 的结果
          } else {
            // 如果日期无效或对象不正确，则不在 draftData 中设置 deadline
            // 这对于可选字段是合适的
            console.warn(
              '提供的截止日期无效或格式不正确，将不发送 deadline 字段。原始值:',
              values.deadline
            )
          }
        }

        if (audienceSelectionMode === 'specific_users') {
          // 使用状态变量 audienceSelectionMode
          draftData.targetScope = 'SPECIFIC_USERS' // 确保此值与后端枚举定义一致
          draftData.targetIds = selectedUsers.map((u) => u.id) || [] // 使用状态变量 selectedUsers
        } else {
          // 当 audienceSelectionMode === 'scope'
          draftData.userTypeFilter = values.objectType || null

          switch (values.scopeType) {
            case 'college':
              draftData.targetScope = 'COLLEGE' // 确保此值与后端枚举定义一致
              // TODO (待办): 如果可以选择特定学院，需要从类似 values.selectedCollegeIds 的表单字段获取 ID
              break
            case 'managed_classes':
              draftData.targetScope = 'SENDER_MANAGED_CLASSES' // 确保此值与后端枚举定义一致
              break
            case 'major':
              draftData.targetScope = 'MAJOR' // 确保此值与后端枚举定义一致
              // TODO (待办): 如果可以选择特定专业，需要从 values.selectedMajorIds 获取 ID
              break
            case 'role':
              draftData.targetScope = 'ROLE' // 确保此值与后端枚举定义一致
              // TODO (待办): 如果可以选择特定角色，需要从 values.selectedRoleCodes 获取 ID
              break
            default:
              if (values.scopeType) {
                // 尝试直接映射，确保大小写与后端 DTO 枚举一致
                draftData.targetScope = String(values.scopeType).toUpperCase()
              } else {
                console.warn(
                  '在范围模式下 scopeType 未定义，targetType 可能不正确。'
                )
              }
              break
          }
          // 对于某些范围类型（例如，发送者所在的学院），如果后端会处理，targetIds 可以为空数组
        }

        // 清理未定义的属性，因为后端 DTO 可能不允许它们
        Object.keys(draftData).forEach((key) => {
          if (draftData[key] === undefined) {
            delete draftData[key]
          }
          // 后端期望 attachments 是一个数组，即使为空。
          // 如果表单中的 attachments 是 null 或 undefined，确保将其设置为空数组。
          if (key === 'attachments' && !draftData[key]) {
            draftData[key] = []
          }
        })

        console.log('保存草稿时发送的数据 (前端):\r\n', draftData)
        handleSaveDraft(draftData)
      })
      .catch((errorInfo) => {
        console.log('表单验证失败:', errorInfo)
        // 假设 showMessage 是全局可用或已导入的
        if (typeof showMessage !== 'undefined' && showMessage.error) {
          showMessage.error('请检查表单填写是否完整正确！')
        } else {
          alert('请检查表单填写是否完整正确！') // 备用方案
        }
      })
  }

  // 保存为草稿
  const handleSaveDraft = async (draftData: any) => {
    setIsSavingDraft(true)
    console.log('Saving draft with data:', draftData)
    try {
      await apiClient.post('/informs/draft', draftData)
      message.success('草稿保存成功!')
      // Optionally, you might want to keep the form open or close it
      // handleCancelPublish(); // or newForm.resetFields(); if you want to clear after save
    } catch (error: any) {
      console.error('Failed to save draft:', error)
      let errorMessage = '草稿保存失败，请稍后再试。'
      if (
        error.response &&
        error.response.data &&
        error.response.data.message
      ) {
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

  const handleSelectUsersOk = (usersFromModal: ModalUser[]) => {
    setSelectedUsers(usersFromModal)
    formInstance.setFieldsValue({
      specificUserIds: usersFromModal.map((u) => u.id),
    })
    formInstance.validateFields(['specificUserIds']) // Trigger validation
    setIsSelectUsersModalVisible(false)
  }

  const handleSelectUsersCancel = () => {
    setIsSelectUsersModalVisible(false)
  }

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

  return (
    <Form
      form={formInstance}
      layout="vertical"
      name="publish_notice_form"
      onFinish={onPublish}
      disabled={readonly}
    >
      <Row gutter={16}>
        <Col span={12}>
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
        </Col>
      </Row>

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
      {/* End Target Audience Section */}

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

      <Row gutter={16}>
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
      </Row>

      <Form.Item>
        <Button onClick={onCancel} style={{ marginRight: 8 }}>
          {cancelText || '取消'}
        </Button>
        {!readonly && (
          <>
            <Button
              style={{ marginLeft: 8 }}
              onClick={() =>
                formInstance.validateFields().then(handleSaveDraftClick)
              }
              loading={isSavingDraft}
            >
              存为草稿
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              style={{ marginLeft: 8 }}
              loading={isSubmitting}
            >
              发布
            </Button>
          </>
        )}
        {customFooterButtons}
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
