import React, { useEffect, useState, useCallback } from 'react';
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
  InputNumber,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  TeamOutlined, // Icon for Academic Class
  InfoCircleOutlined,
  IdcardOutlined, // Icon for Class ID
  UserOutlined, // Icon for Counselor/Monitor
  CalendarOutlined, // Icon for Year
} from '@ant-design/icons';
import apiClient from '@/lib/axios';
import { useAuth } from '@/contexts/AuthContext';

const { Title } = Typography;
const { Search } = Input;
const { Option } = Select;

// --- Types for Selects ---
interface BackendCollegeForSelect {
  _id: string;
  name: string;
}

interface BackendMajorForSelect {
  _id: string;
  name: string;
  college?: string;
}

interface BackendUserForSelect {
  _id: string;
  realname: string; // Changed from name to realname
  username: string; 
  // nickname?: string; // Also available if needed
}


// --- Types for Academic Class Management ---
interface BackendAcademicClass {
  _id: string;
  name: string;
  classId?: string;
  major: {
    _id: string;
    name: string;
    college: { // Assuming college is populated within major
      _id: string;
      name: string;
    };
  };
  college: { // Backend service also populates college directly
    _id: string;
    name: string;
  };
  entryYear: number;
  graduationYear?: number;
  counselor?: BackendUserForSelect;
  classMonitor?: BackendUserForSelect;
  remarks?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface AcademicClassForTable {
  key: string;
  _id: string;
  name: string;
  classId?: string;
  majorId: string;
  majorName: string;
  collegeId: string;
  collegeName: string;
  entryYear: number;
  graduationYear?: number;
  counselorId?: string;
  counselorName?: string; // This will be derived from realname (username)
  classMonitorId?: string;
  classMonitorName?: string; // This will be derived from realname (username)
  remarks?: string;
  createdAt?: string;
  updatedAt?: string;
}

const transformAcademicClassForTable = (ac: BackendAcademicClass): AcademicClassForTable => ({
  key: ac._id,
  _id: ac._id,
  name: ac.name,
  classId: ac.classId,
  majorId: ac.major._id,
  majorName: ac.major.name,
  collegeId: ac.college?._id || ac.major.college._id,
  collegeName: ac.college?.name || ac.major.college.name,
  entryYear: ac.entryYear,
  graduationYear: ac.graduationYear,
  counselorId: ac.counselor?._id,
  counselorName: ac.counselor?.realname ? `${ac.counselor.realname} (${ac.counselor.username})` : ac.counselor?.username,
  classMonitorId: ac.classMonitor?._id,
  classMonitorName: ac.classMonitor?.realname ? `${ac.classMonitor.realname} (${ac.classMonitor.username})` : ac.classMonitor?.username,
  remarks: ac.remarks,
  createdAt: ac.createdAt,
  updatedAt: ac.updatedAt,
});

const currentYear = new Date().getFullYear();
// Generate a range of years for entry and graduation year selectors
const yearRange = (startOffset: number, count: number) =>
  Array.from({ length: count }, (_, i) => currentYear + startOffset + i);

const admissionYears = yearRange(-7, 10); // e.g., 2017-2026 for entry
const gradYears = yearRange(-2, 10);      // e.g., 2022-2034 for graduation

const AcademicClassManagementPage: React.FC = () => {
  const { checkPermission } = useAuth();
  const [academicClasses, setAcademicClasses] = useState<AcademicClassForTable[]>([]);
  const [allColleges, setAllColleges] = useState<BackendCollegeForSelect[]>([]);
  const [allMajorsForFilter, setAllMajorsForFilter] = useState<BackendMajorForSelect[]>([]);
  const [allUsers, setAllUsers] = useState<BackendUserForSelect[]>([]); // For counselor/monitor select

  const [loading, setLoading] = useState<boolean>(true);
  const [modalLoading, setModalLoading] = useState<boolean>(false); // Specific loading for modal operations
  const [error, setError] = useState<string | null>(null);
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [editingAcademicClass, setEditingAcademicClass] = useState<AcademicClassForTable | null>(null);
  const [form] = Form.useForm();

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterCollegeId, setFilterCollegeId] = useState<string | undefined>(undefined);
  const [filterMajorId, setFilterMajorId] = useState<string | undefined>(undefined);
  const [filterEntryYear, setFilterEntryYear] = useState<number | undefined>(undefined);

  const [modalSelectedCollegeId, setModalSelectedCollegeId] = useState<string | null>(null);
  const [modalAvailableMajors, setModalAvailableMajors] = useState<BackendMajorForSelect[]>([]);
  const [modalMajorsLoading, setModalMajorsLoading] = useState<boolean>(false);

  const [tablePagination, setTablePagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const canCreateClass = checkPermission('academic_class:create');
  const canEditClass = checkPermission('academic_class:update');
  const canDeleteClass = checkPermission('academic_class:delete');

  const fetchAllColleges = useCallback(async () => {
    try {
      const response = await apiClient.get('/colleges?limit=1000');
      const fetched = response.data?.data || response.data;
      if (Array.isArray(fetched)) setAllColleges(fetched);
    } catch (err) { message.error('获取学院下拉列表失败'); }
  }, []);

  const fetchMajorsForFilterDropdown = useCallback(async (collegeId?: string) => {
    try {
      const endpoint = collegeId ? `/majors?collegeId=${collegeId}&limit=1000` : '/majors?limit=1000';
      const response = await apiClient.get(endpoint);
      const fetched = response.data?.data || response.data;
      if (Array.isArray(fetched)) setAllMajorsForFilter(fetched);
    } catch (err) { message.error('加载专业列表(筛选用)失败'); setAllMajorsForFilter([]); }
  }, []);

  const fetchMajorsForModalDropdown = useCallback(async (collegeId: string) => {
    if (!collegeId) { setModalAvailableMajors([]); return; }
    setModalMajorsLoading(true);
    try {
      const response = await apiClient.get(`/majors?collegeId=${collegeId}&limit=1000`);
      const fetched = response.data?.data || response.data;
      if (Array.isArray(fetched)) setModalAvailableMajors(fetched);
    } catch (err) { message.error('加载专业列表(模态框)失败'); setModalAvailableMajors([]); }
    finally { setModalMajorsLoading(false); }
  }, []);

  const fetchUsersForSelect = useCallback(async () => {
    try {
      // Uses GET /users endpoint. Assumes it returns an array of users.
      // Kept limit=1000 as a good practice, backend might support it.
      const response = await apiClient.get('/users?limit=1000'); 
      // Adjust data extraction based on your actual backend response structure for GET /users
      const fetchedUsers: BackendUserForSelect[] = response.data?.data || response.data?.users || response.data || [];
      if (Array.isArray(fetchedUsers)) {
        setAllUsers(fetchedUsers);
      } else {
        setAllUsers([]);
        message.error('获取用户列表的响应格式不正确。');
      }
    } catch (err) { 
      message.error('获取用户列表失败 (用于辅导员/班长选择)'); 
      setAllUsers([]); // Ensure allUsers is an array in case of error
    }
  }, []);


  const fetchAcademicClasses = useCallback(async (page = 1, size = tablePagination.pageSize) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', size.toString());
      if (searchTerm) params.append('q', searchTerm);
      if (filterCollegeId) params.append('collegeId', filterCollegeId);
      if (filterMajorId) params.append('majorId', filterMajorId);
      if (filterEntryYear !== undefined) params.append('entryYear', filterEntryYear.toString()); // Use entryYear

      const response = await apiClient.get(`/academic-classes?${params.toString()}`);
      const fetchedClassesResult = response.data?.data || response.data; // Backend might wrap in 'data'
      const fetchedClasses: BackendAcademicClass[] = Array.isArray(fetchedClassesResult) ? fetchedClassesResult : (fetchedClassesResult?.classes || []); // Or in 'classes'
      const totalCount = response.data?.totalCount || fetchedClassesResult?.totalCount || fetchedClasses.length;


      if (Array.isArray(fetchedClasses)) {
        setAcademicClasses(fetchedClasses.map(transformAcademicClassForTable));
        setTablePagination(prev => ({ ...prev, total: totalCount, current: page, pageSize: size }));
      } else {
        setAcademicClasses([]);
        setTablePagination(prev => ({ ...prev, total: 0, current: 1 }));
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || '获取班级列表失败';
      setError(errorMsg); message.error(errorMsg);
    } finally { setLoading(false); }
  }, [searchTerm, filterCollegeId, filterMajorId, filterEntryYear, tablePagination.pageSize]);

  useEffect(() => {
    fetchAllColleges();
    fetchMajorsForFilterDropdown();
    fetchUsersForSelect();
  }, [fetchAllColleges, fetchMajorsForFilterDropdown, fetchUsersForSelect]);

  useEffect(() => {
    fetchAcademicClasses(tablePagination.current, tablePagination.pageSize);
  }, [fetchAcademicClasses, tablePagination.current, tablePagination.pageSize]);


  useEffect(() => {
    if (filterCollegeId) {
      fetchMajorsForFilterDropdown(filterCollegeId);
    } else {
      fetchMajorsForFilterDropdown();
    }
    setFilterMajorId(undefined);
  }, [filterCollegeId, fetchMajorsForFilterDropdown]);


  useEffect(() => {
    if (modalSelectedCollegeId && isModalVisible) {
      fetchMajorsForModalDropdown(modalSelectedCollegeId);
    } else if (!isModalVisible) {
      setModalSelectedCollegeId(null);
      setModalAvailableMajors([]);
    }
  }, [modalSelectedCollegeId, isModalVisible, fetchMajorsForModalDropdown]);

  const handleTableChange = (pagination: any) => {
    setTablePagination(prev => ({ ...prev, current: pagination.current, pageSize: pagination.pageSize }));
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setTablePagination(prev => ({ ...prev, current: 1 })); // Reset to first page
  };

  const handleFilterChange = () => {
    setTablePagination(prev => ({ ...prev, current: 1 }));
  };

  const handleAddClass = () => {
    setEditingAcademicClass(null);
    form.resetFields();
    setModalSelectedCollegeId(null);
    setModalAvailableMajors([]);
    setIsModalVisible(true);
  };

  const handleEditClass = (classToEdit: AcademicClassForTable) => {
    setEditingAcademicClass(classToEdit);
    setModalSelectedCollegeId(classToEdit.collegeId);
    form.setFieldsValue({
      name: classToEdit.name,
      classId: classToEdit.classId,
      entryYear: classToEdit.entryYear,
      graduationYear: classToEdit.graduationYear,
      college: classToEdit.collegeId,
      major: classToEdit.majorId,
      counselor: classToEdit.counselorId,
      classMonitor: classToEdit.classMonitorId,
      remarks: classToEdit.remarks,
    });
    setIsModalVisible(true);
  };

  const handleDeleteClass = async (classId: string, className: string) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除班级 "${className}" 吗？`,
      okText: '删除', okType: 'danger', cancelText: '取消',
      onOk: async () => {
        try {
          await apiClient.delete(`/academic-classes/${classId}`);
          message.success('班级删除成功');
          fetchAcademicClasses(tablePagination.current, tablePagination.pageSize); // Refresh current page
        } catch (err: any) { message.error(err.response?.data?.message || '删除班级失败'); }
      },
    });
  };

  const handleModalSubmit = async () => {
    try {
      const values = await form.validateFields();
      setModalLoading(true);

      const classData = {
        name: values.name,
        classId: values.classId || undefined, // Send undefined if empty
        major: values.major,
        entryYear: values.entryYear,
        graduationYear: values.graduationYear || undefined,
        counselor: values.counselor || undefined,
        classMonitor: values.classMonitor || undefined,
        remarks: values.remarks || undefined,
      };

      if (editingAcademicClass) {
        await apiClient.patch(`/academic-classes/${editingAcademicClass._id}`, classData);
        message.success('班级更新成功');
      } else {
        await apiClient.post('/academic-classes', classData);
        message.success('班级创建成功');
      }
      setIsModalVisible(false);
      fetchAcademicClasses(editingAcademicClass ? tablePagination.current : 1, tablePagination.pageSize);
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || '操作失败';
      if (err.isAxiosError && err.response?.data?.errors) {
        err.response.data.errors.forEach((valErr: any) => message.error(`${valErr.path || valErr.field}: ${valErr.msg}`));
      } else { message.error(errorMsg); }
    } finally { setModalLoading(false); }
  };

  const columns = [
    { title: '序号', key: 'index', width: 70, render: (_: any, __: any, index: number) => (tablePagination.current - 1) * tablePagination.pageSize + index + 1 },
    { title: '班级名称', dataIndex: 'name', key: 'name', width: 180, sorter: (a:any,b:any) => a.name.localeCompare(b.name)  },
    { title: '班级代码', dataIndex: 'classId', key: 'classId', width: 120, render: (text:string) => text || '-' },
    { title: '入学年份', dataIndex: 'entryYear', key: 'entryYear', width: 150, sorter: (a:any,b:any) => a.entryYear - b.entryYear },
    { title: '毕业年份', dataIndex: 'graduationYear', key: 'graduationYear', width: 100, render: (text:number) => text || '-' },
    { title: '所属专业', dataIndex: 'majorName', key: 'majorName', width: 180, sorter: (a:any,b:any) => a.majorName.localeCompare(b.majorName) },
    { title: '所属学院', dataIndex: 'collegeName', key: 'collegeName', width: 180, sorter: (a:any,b:any) => a.collegeName.localeCompare(b.collegeName) },
    { title: '辅导员', dataIndex: 'counselorName', key: 'counselorName', width: 120, render: (text:string) => text || '-' },
    { title: '班长', dataIndex: 'classMonitorName', key: 'classMonitorName', width: 120, render: (text:string) => text || '-' },
    { title: '备注', dataIndex: 'remarks', key: 'remarks', ellipsis: true, width: 150 },
    { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 170, render: (text: string) => text ? new Date(text).toLocaleString() : '-' },
    {
      title: '操作', key: 'action', fixed: 'right' as const, width: 180,
      render: (_: any, record: AcademicClassForTable) => (
        <Space size="small">
          {canEditClass && <Button type="primary" icon={<EditOutlined />} onClick={() => handleEditClass(record)}>编辑</Button>}
          {canDeleteClass && <Button type="primary" danger icon={<DeleteOutlined />} onClick={() => handleDeleteClass(record._id, record.name)}>删除</Button>}
        </Space>
      ),
    },
  ];

  if (loading && academicClasses.length === 0 && !error && tablePagination.current === 1) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}><Spin size="large" tip="加载班级数据中..." /></div>;
  }

  return (
    <>
      <Title level={2}>班级管理</Title>
      {error && <Alert message="错误" description={error} type="error" showIcon closable style={{ marginBottom: 16 }} onClose={() => setError(null)} />}
      
      <Space style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <Space wrap>
          <Search
            placeholder="搜索班级名称/代码"
            allowClear enterButton={<SearchOutlined />} style={{ width: 240 }}
            onSearch={handleSearch} loading={loading && searchTerm !== ''}
          />
          <Select
            placeholder="按学院筛选" allowClear style={{ width: 180 }}
            onChange={(value) => { setFilterCollegeId(value); handleFilterChange(); }}
            loading={allColleges.length === 0 && loading} value={filterCollegeId} showSearch
            filterOption={(input, option) => (option?.children as unknown as string ?? '').toLowerCase().includes(input.toLowerCase())}
          >
            {allColleges.map(c => <Option key={c._id} value={c._id}>{c.name}</Option>)}
          </Select>
          <Select
            placeholder="按专业筛选" allowClear style={{ width: 180 }}
            onChange={(value) => { setFilterMajorId(value); handleFilterChange(); }}
            // @ts-ignore
            loading={modalMajorsLoading || (loading && filterCollegeId && allMajorsForFilter.length === 0)}
            value={filterMajorId}
            disabled={!filterCollegeId && allMajorsForFilter.every(m => !m.college)} showSearch
            filterOption={(input, option) => (option?.children as unknown as string ?? '').toLowerCase().includes(input.toLowerCase())}
          >
            {allMajorsForFilter.map(m => <Option key={m._id} value={m._id}>{m.name}</Option>)}
          </Select>
          <Select
            placeholder="按入学年份筛选" allowClear style={{ width: 150 }}
            onChange={(value) => { setFilterEntryYear(value); handleFilterChange(); }}
            value={filterEntryYear}
          >
            {admissionYears.map(y => <Option key={y} value={y}>{y}年</Option>)}
          </Select>
        </Space>
        {canCreateClass && <Button type="primary" icon={<PlusOutlined />} onClick={handleAddClass}>添加班级</Button>}
      </Space>

      <Table
        dataSource={academicClasses} columns={columns} rowKey="key" loading={loading}
        scroll={{ x: 1800 }} // Adjusted scroll width
        pagination={{ ...tablePagination, showTotal: (total, range) => `${range[0]}-${range[1]} 共 ${total} 条` }}
        onChange={handleTableChange} sticky
      />

      <Modal
        title={editingAcademicClass ? `编辑班级: ${editingAcademicClass.name}` : '添加新班级'}
        open={isModalVisible} onOk={handleModalSubmit} onCancel={() => setIsModalVisible(false)}
        confirmLoading={modalLoading} destroyOnClose width={600}
      >
        <Form form={form} layout="vertical" name="academicClassForm">
          <Form.Item name="name" label={<Space>班级名称<Tooltip title="例如: 软件工程2101班"><InfoCircleOutlined /></Tooltip></Space>} rules={[{ required: true, message: '请输入班级名称!' }]}>
            <Input prefix={<TeamOutlined />} />
          </Form.Item>
          <Form.Item name="classId" label={<Space>班级代码<Tooltip title="班级的唯一代码 (可选), 例如 'SWE2101'"><InfoCircleOutlined /></Tooltip></Space>}
            rules={[{ pattern: /^[a-zA-Z0-9_.-]*$/, message: '班级代码只能包含字母、数字、下划线、点和连字符!'}]}>
            <Input prefix={<IdcardOutlined />} placeholder="例如: SWE2101"/>
          </Form.Item>
          <Form.Item name="entryYear" label="入学年份" rules={[{ required: true, message: '请选择入学年份!' }]}>
            <Select placeholder="选择入学年份" prefix={<CalendarOutlined />}>
              {admissionYears.map(y => <Option key={y} value={y}>{y}年</Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="graduationYear" label="毕业年份 (可选)">
            <Select placeholder="选择毕业年份" allowClear prefix={<CalendarOutlined />}>
              {gradYears.map(y => <Option key={y} value={y}>{y}年</Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="college" label="所属学院" rules={[{ required: true, message: '请选择所属学院!' }]}>
            <Select placeholder="选择学院" loading={allColleges.length === 0}
              onChange={(value) => { setModalSelectedCollegeId(value); form.setFieldsValue({ major: undefined }); }}
              showSearch filterOption={(input, option) => (option?.children as unknown as string ?? '').toLowerCase().includes(input.toLowerCase())}>
              {allColleges.map(c => <Option key={c._id} value={c._id}>{c.name}</Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="major" label="所属专业" rules={[{ required: true, message: '请选择所属专业!' }]}>
            <Select placeholder={modalSelectedCollegeId ? "选择专业" : "请先选择学院"}
              loading={modalMajorsLoading} disabled={!modalSelectedCollegeId || modalMajorsLoading}
              showSearch filterOption={(input, option) => (option?.children as unknown as string ?? '').toLowerCase().includes(input.toLowerCase())}>
              {modalAvailableMajors.map(m => <Option key={m._id} value={m._id}>{m.name}</Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="counselor" label="辅导员 (可选)">
            <Select placeholder="选择辅导员" allowClear showSearch loading={allUsers.length === 0 && loading} // Show loading if main page is loading and users not yet fetched
              // @ts-ignore
              filterOption={(input, option) => 
                option?.children?.toString().toLowerCase().includes(input.toLowerCase()) ||
                option?.value?.toString().toLowerCase().includes(input.toLowerCase())
              }
            >
              {allUsers.map(user => (
                <Option key={user._id} value={user._id}>
                  {user.realname ? `${user.realname} (${user.username})` : user.username}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="classMonitor" label="班长 (可选)">
            <Select placeholder="选择班长" allowClear showSearch loading={allUsers.length === 0 && loading} // Show loading if main page is loading and users not yet fetched
              // @ts-ignore
              filterOption={(input, option) => 
                option?.children?.toString().toLowerCase().includes(input.toLowerCase()) ||
                option?.value?.toString().toLowerCase().includes(input.toLowerCase())
              }
            >
              {allUsers.map(user => (
                <Option key={user._id} value={user._id}>
                  {user.realname ? `${user.realname} (${user.username})` : user.username}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="remarks" label="备注 (可选)">
            <Input.TextArea rows={3} placeholder="关于班级的其他说明" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default AcademicClassManagementPage;