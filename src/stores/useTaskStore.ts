import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Task, TaskStatus, TaskPriority } from '@/types';

interface TaskFilters {
  status?: TaskStatus;
  priority?: TaskPriority;
  keyword?: string;
  dateRange?: [string, string];
  projectId?: string;
  assigneeId?: string;
}

interface TaskState {
  tasks: Task[];
  filters: TaskFilters;
  total: number;
  page: number;
  pageSize: number;
  loading: boolean;
  setTasks: (tasks: Task[]) => void;
  setFilters: (filters: Partial<TaskFilters>) => void;
  clearFilters: () => void;
  setPagination: (page: number, pageSize: number) => void;
  setTotal: (total: number) => void;
  setLoading: (loading: boolean) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
}

export const useTaskStore = create<TaskState>()(
  devtools(
    (set) => ({
      tasks: [],
      filters: {},
      total: 0,
      page: 1,
      pageSize: 20,
      loading: false,
      setTasks: (tasks) => set({ tasks }),
      setFilters: (filters) =>
        set((state) => ({ filters: { ...state.filters, ...filters }, page: 1 })),
      clearFilters: () => set({ filters: {}, page: 1 }),
      setPagination: (page, pageSize) => set({ page, pageSize }),
      setTotal: (total) => set({ total }),
      setLoading: (loading) => set({ loading }),
      updateTask: (id, updates) =>
        set((state) => ({
          tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
        })),
    }),
    { name: 'task' }
  )
);
