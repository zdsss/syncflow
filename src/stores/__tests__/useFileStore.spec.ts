import { describe, it, expect, beforeEach } from 'vitest';
import { useFileStore } from '../useFileStore';
import type { FileRecord } from '@/types';

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

describe('useFileStore', () => {
  beforeEach(() => {
    useFileStore.setState({
      files: [],
      fileTypeTab: 'all',
      storageStats: { totalFiles: 0, usedSpace: 0, totalSpace: 20 * 1024 * 1024 * 1024 },
      total: 0,
      page: 1,
      pageSize: 10,
      loading: false,
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
});
