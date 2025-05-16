import React, { useState } from 'react'
import {
  Layout,
  Menu,
  Typography,
  Breadcrumb,
  Button,
  Space,
  Tooltip,
} from 'antd'
import {
  UserOutlined,
  SettingOutlined,
  DashboardOutlined,
  HomeOutlined,
  ReloadOutlined,
  BankOutlined,
  BookOutlined,
  TeamOutlined,
} from '@ant-design/icons'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import './AdminLayout.css' // 您可以创建一个 CSS 文件来添加自定义样式

const { Header, Content, Sider, Footer } = Layout
const { Title } = Typography

const menuItems = [
  {
    key: 'dashboard',
    icon: <DashboardOutlined />,
    label: <Link to="/admin">仪表盘</Link>,
  },
  {
    key: 'users',
    icon: <UserOutlined />,
    label: <Link to="/admin/users">用户管理</Link>,
  },
  {
    key: 'roles',
    icon: <SettingOutlined />,
    label: <Link to="/admin/roles">角色与权限</Link>,
  },
  {
    key: 'colleges',
    icon: <BankOutlined />,
    label: <Link to="/admin/colleges">学院管理</Link>,
  },
  {
    key: 'majors', // 新增专业管理菜单项
    icon: <BookOutlined />, // 使用 BookOutlined 图标
    label: <Link to="/admin/majors">专业管理</Link>,
  },
  {
    key: 'academic-classes', // 新增班级管理菜单项
    icon: <TeamOutlined />, // 使用 TeamOutlined 图标
    label: <Link to="/admin/academic-classes">班级管理</Link>,
  },
  // 在这里添加其他后台管理菜单项
]

// 根据路径生成面包屑
const breadcrumbNameMap: Record<string, string> = {
  '/admin': '仪表盘',
  '/admin/users': '用户管理',
  '/admin/roles': '角色与权限',
  '/admin/colleges': '学院管理',
  '/admin/majors': '专业管理',
  '/admin/academic-classes': '班级管理',
}

const AdminLayout: React.FC = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)

  const handleRefreshPage = () => {
    navigate(0)
    // 或者，如果您想通过 React Router 的方式（可能会重新运行 loader 等）:
    // navigate(0);
  }

  // 生成面包屑
  const pathSnippets = location.pathname.split('/').filter((i) => i)
  const extraBreadcrumbItems = pathSnippets.map((_, index) => {
    const url = `/${pathSnippets.slice(0, index + 1).join('/')}`
    return (
      <Breadcrumb.Item key={url}>
        <Link to={url}>{breadcrumbNameMap[url] || pathSnippets[index]}</Link>
      </Breadcrumb.Item>
    )
  })

  const breadcrumbItems = [
    <Breadcrumb.Item key="home">
      <Link to="/admin">
        <HomeOutlined /> 后台管理
      </Link>
    </Breadcrumb.Item>,
  ].concat(extraBreadcrumbItems.slice(1)) // 从第二个开始，因为第一个是 /admin

  // 根据当前路径确定选中的菜单项
  const getSelectedKeys = () => {
    const currentPath = location.pathname
    if (currentPath.startsWith('/admin/users')) return ['users']
    if (currentPath.startsWith('/admin/roles')) return ['roles']
    if (currentPath.startsWith('/admin/colleges')) return ['colleges']
    if (currentPath.startsWith('/admin/majors')) return ['majors']
    if (currentPath.startsWith('/admin/academic-classes'))
      return ['academic-classes']
    if (currentPath === '/admin' || currentPath === '/admin/')
      return ['dashboard']
    // 可以为其他路径添加更多判断
    return ['dashboard'] // 默认选中仪表盘
  }

  const handleGoToMainApp = () => {
    navigate('/') // 跳转回主应用
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={(value) => setCollapsed(value)}
        theme="dark"
        width={220}
      >
        <div className="admin-logo-vertical">
          {collapsed ? '管理' : '校园后台管理'}
        </div>
        <Menu
          theme="dark"
          selectedKeys={getSelectedKeys()}
          mode="inline"
          items={menuItems}
        />
      </Sider>
      <Layout className="admin-site-layout">
        <Header className="admin-layout-header">
          <Title
            level={4}
            style={{ color: '#fff', margin: 0, lineHeight: '64px' }}
          >
            管理控制台
          </Title>
          <Space align="center">
            {' '}
            {/* <--- 3. 使用 Space 组件包裹按钮 */}
            <Tooltip title="刷新页面">
              {' '}
              {/* <--- 4. 添加 Tooltip 提示 */}
              <Button
                type="text" // 使用 text 类型按钮以适应头部样式
                icon={
                  <ReloadOutlined
                    style={{ color: 'white', fontSize: '18px' }}
                  />
                } // 设置图标颜色和大小
                onClick={handleRefreshPage}
                style={{ color: 'white' }} // 确保按钮文字（如果有）也是白色
              />
            </Tooltip>
            <Button
              type="link"
              onClick={handleGoToMainApp}
              style={{ color: 'white' }}
            >
              返回主应用
            </Button>
          </Space>
        </Header>
        <Content className="admin-layout-content" style={{ margin: '0 16px' }}>
          <Breadcrumb style={{ margin: '16px 0' }}>
            {breadcrumbItems}
          </Breadcrumb>
          <div className="admin-layout-content-background">
            <Outlet /> {/* 后台管理的子路由将在这里渲染 */}
          </div>
        </Content>
        <Footer style={{ textAlign: 'center' }}>
          Campus Admin Panel ©{new Date().getFullYear()} Created by Ranaran
        </Footer>
      </Layout>
    </Layout>
  )
}

export default AdminLayout
