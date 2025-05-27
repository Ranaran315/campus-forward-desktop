import React, { useState, useEffect } from 'react'
import {
  Modal,
  Radio,
  Select,
  Button,
  Form,
  Row,
  Col,
  Tag,
  message,
} from 'antd'
import { UserOutlined } from '@ant-design/icons'
import SelectUsersModal from '../SelectUsersModal/SelectUsersModal'
import type { User as ModalUser } from '../SelectUsersModal/SelectUsersModal'
import apiClient from '@/lib/axios'

const { Option } = Select

type ScopeType = 'college' | 'managed_classes' | 'major' | 'role'

interface UserRole {
  code: string
  name: string
}

interface PublishTargetModalProps {
  visible: boolean
  onCancel: () => void
  onOk: (targetData: TargetData) => void
  confirmLoading: boolean
}

export interface TargetData {
  targetScope: string
  targetUsers?: string[]
  userTypeFilter?: string | null
  senderIdentity: string
}

const PublishTargetModal: React.FC<PublishTargetModalProps> = ({
  visible,
  onCancel,
  onOk,
  confirmLoading,
}) => {
  const [form] = Form.useForm()
  const [audienceSelectionMode, setAudienceSelectionMode] = useState<
    'scope' | 'specific_users'
  >('scope')
  const [isSelectUsersModalVisible, setIsSelectUsersModalVisible] =
    useState(false)
  const [selectedUsers, setSelectedUsers] = useState<ModalUser[]>([])
  const [senderIdentities, setSenderIdentities] = useState<
    { id: string; name: string }[]
  >([])
  const [isLoadingIdentities, setIsLoadingIdentities] = useState(false)

  // 重置表单
  useEffect(() => {
    if (visible) {
      // 重置状态
      form.resetFields()
      setAudienceSelectionMode('scope')
      setSelectedUsers([])

      // 初始化默认值
      form.setFieldsValue({
        scopeType: 'college',
        objectType: 'students',
      })

      // 加载发送者身份
      fetchSenderIdentities()
    }
  }, [visible, form])

  // 获取发布者身份列表
  const fetchSenderIdentities = async () => {
    setIsLoadingIdentities(true)
    try {
      const response = await apiClient.get('/roles/mine/sendable')
      if (response?.data) {
        // @ts-ignore 根据实际返回结构调整
        const formattedIdentities = response.data.map((role: UserRole) => ({
          id: role.code,
          name: role.name,
        }))
        setSenderIdentities(formattedIdentities)

        // 如果有身份，默认选中第一个
        if (formattedIdentities.length > 0) {
          form.setFieldsValue({ senderIdentity: formattedIdentities[0].id })
        }
      } else {
        setSenderIdentities([])
      }
    } catch (error) {
      console.error('Failed to fetch sender identities:', error)
      message.error('获取发布者身份失败，请稍后再试')
    } finally {
      setIsLoadingIdentities(false)
    }
  }

  // 处理受众选择模式变化
  const handleAudienceSelectionModeChange = (e: any) => {
    const newMode = e.target.value
    setAudienceSelectionMode(newMode)

    if (newMode === 'scope') {
      form.setFieldsValue({
        specificUserIds: [],
        scopeType: 'college',
        objectType: 'students',
      })
      setSelectedUsers([])
    } else {
      form.setFieldsValue({
        scopeType: undefined,
        objectType: undefined,
      })
    }
  }

  // 用户选择相关方法
  const handleOpenSelectUsersModal = () => setIsSelectUsersModalVisible(true)
  const handleSelectUsersCancel = () => setIsSelectUsersModalVisible(false)

  const handleSelectUsersOk = (usersFromModal: ModalUser[]) => {
    setSelectedUsers(usersFromModal)
    form.setFieldsValue({
      specificUserIds: usersFromModal.map((u) => u.id),
    })
    setIsSelectUsersModalVisible(false)
  }

  const handleRemoveSelectedUser = (userIdToRemove: string) => {
    const newSelectedUsers = selectedUsers.filter(
      (user) => user.id !== userIdToRemove
    )
    setSelectedUsers(newSelectedUsers)
    form.setFieldsValue({
      specificUserIds: newSelectedUsers.map((u) => u.id),
    })
  }
  // 提交表单
  const handleSubmit = () => {
    form.validateFields().then((values) => {
      const targetData: TargetData = {
        targetScope: '',
        targetUsers: [],
        userTypeFilter: null,
        senderIdentity: values.senderIdentity,
      }

      if (audienceSelectionMode === 'specific_users') {
        // 选择特定用户模式
        targetData.targetScope = 'SPECIFIC_USERS'
        targetData.targetUsers = selectedUsers.map((u) => u.id)
        targetData.userTypeFilter = null // 确保这个值是 null
      } else {
        // 按范围选择模式
        targetData.targetScope = values.scopeType.toUpperCase()
        targetData.userTypeFilter = values.objectType
        targetData.targetUsers = [] // 确保这个值是空数组
      }

      onOk(targetData)
    })
  }

  // 预设选项
  const scopeTypeOptions = [
    { value: 'college' as ScopeType, label: '所在学院' },
    { value: 'managed_classes' as ScopeType, label: '管理班级' },
    { value: 'major' as ScopeType, label: '专业' },
    { value: 'role' as ScopeType, label: '角色' },
  ]

  return (
    <>
      <Modal
        title="发布通知"
        open={visible}
        onCancel={onCancel}
        footer={[
          <Button key="cancel" onClick={onCancel}>
            取消
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={confirmLoading}
            onClick={handleSubmit}
          >
            确认发布
          </Button>,
        ]}
        width={600}
      >
        <Form form={form} layout="vertical">
          {/* 发布者身份选择 */}
          <Form.Item
            name="senderIdentity"
            label="发布者身份"
            rules={[{ required: true, message: '请选择发布者身份!' }]}
          >
            <Select
              placeholder="选择发布者身份"
              loading={isLoadingIdentities}
              disabled={isLoadingIdentities || senderIdentities.length === 0}
            >
              {senderIdentities.map((identity) => (
                <Option key={identity.id} value={identity.id}>
                  {identity.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          {/* 发布目标选择 */}
          <Form.Item label="发布目标" required>
            <Radio.Group
              onChange={handleAudienceSelectionModeChange}
              value={audienceSelectionMode}
            >
              <Radio value="scope">按范围选择</Radio>
              <Radio value="specific_users">选择特定用户</Radio>
            </Radio.Group>
          </Form.Item>

          {audienceSelectionMode === 'scope' && (
            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="scopeType"
                  label="范围类型"
                  initialValue="college"
                  rules={[{ required: true, message: '请选择范围类型' }]}
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
                  initialValue="students"
                  rules={[{ required: true, message: '请选择对象类型' }]}
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
            <Form.Item
              name="specificUserIds"
              rules={[
                {
                  required: true,
                  validator: async (_, value) => {
                    if (!value || value.length === 0) {
                      return Promise.reject('请选择具体用户')
                    }
                    return Promise.resolve()
                  },
                },
              ]}
            >
              <div>
                <Button
                  onClick={handleOpenSelectUsersModal}
                  icon={<UserOutlined />}
                >
                  选择具体用户
                </Button>

                {selectedUsers.length > 0 && (
                  <div style={{ marginTop: '8px' }}>
                    {selectedUsers.map((user) => (
                      <Tag
                        key={user.id}
                        closable
                        onClose={() => handleRemoveSelectedUser(user.id)}
                        style={{ marginRight: '4px', marginBottom: '4px' }}
                      >
                        {user.name}
                      </Tag>
                    ))}
                  </div>
                )}
              </div>
            </Form.Item>
          )}
        </Form>
      </Modal>

      {/* 用户选择模态框 */}
      <SelectUsersModal
        visible={isSelectUsersModalVisible}
        onOk={handleSelectUsersOk}
        onCancel={handleSelectUsersCancel}
        initialSelectedUsers={selectedUsers}
      />
    </>
  )
}

export default PublishTargetModal
