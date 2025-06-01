import React, { useState, useEffect } from 'react'
import {
  Form,
  Input,
  Select,
  DatePicker,
  Button,
  Space,
  Row,
  Col,
  FormInstance,
  message,
  UploadFile,
} from 'antd'
import { NoticeAttachmentUpload } from '@/components/FileUpload'
import apiClient from '@/lib/axios'
import { useNavigate } from 'react-router-dom'
import PublishTargetModal, {
  TargetData,
} from '@/components/Modal/PublishTargetModal/PublishTargetModal'
import { getAttachmentUrl } from '@/utils/imageHelper'
import dayjs from 'dayjs'

const { Option } = Select
const { TextArea } = Input

// Helper function to transform backend attachments to antd UploadFile
const transformBackendAttachmentToAntd = (backendAtt: any): UploadFile => {
  const completeUrl = backendAtt.url ? getAttachmentUrl(backendAtt.url) : undefined;
  return {
    uid: backendAtt.url || backendAtt.fileName || Date.now().toString(),
    name: backendAtt.fileName || '未命名文件',
    status: 'done',
    url: completeUrl,
    thumbUrl: completeUrl,
    size: backendAtt.size,
  };
};

interface NoticeFormProps {
  formInstance: FormInstance
  status?: 'draft' | 'published' | 'archived'
  id?: string
}

const NoticeForm: React.FC<NoticeFormProps> = ({
  formInstance,
  status,
  id,
}) => {
  const [isPublishModalVisible, setIsPublishModalVisible] = useState(false)
  const [isSavingDraft, setIsSavingDraft] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const navigate = useNavigate()

  const isNew = !id
  const isDraft = status === 'draft'
  const isPublished = status === 'published'
  const isArchived = status === 'archived'

  useEffect(() => {
    if (id && formInstance) {
      const loadNoticeDetails = async () => {
        try {
          message.loading({ content: '正在加载通知详情...', key: 'loadNotice' });
          const response = await apiClient.get(`/informs/${id}`);
          const noticeDetailsFromBackend = response.data.data || response.data;

          if (noticeDetailsFromBackend) {
            let attachmentsForForm: UploadFile[] = [];
            if (noticeDetailsFromBackend.attachments && Array.isArray(noticeDetailsFromBackend.attachments)) {
              attachmentsForForm = noticeDetailsFromBackend.attachments.map(
                (att: any) => transformBackendAttachmentToAntd(att)
              );
            }
            
            console.log('[DEBUG] Transformed attachments for form:', attachmentsForForm);

            formInstance.setFieldsValue({
              title: noticeDetailsFromBackend.title,
              content: noticeDetailsFromBackend.content,
              description: noticeDetailsFromBackend.description,
              importance: noticeDetailsFromBackend.importance,
              tags: noticeDetailsFromBackend.tags || [],
              deadline: noticeDetailsFromBackend.deadline ? dayjs(noticeDetailsFromBackend.deadline) : null,
              allowComments: noticeDetailsFromBackend.allowReplies !== undefined ? noticeDetailsFromBackend.allowReplies : true,
              attachments: attachmentsForForm,
            });
            message.success({ content: '通知详情加载完毕!', key: 'loadNotice' });
          } else {
            message.error({ content: '未找到通知详情。', key: 'loadNotice' });
          }
        } catch (error) {
          message.error({ content: `加载通知详情失败: ${(error as Error).message}`, key: 'loadNotice' });
          console.error('Error loading notice details:', error);
        }
      };
      loadNoticeDetails();
    } else if (formInstance) {
      formInstance.resetFields();
    }
  }, [id, formInstance]);

  const handleCancel = () => {
    if (isNew) {
      navigate('/notifications')
    } else {
      navigate(-1)
    }
  }

  // 准备基础通知数据（不包含目标受众和发布者身份）
  const prepareBaseNoticeData = (values: any) => {
    const noticeData: any = {
      title: values.title,
      content: values.content,
      description: values.description,
      importance: values.importance || 'low',
      allowReplies:
        values.allowComments === undefined ? true : values.allowComments,
      attachments: values.attachments
        ? values.attachments.map((att: UploadFile<any>) => { 
            if (att.response && att.response.url && att.originFileObj) { 
              return {
                fileName: att.response.originalname || att.name, 
                url: att.response.url, 
                size: att.response.size,
                mimetype: att.response.mimetype || att.type,
              };
            } else if (att.url && att.fileName) { 
              return {
                fileName: att.fileName,
                url: att.url,
                size: att.size,
                mimetype: (att as any).mimetype, 
              };
            } else if (att.originFileObj) { 
              console.warn('Attachment without URL in response:', att);
              return null; 
            }
            console.warn('Unknown attachment structure:', att);
            return null; 
          }).filter((att: any): att is { fileName: string; url: string; size?: number; mimetype?: string } => att !== null && att.url && att.fileName) 
        : [],
    }

    // 处理截止日期
    if (values.deadline) {
      if (
        typeof values.deadline.isValid === 'function' &&
        values.deadline.isValid() &&
        typeof values.deadline.toISOString === 'function'
      ) {
        noticeData.deadline = values.deadline.toISOString()
      }
    }

    // 处理标签
    if (values.tags && Array.isArray(values.tags) && values.tags.length > 0) {
      noticeData.tags = values.tags
    }

    // 清理未定义的属性
    Object.keys(noticeData).forEach((key) => {
      if (noticeData[key] === undefined) {
        delete noticeData[key]
      }
      if (key === 'attachments' && !noticeData[key]) {
        noticeData[key] = []
      }
    })

    return noticeData
  }
  // 点击"存为草稿"按钮时的处理函数
  const handleSaveDraftClick = () => {
    formInstance
      .validateFields(['title', 'content']) // 只验证必要字段
      .then(async () => {
        setIsSavingDraft(true)
        // 获取所有表单字段值，而不只是验证的字段
        const allValues = formInstance.getFieldsValue(true)
        console.log('表单所有值:', allValues)
        try {
          const draftData = prepareBaseNoticeData(allValues)
          console.log('提交的草稿数据:', draftData)
          const response = await apiClient.post('/informs/draft', draftData)
          message.success('草稿保存成功!')
          if (isNew) {
            // 获取返回的ID (处理两种可能的响应结构)
            const draftId = response.data._id || response.data.data?._id
            navigate(`/notifications/edit/${draftId}`)
          }
        } catch (error: any) {
          console.error('Failed to save draft:', error)
          const errMsg = error.response?.data?.message
          message.error(
            Array.isArray(errMsg) ? errMsg.join('; ') : errMsg || '草稿保存失败'
          )
        } finally {
          setIsSavingDraft(false)
        }
      })
      .catch(() => message.error('请至少填写标题和内容!'))
  }

  // 点击发布按钮，打开目标选择模态框
  const handlePublishClick = () => {
    formInstance
      .validateFields(['title', 'content', 'importance'])
      .then(() => setIsPublishModalVisible(true))
      .catch(() => message.error('请检查表单是否正确填写!'))
  }
  // 处理目标选择后的发布操作
  const handlePublishWithTarget = async (targetData: TargetData) => {
    setIsSubmitting(true)
    try {
      const values = formInstance.getFieldsValue()
      const noticeData = prepareBaseNoticeData(values)
      console.log('基础通知数据:', noticeData)

      // 发布请求参数，确保完全符合 PublishInformDto 结构
      const publishData = {
        targetScope: targetData.targetScope,
        targetUsers:
          targetData.targetScope === 'SPECIFIC_USERS'
            ? targetData.targetUsers || []
            : [],
        userTypeFilter:
          targetData.targetScope !== 'SPECIFIC_USERS'
            ? targetData.userTypeFilter || null
            : null,
        // senderIdentity 字段已从发布参数中移除
      }

      console.log('发布参数:', publishData)
      console.log(
        `发布模式: ${targetData.targetScope} | 目标用户数量: ${
          publishData.targetUsers.length
        } | 用户筛选类型: ${publishData.userTypeFilter || '无'}`
      )

      if (id) {
        // 发布通知，传递目标受众信息
        await apiClient.post(`/informs/${id}/publish`, publishData)
      } else {
        // 创建草稿
        const draftResponse = await apiClient.post('/informs/draft', noticeData)
        const draftId = draftResponse.data._id || draftResponse.data.data?._id
        // 发布通知，传递目标受众信息
        await apiClient.post(`/informs/${draftId}/publish`, publishData)
      }

      message.success('通知发布成功!')
      navigate('/notifications/my-created')
    } catch (error: any) {
      console.error('Failed to publish notice:', error)
      const errMsg = error.response?.data?.message
      message.error(
        Array.isArray(errMsg) ? errMsg.join('; ') : errMsg || '通知发布失败'
      )
    } finally {
      setIsSubmitting(false)
      setIsPublishModalVisible(false)
    }
  }

  // 处理删除草稿
  const handleDeleteDraft = () => {
    apiClient
      .delete(`/informs/${id}`)
      .then(() => {
        message.success('已删除')
        navigate(-1)
      })
      .catch(() => message.error('删除失败'))
  }

  // 撤销已发布的通知
  const handleRevokePublished = async () => {
    try {
      await apiClient.post(`/informs/${id}/revoke`)
      message.success('已撤销发布')
      navigate(-1)
    } catch {
      message.error('撤销失败')
    }
  }

  // 归档已发布的通知
  const handleArchived = async () => {
    try {
      await apiClient.post(`/informs/${id}/archive`)
      message.success('已归档')
      navigate(-1)
    } catch {
      message.error('归档失败')
    }
  }

  return (
    <>
      <Form
        form={formInstance}
        layout="vertical"
        name="publish_notice_form"
        disabled={isArchived}
      >
        {/* 通知内容相关表单项 */}
        <Form.Item
          name="title"
          label="标题"
          rules={[{ required: true, message: '请输入通知标题!' }]}
        >
          <Input placeholder="输入通知标题" />
        </Form.Item>
        <Form.Item
          name="description"
          label="摘要/描述 (可选)"
          rules={[{ max: 250, message: '摘要内容不能超过250个字符' }]}
        >
          <TextArea
            rows={2}
            placeholder="输入通知的简短摘要或描述，将显示在列表视图中"
          />
        </Form.Item>
        <Form.Item
          name="content"
          label="正文内容"
          rules={[{ required: true, message: '请输入通知正文内容!' }]}
        >
          <TextArea rows={6} placeholder="输入通知的详细内容" />
        </Form.Item>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="tags" label="标签">
              <Select mode="tags" placeholder="输入并按回车添加标签"></Select>
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
        </Row>{' '}
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="deadline" label="截止日期">
              <DatePicker
                style={{ width: '100%' }}
                placeholder="选择截止日期"
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="attachments" label="附件">
              <NoticeAttachmentUpload />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item>
          <Space>
            <Button onClick={handleCancel}>{isNew ? '取消' : '返回'}</Button>

            {/* 草稿状态 - 显示保存、发布、删除 */}
            {(isNew || isDraft) && (
              <>
                <Button onClick={handleSaveDraftClick} loading={isSavingDraft}>
                  存为草稿
                </Button>
                <Button type="primary" onClick={handlePublishClick}>
                  发布
                </Button>
              </>
            )}
            {isDraft && (
              <Button danger onClick={handleDeleteDraft}>
                删除
              </Button>
            )}

            {/* 已发布状态 - 显示撤销、归档 */}
            {isPublished && (
              <>
                <Button onClick={handleRevokePublished}>撤销发布</Button>
                <Button onClick={handleArchived}>归档</Button>
              </>
            )}
          </Space>
        </Form.Item>
      </Form>

      <PublishTargetModal
        visible={isPublishModalVisible}
        onCancel={() => setIsPublishModalVisible(false)}
        onOk={handlePublishWithTarget}
        confirmLoading={isSubmitting}
      />
    </>
  )
}

export default NoticeForm
