import api from './api';
import type { Task, PaginatedResponse } from '@/types';

export async function getTasks(params: Record<string, string | number>) {
  return api.get('/tasks', { params }) as Promise<PaginatedResponse<Task>>;
}

export async function updateTask(id: string, data: Partial<Task>) {
  return api.patch(`/tasks/${id}`, data);
}
