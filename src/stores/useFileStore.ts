import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { FileRecord } from '@/types';
import { getFiles, uploadFile } from '@/services/file.service';

interface StorageStats {
  totalFiles: number;
  usedSpace: number;
  totalSpace: number;
}

interface GetFilesResponse {
  data: FileRecord[];
  total: number;
}

function isGetFilesResponse(res: unknown): res is GetFilesResponse {
  return res != null && typeof res === 'object' && 'data' in res && 'total' in res;
}

interface FileState {
  // State
  files: FileRecord[];
  fileTypeTab: string;
  storageStats: StorageStats;
  total: number;
  page: number;
  pageSize: number;
  loading: boolean;
  error: string | null;

  // Sync actions
  setFiles: (files: FileRecord[]) => void;
  setFileTypeTab: (tab: string) => void;
  setStorageStats: (stats: StorageStats) => void;
  setPagination: (page: number, pageSize: number) => void;
  setTotal: (total: number) => void;
  setLoading: (loading: boolean) => void;

  // Async actions
  fetchFilesAsync: (params?: Record<string, string | number>) => Promise<void>;
  uploadFileAsync: (file: File, params: { uploaderId: string; projectId?: string }) => Promise<void>;
}

export const useFileStore = create<FileState>()(
  devtools(
    (set, get) => ({
      // State
      files: [],
      fileTypeTab: 'all',
      storageStats: { totalFiles: 0, usedSpace: 0, totalSpace: 20 * 1024 * 1024 * 1024 },
      total: 0,
      page: 1,
      pageSize: 10,
      loading: false,
      error: null,

      // Sync actions
      setFiles: (files) => set({ files }),
      setFileTypeTab: (tab) => set({ fileTypeTab: tab, page: 1 }),
      setStorageStats: (stats) => set({ storageStats: stats }),
      setPagination: (page, pageSize) => set({ page, pageSize }),
      setTotal: (total) => set({ total }),
      setLoading: (loading) => set({ loading }),

      // Async actions
      fetchFilesAsync: async (params) => {
        set({ loading: true, error: null });
        try {
          const state = get();
          const queryParams: Record<string, string | number> = {
            page: state.page,
            pageSize: state.pageSize,
            ...params,
          };
          const res = await getFiles(queryParams);
          const files = isGetFilesResponse(res) ? res.data : (res as unknown as FileRecord[]);
          const total = isGetFilesResponse(res) ? res.total : files.length;
          set({ files, total, loading: false });
        } catch (err: any) {
          set({ error: err?.message || 'Failed to fetch files', loading: false });
        }
      },

      uploadFileAsync: async (file, params) => {
        try {
          await uploadFile(file, params);
          // Refresh file list after successful upload
          await get().fetchFilesAsync();
        } catch (err: any) {
          set({ error: err?.message || 'Failed to upload file' });
        }
      },
    }),
    { name: 'file' }
  )
);
