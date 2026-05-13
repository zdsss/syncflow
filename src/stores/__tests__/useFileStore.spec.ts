import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useFileStore } from '../useFileStore';
import type { FileRecord } from '@/types';

vi.mock('@/services/file.service', () => ({
  getFiles: vi.fn(),
  uploadFile: vi.fn(),
}));

import { getFiles, uploadFile } from '@/services/file.service';

const mockGetFiles = vi.mocked(getFiles);
const mockUploadFile = vi.mocked(uploadFile);

const mockFile: FileRecord = {
  id: 'f1',
  name: 'design.pdf',
  type: 'document',
  size: 1024,
  path: '/docs/design.pdf',
  uploaderId: 'user1',
  version: 1,
  downloadCount: 0,
  isDeleted: false,
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
};

const mockFile2: FileRecord = {
  id: 'f2',
  name: 'image.png',
  type: 'image',
  size: 2048,
  path: '/images/image.png',
  uploaderId: 'user2',
  version: 1,
  downloadCount: 3,
  isDeleted: false,
  createdAt: '2024-01-02',
  updatedAt: '2024-01-02',
};

describe('useFileStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useFileStore.setState({
      files: [],
      fileTypeTab: 'all',
      storageStats: { totalFiles: 0, usedSpace: 0, totalSpace: 20 * 1024 * 1024 * 1024 },
      total: 0,
      page: 1,
      pageSize: 10,
      loading: false,
      error: null,
    });
  });

  it('has correct initial state', () => {
    const state = useFileStore.getState();
    expect(state.files).toEqual([]);
    expect(state.fileTypeTab).toBe('all');
    expect(state.storageStats.totalFiles).toBe(0);
    expect(state.storageStats.usedSpace).toBe(0);
    expect(state.page).toBe(1);
    expect(state.pageSize).toBe(10);
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('setFiles updates files array', () => {
    useFileStore.getState().setFiles([mockFile]);
    expect(useFileStore.getState().files).toEqual([mockFile]);
  });

  it('setFileTypeTab updates tab and resets page to 1', () => {
    useFileStore.setState({ page: 3 });
    useFileStore.getState().setFileTypeTab('document');
    const state = useFileStore.getState();
    expect(state.fileTypeTab).toBe('document');
    expect(state.page).toBe(1);
  });

  it('setStorageStats updates storage stats', () => {
    const stats = { totalFiles: 42, usedSpace: 5000, totalSpace: 10000 };
    useFileStore.getState().setStorageStats(stats);
    expect(useFileStore.getState().storageStats).toEqual(stats);
  });

  it('setPagination updates page and pageSize', () => {
    useFileStore.getState().setPagination(5, 25);
    const state = useFileStore.getState();
    expect(state.page).toBe(5);
    expect(state.pageSize).toBe(25);
  });

  it('setTotal updates total', () => {
    useFileStore.getState().setTotal(99);
    expect(useFileStore.getState().total).toBe(99);
  });

  it('setLoading updates loading flag', () => {
    useFileStore.getState().setLoading(true);
    expect(useFileStore.getState().loading).toBe(true);
  });

  // --- Async action tests ---

  describe('fetchFilesAsync', () => {
    it('sets loading=true then calls getFiles service', async () => {
      mockGetFiles.mockResolvedValue({ data: [mockFile], total: 1 } as any);

      const promise = useFileStore.getState().fetchFilesAsync();

      // loading should be true while the call is in flight
      expect(useFileStore.getState().loading).toBe(true);

      await promise;
    });

    it('sets files and total on successful fetch', async () => {
      mockGetFiles.mockResolvedValue({ data: [mockFile, mockFile2], total: 2 } as any);

      await useFileStore.getState().fetchFilesAsync();

      const state = useFileStore.getState();
      expect(state.files).toEqual([mockFile, mockFile2]);
      expect(state.total).toBe(2);
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('sets error and loading=false on failure', async () => {
      mockGetFiles.mockRejectedValue(new Error('Network error'));

      await useFileStore.getState().fetchFilesAsync();

      const state = useFileStore.getState();
      expect(state.loading).toBe(false);
      expect(state.error).toBe('Network error');
      expect(state.files).toEqual([]);
    });

    it('sets default error message when error has no message', async () => {
      mockGetFiles.mockRejectedValue('some string error');

      await useFileStore.getState().fetchFilesAsync();

      expect(useFileStore.getState().error).toBe('Failed to fetch files');
    });
  });

  describe('uploadFileAsync', () => {
    it('calls uploadFile service with file and params', async () => {
      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      const params = { uploaderId: 'user1', projectId: 'p1' };
      mockUploadFile.mockResolvedValue({ data: mockFile } as any);
      mockGetFiles.mockResolvedValue({ data: [mockFile], total: 1 } as any);

      await useFileStore.getState().uploadFileAsync(file, params);

      expect(mockUploadFile).toHaveBeenCalledWith(file, params);
    });

    it('refreshes file list after successful upload', async () => {
      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      mockUploadFile.mockResolvedValue({ data: mockFile } as any);
      mockGetFiles.mockResolvedValue({ data: [mockFile], total: 1 } as any);

      await useFileStore.getState().uploadFileAsync(file, { uploaderId: 'user1' });

      // fetchFilesAsync should have been called internally
      expect(mockGetFiles).toHaveBeenCalled();
      expect(useFileStore.getState().files).toEqual([mockFile]);
    });

    it('sets error on upload failure', async () => {
      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      mockUploadFile.mockRejectedValue(new Error('Upload failed'));

      await useFileStore.getState().uploadFileAsync(file, { uploaderId: 'user1' });

      const state = useFileStore.getState();
      expect(state.error).toBe('Upload failed');
      // getFiles should not have been called since upload failed
      expect(mockGetFiles).not.toHaveBeenCalled();
    });
  });
});
