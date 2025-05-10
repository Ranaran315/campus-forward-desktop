import { UserProfile } from './user.types'

export interface FriendCategory {
  _id: string
  name: string
  user?: string
  isDefault: boolean
}

export interface Friend {
  _id: string
  friend: UserProfile
  remark?: string
  category: FriendCategory
}

export interface FriendCategoryInfo {
  _id: string;
  name: string;
}

export interface CategoryGroup {
  categoryId: string
  categoryName: string
  friends: Friend[]
  isExpanded: boolean
}

export interface FriendRequest {
  _id: string
  sender: {
    _id: string
    username: string
    nickname: string
    avatar?: string
  }
  message?: string
  createdAt: string
}

export type FriendRequestStatusType =
  | 'pending'
  | 'accepted'
  | 'rejected'
  | 'ignored'

export interface BaseFriendRequest {
  _id: string
  message?: string
  createdAt: string
  status: FriendRequestStatusType
}

export interface ReceivedFriendRequest extends BaseFriendRequest {
  sender: {
    _id: string
    username: string
    nickname: string
    avatar?: string
  }
}

export interface SentFriendRequest extends BaseFriendRequest {
  receiver: {
    _id: string
    username: string
    nickname: string
    avatar?: string
  }
}
