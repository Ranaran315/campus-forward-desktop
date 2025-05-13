import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode'; // 用于解码JWT获取用户信息
import { showMessage } from '@/components/Message/MessageContainer';

// 假设解码后的JWT包含以下结构，或者您通过 /users/me 获取此类信息
interface DecodedToken {
  userId: string;
  username: string;
  roles: string[]; // 角色名称列表
  permissions: string[]; // 权限字符串列表
  // 其他用户信息
  iat?: number;
  exp?: number;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: DecodedToken | null;
  token: string | null;
  login: (token: string) => Promise<void>; // 登录后，应从token解码或请求/users/me获取权限
  logout: () => void;
  isLoading: boolean; // 用于处理初始加载用户状态
  checkPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('authToken'));
  const [user, setUser] = useState<DecodedToken | null>(null);
  const [isLoading, setIsLoading] = useState(true); // 开始时加载状态为 true

  useEffect(() => {
    const initializeAuth = async () => {
      setIsLoading(true);
      const storedToken = localStorage.getItem('authToken');
      if (storedToken) {
        try {
          // 理想情况下，这里应该向后端 /users/me 发送请求验证token并获取最新用户信息及权限
          // 为了简化，我们先尝试解码token。注意：解码JWT仅用于读取信息，不应用于安全验证。
          // 安全验证应始终在后端完成，并通过受保护的API端点（如 /users/me）获取用户数据。
          const decoded = jwtDecode<DecodedToken>(storedToken);

          // 检查token是否过期 (如果JWT包含exp字段)
          if (decoded.exp && decoded.exp * 1000 < Date.now()) {
            showMessage.error('用户登录信息已过期，请重新登录。');
            localStorage.removeItem('authToken'); // 清除过期token
            setToken(null);
            console.log('Token expired, logging out.');
            logout(); // Token过期，执行登出
          } else {
            // 假设解码后的token直接包含permissions，或者您需要一个API调用来获取它们
            // 例如: const userData = await fetchUserProfile(storedToken); setUser(userData);
            setUser(decoded); // 假设解码后的token包含所需的用户信息和权限
            setToken(storedToken);
            console.log('Auth initialized, user:', decoded);
          }
        } catch (error) {
          console.error('Failed to decode token or token invalid:', error);
          localStorage.removeItem('authToken'); // 无效token则移除
          setToken(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    };
    initializeAuth();
  }, []);

  const login = async (newToken: string) => {
    setIsLoading(true);
    localStorage.setItem('authToken', newToken);
    try {
      // 同样，理想情况是调用 /users/me
      const decoded = jwtDecode<DecodedToken>(newToken);
      setUser(decoded);
      setToken(newToken);
      console.log('User logged in:', decoded);
    } catch (error) {
      console.error('Failed to process login token:', error);
      localStorage.removeItem('authToken');
      setToken(null);
      setUser(null);
    }
    setIsLoading(false);
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    setToken(null);
    setUser(null);
    console.log('User logged out.');
    // 可选：通知后端token已失效（如果后端有token黑名单机制）
    // 可选：跳转到登录页 window.location.href = '/login'; (如果AuthProvider不包裹登录页)
  };

  const checkPermission = (permission: string): boolean => {
    if (isLoading || !user || !user.permissions) {
      return false;
    }
    return user.permissions.includes(permission);
  };


  return (
    <AuthContext.Provider value={{ isAuthenticated: !!token && !!user, user, token, login, logout, isLoading, checkPermission }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};