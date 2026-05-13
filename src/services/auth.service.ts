import api from './api';
import type { LoginRequest, LoginResponse, User } from '@/types';

export async function login(data: LoginRequest) {
  return api.post('/auth/login', data) as Promise<{ code: number; data: LoginResponse; message: string; timestamp: number }>;
}

export async function getCurrentUser() {
  return api.get('/auth/me') as Promise<{ code: number; data: User; message: string; timestamp: number }>;
}

export async function refreshToken(refreshToken: string) {
  return api.post(`/auth/refresh?refreshToken=${encodeURIComponent(refreshToken)}`) as Promise<{ code: number; data: LoginResponse; message: string; timestamp: number }>;
}

export async function logout() {
  return api.post('/auth/logout');
}

export async function forgotPassword(email: string) {
  return api.post('/auth/forgot-password', { email });
}

export async function resetPassword(token: string, password: string) {
  return api.post('/auth/reset-password', { token, password });
}

export async function register(data: { username: string; password: string; name: string; email: string; teamId?: string }) {
  return api.post('/auth/register', data);
}

export async function getTeams() {
  return api.get('/teams');
}

export async function updateProfile(data: Record<string, any>) {
  return api.put('/auth/profile', data);
}

export async function changePassword(data: { oldPassword: string; newPassword: string }) {
  return api.put('/auth/password', data);
}

// ── Login Records ────────────────────────────────────────────────

export interface LoginRecord {
  id: string;
  userId: string;
  username: string;
  ip: string;
  userAgent: string;
  loginTime: string;
  logoutTime?: string;
  status: 'success' | 'failed';
}

export async function getLoginRecords(params?: { pageNum?: number; pageSize?: number }) {
  return api.get('/auth/login-records', { params });
}

// ── API Keys ─────────────────────────────────────────────────────

export interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  permissions: string[];
  expiresAt: string;
  lastUsedAt?: string;
  status: number;
  createdAt: string;
}

export async function getApiKeys() {
  return api.get('/auth/api-keys');
}

export async function createApiKey(data: { name: string; permissions: string[]; expiresAt: string }) {
  return api.post('/auth/api-keys', data);
}

export async function revokeApiKey(id: string) {
  return api.delete(`/auth/api-keys/${id}`);
}
