import api from './api';
import type { FileRecord } from '@/types';

export async function getFiles(params: Record<string, string | number>) {
  return api.get('/files', { params });
}
