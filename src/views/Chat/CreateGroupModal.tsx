import React, { useState } from 'react';
import { Modal, Form, Input, Upload, message, Checkbox } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import type { RcFile, UploadProps } from 'antd/es/upload';
import apiClient from '@/lib/axios';

interface CreateGroupModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (conversationId: string) => void;
}

const CreateGroupModal: React.FC<CreateGroupModalProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [loading, setLoading] = useState(false);

  // 处理图片上传前的验证
  const beforeUpload = (file: RcFile) => {
    const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/webp';
    if (!isJpgOrPng) {
      message.error('只能上传 JPG/PNG/WebP 格式的图片！');
    }
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error('图片大小不能超过 2MB！');
    }
    return isJpgOrPng && isLt2M;
  };

  // 处理图片变化
  const handleChange: UploadProps['onChange'] = ({ fileList: newFileList }) => {
    setFileList(newFileList);
  };

  // 处理表单提交
  const handleSubmit = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();
      
      // 创建群组（只发送必要的字段）
      const createGroupData = {
        name: values.name,
        description: values.description,
      };

      const groupRes = await apiClient.post('/chat/groups', createGroupData);

      // 如果有上传头像，处理头像上传
      if (fileList.length > 0 && fileList[0].originFileObj) {
        const formData = new FormData();
        formData.append('file', fileList[0].originFileObj);
        try {
          console.log('开始上传群头像:', {
            groupId: groupRes.data.group._id,
            fileSize: fileList[0].originFileObj.size,
            fileType: fileList[0].originFileObj.type
          });
          
          const avatarRes = await apiClient.post(`/chat/groups/${groupRes.data.group._id}/avatar`, formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });
          
          console.log('群头像上传成功:', avatarRes.data);
        } catch (error: any) {
          console.error('上传群头像失败:', {
            error: error.message,
            response: error.response?.data,
            status: error.response?.status,
            headers: error.response?.headers
          });
          message.warning('群组已创建，但头像上传失败');
        }
      }

      // 创建群聊会话
      const conversationRes = await apiClient.post('/chat/conversations/group', {
        groupId: groupRes.data.group._id,
      });

      message.success('群聊创建成功！');
      
      // 确保 conversationRes.data._id 存在
      if (!conversationRes.data?._id) {
        throw new Error('创建群聊会话失败：未返回会话ID');
      }
      
      onSuccess(conversationRes.data._id);
      onClose();
      
      // 清理表单和文件列表
      form.resetFields();
      setFileList([]);
    } catch (error: any) {
      console.error('创建群聊失败:', error);
      message.error(error.response?.data?.message || '创建群聊失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="创建群聊"
      open={visible}
      onCancel={onClose}
      onOk={handleSubmit}
      confirmLoading={loading}
    >
      <Form
        form={form}
        layout="vertical"
      >
        <Form.Item
          name="name"
          label="群名称"
          rules={[
            { required: true, message: '请输入群名称' },
            { max: 20, message: '群名称不能超过20个字符' }
          ]}
        >
          <Input placeholder="请输入群名称" maxLength={20} />
        </Form.Item>

        <Form.Item
          name="description"
          label="群描述"
          rules={[
            { max: 200, message: '群描述不能超过200个字符' }
          ]}
        >
          <Input.TextArea
            placeholder="请输入群描述"
            maxLength={200}
            showCount
          />
        </Form.Item>

        <Form.Item label="群头像">
          <Upload
            listType="picture-card"
            fileList={fileList}
            beforeUpload={beforeUpload}
            onChange={handleChange}
            maxCount={1}
          >
            {fileList.length === 0 && (
              <div>
                <PlusOutlined />
                <div style={{ marginTop: 8 }}>上传</div>
              </div>
            )}
          </Upload>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CreateGroupModal; 