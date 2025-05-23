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
} from 'antd'
import { UploadOutlined, UserOutlined } from '@ant-design/icons' // Added UserOutlined
import { FormInstance } from 'antd/lib/form'
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
// type ObjectType = 'all' | 'students' | 'staff'; // Commented out as it's not directly used by a state variable yet, but good for type safety in form values

interface PublishNoticeFormProps {
  formInstance: FormInstance
  onCancel: () => void
  onPublish: (values: any) => void // Retain this to be called by the internal button
  onSaveDraft: (values: any) => void // New prop for saving draft
  isSubmitting?: boolean // Added for loading state of the internal publish button
  isSavingDraft?: boolean // Optional: for loading state of save draft button
}

const PublishNoticeForm: React.FC<PublishNoticeFormProps> = ({
  formInstance,
  onCancel,
  onPublish,
  onSaveDraft,
  isSubmitting,
  isSavingDraft,
}) => {
  const [senderIdentities, setSenderIdentities] = useState<
    { id: string; name: string }[]
  >([])
  const [audienceSelectionMode, setAudienceSelectionMode] = useState<
    'scope' | 'specific_users'
  >('scope')
  const [isSelectUsersModalVisible, setIsSelectUsersModalVisible] =
    useState(false) // Added
  const [selectedUsers, setSelectedUsers] = useState<ModalUser[]>([]) // Added

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

  const handleSaveDraftClick = () => {
    const values = formInstance.getFieldsValue()
    onSaveDraft(values)
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

      {/* Target Audience Section - new structure */}
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
        label="通知标题"
        rules={[{ required: true, message: '请输入通知标题!' }]}
      >
        <Input placeholder="输入通知标题" />
      </Form.Item>

      <Form.Item
        name="content"
        label="通知内容"
        rules={[{ required: true, message: '请输入通知内容!' }]}
      >
        <TextArea rows={6} placeholder="输入通知内容 (支持Markdown)" />
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

      <Form.Item style={{ marginTop: '24px', textAlign: 'right' }}>
        <Button onClick={onCancel} style={{ marginRight: 8 }}>
          取消
        </Button>
        <Button
          onClick={handleSaveDraftClick}
          style={{ marginRight: 8 }}
          loading={isSavingDraft}
        >
          保存草稿
        </Button>
        <Button type="primary" htmlType="submit" loading={isSubmitting}>
          发布
        </Button>
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

export default PublishNoticeForm
