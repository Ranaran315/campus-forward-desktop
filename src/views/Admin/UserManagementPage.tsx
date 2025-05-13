import React, { useEffect, useState } from 'react'
import {
  Typography,
  Table,
  Tag,
  Space,
  Button,
  Input,
  Modal,
  Form,
  Select,
  message,
  Spin,
  Alert,
  Avatar,
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  UserOutlined,
  MailOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons'
import apiClient from '@/lib/axios' // 确保路径正确
import { BackendUser, UserForTable, BackendRole } from '@/types/admin.types' // 确保路径正确
import { useAuth } from '@/contexts/AuthContext'

const { Title } = Typography
const { Search } = Input
const { Option } = Select

// Helper to transform backend user to table user
const transformUserForTable = (user: BackendUser): UserForTable => ({
  ...user,
  key: user._id,
})

const UserManagementPage: React.FC = () => {
  // 状态
  const { checkPermission, user: currentUser } = useAuth() // Get current user for self-deletion check
  const [users, setUsers] = useState<UserForTable[]>([])
  const [allRoles, setAllRoles] = useState<BackendRole[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false)
  const [editingUser, setEditingUser] = useState<UserForTable | null>(null)
  const [form] = Form.useForm()
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [tablePagination, setTablePagination] = useState({
    // 新增分页状态
    current: 1,
    pageSize: 10,
  })

  // checkPermission
  const canCreateUser = checkPermission('user:create')
  const canEditUser = checkPermission('user:edit_account_any')
  const canDeleteUser = checkPermission('user:delete_account_any')
  const canAssignRoles = checkPermission('user:assign_roles_to_any')

  // 获取用户信息
  const fetchUsers = async (query?: string) => {
    setLoading(true)
    setError(null)
    try {
      const endpoint = query
        ? `/users/search?q=${encodeURIComponent(query)}`
        : '/users'
      // apiClient 直接返回后端响应的 data 部分
      const response = await apiClient.get(endpoint)
      const fetchedUsers: BackendUser[] = response.data
      console.log('Fetched users:', fetchedUsers) // Debugging line
      if (fetchedUsers) {
        setUsers(fetchedUsers.map(transformUserForTable))
      } else {
        setUsers([]) // 如果返回 null 或 undefined
      }
    } catch (err: any) {
      console.error('Failed to fetch users:', err)
      const errorMsg = err.backendMessage || err.message || '获取用户列表失败'
      setError(errorMsg)
      message.error(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  // 获取权限信息
  const fetchAllRoles = async () => {
    try {
      // apiClient 直接返回后端响应的 data 部分
      const response = await apiClient.get('/roles')
      const fetchedRoles: BackendRole[] = response.data
      if (fetchedRoles) {
        setAllRoles(fetchedRoles)
      }
    } catch (err: any) {
      console.error('Failed to fetch roles:', err)
      message.error(
        err.backendMessage ||
          err.message ||
          '获取角色列表失败，分配角色功能可能受限'
      )
    }
  }

  useEffect(() => {
    fetchUsers()
    fetchAllRoles()
  }, [])

  // 搜索
  const handleSearch = (value: string) => {
    setSearchTerm(value)
    fetchUsers(value)
  }

  // 添加用户
  const handleAddUser = () => {
    setEditingUser(null)
    form.resetFields()
    form.setFieldsValue({ roles: [], isActive: true })
    setIsModalVisible(true)
  }

  // 编辑用户
  const handleEditUser = (userToEdit: UserForTable) => {
    setEditingUser(userToEdit)
    console.log('Editing user:', userToEdit) // Debugging line
    // 当编辑时，roles 应该是角色ID的数组，如果 allRoles 已经加载
    const roleIds = userToEdit.roles?.map((roleNameOrId) => {
        // 假设 userToEdit.roles 存储的是角色名称，需要从 allRoles 找到对应的 ID
        // 如果 userToEdit.roles 已经是 ID，则直接使用
        const roleDetail = allRoles.find(
          (r) => r.name === roleNameOrId || r._id === roleNameOrId
        )
        return roleDetail ? roleDetail._id : null
      })
      .filter((id) => id !== null) as string[]

    form.setFieldsValue({
      username: userToEdit.username,
      nickname: userToEdit.nickname,
      email: userToEdit.email,
      roles: roleIds,
      isActive: userToEdit.isActive !== undefined ? userToEdit.isActive : true,
    })
    setIsModalVisible(true)
  }

  // 删除用户
  const handleDeleteUser = async (userId: string, username: string) => {
    if (currentUser && currentUser.sub === userId) {
      message.error('不能删除当前登录的用户。')
      return
    }
    if (username === 'admin' || username === 'superadmin') {
      // Add more reserved usernames if needed
      message.error(`系统保留用户 "${username}" 不能删除。`)
      return
    }
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除用户 "${username}" (ID: ${userId}) 吗？此操作不可恢复。`,
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          setLoading(true)
          await apiClient.delete(`/users/${userId}`) // delete 通常不返回 data，或者返回一个确认消息
          message.success('用户删除成功')
          fetchUsers(searchTerm)
        } catch (err: any) {
          console.error('Failed to delete user:', err)
          message.error(err.backendMessage || err.message || '删除用户失败')
        } finally {
          setLoading(false)
        }
      },
    })
  }

  // 处理表单提交
  const handleModalSubmit = async () => {
    try {
      const values = await form.validateFields()
      setLoading(true)

      if (editingUser) {
        const updateDto: Partial<BackendUser> = {
          nickname: values.nickname,
          email: values.email,
          // isActive: values.isActive, // 确保后端 UpdateUserDto 支持此字段
        }
        // apiClient.patch 直接返回后端响应的 data 部分 (可能是更新后的用户对象或成功消息)
        await apiClient.patch(`/users/${editingUser._id}`, updateDto)

        if (canAssignRoles && values.roles) {
          const originalRoleIds = editingUser.roles?.map((roleNameOrId) => {
              const roleDetail = allRoles.find(
                (r) => r.name === roleNameOrId || r._id === roleNameOrId
              )
              return roleDetail ? roleDetail._id : null
            })
            .filter((id) => id !== null) as string[]
          const newRoleIds = values.roles as string[]

          const rolesToAdd = newRoleIds.filter(
            (id) => !originalRoleIds?.includes(id)
          )
          const rolesToRemove = originalRoleIds?.filter(
            (id) => !newRoleIds.includes(id)
          )

          for (const roleId of rolesToAdd) {
            await apiClient.post(`/admin/users/${editingUser._id}/assign-role`, {
              roleId,
            })
          }
          for (const roleId of rolesToRemove) {
            await apiClient.delete(
              `/admin/users/${editingUser._id}/unassign-role/${roleId}`
            )
          }
        }
        message.success('用户信息更新成功')
      } else {
        // Create new user
        const createDto = {
          username: values.username,
          password: values.password,
          nickname: values.nickname,
          email: values.email,
          // roles: values.roles, // 如果 CreateUserDto 接受角色 ID
        }
        // apiClient.post 直接返回后端响应的 data 部分 (新创建的用户对象)
        const newUser: BackendUser = await apiClient.post('/users', createDto)

        if (canAssignRoles && values.roles && newUser && newUser._id) {
          for (const roleId of values.roles as string[]) {
            // values.roles 应该是角色ID数组
            await apiClient.post(`/admin/users/${newUser._id}/assign-role`, {
              roleId,
            })
          }
        }
        message.success('用户创建成功')
      }
      setIsModalVisible(false)
      fetchUsers(searchTerm)
    } catch (err: any) {
      console.error('Modal submit error:', err)
      message.error(err.backendMessage || err.message || '操作失败')
    } finally {
      setLoading(false)
    }
  }

  // 渲染表格
  const columns = [
    {
      title: '序号',
      key: 'index',
      width: 80,
      fixed: 'left' as const,
      render: (_text: any, _record: UserForTable, index: number) => {
        const { current = 1, pageSize = 10 } = tablePagination // 从 state 或 props 获取分页信息
        return (current - 1) * pageSize + index + 1
      },
    },
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
      width: 180,
      fixed: 'left' as const,
      render: (text: string, record: UserForTable) => (
        <Space>
          <Avatar src={record.avatar} icon={<UserOutlined />} />
          {text}
        </Space>
      ),
    },
    { title: '昵称', dataIndex: 'nickname', key: 'nickname', width: 150 },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
      width: 200,
      ellipsis: true,
    },
    {
      title: '角色',
      dataIndex: 'roles',
      key: 'roles',
      width: 200,
      render: (
        roleIdentifiers: string[] // roleIdentifiers can be names or IDs initially
      ) => (
        <>
          {roleIdentifiers &&
            roleIdentifiers.map((identifier) => {
              const roleDetail = allRoles.find(
                (r) => r.name === identifier || r._id === identifier
              )
              const displayName = roleDetail
                ? roleDetail.displayName
                : identifier
              let color = displayName.length > 5 ? 'geekblue' : 'green'
              if (
                displayName === 'SuperAdmin' ||
                displayName === '超级管理员'
              ) {
                // Match by name or displayName
                color = 'volcano'
              }
              return (
                <Tag color={color} key={identifier}>
                  {displayName.toUpperCase()}
                </Tag>
              )
            })}
        </>
      ),
    },
    // {
    //   title: '状态', // Assuming your BackendUser has an 'isActive' field
    //   dataIndex: 'isActive',
    //   key: 'isActive',
    //   width: 100,
    //   render: (isActive: boolean) => (
    //     <Tag color={isActive ? 'green' : 'red'}>
    //       {isActive ? '激活' : '禁用'}
    //     </Tag>
    //   ),
    // },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (text: string) => (text ? new Date(text).toLocaleString() : '-'),
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right' as const,
      width: 180,
      render: (_: any, record: UserForTable) => (
        <Space size="middle">
          {canEditUser && (
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={() => handleEditUser(record)}
            >
              编辑
            </Button>
          )}
          {canDeleteUser && (
            <Button
              type="primary"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDeleteUser(record._id, record.username)}
            >
              删除
            </Button>
          )}
        </Space>
      ),
    },
  ]

  if (loading && users.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '200px',
        }}
      >
        <Spin size="large" tip="加载用户数据中..." />
      </div>
    )
  }

  return (
    <>
      <Title level={2} style={{ flexShrink: 0 }}>
        用户管理
      </Title>
      {error && (
        <Alert
          message="错误"
          description={error}
          type="error"
          showIcon
          closable
          style={{ marginBottom: 16 }}
          onClose={() => setError(null)}
        />
      )}
      <Space
        style={{
          marginBottom: 16,
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <Search
          placeholder="搜索用户 (用户名, 昵称, 邮箱)"
          allowClear
          enterButton={<SearchOutlined />}
          style={{ width: 400 }}
          onSearch={handleSearch}
          loading={loading && searchTerm !== ''} // Show loading on search bar only when actively searching
        />
        {canCreateUser && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAddUser}
          >
            添加用户
          </Button>
        )}
      </Space>
      <Table
        dataSource={users}
        columns={columns}
        rowKey="key"
        loading={loading}
        scroll={{ x: 1300 }}
        pagination={{
          current: tablePagination.current,
          pageSize: tablePagination.pageSize,
          total: users.length, // 假设 users 是当前搜索/过滤后的完整列表，如果后端分页则这里是 total count
          // 如果是后端分页，total 应该从后端获取
        }}
        onChange={(pagination) => {
          // 处理分页变化
          setTablePagination({
            current: pagination.current || 1,
            pageSize: pagination.pageSize || 10,
          })
        }}
        sticky
      />
      <Modal
        title={editingUser ? `编辑用户: ${editingUser.username}` : '添加新用户'}
        open={isModalVisible}
        onOk={handleModalSubmit}
        onCancel={() => setIsModalVisible(false)}
        confirmLoading={loading}
        destroyOnClose
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          name="userForm"
          initialValues={{ isActive: true }}
        >
          <Form.Item
            name="username"
            label="用户名"
            rules={[
              { required: true, message: '请输入用户名!' },
              {
                pattern: /^[a-zA-Z0-9_.-]+$/,
                message: '用户名只能包含字母、数字和_.-',
              },
            ]}
          >
            <Input prefix={<UserOutlined />} disabled={!!editingUser} />
          </Form.Item>
          {!editingUser && (
            <Form.Item
              name="password"
              label="密码"
              rules={[
                { required: true, message: '请输入密码!' },
                { min: 6, message: '密码至少6位' },
              ]}
            >
              <Input.Password prefix={<SafetyCertificateOutlined />} />
            </Form.Item>
          )}
          <Form.Item name="nickname" label="昵称">
            <Input prefix={<UserOutlined />} />
          </Form.Item>
          <Form.Item
            name="email"
            label="邮箱"
            rules={[{ type: 'email', message: '请输入有效的邮箱地址!' }]}
          >
            <Input prefix={<MailOutlined />} />
          </Form.Item>
          {canAssignRoles && (
            <Form.Item name="roles" label="角色">
              <Select
                mode="multiple"
                placeholder="选择用户角色"
                loading={allRoles.length === 0 && isModalVisible} // Only load if modal is visible and roles not loaded
                allowClear
                filterOption={(input, option) =>
                  (option?.label ?? '')
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
                options={allRoles.map((role) => ({
                  label: `${role.displayName} (${role.name})`,
                  value: role._id, // Form should submit role IDs
                }))}
              />
            </Form.Item>
          )}
          <Form.Item name="isActive" label="账户状态" valuePropName="checked">
            <Select placeholder="选择账户状态">
              <Option value={true}>激活</Option>
              <Option value={false}>禁用</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}

export default UserManagementPage
