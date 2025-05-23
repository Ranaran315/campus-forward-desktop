import React, { useState, useEffect } from 'react'
import {
  Modal,
  Button,
  List,
  Avatar,
  Checkbox,
  Row,
  Col,
  Empty,
  Spin,
  Alert,
} from 'antd'
import './SelectUsersModal.css'
import { InputField } from '@/components/Form/Form'
import apiClient, { BackendStandardResponse } from '@/lib/axios'
import { CloseOutlined, DeleteOutlined } from '@ant-design/icons'

export interface User {
  id: string
  name: string
  avatar?: string
}

interface SelectUsersModalProps {
  visible: boolean
  onCancel: () => void
  onOk: (selectedUsers: User[]) => void
  initialSelectedUsers?: User[] // Users initially selected when modal opens
}

const SelectUsersModal: React.FC<SelectUsersModalProps> = ({
  visible,
  onCancel,
  onOk,
  initialSelectedUsers = [],
}) => {
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [selectedUsers, setSelectedUsers] =
    useState<User[]>(initialSelectedUsers)
  const [searchTerm, setSearchTerm] = useState('')
  const [loadingUsers, setLoadingUsers] = useState<boolean>(false)
  const [errorUsers, setErrorUsers] = useState<string | null>(null)

  useEffect(() => {
    setSelectedUsers(initialSelectedUsers)
  }, [visible, initialSelectedUsers])

  useEffect(() => {
    // 当弹窗变为可见时，获取用户列表
    if (visible) {
      const fetchUsers = async () => {
        setLoadingUsers(true)
        setErrorUsers(null)
        setAllUsers([]) // 清空旧数据
        setFilteredUsers([]) // 清空旧数据
        try {
          const response = await apiClient.get<BackendStandardResponse<any[]>>(
            '/friends'
          ) // 使用 any[] 暂时接收，因为结构复杂

          if (response && response.data && Array.isArray(response.data)) {
            // 将后端返回的好友关系对象映射到前端 User 接口
            // response.data 是一个数组，每个元素是一个“好友关系”对象
            const fetchedUsers: User[] = response.data
              .filter(
                (relation) =>
                  relation && relation.friend && relation.status === 'accepted'
              ) // 可选：确保 friend 对象存在且状态为 accepted
              .map((relation) => ({
                id: relation.friend._id, // 使用 friend 对象中的 _id
                name: relation.friend.nickname || relation.friend.username, // 优先使用 nickname，否则使用 username
                avatar: relation.friend.avatar, // 使用 friend 对象中的 avatar
              }))
            setAllUsers(fetchedUsers)
            setFilteredUsers(fetchedUsers) // 初始时，显示所有用户
          } else {
            console.warn('获取用户列表成功，但数据为空或格式不正确。')
            setAllUsers([])
            setFilteredUsers([])
            if (response && !response.data) {
              // 如果后端明确返回了 null 或 undefined data，可以设置一个更具体的提示
              // setErrorUsers('未能获取到用户列表数据。');
            }
          }
        } catch (error: any) {
          console.error('获取用户列表失败:', error)
          setErrorUsers(
            error.backendMessage ||
              error.message ||
              '获取用户列表失败，请稍后再试。'
          )
          setAllUsers([])
          setFilteredUsers([])
        } finally {
          setLoadingUsers(false)
        }
      }
      fetchUsers()
    } else {
      // 可选：当弹窗关闭时，清空搜索词
      // setSearchTerm('');
    }
  }, [visible]) // 依赖 visible 状态，当弹窗显示时触发

  const handleSearch = (name: string, value: string) => {
    setSearchTerm(value)
  }

  const handleUserToggle = (user: User) => {
    setSelectedUsers((prevSelected) => {
      const isAlreadySelected = prevSelected.find((su) => su.id === user.id)
      if (isAlreadySelected) {
        return prevSelected.filter((su) => su.id !== user.id)
      } else {
        return [...prevSelected, user]
      }
    })
  }

  const handleSelectAll = (e: any) => {
    if (e.target.checked) {
      const newSelections = filteredUsers.filter(
        (fu) => !selectedUsers.find((su) => su.id === fu.id)
      )
      setSelectedUsers((prevSelected) => [...prevSelected, ...newSelections])
    } else {
      setSelectedUsers((prevSelected) =>
        prevSelected.filter(
          (su) => !filteredUsers.find((fu) => fu.id === su.id)
        )
      )
    }
  }

  const isUserSelected = (userId: string) => {
    return !!selectedUsers.find((su) => su.id === userId)
  }

  const handleOk = () => {
    onOk(selectedUsers)
  }

  // Determine if "Select All" checkbox should be checked or indeterminate
  const selectedInFilteredCount = filteredUsers.filter((fu) =>
    isUserSelected(fu.id)
  ).length
  const selectAllChecked =
    filteredUsers.length > 0 && selectedInFilteredCount === filteredUsers.length
  const selectAllIndeterminate =
    selectedInFilteredCount > 0 &&
    selectedInFilteredCount < filteredUsers.length

  return (
    <Modal
      title="选择具体用户"
      visible={visible}
      onOk={handleOk}
      onCancel={onCancel}
      width={800} // Adjust width as needed
      className="select-users-modal"
      destroyOnClose // Reset state when modal is closed
      footer={[
        <Button key="back" onClick={onCancel}>
          取消
        </Button>,
        <Button key="submit" type="primary" onClick={handleOk}>
          确定
        </Button>,
      ]}
    >
      <Row gutter={16} className="select-users-modal-content">
        {/* Left Side: Search and User List */}
        <Col span={12} className="left-panel">
          <div className="search-section">
            <InputField
              name="userSearch"
              placeholder="搜索用户 (姓名、部门)"
              value={searchTerm}
              onChange={handleSearch} // Assuming InputField's onChange provides (name, value)
              theme="search" // Optional: if your InputField supports themes
            />
          </div>
          <div className="select-all-section">
            <Checkbox
              onChange={handleSelectAll}
              checked={selectAllChecked}
              indeterminate={selectAllIndeterminate}
              disabled={filteredUsers.length === 0}
            >
              全选 (当前列表)
            </Checkbox>
          </div>
          <div className="user-list-container">
            {loadingUsers ? ( // 添加加载状态处理
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <Spin tip="正在加载用户列表..." />
              </div>
            ) : errorUsers ? ( // 添加错误状态处理
              <Alert message={errorUsers} type="error" showIcon />
            ) : filteredUsers.length > 0 ? (
              <List
                itemLayout="horizontal"
                dataSource={filteredUsers}
                renderItem={(user) => (
                  <List.Item
                    key={user.id}
                    onClick={() => handleUserToggle(user)}
                    className={isUserSelected(user.id) ? 'user-selected' : ''}
                  >
                    <List.Item.Meta
                      avatar={
                        <Avatar src={user.avatar}>
                          {user.name && user.name[0]}
                        </Avatar>
                      }
                      title={user.name}
                      style={{ alignItems: 'center' }}
                    />
                    <Checkbox checked={isUserSelected(user.id)} />
                  </List.Item>
                )}
              />
            ) : (
              <Empty
                description={
                  searchTerm
                    ? '未找到匹配用户'
                    : allUsers.length === 0 && !errorUsers
                    ? '暂无用户数据'
                    : '列表为空或未找到用户'
                }
              />
            )}
          </div>
        </Col>

        {/* Right Side: Selected Users List */}
        <Col span={12} className="right-panel">
          <h4>已选择用户 ({selectedUsers.length})</h4>
          <div className="selected-users-list-container">
            {selectedUsers.length > 0 ? (
              <List
                itemLayout="horizontal"
                dataSource={selectedUsers}
                renderItem={(user) => (
                  <List.Item
                    key={user.id}
                    actions={[
                      <CloseOutlined
                        key="remove" // 建议为 action 添加 key
                        style={{
                          cursor: 'pointer',
                          fontSize: '16px',
                        }} // 设置图标颜色、鼠标手势和大小
                        onClick={() => handleUserToggle(user)}
                      />,
                    ]}
                  >
                    <List.Item.Meta
                      avatar={
                        <Avatar src={user.avatar}>
                          {user.name && user.name[0]}
                        </Avatar>
                      }
                      title={user.name}
                    />
                  </List.Item>
                )}
              />
            ) : (
              <Empty description="尚未选择任何用户" />
            )}
          </div>
        </Col>
      </Row>
    </Modal>
  )
}

export default SelectUsersModal
