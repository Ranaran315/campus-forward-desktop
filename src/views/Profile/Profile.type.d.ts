export interface ProfileFormData {
  nickname?: string;
  realname: string;
  gender: string;
  birthday?: string; // 使用 YYYY-MM-DD 格式的字符串
  email: string;
  phone?: string;
}