import React, { useEffect, useState } from 'react';
import { Drawer, Form, Input, Button, message, Avatar, Upload, Modal, Select, Spin } from 'antd';
import { PlusOutlined, LoadingOutlined, ExclamationCircleFilled, UserAddOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import type { RcFile, UploadProps } from 'antd/es/upload';
import apiClient from '@/lib/axios';
import { getAvatarUrl } from '@/utils/imageHelper';
import './GroupInfoDrawer.css';
import { useAuth } from '@/contexts/AuthContext';
import debounce from 'lodash/debounce';
import SelectUsersModal from '@/components/Modal/SelectUsersModal/SelectUsersModal';

interface GroupInfoDrawerProps {
  visible: boolean;
  onClose: () => void;
  groupId: string;
  onGroupDissolved?: () => void;
}

interface GroupInfo {
  _id: string;
  name: string;
  description?: string;
  avatar?: string;
  members: Array<{
    _id: string;
    username: string;
    nickname?: string;
    avatar?: string;
  }>;
  owner: {
    _id: string;
    username: string;
    nickname?: string;
    avatar?: string;
  };
  admins: Array<{
    _id: string;
    username: string;
    nickname?: string;
    avatar?: string;
  }>;
}

interface UserSearchResult {
  _id: string;
  username: string;
  nickname?: string;
  avatar?: string;
}

const GroupInfoDrawer: React.FC<GroupInfoDrawerProps> = ({
  visible,
  onClose,
  groupId,
  onGroupDissolved,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [groupInfo, setGroupInfo] = useState<GroupInfo | null>(null);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const { user: currentUser } = useAuth();
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  // Add debug logging
  useEffect(() => {
    console.log('GroupInfoDrawer mounted/updated:', {
      visible,
      groupId,
      loading,
      hasGroupInfo: !!groupInfo
    });
  }, [visible, groupId, loading, groupInfo]);

  // 获取群组信息
  const fetchGroupInfo = async () => {
    try {
      console.log('Fetching group info for:', groupId);
      setLoading(true);
      const response = await apiClient.get(`/chat/groups/${groupId}`);
      console.log('Group info response:', response.data);
      setGroupInfo(response.data);
      
      // 设置表单初始值
      form.setFieldsValue({
        name: response.data.name,
        description: response.data.description,
      });

      // 如果有头像，设置到文件列表
      if (response.data.avatar) {
        setFileList([{
          uid: '-1',
          name: 'avatar',
          status: 'done',
          url: getAvatarUrl(response.data.avatar),
        }]);
      }
    } catch (error: any) {
      console.error('Failed to fetch group info:', error);
      message.error(error.response?.data?.message || '获取群组信息失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible && groupId) {
      fetchGroupInfo();
    }
  }, [visible, groupId]);

  // 处理图片上传前的验证
  const beforeUpload = (file: RcFile) => {
    const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/webp';
    if (!isJpgOrPng) {
      message.error('只能上传 JPG/PNG/WebP 格式的图片！');
      return Upload.LIST_IGNORE;
    }
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error('图片大小不能超过 2MB！');
      return Upload.LIST_IGNORE;
    }
    return false; // 返回 false 阻止自动上传
  };

  // 处理图片变化
  const handleChange: UploadProps['onChange'] = ({ fileList: newFileList }) => {
    // 过滤掉状态为 error 的文件
    const filteredFileList = newFileList.filter(file => file.status !== 'error');
    setFileList(filteredFileList);
  };

  // 处理表单提交
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      // 更新群组基本信息
      await apiClient.put(`/chat/groups/${groupId}`, {
        name: values.name,
        description: values.description,
      });

      // 如果有新的头像文件，上传头像
      if (fileList.length > 0 && fileList[0].originFileObj) {
        const formData = new FormData();
        formData.append('file', fileList[0].originFileObj);
        
        try {
          await apiClient.post(`/chat/groups/${groupId}/avatar`, formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });
        } catch (error: any) {
          console.error('上传群头像失败:', error);
          message.warning('群组信息已更新，但头像上传失败');
        }
      }

      message.success('群组信息更新成功');
      await fetchGroupInfo(); // 刷新群组信息
    } catch (error: any) {
      message.error(error.response?.data?.message || '更新群组信息失败');
    } finally {
      setLoading(false);
    }
  };

  // 判断当前用户是否是群主或管理员
  const isOwnerOrAdmin = groupInfo && (
    groupInfo.owner._id === currentUser?.sub ||
    groupInfo.admins.some(admin => admin._id === currentUser?.sub)
  );

  // 搜索用户
  const searchUsers = debounce(async (searchText: string) => {
    if (!searchText.trim()) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      const response = await apiClient.get(`/users/search?q=${encodeURIComponent(searchText)}`);
      // 过滤掉已经是群成员的用户
      const filteredResults = response.data.filter((user: UserSearchResult) => 
        !groupInfo?.members.some(member => member._id === user._id)
      );
      setSearchResults(filteredResults);
    } catch (error) {
      console.error('搜索用户失败:', error);
      message.error('搜索用户失败');
    } finally {
      setSearchLoading(false);
    }
  }, 500);

  // 添加群成员
  const handleAddMember = async (selectedUsers: { id: string; name: string; avatar?: string }[]) => {
    if (selectedUsers.length === 0) {
      message.error('请选择要添加的成员');
      return;
    }

    try {
      setLoading(true);
      // 批量添加成员
      await Promise.all(
        selectedUsers.map(user =>
          apiClient.post(`/chat/groups/${groupId}/members`, {
            userId: user.id
          })
        )
      );
      
      message.success('成功添加群成员');
      setShowAddMemberModal(false);
      // 刷新群组信息
      await fetchGroupInfo();
    } catch (error: any) {
      console.error('添加群成员失败:', error);
      message.error(error.response?.data?.message || '添加群成员失败');
    } finally {
      setLoading(false);
    }
  };

  // 处理解散群聊
  const handleDissolveGroup = () => {
    Modal.confirm({
      title: '解散群聊',
      icon: <ExclamationCircleFilled />,
      content: '确定要解散该群聊吗？此操作不可恢复。',
      okText: '确认解散',
      okType: 'danger',
      cancelText: '取消',
      async onOk() {
        try {
          setLoading(true);
          await apiClient.delete(`/chat/groups/${groupId}`);
          message.success('群聊已解散');
          onClose();
          onGroupDissolved?.(); // 调用解散后的回调
        } catch (error: any) {
          console.error('解散群聊失败:', error);
          message.error(error.response?.data?.message || '解散群聊失败');
        } finally {
          setLoading(false);
        }
      },
    });
  };

  return (
    <Drawer
      title="群组信息"
      placement="right"
      onClose={onClose}
      open={visible}
      width={400}
      extra={
        <Button type="primary" onClick={handleSubmit} loading={loading}>
          保存
        </Button>
      }
    >
      {groupInfo && (
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            name: groupInfo.name,
            description: groupInfo.description,
          }}
        >
          <Form.Item label="群头像">
            <Upload
              listType="picture-card"
              fileList={fileList}
              beforeUpload={beforeUpload}
              onChange={handleChange}
              maxCount={1}
              customRequest={() => {}} // 禁用默认的上传请求
              className="avatar-uploader"
            >
              {fileList.length === 0 && (
                <div className="upload-button-content">
                  {uploading ? <LoadingOutlined /> : <PlusOutlined />}
                  <div style={{ marginTop: 8 }}>上传</div>
                </div>
              )}
            </Upload>
          </Form.Item>

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
              rows={4}
            />
          </Form.Item>

          <div className="group-info-section">
            <h4>群主</h4>
            <div className="member-item">
              <Avatar src={groupInfo.owner.avatar ? getAvatarUrl(groupInfo.owner.avatar) : undefined} size={24} />
              <span>{groupInfo.owner.nickname || groupInfo.owner.username}</span>
            </div>
          </div>

          <div className="group-info-section">
            <h4>管理员 ({groupInfo.admins.length})</h4>
            {groupInfo.admins.map(admin => (
              <div key={admin._id} className="member-item">
                <Avatar src={admin.avatar ? getAvatarUrl(admin.avatar) : undefined} size={24} />
                <span>{admin.nickname || admin.username}</span>
              </div>
            ))}
          </div>

          <div className="group-info-section">
            <div className="section-header">
              <h4>群成员 ({groupInfo.members.length})</h4>
              {isOwnerOrAdmin && (
                <Button
                  type="link"
                  icon={<UserAddOutlined />}
                  onClick={() => setShowAddMemberModal(true)}
                >
                  添加成员
                </Button>
              )}
            </div>
            {groupInfo.members.map(member => (
              <div key={member._id} className="member-item">
                <Avatar src={member.avatar ? getAvatarUrl(member.avatar) : undefined} size={24} />
                <span>{member.nickname || member.username}</span>
              </div>
            ))}
          </div>

          {/* 添加解散群聊按钮 */}
          {isOwnerOrAdmin && (
            <div className="group-danger-zone">
              <h4>危险操作</h4>
              <Button 
                danger 
                type="primary" 
                onClick={handleDissolveGroup}
                loading={loading}
                block
              >
                解散群聊
              </Button>
              <div className="danger-zone-hint">解散后，群聊将被永久删除且不可恢复</div>
            </div>
          )}
        </Form>
      )}

      <SelectUsersModal
        visible={showAddMemberModal}
        onCancel={() => setShowAddMemberModal(false)}
        onOk={handleAddMember}
        initialSelectedUsers={[]}
      />
    </Drawer>
  );
};

export default GroupInfoDrawer; 