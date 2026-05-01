import api from './api';
import type { Project } from '@/types';

export async function getProjects() {
  return api.get('/projects') as Promise<{ code: number; data: Project[] }>;
}
