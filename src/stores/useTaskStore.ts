import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { TaskStatus } from '@/types';
import type { TaskVO, TaskPageData, TaskQueryParams, TaskStatistics } from '@/services/task.service';
import {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  changeStatus,
  completeTask,
  updateProgress,
  getStatistics,
  quickCreate,
  watchTask,
  unwatchTask,
} from '@/services/task.service';
import { useProjectStore } from './useProjectStore';

interface TaskState {
  // Data
  tasks: TaskVO[];
  total: number;
  currentTask: TaskVO | null;
  statistics: TaskStatistics | null;

  // Pagination & filters
  pageNum: number;
  pageSize: number;
  filters: Omit<TaskQueryParams, 'pageNum' | 'pageSize'>;

  // UI
  loading: boolean;
  error: string | null;

  // Sync actions
  setTasks: (tasks: TaskVO[]) => void;
  setCurrentTask: (task: TaskVO | null) => void;
  setFilters: (filters: Partial<Omit<TaskQueryParams, 'pageNum' | 'pageSize'>>) => void;
  clearFilters: () => void;
  setPagination: (pageNum: number, pageSize: number) => void;

  // Async actions
  fetchTasks: (params?: TaskQueryParams) => Promise<void>;
  fetchTaskById: (id: number) => Promise<void>;
  createTask: (data: Record<string, any>) => Promise<TaskVO>;
  updateTask: (id: number, data: Record<string, any>) => Promise<void>;
  deleteTask: (id: number) => Promise<void>;
  changeStatus: (id: number, status: number) => Promise<void>;
  completeTask: (id: number) => Promise<void>;
  updateProgress: (id: number, progress: number) => Promise<void>;
  fetchStatistics: () => Promise<void>;
  quickCreate: (data: { input: string; projectId?: number }) => Promise<TaskVO>;
  watchTask: (id: number) => Promise<void>;
  unwatchTask: (id: number) => Promise<void>;
}

export const useTaskStore = create<TaskState>()(
  devtools(
    (set, get) => ({
      // Initial state
      tasks: [],
      total: 0,
      currentTask: null,
      statistics: null,
      pageNum: 1,
      pageSize: 10,
      filters: {},
      loading: false,
      error: null,

      // Sync actions
      setTasks: (tasks) => set({ tasks }),
      setCurrentTask: (task) => set({ currentTask: task }),
      setFilters: (filters) =>
        set((state) => ({
          filters: { ...state.filters, ...filters },
          pageNum: 1, // reset to first page on filter change
        })),
      clearFilters: () => set({ filters: {}, pageNum: 1 }),
      setPagination: (pageNum, pageSize) => set({ pageNum, pageSize }),

      // Async actions
      fetchTasks: async (params) => {
        set({ loading: true, error: null });
        try {
          const state = get();
          const queryParams: TaskQueryParams = {
            pageNum: state.pageNum,
            pageSize: state.pageSize,
            ...state.filters,
            ...params,
          };
          const res = await getTasks(queryParams);
          const pageData: TaskPageData = res.data;
          set({
            tasks: pageData.records,
            total: pageData.total,
            loading: false,
          });
        } catch (err: any) {
          set({ error: err?.message || 'Failed to fetch tasks', loading: false });
        }
      },

      fetchTaskById: async (id) => {
        set({ loading: true, error: null });
        try {
          const res = await getTaskById(id);
          set({ currentTask: res.data, loading: false });
        } catch (err: any) {
          set({ error: err?.message || 'Failed to fetch task', loading: false });
        }
      },

      createTask: async (data) => {
        set({ loading: true, error: null });
        try {
          const res = await createTask(data);
          const newTask = res.data;
          set((state) => ({
            tasks: [newTask, ...state.tasks],
            total: state.total + 1,
            loading: false,
          }));
          return newTask;
        } catch (err: any) {
          set({ error: err?.message || 'Failed to create task', loading: false });
          throw err;
        }
      },

      updateTask: async (id, data) => {
        set({ loading: true, error: null });
        try {
          const res = await updateTask(id, data);
          const updated = res.data;
          set((state) => ({
            tasks: state.tasks.map((t) => (t.id === id ? updated : t)),
            currentTask: state.currentTask?.id === id ? updated : state.currentTask,
            loading: false,
          }));
        } catch (err: any) {
          set({ error: err?.message || 'Failed to update task', loading: false });
          throw err;
        }
      },

      deleteTask: async (id) => {
        set({ loading: true, error: null });
        try {
          const task = get().tasks.find((t) => t.id === id);
          await deleteTask(id);
          set((state) => ({
            tasks: state.tasks.filter((t) => t.id !== id),
            total: state.total - 1,
            currentTask: state.currentTask?.id === id ? null : state.currentTask,
            loading: false,
          }));
          if (task?.projectId) {
            useProjectStore.getState().fetchProjectById(task.projectId);
          }
        } catch (err: any) {
          set({ error: err?.message || 'Failed to delete task', loading: false });
          throw err;
        }
      },

      changeStatus: async (id, status) => {
        try {
          await changeStatus(id, status);
          const task = get().tasks.find((t) => t.id === id);
          set((state) => ({
            tasks: state.tasks.map((t) => {
              if (t.id !== id) return t;
              const updated = { ...t, status };
              if (status === TaskStatus.COMPLETED) {
                updated.progress = 100;
              }
              return updated;
            }),
            currentTask: state.currentTask?.id === id
              ? { ...state.currentTask, status, ...(status === TaskStatus.COMPLETED ? { progress: 100 } : {}) }
              : state.currentTask,
          }));
          if (task?.projectId) {
            useProjectStore.getState().fetchProjectById(task.projectId);
          }
        } catch (err: any) {
          set({ error: err?.message || 'Failed to change status' });
          throw err;
        }
      },

      completeTask: async (id) => {
        try {
          let task = get().tasks.find((t) => t.id === id) || get().currentTask;
          if (!task || task.id !== id) {
            const res = await getTaskById(id);
            task = res.data;
          }

          // Idempotency guard: don't start workflow if already in approval
          if (task && task.status === 3) {
            return;
          }

          await completeTask(id);

          // Re-fetch to get actual status from backend (approval routing is server-side)
          const updated = await getTaskById(id);
          const updatedTask = updated.data;

          set((state) => ({
            tasks: state.tasks.map((t) =>
              t.id === id ? { ...t, status: updatedTask.status, progress: updatedTask.progress } : t
            ),
            currentTask:
              state.currentTask?.id === id
                ? { ...state.currentTask, status: updatedTask.status, progress: updatedTask.progress }
                : state.currentTask,
          }));
          if (task?.projectId) {
            useProjectStore.getState().fetchProjectById(task.projectId);
          }
        } catch (err: any) {
          set({ error: err?.message || 'Failed to complete task' });
          throw err;
        }
      },

      updateProgress: async (id, progress) => {
        try {
          await updateProgress(id, progress);
          set((state) => ({
            tasks: state.tasks.map((t) => (t.id === id ? { ...t, progress } : t)),
            currentTask:
              state.currentTask?.id === id ? { ...state.currentTask, progress } : state.currentTask,
          }));
        } catch (err: any) {
          set({ error: err?.message || 'Failed to update progress' });
          throw err;
        }
      },

      fetchStatistics: async () => {
        try {
          const res = await getStatistics();
          set({ statistics: res.data });
        } catch (err: any) {
          set({ error: err?.message || 'Failed to fetch statistics' });
        }
      },

      quickCreate: async (data) => {
        set({ loading: true, error: null });
        try {
          const res = await quickCreate(data);
          const newTask = res.data;
          set((state) => ({
            tasks: [newTask, ...state.tasks],
            total: state.total + 1,
            loading: false,
          }));
          return newTask;
        } catch (err: any) {
          set({ error: err?.message || 'Failed to quick create task', loading: false });
          throw err;
        }
      },

      watchTask: async (id) => {
        try {
          await watchTask(id);
        } catch (err: any) {
          set({ error: err?.message || 'Failed to watch task' });
          throw err;
        }
      },

      unwatchTask: async (id) => {
        try {
          await unwatchTask(id);
        } catch (err: any) {
          set({ error: err?.message || 'Failed to unwatch task' });
          throw err;
        }
      },
    }),
    { name: 'task' }
  )
);
