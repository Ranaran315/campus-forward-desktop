import React from 'react';
import { Typography, Card, Row, Col, Statistic } from 'antd';
import { UserOutlined, SolutionOutlined, ProjectOutlined } from '@ant-design/icons';

const { Title } = Typography;

const DashboardPage: React.FC = () => {
  return (
    <div>
      <Title level={2} style={{ marginBottom: '24px' }}>仪表盘</Title>
      <Row gutter={16}>
        <Col span={8}>
          <Card>
            <Statistic
              title="活跃用户"
              value={1128}
              precision={0}
              valueStyle={{ color: '#3f8600' }}
              prefix={<UserOutlined />}
              suffix="人"
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="角色数量"
              value={5}
              precision={0}
              valueStyle={{ color: '#cf1322' }}
              prefix={<SolutionOutlined />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="待处理事项"
              value={12}
              prefix={<ProjectOutlined />}
              suffix="项"
            />
          </Card>
        </Col>
      </Row>
      <Title level={3} style={{ marginTop: '32px' }}>系统概览</Title>
      <p>欢迎来到后台管理系统。您可以在这里管理应用的用户、角色、权限以及其他系统设置。</p>
      {/* 在这里可以添加更多图表或系统信息 */}
    </div>
  );
};

export default DashboardPage;