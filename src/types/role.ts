export interface Role {
  id: string;
  name: string;
  departmentId: string;
  description?: string;
  permissions: string[];
  memberCount: number;
}
