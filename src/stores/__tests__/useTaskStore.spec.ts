import { describe, it, expect, beforeEach } from 'vitest';
import { useTaskStore } from '../useTaskStore';
import { TaskStatus, TaskPriority, type Task } from '@/types';

const mockTask: Task = {
  id: '1',
  name: 'Test Task',
  projectId: 'p1',
  priority: TaskPriority.MEDIUM,
  status: TaskStatus.IN_PROGRESS,
  assigneeId: 'user1',
  participantIds: [],
  progress: 50,
  milestone: false,
  dependencies: [],
  tags: [],
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
};

const mockTask2: Task = {
  id: '2',
  name: 'Second Task',
  projectId: 'p2',
  priority: TaskPriority.HIGH,
  status: TaskStatus.PENDING_ASSIGN,
  assigneeId: 'user2',
  participantIds: [],
  progress: 0,
  milestone: true,
  dependencies: [],
  tags: [],
  createdAt: '2024-01-02',
  updatedAt: '2024-01-02',
};

describe('useTaskStore', () => {
  beforeEach(() => {
    useTaskStore.setState({
      tasks: [],
      filters: {},
      total: 0,
      page: 1,
      pageSize: 20,
      loading: false,
    });
  });

  it('has correct initial state', () => {
    const state = useTaskStore.getState();
    expect(state.tasks).toEqual([]);
    expect(state.filters).toEqual({});
    expect(state.total).toBe(0);
    expect(state.page).toBe(1);
    expect(state.pageSize).toBe(20);
    expect(state.loading).toBe(false);
  });

  it('setTasks updates tasks array', () => {
    useTaskStore.getState().setTasks([mockTask, mockTask2]);
    expect(useTaskStore.getState().tasks).toEqual([mockTask, mockTask2]);
  });

  it('setFilters merges filters and resets page to 1', () => {
    useTaskStore.setState({ page: 3 });
    useTaskStore.getState().setFilters({ status: TaskStatus.IN_PROGRESS });
    const state = useTaskStore.getState();
    expect(state.filters.status).toBe(TaskStatus.IN_PROGRESS);
    expect(state.page).toBe(1);
  });

  it('setFilters merges with existing filters', () => {
    useTaskStore.getState().setFilters({ status: TaskStatus.IN_PROGRESS });
    useTaskStore.getState().setFilters({ priority: TaskPriority.HIGH });
    const state = useTaskStore.getState();
    expect(state.filters.status).toBe(TaskStatus.IN_PROGRESS);
    expect(state.filters.priority).toBe(TaskPriority.HIGH);
  });

  it('clearFilters resets filters to empty and page to 1', () => {
    useTaskStore.setState({ filters: { status: TaskStatus.IN_PROGRESS, keyword: 'test' }, page: 5 });
    useTaskStore.getState().clearFilters();
    const state = useTaskStore.getState();
    expect(state.filters).toEqual({});
    expect(state.page).toBe(1);
  });

  it('setPagination updates page and pageSize', () => {
    useTaskStore.getState().setPagination(3, 50);
    const state = useTaskStore.getState();
    expect(state.page).toBe(3);
    expect(state.pageSize).toBe(50);
  });

  it('setTotal updates total', () => {
    useTaskStore.getState().setTotal(100);
    expect(useTaskStore.getState().total).toBe(100);
  });

  it('setLoading updates loading flag', () => {
    useTaskStore.getState().setLoading(true);
    expect(useTaskStore.getState().loading).toBe(true);
    useTaskStore.getState().setLoading(false);
    expect(useTaskStore.getState().loading).toBe(false);
  });

  it('updateTask updates specific task by id', () => {
    useTaskStore.setState({ tasks: [mockTask, mockTask2] });
    useTaskStore.getState().updateTask('1', { progress: 80, name: 'Updated Task' });
    const { tasks } = useTaskStore.getState();
    expect(tasks[0].progress).toBe(80);
    expect(tasks[0].name).toBe('Updated Task');
    expect(tasks[0].id).toBe('1');
  });

  it('updateTask keeps other tasks unchanged', () => {
    useTaskStore.setState({ tasks: [mockTask, mockTask2] });
    useTaskStore.getState().updateTask('1', { progress: 80 });
    const { tasks } = useTaskStore.getState();
    expect(tasks[1]).toEqual(mockTask2);
  });
});
