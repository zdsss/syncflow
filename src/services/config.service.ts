import api from './api';
import type { Department, Role, User } from '@/types';

export async function getDepartments() {
  return api.get('/config/departments') as Promise<{ code: number; data: Department[] }>;
}

export async function getRoles(departmentId?: string) {
  return api.get('/config/roles', { params: departmentId ? { departmentId } : {} }) as Promise<{ code: number; data: Role[] }>;
}

export async function getMembers(roleId?: string) {
  return api.get('/config/members', { params: roleId ? { roleId } : {} }) as Promise<{ code: number; data: User[] }>;
}
