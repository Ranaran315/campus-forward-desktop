import { UserProfile } from './user.types'

export interface Friend {
  _id: string
  friend: UserProfile
  remark?: string
  category: string
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
