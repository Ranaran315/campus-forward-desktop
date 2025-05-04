import { useCallback, useState } from 'react'
import { debounce } from 'lodash'
import axios from '@/lib/axios'
import Avatar from '@/components/Avatar/Avatar'
import { InputField, TextAreaField } from '@/components/Form/Form'
import { showMessage } from '@/components/Message/MessageContainer'
import Modal from '@/components/Modal/Modal'
import Button from '@/components/Button/Button'
import TipIcon from '@/assets/icons/tip.svg?react'
import "./AddFriendPanel.css"

// 类型定义
interface User {
    _id: string
    username: string
    nickname?: string
    avatar?: string
    userType?: string
}

interface AddFriendPanelProps {
    onRequestSent?: () => void
}

const AddFriendPanel: React.FC<AddFriendPanelProps> = ({ onRequestSent }) => {
    const [searchUserQuery, setSearchUserQuery] = useState('')
    const [searchUserResults, setSearchUserResults] = useState<User[]>([])
    const [isSearchingUsers, setIsSearchingUsers] = useState(false)
    const [selectedUser, setSelectedUser] = useState<User | null>(null)
    const [showAddFriendForm, setShowAddFriendForm] = useState(false)
    const [addFriendMessage, setAddFriendMessage] = useState('')

    // 搜索用户
    const searchUsers = async (query: string) => {
        if (!query.trim()) {
            setSearchUserResults([])
            return
        }

        try {
            setIsSearchingUsers(true)
            const response = await axios.get(`/users/search?q=${encodeURIComponent(query)}`)
            setSearchUserResults(response.data)
        } catch (error) {
            console.error('搜索用户失败:', error)
            showMessage.error('搜索用户失败')
        } finally {
            setIsSearchingUsers(false)
        }
    }

    // 使用防抖处理搜索
    const handleSearchUserChange = (_name: string, value: string) => {
        setSearchUserQuery(value)
        debouncedSearch(value)
    }

    // 防抖搜索函数
    const debouncedSearch = useCallback(
        debounce((query: string) => {
            searchUsers(query)
        }, 500),
        [] // 空依赖数组确保函数只创建一次
    )

    // 选择用户显示添加好友表单
    const selectUserToAdd = (user: User) => {
        setSelectedUser(user)
        setShowAddFriendForm(true)
    }

    // 发送好友请求
    const sendFriendRequest = async () => {
        if (!selectedUser) return

        try {
            await axios.post('/friends/requests', {
                receiverId: selectedUser._id,
                message: addFriendMessage
            })

            showMessage.success('好友请求已发送')
            setShowAddFriendForm(false)
            setSelectedUser(null)
            setAddFriendMessage('')

            // 如果提供了回调，则调用
            if (onRequestSent) {
                onRequestSent()
            }
        } catch (error) {
            console.error('发送好友请求失败:', error)
            showMessage.error('发送好友请求失败')
        }
    }

    // 处理关闭弹窗
    const handleCloseModal = () => {
        setShowAddFriendForm(false)
        setSelectedUser(null)
        setAddFriendMessage('')
    }

    // 处理输入验证消息
    const handleMessageChange = (_name: string, value: string) => {
        setAddFriendMessage(value)
    }

    // 组件卸载时取消挂起的防抖操作
    useCallback(() => {
        return () => {
            debouncedSearch.cancel()
        }
    }, [debouncedSearch])

    return (
        <div className="add-friend-panel">
            <h2 className="panel-title">添加好友</h2>

            <div className="search-user-box">
                <InputField
                    name="searchUser"
                    theme="search"
                    type="text"
                    placeholder="请输入关键词进行搜索"
                    value={searchUserQuery}
                    onChange={handleSearchUserChange}
                    className="search-user-input"
                />
            </div>

            {isSearchingUsers && (
                <div className="searching-indicator">
                    <span className="loading-dot"></span>
                    <span>正在搜索...</span>
                </div>
            )}

            {!isSearchingUsers && searchUserQuery && searchUserResults.length === 0 && (
                <div className="no-results">
                    未找到匹配的用户
                </div>
            )}

            <div className="search-results">
                {searchUserResults.map(user => (
                    <div key={user._id} className="user-result-item">
                        <Avatar
                            src={user.avatar}
                            alt={user.nickname || user.username}
                            size={48}
                        />
                        <div className="user-info">
                            <div className="user-info-top">
                                <div className="user-name">{user.nickname || user.username}</div>
                                <div className="user-type">{user.userType === 'student' ? '学生' : '教职工'}</div>
                            </div>
                            <div className="user-info-bottom">
                                <div className="user-id">@{user.username}</div>
                            </div>
                        </div>
                        <Button
                            theme="primary"
                            className="add-button"
                            onClick={() => selectUserToAdd(user)}
                        >
                            添加
                        </Button>
                    </div>
                ))}
            </div>

            {/* 使用 Modal 组件替代原有的添加好友弹窗 */}
            <Modal
                isOpen={showAddFriendForm && selectedUser !== null}
                onClose={handleCloseModal}
                title="添加好友"
                confirmText="发送请求"
                cancelText="取消"
                onConfirm={sendFriendRequest}
                onCancel={handleCloseModal}
            >
                <div className="add-friend-modal-content">
                    <div className="selected-user">
                        <Avatar
                            src={selectedUser?.avatar}
                            alt={selectedUser?.nickname || selectedUser?.username || ''}
                            size={60}
                        />
                        <div className="user-name">{selectedUser?.nickname || selectedUser?.username}</div>
                        <div className="user-id">@{selectedUser?.username}</div>
                    </div>

                    <div className="message-form">
                        <TextAreaField
                            name="addFriendMessage"
                            label="验证信息"
                            value={addFriendMessage}
                            onChange={handleMessageChange}
                            placeholder="请输入验证信息"
                            className="message-input"
                            rows={3}
                            maxLength={100}
                            resizable="vertical" // 只允许上下拉伸
                            showCount={true} // 显示字数统计
                            minHeight="80px" // 设置最小高度
                        />
                        <p className="message-help">
                            <TipIcon></TipIcon>
                            添加好友请求会发送给对方，对方确认后，你们将会成为好友
                        </p>
                    </div>
                </div>
            </Modal>
        </div>
    )
}

export default AddFriendPanel