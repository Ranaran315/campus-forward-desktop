import { useState } from 'react'
import './ChatViews.css'
// Avatar import is no longer directly needed here if not used in ChatViews itself
// import Avatar from '@/components/Avatar/Avatar'; 
// import type { Message } from './ChatViews'; // Removed this problematic import
import MessageList from './MessageList'
import MessageDetails from './MessageDetails'

export interface Message {
  id: string
  sender: string
  avatar: string
  timestamp: string
  content: string
  unread?: boolean
}

const messageList: Message[] = [
  {
    id: '1',
    sender: '张三',
    avatar: '',
    timestamp: '昨天 10:30',
    content: '关于下个阶段的项目计划，我们明天上午开个会讨论一下。',
    unread: true,
  },
  {
    id: '2',
    sender: '李四',
    avatar: '',
    timestamp: '今天 09:15',
    content: '我因个人原因需要请假一天，望批准。',
  },
  {
    id: '3',
    sender: '王五',
    avatar: '',
    timestamp: '今天 11:48',
    content: '上次会议的纪要已整理完毕，请查收附件。',
    unread: true,
  },
  {
    id: '4',
    sender: '赵六aaaaaaaaaaaaaaaaaaaaaaaaaa',
    avatar: '',
    timestamp: '上周五 14:20',
    content: '下个月我们计划组织一次团队建设活动，大家有什么建议吗？',
  },
  {
    id: '5',
    sender: '孙七',
    avatar: '',
    timestamp: '今天 13:05',
    content: '服务器将在下午进行紧急维护，请提前保存好工作。',
    unread: true,
  },
]

function ChatViews() {
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null)

  const handleMessageClick = (message: Message) => {
    setSelectedMessage(message)
    // 在真实场景中，这里可以处理标记为已读等逻辑
  }

  return (
    <div className="message-layout">
      <MessageList 
        messages={messageList} 
        selectedMessageId={selectedMessage?.id || null} 
        onMessageSelect={handleMessageClick} 
      />
      <MessageDetails message={selectedMessage} />
    </div>
  )
}

export default ChatViews
