import React, { useEffect, useState } from 'react';
import {
  Typography,
  Table,
  Space,
  Button,
  Input,
  Modal,
  Form,
  Select,
  message,
  Spin,
  Alert,
  Tooltip,
  InputNumber, // Added for durationYears
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  BookOutlined, // Icon for Major
  InfoCircleOutlined,
  IdcardOutlined, // Icon for Major ID
  ReadOutlined, // Icon for Degree
  ClockCircleOutlined, // Icon for Duration
} from '@ant-design/icons';
import apiClient from '@/lib/axios';
import { useAuth } from '@/contexts/AuthContext';

const { Title } = Typography;
const { Search } = Input;
const { Option } = Select;

// --- Types for College (to be used in Major) ---
interface BackendCollegeForSelect {
  _id: string;
  name: string;
}

// --- Types for Major Management ---
interface BackendMajor {
  _id: string;
  name: string;
  majorId?: string; // 专业代码
  college: BackendCollegeForSelect; // Populated by backend
  degreeOffered?: string; // 授予学位
  durationYears?: number; // 学制年限
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface MajorForTable extends Omit<BackendMajor, 'college'> {
  key: string;
  collegeId: string;
  collegeName: string;
}

// Helper to transform backend major to table major
const transformMajorForTable = (major: BackendMajor): MajorForTable => ({
  ...major,
  key: major._id,
  collegeId: major.college._id,
  collegeName: major.college.name,
});

const MajorManagementPage: React.FC = () => {
  const { checkPermission } = useAuth();
  const [majors, setMajors] = useState<MajorForTable[]>([]);
  const [allColleges, setAllColleges] = useState<BackendCollegeForSelect[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [editingMajor, setEditingMajor] = useState<MajorForTable | null>(null);
  const [form] = Form.useForm();
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterCollegeId, setFilterCollegeId] = useState<string | undefined>(undefined);
  const [tablePagination, setTablePagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // Permissions
  const canCreateMajor = checkPermission('major:create');
  const canEditMajor = checkPermission('major:update');
  const canDeleteMajor = checkPermission('major:delete');

  // Fetch Colleges for Select Dropdown
  const fetchAllColleges = async () => {
    try {
      const response = await apiClient.get('/colleges?limit=1000'); // Fetch all for dropdown
      const fetchedColleges: BackendCollegeForSelect[] = response.data?.data || response.data;
      if (Array.isArray(fetchedColleges)) {
        setAllColleges(fetchedColleges);
      } else {
        setAllColleges([]);
        message.error('获取学院列表失败，无法筛选或创建专业。');
      }
    } catch (err: any) {
      console.error('Failed to fetch colleges for select:', err);
      message.error(err.response?.data?.message || err.message || '获取学院下拉列表失败');
    }
  };

  // Fetch Majors
  const fetchMajors = async (page = tablePagination.current, size = tablePagination.pageSize, query = searchTerm, collegeId = filterCollegeId) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', size.toString());
      if (query) params.append('q', query);
      if (collegeId) params.append('collegeId', collegeId);

      const response = await apiClient.get(`/majors?${params.toString()}`);
      const fetchedMajors: BackendMajor[] = response.data?.data || response.data;
      const totalCount = response.data?.totalCount || (Array.isArray(fetchedMajors) ? fetchedMajors.length : 0);

      if (Array.isArray(fetchedMajors)) {
        setMajors(fetchedMajors.map(transformMajorForTable));
        setTablePagination(prev => ({ ...prev, total: totalCount, current: page, pageSize: size }));
      } else {
        setMajors([]);
        setTablePagination(prev => ({ ...prev, total: 0, current: 1 }));
        console.warn('Fetched majors is not an array:', fetchedMajors);
      }
    } catch (err: any) {
      console.error('Failed to fetch majors:', err);
      const errorMsg = err.response?.data?.message || err.backendMessage || err.message || '获取专业列表失败';
      setError(errorMsg);
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllColleges();
    fetchMajors();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Initial fetch

  const handleTableChange = (pagination: any) => {
    fetchMajors(pagination.current, pagination.pageSize, searchTerm, filterCollegeId);
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    fetchMajors(1, tablePagination.pageSize, value, filterCollegeId);
  };

  const handleCollegeFilterChange = (value: string | undefined) => {
    setFilterCollegeId(value);
    fetchMajors(1, tablePagination.pageSize, searchTerm, value);
  };

  const handleAddMajor = () => {
    setEditingMajor(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEditMajor = (majorToEdit: MajorForTable) => {
    setEditingMajor(majorToEdit);
    form.setFieldsValue({
      name: majorToEdit.name,
      majorId: majorToEdit.majorId,
      college: majorToEdit.collegeId,
      degreeOffered: majorToEdit.degreeOffered,
      durationYears: majorToEdit.durationYears,
      description: majorToEdit.description,
    });
    setIsModalVisible(true);
  };

  const handleDeleteMajor = async (majorIdToDelete: string, majorName: string) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除专业 "${majorName}" (ID: ${majorIdToDelete}) 吗？此操作不可恢复。`,
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await apiClient.delete(`/majors/${majorIdToDelete}`);
          message.success('专业删除成功');
          fetchMajors(tablePagination.current, tablePagination.pageSize, searchTerm, filterCollegeId);
        } catch (err: any) {
          console.error('Failed to delete major:', err);
          message.error(err.response?.data?.message || err.backendMessage || err.message || '删除专业失败');
        }
      },
    });
  };

  const handleModalSubmit = async () => {
    try {
      const values = await form.validateFields();
      const majorData: Partial<Omit<BackendMajor, 'college' | '_id' | 'createdAt' | 'updatedAt'> & { college: string }> = {
        name: values.name,
        majorId: values.majorId,
        college: values.college, // This should be the college ID from the form
        degreeOffered: values.degreeOffered,
        durationYears: values.durationYears,
        description: values.description,
      };

      Object.keys(majorData).forEach(key => {
        const typedKey = key as keyof typeof majorData;
        if (majorData[typedKey] === '' || (typedKey === 'durationYears' && majorData[typedKey] === null)) {
          // @ts-ignore
          majorData[typedKey] = undefined;
        }
      });


      if (editingMajor) {
        await apiClient.patch(`/majors/${editingMajor._id}`, majorData);
        message.success('专业更新成功');
      } else {
        await apiClient.post('/majors', majorData);
        message.success('专业创建成功');
      }
      setIsModalVisible(false);
      fetchMajors(editingMajor ? tablePagination.current : 1, tablePagination.pageSize, searchTerm, filterCollegeId);
    } catch (err: any) {
      console.error('Modal submit error:', err);
      const errorMsg = err.response?.data?.message || err.backendMessage || err.message || '操作失败';
       if (err.isAxiosError && err.response?.data?.errors) {
        const validationErrors = err.response.data.errors;
        validationErrors.forEach((valErr: any) => message.error(`${valErr.path || valErr.field || 'Error'}: ${valErr.message || valErr.msg}`));
      } else {
        message.error(errorMsg);
      }
    }
  };

  const columns = [
    {
      title: '序号',
      key: 'index',
      width: 80,
      render: (_text: any, _record: MajorForTable, index: number) =>
        (tablePagination.current - 1) * tablePagination.pageSize + index + 1,
    },
    {
      title: '专业名称',
      dataIndex: 'name',
      key: 'name',
      sorter: (a: MajorForTable, b: MajorForTable) => a.name.localeCompare(b.name),
      width: 200,
    },
    {
      title: '专业代码',
      dataIndex: 'majorId',
      key: 'majorId',
      width: 120,
      render: (text: string) => text || '-',
    },
    {
      title: '所属学院',
      dataIndex: 'collegeName',
      key: 'collegeName',
      sorter: (a: MajorForTable, b: MajorForTable) => a.collegeName.localeCompare(b.collegeName),
      width: 200,
    },
    {
      title: '授予学位',
      dataIndex: 'degreeOffered',
      key: 'degreeOffered',
      width: 150,
      ellipsis: true,
      render: (text: string) => text || '-',
    },
    {
      title: '学制(年)',
      dataIndex: 'durationYears',
      key: 'durationYears',
      width: 100,
      align: 'center' as const,
      render: (text: number) => text || '-',
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
      render: (text: string) => text ? new Date(text).toLocaleString() : '-',
      sorter: (a: MajorForTable, b: MajorForTable) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime(),
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right' as const,
      width: 180,
      render: (_: any, record: MajorForTable) => (
        <Space size="small">
          {canEditMajor && (
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={() => handleEditMajor(record)}
            >
              编辑
            </Button>
          )}
          {canDeleteMajor && (
            <Button
              type="primary"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDeleteMajor(record._id, record.name)}
            >
              删除
            </Button>
          )}
        </Space>
      ),
    },
  ];

  if (loading && majors.length === 0 && allColleges.length === 0 && !error && tablePagination.current === 1) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
        <Spin size="large" tip="加载专业数据中..." />
      </div>
    );
  }

  return (
    <>
      <Title level={2}>专业管理</Title>
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
      <Space style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <Space>
          <Search
            placeholder="搜索专业 (名称, 代码, 描述)"
            allowClear
            enterButton={<SearchOutlined />}
            style={{ width: 300 }}
            onSearch={handleSearch}
            loading={loading && searchTerm !== ''}
          />
          <Select
            placeholder="按学院筛选"
            allowClear
            style={{ width: 200 }}
            onChange={handleCollegeFilterChange}
            loading={allColleges.length === 0 && loading} // Only show loading if colleges are actually being fetched
            value={filterCollegeId}
            showSearch
            filterOption={(input, option) =>
                (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
            }
          >
            {allColleges.map(college => (
              <Option key={college._id} value={college._id}>
                {college.name}
              </Option>
            ))}
          </Select>
        </Space>
        {canCreateMajor && (
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAddMajor}>
            添加专业
          </Button>
        )}
      </Space>
      <Table
        dataSource={majors}
        columns={columns}
        rowKey="key"
        loading={loading}
        scroll={{ x: 1400 }} // Adjusted scroll width
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
        title={editingMajor ? `编辑专业: ${editingMajor.name}` : '添加新专业'}
        open={isModalVisible}
        onOk={handleModalSubmit}
        onCancel={() => setIsModalVisible(false)}
        confirmLoading={loading}
        destroyOnClose
        width={600}
      >
        <Form form={form} layout="vertical" name="majorForm">
          <Form.Item
            name="name"
            label={
              <Space>
                专业名称
                <Tooltip title="专业的正式名称，例如 '软件工程'">
                  <InfoCircleOutlined />
                </Tooltip>
              </Space>
            }
            rules={[{ required: true, message: '请输入专业名称!' }]}
          >
            <Input prefix={<BookOutlined />} />
          </Form.Item>
          <Form.Item
            name="majorId"
            label={
              <Space>
                专业代码
                <Tooltip title="专业的唯一代码 (可选), 例如 'SWE'">
                  <InfoCircleOutlined />
                </Tooltip>
              </Space>
            }
            rules={[
              {
                pattern: /^[a-zA-Z0-9_.-]*$/,
                message: '专业代码只能包含字母、数字、下划线、点和连字符!',
              },
            ]}
          >
            <Input prefix={<IdcardOutlined />} placeholder="例如: SWE"/>
          </Form.Item>
          <Form.Item
            name="college"
            label="所属学院"
            rules={[{ required: true, message: '请选择所属学院!' }]}
          >
            <Select
              placeholder="选择所属学院"
              loading={allColleges.length === 0 && !error} // Show loading if colleges are not yet fetched and no error
              showSearch
              filterOption={(input, option) =>
                (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
              }
            >
              {allColleges.map(college => (
                <Option key={college._id} value={college._id}>
                  {college.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="degreeOffered"
            label={
              <Space>
                授予学位
                <Tooltip title="例如: 工学学士, 文学硕士 (可选)">
                  <InfoCircleOutlined />
                </Tooltip>
              </Space>
            }
          >
            <Input prefix={<ReadOutlined />} placeholder="例如: 工学学士"/>
          </Form.Item>
          <Form.Item
            name="durationYears"
            label={
              <Space>
                学制年限
                <Tooltip title="专业学习的年数 (可选)">
                  <InfoCircleOutlined />
                </Tooltip>
              </Space>
            }
            rules={[{ type: 'number', min: 1, max: 10, message: '请输入1-10之间的数字' }]}
          >
            <InputNumber prefix={<ClockCircleOutlined />} style={{ width: '100%' }} placeholder="例如: 4"/>
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={3} placeholder="关于专业的简短描述" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default MajorManagementPage;