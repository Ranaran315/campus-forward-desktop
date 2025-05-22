import React from 'react'
import {
  Form,
  Input,
  Select,
  DatePicker,
  Checkbox,
  Button,
  Upload,
  Row,
  Col,
} from 'antd'
import { UploadOutlined } from '@ant-design/icons'
import { FormInstance } from 'antd/lib/form'

const { Option } = Select
const { TextArea } = Input

interface PublishNoticeFormProps {
  formInstance: FormInstance
  onCancel: () => void
  onPublish: (values: any) => void
}

const PublishNoticeForm: React.FC<PublishNoticeFormProps> = ({
  formInstance,
  onCancel,
  onPublish,
}) => {
  // Dummy options for select fields - replace with actual data sources
  const senderIdentities = [
    { id: '1', name: '学生会' },
    { id: '2', name: '教务处' },
    { id: '3', name: '后勤集团' },
    { id: 'admin', name: '管理员' },
  ]

  const targetAudiences = [
    { id: 'all', name: '全体成员' },
    { id: 'students', name: '全体学生' },
    { id: 'teachers', name: '全体教职工' },
    { id: 'cs_students', name: '计算机学院学生' },
  ]

  const tags = ['重要', '会议', '活动', '选课', '讲座', '失物招领']

  return (
    <Form form={formInstance} layout="vertical" name="publish_notice_form">
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="senderIdentity"
            label="发布者身份"
            rules={[{ required: true, message: '请选择发布者身份!' }]}
          >
            <Select placeholder="选择发布者身份">
              {senderIdentities.map((identity) => (
                <Option key={identity.id} value={identity.id}>
                  {identity.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="targetAudience"
            label="目标受众"
            rules={[{ required: true, message: '请选择目标受众!' }]}
          >
            <Select mode="multiple" placeholder="选择目标受众">
              {targetAudiences.map((audience) => (
                <Option key={audience.id} value={audience.id}>
                  {audience.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
      </Row>

      <Form.Item
        name="title"
        label="通知标题"
        rules={[{ required: true, message: '请输入通知标题!' }]}
      >
        <Input placeholder="输入通知标题" />
      </Form.Item>

      <Form.Item
        name="content"
        label="通知内容"
        rules={[{ required: true, message: '请输入通知内容!' }]}
      >
        <TextArea rows={6} placeholder="输入通知内容 (支持Markdown)" />
        {/* For a rich text editor, replace TextArea with the editor component */}
      </Form.Item>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="tags" label="标签">
            <Select mode="tags" placeholder="添加标签">
              {tags.map((tag) => (
                <Option key={tag} value={tag}>
                  {tag}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="importance"
            label="重要程度"
            rules={[{ required: true, message: '请选择重要程度!' }]}
          >
            <Select placeholder="选择重要程度">
              <Option value="high">紧急</Option>
              <Option value="medium">重要</Option>
              <Option value="low">一般</Option>
            </Select>
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="deadline" label="截止日期">
            <DatePicker style={{ width: '100%' }} placeholder="选择截止日期" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="attachments" label="附件">
            <Upload beforeUpload={() => false} listType="picture">
              <Button icon={<UploadOutlined />}>上传附件</Button>
            </Upload>
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="needsFeedback" valuePropName="checked">
            <Checkbox>需要反馈</Checkbox>
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="needsConfirmation" valuePropName="checked">
            <Checkbox>需要确认已读</Checkbox>
          </Form.Item>
        </Col>
      </Row>

      {/* Footer buttons are now part of the Modal in NotificationsSidebar.tsx */}
      {/* The onCancel and onPublish props are kept for flexibility but might be unused if Modal handles all actions */}
    </Form>
  )
}

export default PublishNoticeForm
