// src/views/Notifications/MyPublishedNoticesView.tsx
import React, { useState, useEffect } from 'react'
import { Tabs, List, Pagination, Empty, Tag, Button, Space } from 'antd'
import type { TabsProps } from 'antd'
import { InputField } from '@/components/Form/Form'
import './MyPublishedNoticesView.css'

// Define a type for published notices
interface MyNoticeItem {
  id: string
  title: string
  status: 'draft' | 'published' | 'archived'
  lastModified: string
  summary?: string
  tags?: string[]
  // Add other relevant fields like creationDate, publicationDate, viewCount etc.
}

// Mock Data for demonstration
const mockMyNotices: MyNoticeItem[] = [
  {
    id: 'pub1',
    title: '关于调整期末考试安排的通知 (草稿)',
    status: 'draft',
    lastModified: '2025-05-21',
    summary: '初步调整方案，待审核...',
    tags: ['考试', '教务'],
  },
  {
    id: 'pub2',
    title: '五一劳动节放假通知 (已发布)',
    status: 'published',
    lastModified: '2025-04-28',
    summary: '根据国家法定节假日安排...',
    tags: ['假期'],
  },
  {
    id: 'pub3',
    title: '校园网络升级公告 (已发布)',
    status: 'published',
    lastModified: '2025-03-10',
    summary: '为提升校园网速及稳定性...',
    tags: ['网络', '重要'],
  },
  {
    id: 'pub4',
    title: '旧版图书处理通知 (已归档)',
    status: 'archived',
    lastModified: '2024-12-01',
    summary: '图书馆将处理一批旧版图书...',
    tags: ['图书馆', '旧书'],
  },
  {
    id: 'pub5',
    title: '校庆活动志愿者招募 (草稿)',
    status: 'draft',
    lastModified: '2025-05-22',
    summary: '校庆活动需要大量志愿者...',
    tags: ['校庆', '招募'],
  },
  {
    id: 'pub6',
    title: '暑期社会实践安全须知 (已发布)',
    status: 'published',
    lastModified: '2025-05-15',
    summary: '请参与暑期社会实践的同学注意...',
    tags: ['暑期实践', '安全'],
  },
  {
    id: 'pub7',
    title: '关于举办第十届编程大赛的通知 (已发布)',
    status: 'published',
    lastModified: '2025-05-10',
    summary: '报名截止日期为5月30日，详情请见附件。',
    tags: ['竞赛', '编程'],
  },
  {
    id: 'pub8',
    title: '实验室设备采购清单 (草稿)',
    status: 'draft',
    lastModified: '2025-05-20',
    summary: '初步清单，待各负责人确认。',
    tags: ['实验', '采购'],
  },
  {
    id: 'pub9',
    title: '年度优秀教师评选通知 (已发布)',
    status: 'published',
    lastModified: '2025-04-15',
    summary: '请各院系积极推荐候选人。',
    tags: ['评选', '教师'],
  },
  {
    id: 'pub10',
    title: '国庆节值班安排 (已归档)',
    status: 'archived',
    lastModified: '2024-09-28',
    summary: '确保节日期间校园安全。',
    tags: ['国庆', '值班'],
  },
  {
    id: 'pub11',
    title: '新学期教材领取通知 (已发布)',
    status: 'published',
    lastModified: '2025-02-20',
    summary: '请各班级派代表统一领取。',
    tags: ['教材', '新学期'],
  },
]

const getStatusTagColor = (status: MyNoticeItem['status']) => {
  switch (status) {
    case 'draft':
      return 'gold'
    case 'published':
      return 'green'
    case 'archived':
      return 'default'
    default:
      return 'default'
  }
}

const getStatusText = (status: MyNoticeItem['status']) => {
  switch (status) {
    case 'draft':
      return '草稿'
    case 'published':
      return '已发布'
    case 'archived':
      return '已归档'
    default:
      return status
  }
}

const MyPublishedNoticesView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [pageSize, setPageSize] = useState<number>(5) // Smaller page size for demo
  const [filteredNotices, setFilteredNotices] = useState<MyNoticeItem[]>([])
  const [totalNotices, setTotalNotices] = useState<number>(0)

  useEffect(() => {
    let noticesSource = mockMyNotices

    // Filter by activeTab
    if (activeTab !== 'all') {
      noticesSource = noticesSource.filter(
        (notice) => notice.status === activeTab
      )
    }

    // Filter by searchQuery
    if (searchQuery) {
      const lowerSearchQuery = searchQuery.toLowerCase()
      noticesSource = noticesSource.filter(
        (notice) =>
          notice.title.toLowerCase().includes(lowerSearchQuery) ||
          (notice.summary &&
            notice.summary.toLowerCase().includes(lowerSearchQuery)) ||
          (notice.tags &&
            notice.tags.some((tag) =>
              tag.toLowerCase().includes(lowerSearchQuery)
            ))
      )
    }

    setTotalNotices(noticesSource.length)
    setFilteredNotices(
      noticesSource.slice((currentPage - 1) * pageSize, currentPage * pageSize)
    )
  }, [activeTab, searchQuery, currentPage, pageSize])

  const handleTabChange = (key: string) => {
    setActiveTab(key)
    setCurrentPage(1)
  }

  const handleSearchChange = (_name: string, value: string) => {
    setSearchQuery(value)
    setCurrentPage(1)
  }

  const handlePageChange = (page: number, newPageSize?: number) => {
    setCurrentPage(page)
    if (newPageSize && newPageSize !== pageSize) {
      setPageSize(newPageSize)
      setCurrentPage(1)
    }
  }

  const tabItems: TabsProps['items'] = [
    { key: 'all', label: '全部' },
    { key: 'draft', label: '草稿' },
    { key: 'published', label: '已发布' },
    { key: 'archived', label: '已归档' },
  ]

  return (
    <div className="my-published-notices-view">
      <div className="sticky-controls">
        <Tabs
          activeKey={activeTab}
          items={tabItems}
          onChange={handleTabChange}
        />
        <div className="my-notices-controls">
          <InputField
            name="searchPublishedNotices"
            theme="search"
            type="text"
            placeholder="搜索标题、摘要或标签"
            value={searchQuery}
            onChange={handleSearchChange}
          />
        </div>
      </div>
      <div className="my-notices-list-container">
        {filteredNotices.length > 0 ? (
          <List
            className="my-notices-list"
            itemLayout="vertical"
            dataSource={filteredNotices}
            renderItem={(item) => (
              <List.Item
                key={item.id}
                actions={
                  [
                    <Button
                      type="link"
                      size="small"
                      onClick={() => console.log('View:', item.id)}
                    >
                      查看
                    </Button>,
                    item.status === 'draft' && (
                      <Button
                        type="link"
                        size="small"
                        onClick={() => console.log('Edit:', item.id)}
                      >
                        编辑
                      </Button>
                    ),
                    item.status === 'published' && (
                      <Button
                        type="link"
                        size="small"
                        onClick={() => console.log('Archive:', item.id)}
                      >
                        归档
                      </Button>
                    ),
                    item.status === 'archived' && (
                      <Button
                        type="link"
                        size="small"
                        onClick={() => console.log('Unarchive:', item.id)}
                      >
                        取消归档
                      </Button>
                    ),
                  ].filter(Boolean) as React.ReactNode[]
                }
                extra={
                  <Space direction="vertical" align="end">
                    <Tag color={getStatusTagColor(item.status)}>
                      {getStatusText(item.status)}
                    </Tag>
                    <span className="last-modified-date">
                      最后修改: {item.lastModified}
                    </span>
                  </Space>
                }
              >
                <List.Item.Meta
                  title={
                    <a
                      onClick={() => console.log('View details for:', item.id)}
                    >
                      {item.title}
                    </a>
                  }
                  description={item.summary}
                />
                {item.tags && item.tags.length > 0 && (
                  <div className="item-tags">
                    {item.tags.map((tag) => (
                      <Tag key={tag}>{tag}</Tag>
                    ))}
                  </div>
                )}
              </List.Item>
            )}
          />
        ) : (
          <Empty
            description={
              searchQuery || activeTab !== 'all'
                ? '没有找到匹配的通知'
                : '您还没有该状态下的通知'
            }
          />
        )}
      </div>
      <div className="my-notices-pagination-container">
        {totalNotices > pageSize && (
          <Pagination
            current={currentPage}
            pageSize={pageSize}
            total={totalNotices}
            onChange={handlePageChange}
            showSizeChanger={false}
          />
        )}
      </div>
    </div>
  )
}

export default MyPublishedNoticesView
