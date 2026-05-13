export interface User {
  id: number; // was string
  username: string;
  realName: string; // was 'name'
  email: string;
  phone?: string;
  avatar?: string;
  status: number; // 1=active, 0=inactive
  deptId?: number;
  deptName?: string; // was 'departmentId'
  roles: string[]; // was 'roleIds: string[]'
}

export interface LoginRequest {
  username: string; // was 'email'
  password: string;
}

export interface LoginResponse {
  token: string; // was 'accessToken'
  refreshToken: string;
  userId: number;
  username: string;
  realName: string;
  avatar?: string;
  roles: string[];
}
