import Avatar from '@/components/Avatar/Avatar'
import { InputField } from '@/components/Form/Form'
import AddFriendIcon from '@/assets/icons/add_friend.svg?react'
import RemindIcon from '@/assets/icons/remind.svg?react'
import ArrowDownIcon from '@/assets/icons/arrow_down.svg?react'
import ArrowRightIcon from '@/assets/icons/arrow_right.svg?react'
import AddIcon from '@/assets/icons/add.svg?react'
import EditIcon from '@/assets/icons/edit.svg?react'
import DelteIcon from '@/assets/icons/delete.svg?react'
import './FriendsSidebar.css'
import { CategoryGroup, Friend } from '@/types/friends.type'
import ContextMenu, {
  ContextMenuItem,
} from '@/components/ContextMenu/ContextMenu'
import React, { useCallback, useState } from 'react'

interface FriendsSidebarProps {
  categoryGroups: CategoryGroup[]
  selectedFriend: Friend | null
  selectedTab: 'details' | 'requests' | 'addFriend'
  pendingRequestsCount: number
  isLoading: boolean
  searchQuery: string

  // 回调函数
  onFriendClick: (friend: Friend) => void
  onViewFriendRequests: () => void
  onViewAddFriend: () => void
  onToggleCategory: (category: string) => void
  onSearch: (name: string, query: string) => void
  onAddCategory: () => void
  onOpenAddCategoryDialog: () => void // Renamed from onAddCategory for clarity
  onOpenRenameCategoryDialog: (categoryId: string, currentName: string) => void
  onOpenDeleteCategoryDialog: (categoryId: string, categoryName: string) => void
}

const FriendsSidebar: React.FC<FriendsSidebarProps> = ({
  categoryGroups,
  selectedFriend,
  selectedTab,
  pendingRequestsCount,
  isLoading,
  searchQuery,
  onFriendClick,
  onViewFriendRequests,
  onViewAddFriend,
  onToggleCategory,
  onSearch,
  onAddCategory,
  onOpenAddCategoryDialog,
  onOpenRenameCategoryDialog,
  onOpenDeleteCategoryDialog,
}) => {
  // 状态定义
  const [contextMenuVisible, setContextMenuVisible] = useState(false)
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 })
  const [contextMenuTarget, setContextMenuTarget] = useState<
    CategoryGroup | Friend | null
  >(null)
  const [contextMenuType, setContextMenuType] = useState<
    'category' | 'friend' | null
  >(null)

  // 处理右键菜单的打开
  const handleOpenContextMenu = (
    event: React.MouseEvent,
    target: CategoryGroup | Friend,
    type: 'category' | 'friend'
  ) => {
    event.preventDefault()
    event.stopPropagation() // Important to prevent other context menus or default browser behavior
    setContextMenuPosition({ x: event.clientX, y: event.clientY })
    setContextMenuTarget(target)
    setContextMenuType(type)
    setContextMenuVisible(true)
  }

  // 处理右键菜单的关闭
  const handleCloseContextMenu = useCallback(() => {
    setContextMenuVisible(false)
    setContextMenuTarget(null)
    setContextMenuType(null)
  }, [])

  // 生成不同的右键菜单项
  const getContextMenuItems = (): ContextMenuItem[] => {
    if (!contextMenuTarget) return []

    if (contextMenuType === 'category' && contextMenuTarget) {
      const category = contextMenuTarget as CategoryGroup
      return [
        {
          label: '新增好友分组',
          icon: <AddIcon></AddIcon>,
          onClick: onOpenAddCategoryDialog,
        },
        {
          label: '重命名分组',
          icon: <EditIcon></EditIcon>,
          onClick: () => {
            if (category.category) {
              onOpenRenameCategoryDialog(
                category.category,
                category.categoryName
              )
            }
          },
        },
        {
          label: '删除好友分组',
          icon: <DelteIcon></DelteIcon>,
          onClick: () => {
            if (category.category) {
              onOpenDeleteCategoryDialog(
                category.category,
                category.categoryName
              )
            }
          },
          disabled: category.isDefault, // Disable for "我的好友"
        },
      ]
    } else if (contextMenuType === 'friend' && contextMenuTarget) {
      // const friend = contextMenuTarget as Friend;
      // Future: Define friend-specific context menu items here
      // Example:
      // return [
      //   { label: '发送消息', onClick: () => console.log('Send message to', friend.friend.username) },
      //   { label: '查看资料', onClick: () => onFriendClick(friend) },
      //   { label: '修改备注', onClick: () => { /* call prop to open remark dialog */ } },
      //   { isSeparator: true },
      //   { label: '移至分组...', onClick: () => { /* open move to group dialog */ } },
      //   { label: '删除好友', onClick: () => { /* call prop to open delete friend confirm */ } },
      // ];
      return [] // Placeholder for now
    }
    return []
  }

  // 处理搜索输入
  const handleSearch = (name: string, query: string) => {
    onSearch(name, query)
  }

  // 获取过滤后的分组
  const getFilteredGroups = () => {
    if (!searchQuery) return categoryGroups

    return categoryGroups
      .map((group) => ({
        ...group,
        friends: group.friends.filter((friend) => {
          const displayName =
            friend.remark || friend.friend.nickname || friend.friend.username
          return displayName.toLowerCase().includes(searchQuery.toLowerCase())
        }),
      }))
      .filter((group) => group.friends.length > 0)
  }

  // 获取显示名称
  const getDisplayName = (friend: Friend) => {
    return friend.remark || friend.friend.nickname || friend.friend.username
  }

  return (
    <aside className="friends-sidebar">
      {/* 头部区域：搜索框和添加好友按钮 */}
      <div className="friends-header">
        <div className="search-box">
          <InputField
            name="search"
            theme="search"
            type="text"
            placeholder="搜索好友"
            value={searchQuery}
            onChange={handleSearch}
          />
        </div>
        <button
          className={`add-friend-btn ${
            selectedTab === 'addFriend' ? 'active' : ''
          }`}
          onClick={onViewAddFriend}
        >
          <AddFriendIcon />
        </button>
      </div>

      {/* 功能区域：好友通知 */}
      <div className="friends-functions">
        <div
          className={`function-item ${
            selectedTab === 'requests' ? 'active' : ''
          } ${pendingRequestsCount > 0 ? 'has-badge' : ''}`}
          onClick={onViewFriendRequests}
        >
          <RemindIcon />
          <span className="function-text">好友通知</span>
          <div className="function-item-right">
            {pendingRequestsCount > 0 && (
              <span className="badge">{pendingRequestsCount}</span>
            )}
            <ArrowRightIcon />
          </div>
        </div>
      </div>

      {/* 好友分类操作区 */}
      <div className="category-controls">
        <h3 className="section-title">我的好友</h3>
        <button className="category-add-btn" onClick={onAddCategory}>
          <AddIcon></AddIcon>
        </button>
      </div>

      {/* 好友列表区域 */}
      {isLoading ? (
        <div className="loading-container">
          <span>加载中...</span>
        </div>
      ) : (
        <div className="friends-list-container">
          {getFilteredGroups().length === 0 ? (
            <div className="empty-state">
              {searchQuery ? '没有找到匹配的好友' : '暂无好友'}
            </div>
          ) : (
            getFilteredGroups().map((group) => (
              <div key={group.category} className="category-group">
                <div
                  className="category-header"
                  onClick={() => onToggleCategory(group.categoryName)}
                  onContextMenu={(e) =>
                    handleOpenContextMenu(e, group, 'category')
                  }
                >
                  {group.isExpanded ? <ArrowDownIcon /> : <ArrowRightIcon />}
                  <span className="category-name">{group.categoryName}</span>
                  <span className="friend-count">({group.friends.length})</span>
                </div>

                {group.isExpanded && (
                  <ul className="friend-list">
                    {group.friends.map((friend) => (
                      <li
                        key={friend._id}
                        className={`friend-item ${
                          selectedFriend?._id === friend._id &&
                          selectedTab === 'details'
                            ? 'active'
                            : ''
                        }`}
                        onClick={() => onFriendClick(friend)}
                      >
                        <Avatar
                          src={friend.friend.avatar}
                          alt={getDisplayName(friend)}
                          size={40}
                        />
                        <div className="friend-info">
                          <span className="friend-name">
                            {getDisplayName(friend)}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))
          )}
        </div>
      )}
      <ContextMenu
        x={contextMenuPosition.x}
        y={contextMenuPosition.y}
        visible={contextMenuVisible}
        items={getContextMenuItems()}
        onClose={handleCloseContextMenu}
      />
    </aside>
  )
}

export default FriendsSidebar
