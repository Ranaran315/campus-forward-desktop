import { useState } from 'react'
import './ChatViews.css'
import Avatar from '@/components/Avatar/Avatar'

interface Message {
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
      <aside className="message-list-container">
        <h2>消息</h2>
        <ul className="message-list">
          {messageList.map((message) => (
            <li
              key={message.id}
              className={`message-item ${
                selectedMessage?.id === message.id ? 'active' : ''
              }`}
              onClick={() => handleMessageClick(message)}
            >
              <div className="message-item-left">
                <Avatar src={message.avatar} size="35px"></Avatar>
              </div>
              <div className="message-item-right">
                <div className="message-item-desc">
                  <div className="sender">{message.sender}</div>
                  <div className="timestamp">{message.timestamp}</div>
                </div>
                <div className="message-item-detail">
                  <div className="message-content">{message.content}</div>
                  {/* {message.unread && <span className="unread-badge">1</span>} */}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </aside>
      <main className="message-content-container">
        {selectedMessage ? (
          <div className="message-details">
            <div className="detail-header">
              <div className="sender-info">
                <Avatar src={selectedMessage.avatar} size="40px"></Avatar>
                <div className="sender-name">{selectedMessage.sender}</div>
              </div>
            </div>
            <div className="detail-content">{selectedMessage.content}</div>
          </div>
        ) : (
          <div className="empty-message">请选择一条消息查看详情</div>
        )}
      </main>
    </div>
  )
}

export default ChatViews
