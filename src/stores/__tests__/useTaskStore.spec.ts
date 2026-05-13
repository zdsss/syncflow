import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useTaskStore } from '../useTaskStore';
import type { TaskVO, TaskPageData } from '@/services/task.service';

vi.mock('@/services/task.service', () => ({
  getTasks: vi.fn(),
  getTaskById: vi.fn(),
  createTask: vi.fn(),
  updateTask: vi.fn(),
  deleteTask: vi.fn(),
  changeStatus: vi.fn(),
  completeTask: vi.fn(),
  updateProgress: vi.fn(),
  getStatistics: vi.fn(),
  quickCreate: vi.fn(),
  watchTask: vi.fn(),
  unwatchTask: vi.fn(),
}));

import {
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
  changeStatus,
  completeTask,
  updateProgress,
  getStatistics,
} from '@/services/task.service';

const mockGetTasks = vi.mocked(getTasks);
const mockGetTaskById = vi.mocked(getTaskById);
const mockUpdateTask = vi.mocked(updateTask);
const mockDeleteTask = vi.mocked(deleteTask);
const mockChangeStatus = vi.mocked(changeStatus);
const mockCompleteTask = vi.mocked(completeTask);
const mockUpdateProgress = vi.mocked(updateProgress);
const mockGetStatistics = vi.mocked(getStatistics);

const mockTask: TaskVO = {
  id: 1,
  name: 'Test Task',
  projectId: 10,
  type: 'TASK',
  priority: 3,
  status: 2,
  assigneeId: 1,
  progress: 50,
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
};

const mockTask2: TaskVO = {
  id: 2,
  name: 'Second Task',
  projectId: 20,
  type: 'TASK',
  priority: 1,
  status: 1,
  assigneeId: 2,
  progress: 0,
  createdAt: '2024-01-02',
  updatedAt: '2024-01-02',
};

const mockPageData: TaskPageData = {
  records: [mockTask, mockTask2],
  total: 2,
  size: 10,
  current: 1,
};

describe('useTaskStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useTaskStore.setState({
      tasks: [],
      total: 0,
      currentTask: null,
      statistics: null,
      pageNum: 1,
      pageSize: 10,
      filters: {},
      loading: false,
      error: null,
    });
  });

  it('has correct initial state', () => {
    const state = useTaskStore.getState();
    expect(state.tasks).toEqual([]);
    expect(state.filters).toEqual({});
    expect(state.total).toBe(0);
    expect(state.pageNum).toBe(1);
    expect(state.pageSize).toBe(10);
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('setTasks updates tasks array', () => {
    useTaskStore.getState().setTasks([mockTask, mockTask2]);
    expect(useTaskStore.getState().tasks).toEqual([mockTask, mockTask2]);
  });

  it('setFilters merges filters and resets pageNum to 1', () => {
    useTaskStore.setState({ pageNum: 3 });
    useTaskStore.getState().setFilters({ status: 2 });
    const state = useTaskStore.getState();
    expect(state.filters.status).toBe(2);
    expect(state.pageNum).toBe(1);
  });

  it('setFilters merges with existing filters', () => {
    useTaskStore.getState().setFilters({ status: 2 });
    useTaskStore.getState().setFilters({ priority: 1 });
    const state = useTaskStore.getState();
    expect(state.filters.status).toBe(2);
    expect(state.filters.priority).toBe(1);
  });

  it('clearFilters resets filters to empty and pageNum to 1', () => {
    useTaskStore.setState({ filters: { status: 2, keyword: 'test' }, pageNum: 5 });
    useTaskStore.getState().clearFilters();
    const state = useTaskStore.getState();
    expect(state.filters).toEqual({});
    expect(state.pageNum).toBe(1);
  });

  it('setPagination updates pageNum and pageSize', () => {
    useTaskStore.getState().setPagination(3, 50);
    const state = useTaskStore.getState();
    expect(state.pageNum).toBe(3);
    expect(state.pageSize).toBe(50);
  });

  // --- Async action tests ---

  describe('fetchTasks', () => {
    it('sets loading=true then calls getTasks service', async () => {
      mockGetTasks.mockResolvedValue({ code: 200, data: mockPageData } as any);

      const promise = useTaskStore.getState().fetchTasks();
      expect(useTaskStore.getState().loading).toBe(true);

      await promise;
    });

    it('sets tasks and total on successful fetch', async () => {
      mockGetTasks.mockResolvedValue({ code: 200, data: mockPageData } as any);

      await useTaskStore.getState().fetchTasks();

      const state = useTaskStore.getState();
      expect(state.tasks).toEqual([mockTask, mockTask2]);
      expect(state.total).toBe(2);
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('sets error and loading=false on failure', async () => {
      mockGetTasks.mockRejectedValue(new Error('Network error'));

      await useTaskStore.getState().fetchTasks();

      const state = useTaskStore.getState();
      expect(state.loading).toBe(false);
      expect(state.error).toBe('Network error');
      expect(state.tasks).toEqual([]);
    });

    it('sets default error message when error has no message', async () => {
      mockGetTasks.mockRejectedValue('some string error');

      await useTaskStore.getState().fetchTasks();

      expect(useTaskStore.getState().error).toBe('Failed to fetch tasks');
    });
  });

  describe('updateTask', () => {
    it('calls updateTask service and patches store', async () => {
      useTaskStore.setState({ tasks: [mockTask, mockTask2] });
      const updatedTask = { ...mockTask, name: 'Updated Task' };
      mockUpdateTask.mockResolvedValue({ code: 200, data: updatedTask } as any);

      await useTaskStore.getState().updateTask(1, { name: 'Updated Task' });

      expect(mockUpdateTask).toHaveBeenCalledWith(1, { name: 'Updated Task' });
      const { tasks } = useTaskStore.getState();
      expect(tasks[0].name).toBe('Updated Task');
      expect(tasks[1]).toEqual(mockTask2);
    });

    it('sets error on failure', async () => {
      useTaskStore.setState({ tasks: [mockTask, mockTask2] });
      mockUpdateTask.mockRejectedValue(new Error('Update failed'));

      await expect(useTaskStore.getState().updateTask(1, { progress: 80 })).rejects.toThrow('Update failed');

      const state = useTaskStore.getState();
      expect(state.error).toBe('Update failed');
    });
  });

  describe('deleteTask', () => {
    it('removes task from store after successful delete', async () => {
      useTaskStore.setState({ tasks: [mockTask, mockTask2], total: 2 });
      mockDeleteTask.mockResolvedValue({ code: 200, data: null } as any);

      await useTaskStore.getState().deleteTask(1);

      const state = useTaskStore.getState();
      expect(state.tasks).toEqual([mockTask2]);
      expect(state.total).toBe(1);
    });
  });

  describe('changeStatus', () => {
    it('updates task status in store', async () => {
      useTaskStore.setState({ tasks: [mockTask] });
      mockChangeStatus.mockResolvedValue({ code: 200, data: null } as any);

      await useTaskStore.getState().changeStatus(1, 4);

      expect(mockChangeStatus).toHaveBeenCalledWith(1, 4);
      expect(useTaskStore.getState().tasks[0].status).toBe(4);
    });
  });

  describe('completeTask', () => {
    it('sets task status to 4 and progress to 100', async () => {
      useTaskStore.setState({ tasks: [mockTask] });
      mockCompleteTask.mockResolvedValue({ code: 200, data: null } as any);
      mockGetTaskById.mockResolvedValue({ code: 200, data: { ...mockTask, status: 4, progress: 100 } } as any);

      await useTaskStore.getState().completeTask(1);

      const task = useTaskStore.getState().tasks[0];
      expect(task.status).toBe(4);
      expect(task.progress).toBe(100);
    });
  });

  describe('updateProgress', () => {
    it('updates task progress in store', async () => {
      useTaskStore.setState({ tasks: [mockTask] });
      mockUpdateProgress.mockResolvedValue({ code: 200, data: null } as any);

      await useTaskStore.getState().updateProgress(1, 80);

      expect(mockUpdateProgress).toHaveBeenCalledWith(1, 80);
      expect(useTaskStore.getState().tasks[0].progress).toBe(80);
    });
  });

  describe('fetchStatistics', () => {
    it('sets statistics on successful fetch', async () => {
      const stats = { total: 10, pending: 2, inProgress: 3, reviewing: 1, completed: 3, cancelled: 1 };
      mockGetStatistics.mockResolvedValue({ code: 200, data: stats } as any);

      await useTaskStore.getState().fetchStatistics();

      expect(useTaskStore.getState().statistics).toEqual(stats);
    });
  });
});
