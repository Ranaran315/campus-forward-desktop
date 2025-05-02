import React, { useState, useEffect, useCallback, useRef } from 'react'; // 引入 useRef
import apiClient from '../../lib/axios'; // 确认 apiClient 路径
import './Profile.css'; // 导入 CSS 文件
import Avatar from '@/components/Avatar/Avatar'; // 假设有头像组件
import Button from '@/components/Button/Button'; // 引入 Button 组件
import EditIcon from '@/assets/icons/edit.svg?react'; // 引入图标
import UpdateIcon from '@/assets/icons/update.svg?react'; // 引入图标
import QuitIcon from '@/assets/icons/quit.svg?react'; // 引入图标
// import { useNavigate } from 'react-router-dom'; // 如果需要导航，取消注释
import Modal from '@/components/Modal/Modal'; // 引入 Modal 组件
// --- 引入修改后的表单组件 ---
import ChangePasswordForm from './ChangePasswordForm/ChangePasswordForm';
import EditProfileForm from './EditProfileForm/EditProfileForm';
import { ProfileFormData } from './Profile.type';
// import LoadingSpinner from '@/components/LoadingSpinner/LoadingSpinner'; // 如果需要加载指示器，取消注释

// --- 前端使用的用户数据类型 (根据实际 API 调整) ---
interface UserProfileData {
  _id: string;
  username: string; // 通常是学号/工号
  nickname?: string;
  realname: string;
  gender: 'male' | 'female' | string; // 明确性别类型或使用 string
  birthday?: string; // ISO 格式字符串 (e.g., "YYYY-MM-DDTHH:mm:ss.sssZ")
  description?: string;
  avatar: string; // 头像 URL
  userType: 'student' | 'staff';
  studentId?: string;
  staffId?: string;
  departmentInfo?: {
    departmentId: string;
    departmentName: string;
  };
  majorInfo?: {
    majorId: string;
    majorName: string;
  };
  classInfo?: {
    classId: string;
    className: string;
  };
  staffInfo?: {
    officeLocation?: string;
    titles?: string[];
    managedClassIds?: string[];
  };
  email: string;
  phone?: string; // 手机号可能为空
  status: string; // 用户状态
  createdAt: string; // ISO 格式字符串
  updatedAt: string; // ISO 格式字符串
}

// --- 编辑表单所需的数据结构 ---
interface ProfileFormDataForEdit {
  nickname?: string;
  realname: string;
  gender: string;
  birthday?: string; // YYYY-MM-DD 格式
  email: string;
  phone?: string;
  avatar?: string; // 头像 URL (用于初始显示)
}

function ProfileViews() {
  // --- State 定义 ---
  const [userData, setUserData] = useState<UserProfileData | null>(null);
  const [error, setError] = useState<string | null>(null); // 用于显示全局错误或初始加载错误
  const [isLoggingOut, setIsLoggingOut] = useState(false); // 登出按钮加载状态
  const [isEditModalOpen, setIsEditModalOpen] = useState(false); // 编辑 Modal 开关
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false); // 修改密码 Modal 开关

  // --- Modal 加载状态 ---
  const [isEditLoading, setIsEditLoading] = useState(false); // 编辑表单提交加载状态
  const [isPasswordLoading, setIsPasswordLoading] = useState(false); // 修改密码表单提交加载状态

  // --- Refs 用于触发子组件方法 ---
  const editFormRef = useRef<{ submit: () => Promise<void> }>(null);
  const passwordFormRef = useRef<{ submit: () => Promise<void> }>(null);

  // const navigate = useNavigate(); // 如果需要导航，取消注释

  // --- 获取用户信息 ---
  const fetchUserProfile = useCallback(async () => {
    // setLoading(true); // 如果有全局加载状态
    setError(null); // 清除旧错误
    try {
      const response = await apiClient.get<UserProfileData>('/users/me'); // 指定响应类型
      setUserData(response.data);
    } catch (err: any) {
      console.error('获取用户信息失败:', err);
      setError(
        err.response?.data?.message || '无法加载用户信息，请稍后重试。'
      );
      // 可选：处理特定错误，例如 401 未授权跳转登录页
      // if (err.response?.status === 401) { navigate('/login'); }
    } finally {
      // setLoading(false);
    }
  }, []); // 空依赖数组，通常只在挂载时运行一次

  // --- 组件挂载时获取用户信息 ---
  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]); // 依赖 fetchUserProfile (虽然它依赖为空，但这是标准做法)

  // --- Modal 控制函数 (打开时重置加载和错误状态) ---
  const openEditModal = () => { setIsEditLoading(false); setError(null); setIsEditModalOpen(true); };
  const closeEditModal = () => setIsEditModalOpen(false);
  const openPasswordModal = () => { setIsPasswordLoading(false); setError(null); setIsPasswordModalOpen(true); };
  const closePasswordModal = () => setIsPasswordModalOpen(false);

  // --- 处理登出逻辑 ---
  const handleLogout = async () => {
    setIsLoggingOut(true);
    setError(null);
    try {
      await apiClient.post('/auth/logout');
      // 清除本地存储的 token 或用户信息
      localStorage.removeItem('accessToken'); // 假设 token 存储在这里
      // 可选：跳转到登录页
      // navigate('/login');
      window.location.href = '/login'; // 或者直接刷新跳转
    } catch (logoutError: any) {
      console.error('登出失败:', logoutError);
      setError(logoutError.response?.data?.message || '登出时发生错误');
    } finally {
      setIsLoggingOut(false);
    }
  };

  // --- 表单成功回调 ---
  const handleProfileSuccess = useCallback((updatedData: ProfileFormData) => {
    // 使用后端返回的最新数据更新本地状态
    setUserData(prevData => prevData ? { ...prevData, ...updatedData } : null);
    closeEditModal(); // 成功后关闭 Modal
    console.log("Profile updated successfully!");
    // 可以在这里显示全局成功提示 (例如使用 Toast 库)
    // showToast('个人资料更新成功！', 'success');
  }, []); // 空依赖，因为 closeEditModal 和 setUserData 是稳定的

  const handlePasswordSuccess = useCallback(() => {
    closePasswordModal(); // 成功后关闭 Modal
    console.log("Password changed successfully!");
    // 可以在这里显示全局成功提示
    // showToast('密码修改成功！', 'success');
  }, []); // 空依赖

  // --- 表单错误处理回调 ---
  const handleFormError = useCallback((message: string) => {
      // 在这里处理表单报告的错误，例如显示全局提示
      setError(`操作失败: ${message}`); // 更新全局错误状态，显示在页面上
      console.error("Form submission error:", message);
      // 通常不需要在出错时关闭 Modal，让用户可以修正输入
      // 可以在这里显示全局错误提示
      // showToast(`操作失败: ${message}`, 'error');
  }, []); // 空依赖

  // --- 创建触发函数，用于 Modal 的 onConfirm ---
  const triggerEditSubmit = () => {
      editFormRef.current?.submit(); // 调用 EditProfileForm 内部的 submit 方法
  };
  const triggerPasswordSubmit = () => {
      passwordFormRef.current?.submit(); // 调用 ChangePasswordForm 内部的 submit 方法
  };

  // --- 渲染逻辑 ---

  // 初始加载错误
  if (error && !userData) {
    return <div className="error-message">错误: {error}</div>;
  }

  // 初始加载中 (可以使用 LoadingSpinner)
  if (!userData) {
    // return <LoadingSpinner />;
    return <div className="info-message">正在加载用户信息...</div>;
  }

  // --- 准备传递给 EditProfileForm 的初始数据 ---
  // 确保 birthday 格式为 YYYY-MM-DD
  const profileFormData: ProfileFormDataForEdit = {
    nickname: userData.nickname,
    realname: userData.realname,
    gender: userData.gender,
    birthday: userData.birthday ? userData.birthday.split('T')[0] : undefined,
    email: userData.email,
    phone: userData.phone,
    avatar: userData.avatar, // 传递当前头像 URL
  };

  // --- 渲染用户信息和控制按钮 ---
  return (
    <div className="profile-container">
      {/* --- 用户信息卡片 --- */}
      <div className="profile-card">
        {/* 头部 */}
        <div className="profile-header">
          <div className="avatar-section">
            <Avatar size="80px" src={userData.avatar} alt={`${userData.nickname || userData.realname} 的头像`} />
          </div>
          <div className="baseinfo-section">
            <div className="baseinfo-section-top">
              <div className="nickname">
                {userData.nickname || userData.realname} {/* 优先显示昵称 */}
              </div>
            </div>
            <div className="baseinfo-section-bottom">
              <div className="user-type">
                {userData.userType === 'student' ? '学生' : '教职工'}
              </div>
              <div className="gender">
                {userData.gender === 'male' ? '男' : userData.gender === 'female' ? '女' : '未知'}
              </div>
            </div>
          </div>
        </div>
        {/* 信息区域 */}
        <div className="profile-info">
          {/* 基本信息 */}
          <div className="profile-info-section">
            <span className="profile-info-section-title">基本信息</span>
            <ul className="profile-info-section-item">
              <li><b>真实姓名：</b>{userData.realname}</li>
              <li><b>生日：</b>{userData.birthday ? new Date(userData.birthday).toLocaleDateString() : '未设置'}</li>
              <li><b>用户名：</b>{userData.username}</li> {/* 显示学号/工号 */}
            </ul>
          </div>
          {/* 学生信息 */}
          {userData.userType === 'student' && (
            <div className="profile-info-section">
              <span className="profile-info-section-title">学生信息</span>
              <ul className="profile-info-section-item">
                <li><b>学号：</b>{userData.studentId || userData.username}</li>
                <li><b>学院：</b>{userData.departmentInfo?.departmentName || '未分配'}</li>
                <li><b>专业：</b>{userData.majorInfo?.majorName || '未分配'}</li>
                <li><b>班级：</b>{userData.classInfo?.className || '未分配'}</li>
              </ul>
            </div>
          )}
          {/* 教职工信息 */}
          {userData.userType === 'staff' && (
             <div className="profile-info-section">
               <span className="profile-info-section-title">教职工信息</span>
               <ul className="profile-info-section-item">
                 <li><b>工号：</b>{userData.staffId || userData.username}</li>
                 <li><b>学院：</b>{userData.departmentInfo?.departmentName || '未分配'}</li>
                 <li><b>职称：</b>{userData.staffInfo?.titles?.join(', ') || '未设置'}</li>
                 <li><b>办公地点：</b>{userData.staffInfo?.officeLocation || '未设置'}</li>
               </ul>
             </div>
          )}
          {/* 联系方式 */}
          <div className="profile-info-section">
            <span className="profile-info-section-title">联系方式</span>
            <ul className="profile-info-section-item">
              <li><b>邮箱：</b>{userData.email}</li>
              <li><b>手机号：</b>{userData.phone || '未提供'}</li>
            </ul>
          </div>
        </div>
      </div>

      {/* --- 控制按钮 --- */}
      <div className="profile-controls">
        <Button onClick={openEditModal}>
          <EditIcon /> 编辑资料
        </Button>
        <Button theme="success" onClick={openPasswordModal}>
          <UpdateIcon /> 修改密码
        </Button>
        <Button theme="danger" onClick={handleLogout} disabled={isLoggingOut}>
          <QuitIcon /> {isLoggingOut ? '退出中...' : '退出登录'}
        </Button>
      </div>

      {/* --- 编辑资料 Modal --- */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={closeEditModal} // 关闭按钮和背景点击的处理
        title="编辑个人资料"
        // --- 使用 Modal 的默认 Footer ---
        showFooter={true}
        confirmText='保存' // 自定义确认按钮文字
        onConfirm={triggerEditSubmit} // 点击确认按钮时，触发 EditProfileForm 的提交
        isConfirmLoading={isEditLoading} // 将加载状态传递给 Modal 的确认按钮
        // onCancel 默认使用 onClose，即 closeEditModal
      >
        <EditProfileForm
          submitRef={editFormRef} // 传递 ref
          initialData={profileFormData} // 传递初始数据
          onSuccess={handleProfileSuccess} // 传递成功回调
          onError={handleFormError}      // 传递失败回调
          setLoading={setIsEditLoading}  // 传递设置加载状态的函数
          userId={userData._id} // 传递用户 ID
        />
      </Modal>

      {/* --- 修改密码 Modal --- */}
      <Modal
        isOpen={isPasswordModalOpen}
        onClose={closePasswordModal}
        title="修改密码"
        // --- 使用 Modal 的默认 Footer ---
        showFooter={true}
        confirmText='确认修改' // 自定义确认按钮文字
        onConfirm={triggerPasswordSubmit} // 点击确认按钮时，触发 ChangePasswordForm 的提交
        isConfirmLoading={isPasswordLoading} // 传递加载状态
        // onCancel 默认使用 onClose，即 closePasswordModal
      >
        <ChangePasswordForm
          submitRef={passwordFormRef} // 传递 ref
          onSuccess={handlePasswordSuccess} // 传递成功回调
          onError={handleFormError}       // 传递失败回调
          setLoading={setIsPasswordLoading} // 传递设置加载状态的函数
        />
      </Modal>
    </div>
  );
}

export default ProfileViews;