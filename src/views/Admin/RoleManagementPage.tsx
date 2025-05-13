import React, { useEffect, useState } from 'react';
import {
  Typography,
  Table,
  Tag,
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
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  SafetyCertificateOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import apiClient from '@/lib/axios';
import { useAuth } from '@/contexts/AuthContext';
import { ALL_PERMISSION_STRINGS, PermissionString } from '@/constants/permissions'; // Assuming you have this from previous steps

const { Title } = Typography;
const { Search } = Input;
const { Option } = Select;

// Types for Role Management
interface BackendRole {
  _id: string;
  name: string;
  displayName: string;
  description?: string;
  permissions: PermissionString[];
  isSystemRole?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface RoleForTable extends BackendRole {
  key: string;
  permissionsCount: number;
}

// Helper to transform backend role to table role
const transformRoleForTable = (role: BackendRole): RoleForTable => ({
  ...role,
  key: role._id,
  permissionsCount: role.permissions?.length || 0,
});

const RoleManagementPage: React.FC = () => {
  const { checkPermission } = useAuth();
  const [roles, setRoles] = useState<RoleForTable[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [editingRole, setEditingRole] = useState<RoleForTable | null>(null);
  const [form] = Form.useForm();
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [tablePagination, setTablePagination] = useState({
    current: 1,
    pageSize: 10,
  });

  // Permissions
  const canCreateRole = checkPermission('role:create');
  const canEditRole = checkPermission('role:update');
  const canDeleteRole = checkPermission('role:delete');
  // const canViewPermissionsList = checkPermission('permission:list_all_available'); // For populating selector

  // Fetch Roles
  const fetchRoles = async (query?: string) => {
    setLoading(true);
    setError(null);
    try {
      // Assuming backend supports search via query param 'q' or 'name' or 'displayName'
      // Adjust endpoint if backend search is different
      const endpoint = query ? `/roles?q=${encodeURIComponent(query)}` : '/roles';
      const response = await apiClient.get(endpoint);
      const fetchedRoles: BackendRole[] = response.data;
      if (fetchedRoles) {
        setRoles(fetchedRoles.map(transformRoleForTable));
      } else {
        setRoles([]);
      }
    } catch (err: any) {
      console.error('Failed to fetch roles:', err);
      const errorMsg = err.backendMessage || err.message || '获取角色列表失败';
      setError(errorMsg);
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
    // fetchAllPermissions(); // If permissions are fetched from backend
  }, []);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    fetchRoles(value);
  };

  const handleAddRole = () => {
    setEditingRole(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEditRole = (roleToEdit: RoleForTable) => {
    setEditingRole(roleToEdit);
    form.setFieldsValue({
      name: roleToEdit.name,
      displayName: roleToEdit.displayName,
      description: roleToEdit.description,
      permissions: roleToEdit.permissions,
      isSystemRole: roleToEdit.isSystemRole,
    });
    setIsModalVisible(true);
  };

  const handleDeleteRole = async (roleId: string, roleName: string) => {
    const roleToDelete = roles.find(r => r._id === roleId);
    if (roleToDelete?.isSystemRole) {
      message.error(`系统角色 "${roleName}" 不能删除。`);
      return;
    }
    // Add other critical role name checks if necessary
    if (roleName === 'admin' || roleName === 'superadmin' || roleName === 'student' || roleName === 'staff') {
         message.error(`核心角色 "${roleName}" 不建议删除。`);
         // return; // Uncomment if strict deletion prevention is needed
    }

    Modal.confirm({
      title: '确认删除',
      content: `确定要删除角色 "${roleName}" (ID: ${roleId}) 吗？此操作不可恢复。`,
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          setLoading(true);
          await apiClient.delete(`/roles/${roleId}`);
          message.success('角色删除成功');
          fetchRoles(searchTerm);
        } catch (err: any) {
          console.error('Failed to delete role:', err);
          message.error(err.backendMessage || err.message || '删除角色失败');
        } finally {
          setLoading(false);
        }
      },
    });
  };

   const handleModalSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      let roleData: Partial<BackendRole> & { permissions: PermissionString[] } = { // 使用 Partial 允许 isSystemRole 可选
        name: values.name,
        displayName: values.displayName,
        description: values.description,
        permissions: values.permissions || [],
      };

      if (editingRole) {
        // For system roles, name might be uneditable
        if (editingRole.isSystemRole && editingRole.name !== values.name) {
          message.error(`系统角色的内部名称 "${editingRole.name}" 不能修改。`);
          setLoading(false);
          return;
        }

        // **关键修复点**：
        // 如果正在编辑的角色是系统角色，则在提交的数据中明确保留其 isSystemRole 状态。
        // 否则，对于非系统角色，我们通常不通过UI修改此状态，所以可以不发送它，
        // 或者如果后端允许创建时设置，则在创建新角色时处理。
        // 对于 PATCH 操作，如果后端期望 isSystemRole 字段，并且我们不想改变它，
        // 最好从 editingRole 中获取。
        if (editingRole.isSystemRole !== undefined) { // 确保 editingRole 有 isSystemRole 属性
            roleData.isSystemRole = editingRole.isSystemRole;
        }
        // 或者，如果后端 PATCH 仅更新提供的字段，并且您不希望 isSystemRole 被更改，
        // 那么在 roleData 中不包含 isSystemRole 字段也是一种策略，
        // 但这取决于您的后端如何处理部分更新。
        // 最安全的方式是，如果编辑的是系统角色，就明确发送 isSystemRole: true。

        await apiClient.patch(`/roles/${editingRole._id}`, roleData);
        message.success('角色更新成功');
      } else {
        // 创建新角色时，isSystemRole 通常默认为 false，或由后端设置。
        // 如果允许通过UI创建系统角色（通常不推荐），则需要在这里处理。
        // roleData.isSystemRole = values.isSystemRole; // 如果表单中有可编辑的 isSystemRole 字段
        await apiClient.post('/roles', roleData);
        message.success('角色创建成功');
      }
      setIsModalVisible(false);
      fetchRoles(searchTerm);
    } catch (err: any) {
      console.error('Modal submit error:', err);
      message.error(err.backendMessage || err.message || '操作失败');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: '序号',
      key: 'index',
      width: 80,
      render: (_text: any, _record: RoleForTable, index: number) =>
        (tablePagination.current - 1) * tablePagination.pageSize + index + 1,
    },
    {
      title: '角色名 (标识)',
      dataIndex: 'name',
      key: 'name',
      width: 180,
    },
    {
      title: '显示名称',
      dataIndex: 'displayName',
      key: 'displayName',
      width: 180,
    },
    {
      title: '权限数量',
      dataIndex: 'permissionsCount',
      key: 'permissionsCount',
      align: 'center' as const,
      width: 120,
    },
    {
      title: '系统角色',
      dataIndex: 'isSystemRole',
      key: 'isSystemRole',
      align: 'center' as const,
      width: 100,
      render: (isSystem: boolean) =>
        isSystem ? <Tag color="red">是</Tag> : <Tag color="blue">否</Tag>,
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right' as const,
      width: 200,
      render: (_: any, record: RoleForTable) => (
        <Space size="small">
          {canEditRole && (
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={() => handleEditRole(record)}
            >
              编辑
            </Button>
          )}
          {canDeleteRole && (
            <Button
              type="primary"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDeleteRole(record._id, record.displayName)}
              disabled={record.isSystemRole || record.name === 'admin' || record.name === 'superadmin'} // Disable delete for system roles or critical roles
            >
              删除
            </Button>
          )}
        </Space>
      ),
    },
  ];

  if (loading && roles.length === 0 && !error) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
        <Spin size="large" tip="加载角色数据中..." />
      </div>
    );
  }

  return (
    <>
      <Title level={2}>角色与权限管理</Title>
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
      <Space style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <Search
          placeholder="搜索角色 (标识, 显示名称)"
          allowClear
          enterButton={<SearchOutlined />}
          style={{ width: 300 }}
          onSearch={handleSearch}
          loading={loading && searchTerm !== ''}
        />
        {canCreateRole && (
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAddRole}>
            添加角色
          </Button>
        )}
      </Space>
      <Table
        dataSource={roles}
        columns={columns}
        rowKey="key"
        loading={loading}
        scroll={{ x: 1000 }} // Adjust x-scroll as needed
        pagination={{
          current: tablePagination.current,
          pageSize: tablePagination.pageSize,
          total: roles.length, // Replace with backend total count if server-side pagination is implemented
        }}
        onChange={(pagination) => {
          setTablePagination({
            current: pagination.current || 1,
            pageSize: pagination.pageSize || 10,
          });
        }}
        sticky
      />
      <Modal
        title={editingRole ? `编辑角色: ${editingRole.displayName}` : '添加新角色'}
        open={isModalVisible}
        onOk={handleModalSubmit}
        onCancel={() => setIsModalVisible(false)}
        confirmLoading={loading}
        destroyOnClose
        width={700} // Wider modal for permissions list
      >
        <Form form={form} layout="vertical" name="roleForm">
          <Form.Item
            name="name"
            label={
              <Space>
                角色名 (标识)
                <Tooltip title="内部使用的唯一英文标识，例如 'department_admin'">
                  <InfoCircleOutlined />
                </Tooltip>
              </Space>
            }
            rules={[
              { required: true, message: '请输入角色名!' },
              {
                pattern: /^[a-zA-Z0-9_]+$/,
                message: '角色名只能包含字母、数字和下划线!',
              },
            ]}
          >
            <Input
              prefix={<SafetyCertificateOutlined />}
              disabled={!!editingRole && editingRole.isSystemRole} // System role names usually cannot be changed
            />
          </Form.Item>
          <Form.Item
            name="displayName"
            label="显示名称"
            rules={[{ required: true, message: '请输入显示名称!' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item
            name="permissions"
            label="权限分配"
            rules={[{ type: 'array' }]}
          >
            <Select
              mode="multiple"
              allowClear
              style={{ width: '100%' }}
              placeholder="请选择权限"
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={ALL_PERMISSION_STRINGS.map((permission) => ({
                label: permission,
                value: permission,
              }))}
            />
          </Form.Item>
           {editingRole && editingRole.isSystemRole !== undefined && (
            <Form.Item name="isSystemRole" label="系统角色">
              <Select disabled style={{ width: 120 }}>
                <Option value={true}>是</Option>
                <Option value={false}>否</Option>
              </Select>
            </Form.Item>
          )}
        </Form>
      </Modal>
    </>
  );
};

export default RoleManagementPage;