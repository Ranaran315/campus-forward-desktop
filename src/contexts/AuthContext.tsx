import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react'
import { jwtDecode } from 'jwt-decode' // 用于解码JWT获取用户信息
import { showMessage } from '@/components/Message/MessageContainer'
import { PermissionString } from '@/constants/permissions'

// 新的用户信息接口，包含头像等
export interface UserProfile {
  sub: string; // User ID
  username: string; // 通常是登录名
  avatar?: string; // 头像 URL
  displayName?: string; // 显示名称 (如果后端提供)
  roles: string[]; // 角色名称列表
  permissions: string[]; // 权限字符串列表
  iat?: number; // Issued at (from JWT)
  exp?: number; // Expiry (from JWT)
  // 可以根据后端实际返回的 user 对象添加更多字段
  [key: string]: any; // 允许其他潜在字段
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: UserProfile | null; // 使用 UserProfile 类型
  token: string | null;
  login: (token: string, userInfo: UserProfile) => Promise<void>; // login 接受 userInfo
  logout: () => void;
  isLoading: boolean; // 用于处理初始加载用户状态
  checkPermission: (permission: PermissionString) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [token, setToken] = useState<string | null>(
    localStorage.getItem('authToken')
  );
  const [user, setUser] = useState<UserProfile | null>(null); // 使用 UserProfile 类型
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      setIsLoading(true);
      const storedToken = localStorage.getItem('authToken');
      const storedUserProfile = localStorage.getItem('userProfile'); // 获取存储的用户信息

      if (storedToken && storedUserProfile) {
        try {
          const userProfile: UserProfile = JSON.parse(storedUserProfile);

          // 检查token是否过期 (基于存储的userProfile中的exp)
          if (userProfile.exp && userProfile.exp * 1000 < Date.now()) {
            showMessage.error('用户登录信息已过期，请重新登录。');
            localStorage.removeItem('authToken');
            localStorage.removeItem('userProfile');
            setToken(null);
            setUser(null);
            console.log('Token expired based on stored user profile, logging out.');
          } else {
            // 如果token有效 (根据存储的profile)，则恢复用户状态
            setUser(userProfile);
            setToken(storedToken);
            console.log('Auth initialized from localStorage, user profile:', userProfile);
          }
        } catch (error) {
          console.error('Failed to parse stored user profile or token invalid:', error);
          localStorage.removeItem('authToken');
          localStorage.removeItem('userProfile');
          setToken(null);
          setUser(null);
        }
      } else if (storedToken) {
        // 只有token，没有userProfile (可能是旧的存储或不完整状态)
        // 尝试解码token作为回退，但这将不包含avatar等信息
        // 或者，更好的做法是清除不完整的状态并要求重新登录
        console.warn('Auth: Found token but no user profile in localStorage. Clearing token.');
        localStorage.removeItem('authToken'); // 清除孤立的token
        setToken(null);
        setUser(null);
        // （可选）如果希望尝试从孤立token中恢复基础信息（不推荐长期使用）：
        // try {
        //   const decoded = jwtDecode<UserProfile>(storedToken); // 尝试用UserProfile解码
        //   if (decoded.exp && decoded.exp * 1000 < Date.now()) {
        //     // ... token过期处理 ...
        //   } else {
        //     setUser(decoded); // 这将只有JWT中的字段
        //     setToken(storedToken);
        //   }
        // } catch (error) { /* ... */ }
      }
      setIsLoading(false);
    };
    initializeAuth();
  }, []);

  const login = async (newToken: string, userInfo: UserProfile) => {
    setIsLoading(true);
    localStorage.setItem('authToken', newToken);
    localStorage.setItem('userProfile', JSON.stringify(userInfo)); // 存储完整的用户信息
    
    setUser(userInfo); // 直接使用传入的 userInfo
    setToken(newToken);
    console.log('User logged in with profile:', userInfo);
    setIsLoading(false);
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userProfile'); // 清除存储的用户信息
    setToken(null);
    setUser(null);
    console.log('User logged out.');
  };

  const checkPermission = (permission: PermissionString): boolean => {
    if (isLoading || !user || !user.permissions) {
      return false;
    }
    return user.permissions.includes(permission);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!token && !!user,
        user,
        token,
        login,
        logout,
        isLoading,
        checkPermission,
      }}
    >
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
