import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { FileRecord } from '@/types';

interface StorageStats {
  totalFiles: number;
  usedSpace: number;
  totalSpace: number;
}

interface FileState {
  files: FileRecord[];
  fileTypeTab: string;
  storageStats: StorageStats;
  total: number;
  page: number;
  pageSize: number;
  loading: boolean;
  setFiles: (files: FileRecord[]) => void;
  setFileTypeTab: (tab: string) => void;
  setStorageStats: (stats: StorageStats) => void;
  setPagination: (page: number, pageSize: number) => void;
  setTotal: (total: number) => void;
  setLoading: (loading: boolean) => void;
}

export const useFileStore = create<FileState>()(
  devtools(
    (set) => ({
      files: [],
      fileTypeTab: 'all',
      storageStats: { totalFiles: 0, usedSpace: 0, totalSpace: 20 * 1024 * 1024 * 1024 },
      total: 0,
      page: 1,
      pageSize: 10,
      loading: false,
      setFiles: (files) => set({ files }),
      setFileTypeTab: (tab) => set({ fileTypeTab: tab, page: 1 }),
      setStorageStats: (stats) => set({ storageStats: stats }),
      setPagination: (page, pageSize) => set({ page, pageSize }),
      setTotal: (total) => set({ total }),
      setLoading: (loading) => set({ loading }),
    }),
    { name: 'file' }
  )
);
