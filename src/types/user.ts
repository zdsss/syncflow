export type UserStatus = 'active' | 'inactive' | 'locked';

export interface User {
  id: string;
  name: string;
  avatar?: string;
  email: string;
  phone?: string;
  departmentId: string;
  roleIds: string[];
  teamIds: string[];
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}
