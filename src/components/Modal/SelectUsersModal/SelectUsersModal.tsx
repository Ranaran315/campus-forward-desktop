import React, { useState, useEffect } from 'react'
import {
  Modal,
  Button,
  Input,
  List,
  Avatar,
  Checkbox,
  Row,
  Col,
  Empty,
} from 'antd'
import './SelectUsersModal.css'
import { InputField } from '@/components/Form/Form' // Assuming InputField is a custom component

// Mock user data type - replace with your actual User type
export interface User {
  // Added export
  id: string
  name: string
  avatar?: string
  department?: string // Example additional field
}

// Mock data - replace with actual API call and data fetching
const MOCK_ALL_USERS: User[] = [
  {
    id: '1',
    name: '张三',
    avatar: '/assets/avatars/avatar1.png',
    department: '技术部',
  },
  {
    id: '2',
    name: '李四',
    avatar: '/assets/avatars/avatar2.png',
    department: '产品部',
  },
  { id: '3', name: '王五', department: '技术部' },
  {
    id: '4',
    name: '赵六',
    avatar: '/assets/avatars/avatar3.png',
    department: '设计部',
  },
  { id: '5', name: '孙七', department: '产品部' },
  { id: '6', name: '周八', department: '技术部' },
  { id: '7', name: '吴九', department: '市场部' },
  { id: '8', name: '郑十', department: '市场部' },
]

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
  const [allUsers, setAllUsers] = useState<User[]>(MOCK_ALL_USERS)
  const [filteredUsers, setFilteredUsers] = useState<User[]>(MOCK_ALL_USERS)
  const [selectedUsers, setSelectedUsers] =
    useState<User[]>(initialSelectedUsers)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    // When the modal becomes visible, if there are initialSelectedUsers, set them.
    // Also, reset if initialSelectedUsers changes (e.g. opening modal for different notices)
    setSelectedUsers(initialSelectedUsers)
  }, [visible, initialSelectedUsers])

  useEffect(() => {
    // Filter users based on search term
    const lowercasedSearchTerm = searchTerm.toLowerCase()
    const results = allUsers.filter(
      (user) =>
        user.name.toLowerCase().includes(lowercasedSearchTerm) ||
        (user.department &&
          user.department.toLowerCase().includes(lowercasedSearchTerm))
    )
    setFilteredUsers(results)
  }, [searchTerm, allUsers])

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
      // Select all from the currently *filtered* list that are not already selected
      const newSelections = filteredUsers.filter(
        (fu) => !selectedUsers.find((su) => su.id === fu.id)
      )
      setSelectedUsers((prevSelected) => [...prevSelected, ...newSelections])
    } else {
      // Deselect all from the currently *filtered* list
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
            {filteredUsers.length > 0 ? (
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
                      avatar={<Avatar src={user.avatar}>{user.name[0]}</Avatar>}
                      title={user.name}
                      description={user.department || '无部门'}
                    />
                    <Checkbox checked={isUserSelected(user.id)} />
                  </List.Item>
                )}
              />
            ) : (
              <Empty
                description={searchTerm ? '未找到匹配用户' : '暂无用户数据'}
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
                      <Button
                        type="link"
                        danger
                        onClick={() => handleUserToggle(user)}
                      >
                        移除
                      </Button>,
                    ]}
                  >
                    <List.Item.Meta
                      avatar={<Avatar src={user.avatar}>{user.name[0]}</Avatar>}
                      title={user.name}
                      description={user.department || '无部门'}
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
