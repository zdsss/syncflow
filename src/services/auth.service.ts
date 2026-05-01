import api from './api';
import type { User, Team } from '@/types';

export async function getCurrentUser() {
  return api.get('/auth/me') as Promise<{ code: number; data: { user: User; team: Team } }>;
}

export async function getTeams() {
  return api.get('/teams') as Promise<{ code: number; data: Team[] }>;
}
