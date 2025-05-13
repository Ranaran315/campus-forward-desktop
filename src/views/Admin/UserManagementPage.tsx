import React from 'react';
import { Typography, Table, Tag, Space, Button, Input } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';

const { Title } = Typography;
const { Search } = Input;

// 示例数据
const dataSource = [
  {
    key: '1',
    username: 'admin',
    nickname: '超级管理员',
    email: 'admin@example.com',
    roles: ['SuperAdmin', 'Admin'],
    status: 'active',
  },
  {
    key: '2',
    username: 'student001',
    nickname: '张三',
    email: 'zhangsan@example.com',
    roles: ['Student'],
    status: 'active',
  },
  {
    key: '3',
    username: 'teacher001',
    nickname: '李四',
    email: 'lisi@example.com',
    roles: ['Staff', 'Teacher'],
    status: 'inactive',
  },
];

const columns = [
  {
    title: '用户名',
    dataIndex: 'username',
    key: 'username',
  },
  {
    title: '昵称',
    dataIndex: 'nickname',
    key: 'nickname',
  },
  {
    title: '邮箱',
    dataIndex: 'email',
    key: 'email',
  },
  {
    title: '角色',
    key: 'roles',
    dataIndex: 'roles',
    render: (roles: string[]) => (
      <>
        {roles.map(role => {
          let color = role.length > 5 ? 'geekblue' : 'green';
          if (role === 'SuperAdmin') {
            color = 'volcano';
          }
          return (
            <Tag color={color} key={role}>
              {role.toUpperCase()}
            </Tag>
          );
        })}
      </>
    ),
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    render: (status: string) => (
        <Tag color={status === 'active' ? 'green' : 'red'}>
            {status === 'active' ? '激活' : '禁用'}
        </Tag>
    )
  },
  {
    title: '操作',
    key: 'action',
    render: (_: any, record: any) => (
      <Space size="middle">
        <Button type="primary" icon={<EditOutlined />} onClick={() => console.log('Edit', record.key)}>编辑</Button>
        <Button type="primary" danger icon={<DeleteOutlined />} onClick={() => console.log('Delete', record.key)}>删除</Button>
      </Space>
    ),
  },
];


const UserManagementPage: React.FC = () => {
  return (
    <div>
      <Title level={2}>用户管理</Title>
      <Space style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <Search
            placeholder="搜索用户 (用户名, 昵称, 邮箱)"
            allowClear
            enterButton={<SearchOutlined />}
            style={{ width: 400 }}
            onSearch={(value) => console.log('Search:', value)}
        />
        <Button type="primary" icon={<PlusOutlined />}>
          添加用户
        </Button>
      </Space>
      <Table dataSource={dataSource} columns={columns} rowKey="key" />
    </div>
  );
};

export default UserManagementPage;