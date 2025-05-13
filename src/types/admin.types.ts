export interface BackendUser {
  _id: string; // or _id depending on your backend transform
  username: string;
  nickname?: string;
  email?: string; // Assuming email is available for admins
  avatar?: string;
  roles: string[]; // Array of role names
  permissions?: string[]; // Usually permissions are tied to roles, but your login returns this
  isActive?: boolean; // Or a 'status' field
  createdAt?: string;
  updatedAt?: string;
  // Add other fields your admin panel might need, e.g., lastLogin
}

export interface BackendRole {
  _id: string; // Or id
  name: string; // Machine-readable name (e.g., 'admin', 'student')
  displayName: string; // Human-readable name (e.g., '超级管理员', '学生')
  permissions: string[]; // Array of permission strings
  isSystemRole?: boolean;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

// For table display, you might want a slightly different structure or add a 'key'
export interface UserForTable extends BackendUser {
  key: string; // Ant Design Table needs a unique key
}

export interface RoleForTable extends BackendRole {
  key: string; // Ant Design Table needs a unique key
  permissionsCount: number;
}