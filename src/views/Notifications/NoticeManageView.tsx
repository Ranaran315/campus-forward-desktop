import React from 'react';
import { useParams } from 'react-router-dom';
import { Typography } from 'antd';

const { Title, Text } = Typography;

const NoticeManageView: React.FC = () => {
  const { noticeId } = useParams<{ noticeId: string }>();

  return (
    <div style={{ padding: '20px' }}>
      <Title level={3}>通知管理页面</Title>
      <Text>正在管理通知 ID: {noticeId}</Text>
      <Text type="secondary" style={{ display: 'block', marginTop: '20px' }}>
        (此页面的详细用户界面将在后续步骤中实现。)
      </Text>
    </div>
  );
};

export default NoticeManageView;