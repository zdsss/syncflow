import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../api', () => {
  const fns = {
    get: vi.fn().mockResolvedValue({}),
    post: vi.fn().mockResolvedValue({}),
    put: vi.fn().mockResolvedValue({}),
    delete: vi.fn().mockResolvedValue({}),
  };
  return { default: fns, request: fns };
});

import api from '../api';
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
  getComments,
  watchTask,
  unwatchTask,
} from '../task.service';

describe('TaskService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getTasks calls GET /tasks with params', async () => {
    const params = { pageNum: 1, pageSize: 10, keyword: 'test' };
    await getTasks(params);
    expect(api.get).toHaveBeenCalledWith('/tasks', { params });
  });

  it('getTasks works with no params', async () => {
    await getTasks();
    expect(api.get).toHaveBeenCalledWith('/tasks', { params: {} });
  });

  it('getTaskById calls GET /tasks/:id with numeric id', async () => {
    await getTaskById(42);
    expect(api.get).toHaveBeenCalledWith('/tasks/42');
  });

  it('createTask calls POST /tasks with data', async () => {
    const data = { name: 'New Task', projectId: 1, priority: 2 };
    await createTask(data);
    expect(api.post).toHaveBeenCalledWith('/tasks', data);
  });

  it('updateTask calls PUT /tasks/:id with data', async () => {
    const data = { name: 'Updated' };
    await updateTask(123, data);
    expect(api.put).toHaveBeenCalledWith('/tasks/123', data);
  });

  it('deleteTask calls DELETE /tasks/:id', async () => {
    await deleteTask(123);
    expect(api.delete).toHaveBeenCalledWith('/tasks/123');
  });

  it('changeStatus calls PUT /tasks/:id/status with status', async () => {
    await changeStatus(1, 4);
    expect(api.put).toHaveBeenCalledWith('/tasks/1/status', { status: 4 });
  });

  it('completeTask calls PUT /tasks/:id/complete', async () => {
    await completeTask(1);
    expect(api.put).toHaveBeenCalledWith('/tasks/1/complete');
  });

  it('updateProgress calls PUT /tasks/:id/progress with progress param', async () => {
    await updateProgress(1, 80);
    expect(api.put).toHaveBeenCalledWith('/tasks/1/progress', null, { params: { progress: 80 } });
  });

  it('getStatistics calls GET /tasks/statistics', async () => {
    await getStatistics();
    expect(api.get).toHaveBeenCalledWith('/tasks/statistics');
  });

  it('quickCreate calls POST /tasks/quick', async () => {
    await quickCreate({ input: 'Fix the bug', projectId: 1 });
    expect(api.post).toHaveBeenCalledWith('/tasks/quick', { input: 'Fix the bug', projectId: 1 });
  });

  it('getComments calls GET /tasks/:id/comments with pagination params', async () => {
    await getComments(1);
    expect(api.get).toHaveBeenCalledWith('/tasks/1/comments', { params: { pageNum: 1, pageSize: 20 } });
  });

  it('watchTask calls POST /tasks/:id/watch', async () => {
    await watchTask(1);
    expect(api.post).toHaveBeenCalledWith('/tasks/1/watch');
  });

  it('unwatchTask calls DELETE /tasks/:id/watch', async () => {
    await unwatchTask(1);
    expect(api.delete).toHaveBeenCalledWith('/tasks/1/watch');
  });
});
