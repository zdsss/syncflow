import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../api', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: {} }),
    post: vi.fn().mockResolvedValue({ data: {} }),
    put: vi.fn().mockResolvedValue({ data: {} }),
    patch: vi.fn().mockResolvedValue({ data: {} }),
    delete: vi.fn().mockResolvedValue({ data: {} }),
  },
}));

import api from '../api';
import {
  uploadFile,
  getFiles,
  deleteFile,
  createFolder,
} from '../file.service';

describe('FileService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('uploadFile sends FormData to POST /files/upload', async () => {
    const mockFile = new File(['content'], 'test.txt', { type: 'text/plain' });
    await uploadFile(mockFile, { projectId: 1, bizType: 'task', bizId: 5 });
    expect(api.post).toHaveBeenCalledWith(
      '/files/upload',
      expect.any(FormData),
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
  });

  it('getFiles calls GET /files with params', async () => {
    const params = { projectId: 1, bizType: 'task' };
    await getFiles(params);
    expect(api.get).toHaveBeenCalledWith('/files', { params });
  });

  it('getFiles calls GET /files with empty params by default', async () => {
    await getFiles();
    expect(api.get).toHaveBeenCalledWith('/files', { params: {} });
  });

  it('deleteFile calls DELETE /files/:id', async () => {
    await deleteFile(5);
    expect(api.delete).toHaveBeenCalledWith('/files/5');
  });

  it('createFolder calls POST /files/folders with params', async () => {
    await createFolder({ name: 'New Folder', projectId: 1 });
    expect(api.post).toHaveBeenCalledWith('/files/folders', null, { params: { name: 'New Folder', projectId: 1 } });
  });
});
