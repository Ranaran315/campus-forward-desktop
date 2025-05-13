import React from 'react';
import { Typography, Table, Tag, Space, Button, Input } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, SearchOutlined } from '@ant-design/icons';

const { Title } = Typography;
const { Search } = Input;

// 示例数据
const rolesDataSource = [
  {
    key: '1',
    name: 'SuperAdmin',
    displayName: '超级管理员',
    permissionsCount: 50, // 假设权限数量
    description: '拥有系统所有权限',
  },
  {
    key: '2',
    name: 'Student',
    displayName: '学生',
    permissionsCount: 15,
    description: '学生用户的基础权限',
  },
  {
    key: '3',
    name: 'Staff',
    displayName: '教职工',
    permissionsCount: 25,
    description: '教职工用户的基础权限',
  },
    {
    key: '4',
    name: 'DepartmentAdmin',
    displayName: '院系管理员',
    permissionsCount: 30,
    description: '管理特定院系事务的权限',
  },
];

const rolesColumns = [
  {
    title: '角色名 (标识)',
    dataIndex: 'name',
    key: 'name',
  },
  {
    title: '显示名称',
    dataIndex: 'displayName',
    key: 'displayName',
  },
  {
    title: '权限数量',
    dataIndex: 'permissionsCount',
    key: 'permissionsCount',
    align: 'center',
  },
  {
    title: '描述',
    dataIndex: 'description',
    key: 'description',
  },
  {
    title: '操作',
    key: 'action',
    render: (_: any, record: any) => (
      <Space size="middle">
        <Button icon={<EyeOutlined />} onClick={() => console.log('View Permissions', record.key)}>查看权限</Button>
        <Button type="primary" icon={<EditOutlined />} onClick={() => console.log('Edit Role', record.key)}>编辑角色</Button>
        <Button type="primary" danger icon={<DeleteOutlined />} onClick={() => console.log('Delete Role', record.key)} disabled={record.name === 'SuperAdmin'}>删除角色</Button>
      </Space>
    ),
  },
];

const RoleManagementPage: React.FC = () => {
  return (
    <div>
      <Title level={2}>角色与权限管理</Title>
       <Space style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <Search
            placeholder="搜索角色 (角色名, 显示名称)"
            allowClear
            enterButton={<SearchOutlined />}
            style={{ width: 300 }}
            onSearch={(value) => console.log('Search Roles:', value)}
        />
        <Button type="primary" icon={<PlusOutlined />}>
          添加角色
        </Button>
      </Space>
      {/* @ts-ignore */}
      <Table dataSource={rolesDataSource} columns={rolesColumns} rowKey="key" />
    </div>
  );
};

export default RoleManagementPage;