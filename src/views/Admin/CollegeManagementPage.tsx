import React, { useEffect, useState } from 'react'
import {
  Typography,
  Table,
  Space,
  Button,
  Input,
  Modal,
  Form,
  message,
  Spin,
  Alert,
  Tooltip,
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  BankOutlined,
  InfoCircleOutlined,
  IdcardOutlined, // Icon for College ID
  UserOutlined, // Icon for Dean
  MailOutlined, // Icon for Email
  PhoneOutlined, // Icon for Phone
} from '@ant-design/icons'
import apiClient from '@/lib/axios'
import { useAuth } from '@/contexts/AuthContext'

const { Title } = Typography
const { Search } = Input

// --- Types for College Management ---
interface BackendCollege {
  _id: string
  name: string
  collegeId?: string // 学院代码
  description?: string
  dean?: string // 院长
  contactEmail?: string // 联系邮箱
  contactPhone?: string // 联系电话
  createdAt?: string
  updatedAt?: string
}

interface CollegeForTable extends BackendCollege {
  key: string
}

// Helper to transform backend college to table college
const transformCollegeForTable = (
  college: BackendCollege
): CollegeForTable => ({
  ...college,
  key: college._id,
})

const CollegeManagementPage: React.FC = () => {
  const { checkPermission } = useAuth()
  const [colleges, setColleges] = useState<CollegeForTable[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false)
  const [editingCollege, setEditingCollege] = useState<CollegeForTable | null>(
    null
  )
  const [form] = Form.useForm()
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [tablePagination, setTablePagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  })

  const canCreateCollege = checkPermission('college:create')
  const canEditCollege = checkPermission('college:update')
  const canDeleteCollege = checkPermission('college:delete')

  const fetchColleges = async (
    page = tablePagination.current,
    size = tablePagination.pageSize,
    query = searchTerm
  ) => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      params.append('page', page.toString())
      params.append('limit', size.toString())
      if (query) {
        params.append('q', encodeURIComponent(query))
      }

      const response = await apiClient.get(`/colleges?${params.toString()}`)
      const fetchedColleges: BackendCollege[] =
        response.data?.data || response.data
      const totalCount =
        response.data?.totalCount ||
        (Array.isArray(fetchedColleges) ? fetchedColleges.length : 0)

      if (Array.isArray(fetchedColleges)) {
        setColleges(fetchedColleges.map(transformCollegeForTable))
        setTablePagination((prev) => ({
          ...prev,
          total: totalCount,
          current: page,
          pageSize: size,
        }))
      } else {
        setColleges([])
        setTablePagination((prev) => ({ ...prev, total: 0, current: 1 }))
        console.warn('Fetched colleges is not an array:', fetchedColleges)
      }
    } catch (err: any) {
      console.error('Failed to fetch colleges:', err)
      const errorMsg =
        err.response?.data?.message ||
        err.backendMessage ||
        err.message ||
        '获取学院列表失败'
      setError(errorMsg)
      message.error(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchColleges()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Initial fetch

  const handleTableChange = (pagination: any) => {
    fetchColleges(pagination.current, pagination.pageSize, searchTerm)
  }

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    fetchColleges(1, tablePagination.pageSize, value) // Reset to first page on search
  }

  const handleAddCollege = () => {
    setEditingCollege(null)
    form.resetFields()
    setIsModalVisible(true)
  }

  const handleEditCollege = (collegeToEdit: CollegeForTable) => {
    setEditingCollege(collegeToEdit)
    form.setFieldsValue({
      name: collegeToEdit.name,
      collegeId: collegeToEdit.collegeId,
      description: collegeToEdit.description,
      dean: collegeToEdit.dean,
      contactEmail: collegeToEdit.contactEmail,
      contactPhone: collegeToEdit.contactPhone,
    })
    setIsModalVisible(true)
  }

  const handleDeleteCollege = async (
    collegeIdToDelete: string,
    collegeName: string
  ) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除学院 "${collegeName}" (ID: ${collegeIdToDelete}) 吗？此操作不可恢复。`,
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          // setLoading(true); // fetchColleges will handle loading
          await apiClient.delete(`/colleges/${collegeIdToDelete}`)
          message.success('学院删除成功')
          fetchColleges(
            tablePagination.current,
            tablePagination.pageSize,
            searchTerm
          ) // Refresh current page
        } catch (err: any) {
          console.error('Failed to delete college:', err)
          message.error(
            err.response?.data?.message ||
              err.backendMessage ||
              err.message ||
              '删除学院失败'
          )
          // setLoading(false);
        }
      },
    })
  }

  const handleModalSubmit = async () => {
    try {
      const values = await form.validateFields()
      // setLoading(true); // fetchColleges will handle loading

      const collegeData: Partial<BackendCollege> = {
        name: values.name,
        collegeId: values.collegeId,
        description: values.description,
        dean: values.dean,
        contactEmail: values.contactEmail,
        contactPhone: values.contactPhone,
      }

      // Filter out empty strings for optional fields to send undefined instead
      Object.keys(collegeData).forEach((key) => {
        const typedKey = key as keyof typeof collegeData
        if (collegeData[typedKey] === '') {
          collegeData[typedKey] = undefined
        }
      })

      if (editingCollege) {
        await apiClient.patch(`/colleges/${editingCollege._id}`, collegeData)
        message.success('学院更新成功')
      } else {
        await apiClient.post('/colleges', collegeData)
        message.success('学院创建成功')
      }
      setIsModalVisible(false)
      fetchColleges(
        editingCollege ? tablePagination.current : 1,
        tablePagination.pageSize,
        searchTerm
      ) // Refresh, go to page 1 if adding
    } catch (err: any) {
      console.error('Modal submit error:', err)
      const errorMsg =
        err.response?.data?.message ||
        err.backendMessage ||
        err.message ||
        '操作失败'
      if (err.isAxiosError && err.response?.data?.errors) {
        const validationErrors = err.response.data.errors
        validationErrors.forEach((valErr: any) =>
          message.error(
            `${valErr.path || valErr.field || 'Error'}: ${
              valErr.message || valErr.msg
            }`
          )
        )
      } else {
        message.error(errorMsg)
      }
      // setLoading(false);
    }
  }

  const columns = [
    {
      title: '序号',
      key: 'index',
      width: 80,
      render: (_text: any, _record: CollegeForTable, index: number) =>
        (tablePagination.current - 1) * tablePagination.pageSize + index + 1,
    },
    {
      title: '学院名称',
      dataIndex: 'name',
      key: 'name',
      sorter: (a: CollegeForTable, b: CollegeForTable) =>
        a.name.localeCompare(b.name),
      width: 220,
    },
    {
      title: '学院代码',
      dataIndex: 'collegeId',
      key: 'collegeId',
      width: 120,
      sorter: (a: CollegeForTable, b: CollegeForTable) =>
        (a.collegeId || '').localeCompare(b.collegeId || ''),
    },
    {
      title: '院长',
      dataIndex: 'dean',
      key: 'dean',
      width: 120,
      ellipsis: true,
      render: (text: string) => text || '-',
    },
    {
      title: '联系邮箱',
      dataIndex: 'contactEmail',
      key: 'contactEmail',
      width: 200,
      ellipsis: true,
      render: (text: string) => text || '-',
    },
    {
      title: '联系电话',
      dataIndex: 'contactPhone',
      key: 'contactPhone',
      width: 150,
      ellipsis: true,
      render: (text: string) => text || '-',
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (text: string) => (text ? new Date(text).toLocaleString() : '-'),
      sorter: (a: CollegeForTable, b: CollegeForTable) =>
        new Date(a.createdAt || 0).getTime() -
        new Date(b.createdAt || 0).getTime(),
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right' as const,
      width: 180,
      render: (_: any, record: CollegeForTable) => (
        <Space size="small">
          {canEditCollege && (
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={() => handleEditCollege(record)}
            >
              编辑
            </Button>
          )}
          {canDeleteCollege && (
            <Button
              type="primary"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDeleteCollege(record._id, record.name)}
            >
              删除
            </Button>
          )}
        </Space>
      ),
    },
  ]

  if (
    loading &&
    colleges.length === 0 &&
    !error &&
    tablePagination.current === 1
  ) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '200px',
        }}
      >
        <Spin size="large" tip="加载学院数据中..." />
      </div>
    )
  }

  return (
    <>
      <Title level={2}>学院管理</Title>
      {error && (
        <Alert
          message="错误"
          description={error}
          type="error"
          showIcon
          closable
          style={{ marginBottom: 16 }}
          onClose={() => setError(null)}
        />
      )}
      <Space
        style={{
          marginBottom: 16,
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <Search
          placeholder="搜索学院 (名称, 代码, 描述)"
          allowClear
          enterButton={<SearchOutlined />}
          style={{ width: 300 }}
          onSearch={handleSearch}
          loading={loading && searchTerm !== ''}
        />
        {canCreateCollege && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAddCollege}
          >
            添加学院
          </Button>
        )}
      </Space>
      <Table
        dataSource={colleges}
        columns={columns}
        rowKey="key"
        loading={loading}
        scroll={{ x: 1000 }}
        pagination={{
          current: tablePagination.current,
          pageSize: tablePagination.pageSize,
          total: tablePagination.total,
          showSizeChanger: true,
          showTotal: (total, range) => `${range[0]}-${range[1]} 共 ${total} 条`,
        }}
        onChange={handleTableChange}
        sticky
      />
      <Modal
        title={
          editingCollege ? `编辑学院: ${editingCollege.name}` : '添加新学院'
        }
        open={isModalVisible}
        onOk={handleModalSubmit}
        onCancel={() => setIsModalVisible(false)}
        confirmLoading={loading} // Consider a separate modal loading state if needed
        destroyOnClose
        width={600}
      >
        <Form form={form} layout="vertical" name="collegeForm">
          <Form.Item
            name="name"
            label={
              <Space>
                学院名称
                <Tooltip title="学院的正式名称，例如 '计算机科学与技术学院'">
                  <InfoCircleOutlined />
                </Tooltip>
              </Space>
            }
            rules={[{ required: true, message: '请输入学院名称!' }]}
          >
            <Input prefix={<BankOutlined />} />
          </Form.Item>
          <Form.Item
            name="collegeId"
            label={
              <Space>
                学院代码
                <Tooltip title="学院的唯一代码 (可选), 例如 'CS', 'FL'">
                  <InfoCircleOutlined />
                </Tooltip>
              </Space>
            }
            rules={[
              {
                pattern: /^[a-zA-Z0-9_.-]*$/,
                message: '学院代码只能包含字母、数字、下划线、点和连字符!',
              },
            ]}
          >
            <Input prefix={<IdcardOutlined />} placeholder="例如: CS" />
          </Form.Item>
          <Form.Item
            name="dean"
            label={
              <Space>
                院长
                <Tooltip title="学院院长的姓名 (可选)">
                  <InfoCircleOutlined />
                </Tooltip>
              </Space>
            }
          >
            <Input prefix={<UserOutlined />} placeholder="院长姓名" />
          </Form.Item>
          <Form.Item
            name="contactEmail"
            label={
              <Space>
                联系邮箱
                <Tooltip title="学院的官方联系邮箱 (可选)">
                  <InfoCircleOutlined />
                </Tooltip>
              </Space>
            }
            rules={[{ type: 'email', message: '请输入有效的邮箱地址!' }]}
          >
            <Input
              prefix={<MailOutlined />}
              placeholder="例如: college@example.com"
            />
          </Form.Item>
          <Form.Item
            name="contactPhone"
            label={
              <Space>
                联系电话
                <Tooltip title="学院的官方联系电话 (可选)">
                  <InfoCircleOutlined />
                </Tooltip>
              </Space>
            }
            rules={[
              {
                pattern: /^[0-9-+\s()]*$/,
                message: '请输入有效的电话号码!',
              },
            ]}
          >
            <Input
              prefix={<PhoneOutlined />}
              placeholder="例如: 010-12345678"
            />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={3} placeholder="关于学院的简短描述" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}

export default CollegeManagementPage
