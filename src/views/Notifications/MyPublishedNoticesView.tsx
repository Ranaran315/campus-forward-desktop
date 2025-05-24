// src/views/Notifications/MyPublishedNoticesView.tsx
import React, { useState, useEffect, useCallback } from 'react'
import {
  Tabs,
  List,
  Pagination,
  Empty,
  Tag,
  Button,
  Space,
  Spin,
  Alert,
} from 'antd'
import type { TabsProps } from 'antd'
import { InputField } from '@/components/Form/Form'
import apiClient, { BackendStandardResponse } from '@/lib/axios' // Import BackendStandardResponse
import './MyPublishedNoticesView.css'

// Define a type for notices fetched from the backend
interface MyCreatedNoticeItem {
  _id: string
  title: string
  description?: string // Already added in previous step
  status: 'draft' | 'published' | 'archived'
  updatedAt: string
  publishAt?: string
  createdAt: string
  contentPreview?: string
  tags?: string[]
  importance: 'high' | 'medium' | 'low'
  deadline?: string
}

// Define the structure of the paginated API response (this is the type for backendResponse.data)
interface PaginatedNoticesResponse {
  data: MyCreatedNoticeItem[]
  page: number
  limit: number
  total: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

const getStatusTagColor = (status: MyCreatedNoticeItem['status']) => {
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

const getStatusText = (status: MyCreatedNoticeItem['status']) => {
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
  const [pageSize, setPageSize] = useState<number>(5)
  const [notices, setNotices] = useState<MyCreatedNoticeItem[]>([])
  const [totalNotices, setTotalNotices] = useState<number>(0)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const fetchNotices = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params: any = {
        page: currentPage,
        limit: pageSize,
        status: activeTab === 'all' ? undefined : activeTab,
        searchQuery: searchQuery || undefined,
        sortBy: 'updatedAt',
        sortOrder: 'desc',
      }

      const backendResponse = await apiClient.get<
        BackendStandardResponse<PaginatedNoticesResponse>
      >('/informs/my-created', { params })

      if (backendResponse && backendResponse.data) {
        const responseData = backendResponse.data // responseData is PaginatedNoticesResponse
        // @ts-ignore
        setNotices(
          responseData.data?.map((notice) => ({
            ...notice,
          })) || []
        ) // Ensure an array is always passed to setNotices
        // @ts-ignore
        setTotalNotices(responseData.total)
      } else {
        // @ts-ignore
        const errorMessage =
          backendResponse?.message ||
          '获取通知列表失败：响应数据格式不正确或为空。'
        console.error(
          'Failed to fetch notices or data is null:',
          backendResponse
        )
        setError(errorMessage)
        setNotices([])
        setTotalNotices(0)
      }
    } catch (err: any) {
      console.error('Failed to fetch notices:', err)
      setError(
        err.backendMessage || err.message || '获取通知列表失败，请稍后重试。'
      )
      setNotices([])
      setTotalNotices(0)
    } finally {
      setLoading(false)
    }
  }, [activeTab, searchQuery, currentPage, pageSize])

  useEffect(() => {
    fetchNotices()
  }, [fetchNotices])

  const handleTabChange = (key: string) => {
    setActiveTab(key)
    setCurrentPage(1) // Reset to first page on tab change
  }

  const handleSearchChange = (_name: string, value: string) => {
    setSearchQuery(value)
    setCurrentPage(1) // Reset to first page on search
  }

  const handlePageChange = (page: number, newPageSize?: number) => {
    setCurrentPage(page)
    if (newPageSize && newPageSize !== pageSize) {
      setPageSize(newPageSize)
      setCurrentPage(1) // Reset to first page if page size changes
    }
  }

  const tabItems: TabsProps['items'] = [
    { key: 'all', label: '全部' },
    { key: 'draft', label: '草稿' },
    { key: 'published', label: '已发布' },
    { key: 'archived', label: '已归档' },
  ]

  // Function to format date string (e.g., from ISO to YYYY-MM-DD)
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A'
    try {
      return new Date(dateString).toLocaleDateString()
    } catch (e) {
      return dateString // Return original if parsing fails
    }
  }

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
        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <Spin size="large" />
          </div>
        ) : error ? (
          <Alert
            message="错误"
            description={error}
            type="error"
            showIcon
            closable
            onClose={() => setError(null)}
          />
        ) : notices.length > 0 ? (
          <List
            className="my-notices-list"
            itemLayout="vertical"
            dataSource={notices}
            renderItem={(item) => (
              <List.Item
                key={item._id}
                className="my-notices-list-item"
                extra={
                  <Space direction="vertical" align="end">
                    <Tag color={getStatusTagColor(item.status)}>
                      {getStatusText(item.status)}
                    </Tag>
                    <span className="last-modified-date">
                      最后修改: {formatDate(item.updatedAt)}
                    </span>
                    <span className="publish-date">
                      {item.status === 'published' && item.publishAt
                        ? `发布于: ${formatDate(item.publishAt)}`
                        : ''}
                    </span>
                  </Space>
                }
              >
                <List.Item.Meta
                  title={
                    <a
                      onClick={() => console.log('View details for:', item._id)}
                    >
                      {item.title}
                    </a>
                  }
                  description={item.description || '暂无摘要'} // Uses item.description
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
        {totalNotices > pageSize &&
          !loading && ( // Hide pagination while loading
            <Pagination
              current={currentPage}
              pageSize={pageSize}
              total={totalNotices}
              onChange={handlePageChange}
              showSizeChanger={false} // Consider enabling if many items
            />
          )}
      </div>
    </div>
  )
}

export default MyPublishedNoticesView
