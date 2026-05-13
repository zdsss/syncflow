import api from './api';

// ── File Upload / Download ──────────────────────────────────────────

export async function uploadFile(file: File, params: {
  projectId?: number;
  bizType?: string;
  bizId?: number;
}) {
  const formData = new FormData();
  formData.append('file', file);
  if (params.projectId != null) formData.append('projectId', String(params.projectId));
  if (params.bizType != null) formData.append('bizType', params.bizType);
  if (params.bizId != null) formData.append('bizId', String(params.bizId));
  return api.post('/files/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

// ── File Detail / List ──────────────────────────────────────────────

export async function getFiles(params: { projectId?: number; bizType?: string; bizId?: number } = {}) {
  return api.get('/files', { params });
}

export async function getFileInfo(id: number | string) {
  return api.get(`/files/${id}`);
}

export async function renameFile(id: number | string, name: string) {
  return api.patch(`/files/${id}/rename`, { name });
}

export async function deleteFile(id: number | string) {
  return api.delete(`/files/${id}`);
}

// ── Folders ─────────────────────────────────────────────────────────

export async function createFolder(data: { name: string; parentId?: number; projectId?: number }) {
  return api.post('/files/folders', null, {
    params: data,
  });
}

export async function getFileBreadcrumbs(fileId: number) {
  return api.get(`/files/${fileId}/breadcrumbs`);
}

export async function batchDeleteFiles(ids: number[]) {
  return api.post('/files/batch-delete', { ids });
}

export async function getBatchDownloadInfo(ids: number[]) {
  return api.post('/files/batch-download', { ids });
}

export async function downloadFile(id: number | string) {
  return api.get(`/files/${id}/download`, { responseType: 'blob' });
}

export async function getFileContent(id: number | string): Promise<string> {
  return api.get(`/files/${id}/download`, { responseType: 'text' }) as unknown as Promise<string>;
}
