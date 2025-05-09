import Avatar from '@/components/Avatar/Avatar'
import { InputField } from '@/components/Form/Form'
import AddFriendIcon from '@/assets/icons/add_friend.svg?react'
import RemindIcon from '@/assets/icons/remind.svg?react'
import ArrowDownIcon from '@/assets/icons/arrow_down.svg?react'
import ArrowRightIcon from '@/assets/icons/arrow_right.svg?react'
import AddIcon from '@/assets/icons/add.svg?react'
import EditIcon from '@/assets/icons/edit.svg?react'
import './FriendsSidebar.css'
import { CategoryGroup, Friend } from '@/types/friends.type'

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
}) => {
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

  // 点击编辑分类按钮
  const handleEditCategoryClick = (
    event: React.MouseEvent, // 接收事件对象
    categoryId: string | null, // 分类ID，可能为 null (例如 "我的好友" 分类)
    categoryName: string
  ) => {
    event.stopPropagation(); // 阻止事件冒泡到父元素 (category-header)
    if (categoryId) { // 通常只允许编辑用户创建的真实分类
      // onEditCategory(categoryId, categoryName);
    } else {
      // 可以选择提示用户 "我的好友" 分组不可编辑，或不显示编辑按钮
      console.log("默认分类不可编辑");
    }
  };

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
              <div key={group.categoryId ?? 'friend_category_default_1'} className="category-group">
                <div
                  className="category-header"
                  onClick={() => onToggleCategory(group.categoryName)}
                >
                  {group.isExpanded ? <ArrowDownIcon /> : <ArrowRightIcon />}
                  <span className="category-name">
                    {group.categoryName}
                  </span>
                  <span className="friend-count">({group.friends.length})</span>
                  {group.categoryId && (
                    <EditIcon aria-label={`编辑分类 ${group.categoryName}`} className="edit-icon"></EditIcon>
                  )}
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
    </aside>
  )
}

export default FriendsSidebar
