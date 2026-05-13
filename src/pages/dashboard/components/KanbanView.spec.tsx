import { render, screen, act, fireEvent } from '@testing-library/react';
import { useRef } from 'react';
import { ConfigProvider } from 'antd';
import KanbanView from './KanbanView';
import { TaskStatus, TaskPriority } from '@/types';
import type { Task } from '@/types';

vi.mock('@dnd-kit/core', () => {
  const DndContext = ({ children, onDragStart, onDragEnd }: any) => {
    const handlersRef = useRef({ onDragStart, onDragEnd });
    handlersRef.current = { onDragStart, onDragEnd };
    (globalThis as any).__dndHandlers = handlersRef;
    return <div>{children}</div>;
  };
  return {
    DndContext,
    DragOverlay: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    closestCorners: vi.fn(),
    PointerSensor: vi.fn(),
    useSensor: vi.fn(),
    useSensors: vi.fn(() => []),
    useDroppable: () => ({ setNodeRef: vi.fn(), isOver: false }),
    useDraggable: () => ({
      attributes: {},
      listeners: {},
      setNodeRef: vi.fn(),
      transform: null,
      isDragging: false,
    }),
  };
});

const renderWithAntd = (ui: React.ReactElement) =>
  render(<ConfigProvider>{ui}</ConfigProvider>);

const makeTask = (overrides: Partial<Task> = {}): Task => ({
  id: 1,
  taskNo: 'T-001',
  title: '测试任务',
  description: '',
  type: 'TASK',
  projectId: 1,
  priority: TaskPriority.MEDIUM,
  status: TaskStatus.PENDING,
  assigneeId: 1,
  assigneeName: 'User1',
  reporterName: 'Reporter1',
  projectName: 'Project1',
  plannedStart: '',
  plannedEnd: '',
  progress: 0,
  tags: '',
  isWatching: false,
  isOverdue: false,
  isWarning: false,
  commentCount: 0,
  watcherCount: 0,
  createdAt: '2025-01-01',
  updatedAt: '2025-01-01',
  ...overrides,
});

const defaultProps = {
  tasks: [] as Task[],
  dateRange: ['2025-01-01', '2025-12-31'] as [string, string],
  onDateRangeChange: vi.fn(),
  onTaskStatusChange: vi.fn(),
};

describe('KanbanView', () => {
  it('renders kanban column headers', () => {
    renderWithAntd(<KanbanView {...defaultProps} />);
    expect(screen.getByText('待办')).toBeInTheDocument();
    expect(screen.getByText('进行中')).toBeInTheDocument();
    expect(screen.getAllByText('已完成').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('待审核')).toBeInTheDocument();
    expect(screen.getByText('已取消')).toBeInTheDocument();
    const taskCounts = screen.getAllByText(/\d+ tasks/);
    expect(taskCounts.length).toBe(5);
  });

  it('shows "暂无任务" when column has no tasks', () => {
    renderWithAntd(<KanbanView {...defaultProps} tasks={[]} />);
    const emptyMessages = screen.getAllByText('暂无任务');
    expect(emptyMessages.length).toBeGreaterThanOrEqual(1);
  });

  it('renders task card in correct column', () => {
    const task = makeTask({ title: '待办任务A', status: TaskStatus.PENDING });
    renderWithAntd(<KanbanView {...defaultProps} tasks={[task]} />);
    expect(screen.getByText('待办任务A')).toBeInTheDocument();
  });

  it('renders multiple tasks in different columns', () => {
    const tasks = [
      makeTask({ id: 1, title: '任务1', status: TaskStatus.PENDING }),
      makeTask({ id: 2, title: '任务2', status: TaskStatus.IN_PROGRESS }),
      makeTask({ id: 3, title: '任务3', status: TaskStatus.COMPLETED }),
    ];
    renderWithAntd(<KanbanView {...defaultProps} tasks={tasks} />);
    expect(screen.getByText('任务1')).toBeInTheDocument();
    expect(screen.getByText('任务2')).toBeInTheDocument();
    expect(screen.getByText('任务3')).toBeInTheDocument();
  });

  it('renders date range picker with placeholder', () => {
    renderWithAntd(<KanbanView {...defaultProps} />);
    expect(screen.getByPlaceholderText('开始日期')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('结束日期')).toBeInTheDocument();
  });

  it('updates column task count when tasks are provided', () => {
    const tasks = [
      makeTask({ id: 1, title: '待办A', status: TaskStatus.PENDING }),
      makeTask({ id: 2, title: '待办B', status: TaskStatus.PENDING }),
      makeTask({ id: 3, title: '进行中A', status: TaskStatus.IN_PROGRESS }),
    ];
    renderWithAntd(<KanbanView {...defaultProps} tasks={tasks} />);
    const taskCounts = screen.getAllByText(/\d+ tasks/);
    expect(taskCounts[0].textContent).toBe('2 tasks');
    expect(taskCounts[1].textContent).toBe('1 tasks');
  });

  it('renders tasks with different statuses in correct columns', () => {
    const tasks = [
      makeTask({ id: 1, title: '待办任务', status: TaskStatus.PENDING }),
      makeTask({ id: 2, title: '进行中任务', status: TaskStatus.IN_PROGRESS }),
      makeTask({ id: 3, title: '已完成任务', status: TaskStatus.COMPLETED }),
      makeTask({ id: 4, title: '待审核任务', status: TaskStatus.PENDING_REVIEW }),
      makeTask({ id: 5, title: '已取消任务', status: TaskStatus.CANCELLED }),
    ];
    renderWithAntd(<KanbanView {...defaultProps} tasks={tasks} />);
    expect(screen.getByText('待办任务')).toBeInTheDocument();
    expect(screen.getByText('进行中任务')).toBeInTheDocument();
    expect(screen.getByText('已完成任务')).toBeInTheDocument();
    expect(screen.getByText('待审核任务')).toBeInTheDocument();
    expect(screen.getByText('已取消任务')).toBeInTheDocument();
  });

  it('renders priority label on task card', () => {
    const task = makeTask({ title: '高优先级任务', status: TaskStatus.IN_PROGRESS, priority: TaskPriority.HIGH });
    renderWithAntd(<KanbanView {...defaultProps} tasks={[task]} />);
    expect(screen.getByText('高')).toBeInTheDocument();
  });

  it('renders priority label for URGENT priority', () => {
    const task = makeTask({ title: '紧急任务', status: TaskStatus.IN_PROGRESS, priority: TaskPriority.URGENT });
    renderWithAntd(<KanbanView {...defaultProps} tasks={[task]} />);
    expect(screen.getByText('紧急')).toBeInTheDocument();
  });

  it('renders priority label for LOW priority', () => {
    const task = makeTask({ title: '低优先级任务', status: TaskStatus.IN_PROGRESS, priority: TaskPriority.LOW });
    renderWithAntd(<KanbanView {...defaultProps} tasks={[task]} />);
    expect(screen.getByText('低')).toBeInTheDocument();
  });

  // --- Drag end handler tests ---

  it('handleDragEnd calls onTaskStatusChange when task drops on different column', () => {
    const onTaskStatusChange = vi.fn();
    const task = makeTask({ id: 1, status: TaskStatus.PENDING });
    renderWithAntd(
      <KanbanView {...defaultProps} tasks={[task]} onTaskStatusChange={onTaskStatusChange} />
    );

    const handlers = (globalThis as any).__dndHandlers.current;
    handlers.onDragEnd({
      active: { id: '1' },
      over: { id: 'in_progress' },
    });

    expect(onTaskStatusChange).toHaveBeenCalledWith(1, TaskStatus.IN_PROGRESS);
  });

  it('handleDragEnd does NOT call onTaskStatusChange when task is already in target column', () => {
    const onTaskStatusChange = vi.fn();
    const task = makeTask({ id: 1, status: TaskStatus.PENDING });
    renderWithAntd(
      <KanbanView {...defaultProps} tasks={[task]} onTaskStatusChange={onTaskStatusChange} />
    );

    const handlers = (globalThis as any).__dndHandlers.current;
    handlers.onDragEnd({
      active: { id: '1' },
      over: { id: 'todo' },
    });

    expect(onTaskStatusChange).not.toHaveBeenCalled();
  });

  it('handleDragEnd returns early when over is null', () => {
    const onTaskStatusChange = vi.fn();
    const task = makeTask({ id: 1, status: TaskStatus.PENDING });
    renderWithAntd(
      <KanbanView {...defaultProps} tasks={[task]} onTaskStatusChange={onTaskStatusChange} />
    );

    const handlers = (globalThis as any).__dndHandlers.current;
    handlers.onDragEnd({ active: { id: '1' }, over: null });

    expect(onTaskStatusChange).not.toHaveBeenCalled();
  });

  it('handleDragEnd returns early when task is not found', () => {
    const onTaskStatusChange = vi.fn();
    const task = makeTask({ id: 1, status: TaskStatus.PENDING });
    renderWithAntd(
      <KanbanView {...defaultProps} tasks={[task]} onTaskStatusChange={onTaskStatusChange} />
    );

    const handlers = (globalThis as any).__dndHandlers.current;
    handlers.onDragEnd({
      active: { id: '999' },
      over: { id: 'in_progress' },
    });

    expect(onTaskStatusChange).not.toHaveBeenCalled();
  });

  it('handleDragEnd returns early when over.id does not match any column', () => {
    const onTaskStatusChange = vi.fn();
    const task = makeTask({ id: 1, status: TaskStatus.PENDING });
    renderWithAntd(
      <KanbanView {...defaultProps} tasks={[task]} onTaskStatusChange={onTaskStatusChange} />
    );

    const handlers = (globalThis as any).__dndHandlers.current;
    handlers.onDragEnd({
      active: { id: '1' },
      over: { id: 'unknown_column' },
    });

    expect(onTaskStatusChange).not.toHaveBeenCalled();
  });

  // --- Drag start handler tests ---

  it('handleDragStart sets activeTask for an existing task', () => {
    const task = makeTask({ id: 1, title: '拖拽任务', status: TaskStatus.PENDING });
    renderWithAntd(<KanbanView {...defaultProps} tasks={[task]} />);

    const handlers = (globalThis as any).__dndHandlers.current;
    act(() => handlers.onDragStart({ active: { id: '1' } }));

    const taskElements = screen.getAllByText('拖拽任务');
    expect(taskElements.length).toBe(2);
  });

  it('handleDragStart does not throw when task is not found', () => {
    const task = makeTask({ id: 1, status: TaskStatus.PENDING });
    renderWithAntd(<KanbanView {...defaultProps} tasks={[task]} />);

    const handlers = (globalThis as any).__dndHandlers.current;
    expect(() =>
      act(() => handlers.onDragStart({ active: { id: '999' } }))
    ).not.toThrow();
  });

  // --- KanbanCard date rendering ---

  it('renders KanbanCard with plannedStart date formatted as M/D', () => {
    const task = makeTask({ title: '有日期的任务', status: TaskStatus.IN_PROGRESS, plannedStart: '2025-03-15' });
    renderWithAntd(<KanbanView {...defaultProps} tasks={[task]} />);
    expect(screen.getByText('3/15')).toBeInTheDocument();
  });

  it('does NOT render date when task has no plannedStart', () => {
    const task = makeTask({ title: '无日期的任务', status: TaskStatus.IN_PROGRESS, plannedStart: '' });
    renderWithAntd(<KanbanView {...defaultProps} tasks={[task]} />);
    expect(screen.queryByText(/^\d+\/\d+$/)).not.toBeInTheDocument();
  });

  // --- KanbanCard assignee avatar ---

  it('renders assignee avatar with first letter of assigneeName uppercase', () => {
    const task = makeTask({ title: '分配给Alice', status: TaskStatus.IN_PROGRESS, assigneeName: 'alice' });
    renderWithAntd(<KanbanView {...defaultProps} tasks={[task]} />);
    expect(screen.getByText('A')).toBeInTheDocument();
  });

  it('renders assignee avatar with "?" when assigneeName is empty', () => {
    const task = makeTask({ title: '无负责人的任务', status: TaskStatus.IN_PROGRESS, assigneeName: '' });
    renderWithAntd(<KanbanView {...defaultProps} tasks={[task]} />);
    expect(screen.getByText('?')).toBeInTheDocument();
  });

  // --- Column task filtering ---

  it('filters tasks into correct columns by status', () => {
    const tasks = [
      makeTask({ id: 1, title: '待办A', status: TaskStatus.PENDING }),
      makeTask({ id: 2, title: '进行中A', status: TaskStatus.IN_PROGRESS }),
      makeTask({ id: 3, title: '完成A', status: TaskStatus.COMPLETED }),
      makeTask({ id: 4, title: '审核A', status: TaskStatus.PENDING_REVIEW }),
      makeTask({ id: 5, title: '取消A', status: TaskStatus.CANCELLED }),
    ];
    renderWithAntd(<KanbanView {...defaultProps} tasks={tasks} />);

    expect(screen.getByText('待办A')).toBeInTheDocument();
    expect(screen.getByText('进行中A')).toBeInTheDocument();
    expect(screen.getByText('完成A')).toBeInTheDocument();
    expect(screen.getByText('审核A')).toBeInTheDocument();
    expect(screen.getByText('取消A')).toBeInTheDocument();

    const taskCounts = screen.getAllByText(/\d+ tasks/);
    expect(taskCounts[0].textContent).toBe('1 tasks');  // todo
    expect(taskCounts[1].textContent).toBe('1 tasks');  // in_progress
    expect(taskCounts[2].textContent).toBe('1 tasks');  // done
    expect(taskCounts[3].textContent).toBe('1 tasks');  // pending
    expect(taskCounts[4].textContent).toBe('1 tasks');  // rejected
  });

  // --- Multiple tasks per column ---

  it('renders multiple tasks in the same column', () => {
    const tasks = [
      makeTask({ id: 1, title: '进行中A', status: TaskStatus.IN_PROGRESS }),
      makeTask({ id: 2, title: '进行中B', status: TaskStatus.IN_PROGRESS }),
      makeTask({ id: 3, title: '进行中C', status: TaskStatus.IN_PROGRESS }),
    ];
    renderWithAntd(<KanbanView {...defaultProps} tasks={tasks} />);
    expect(screen.getByText('进行中A')).toBeInTheDocument();
    expect(screen.getByText('进行中B')).toBeInTheDocument();
    expect(screen.getByText('进行中C')).toBeInTheDocument();
    const taskCounts = screen.getAllByText(/\d+ tasks/);
    expect(taskCounts[1].textContent).toBe('3 tasks');
  });

  // --- DragOverlay rendering ---

  it('renders DragOverlay card when activeTask is set', () => {
    const task = makeTask({ id: 1, title: '覆盖层任务', status: TaskStatus.PENDING });
    renderWithAntd(<KanbanView {...defaultProps} tasks={[task]} />);

    const handlers = (globalThis as any).__dndHandlers.current;
    act(() => handlers.onDragStart({ active: { id: '1' } }));

    const titleElements = screen.getAllByText('覆盖层任务');
    expect(titleElements.length).toBe(2);
  });

  // --- Column data attributes ---

  it('renders column with data-column-key attribute', () => {
    renderWithAntd(<KanbanView {...defaultProps} />);
    expect(document.querySelector('[data-column-key="todo"]')).toBeInTheDocument();
    expect(document.querySelector('[data-column-key="in_progress"]')).toBeInTheDocument();
  });

  it('renders draggable card with data-task-id attribute', () => {
    const task = makeTask({ id: 42, title: '可拖拽任务', status: TaskStatus.IN_PROGRESS });
    renderWithAntd(<KanbanView {...defaultProps} tasks={[task]} />);
    expect(document.querySelector('[data-task-id="42"]')).toBeInTheDocument();
  });

  it('renders sort and filter controls', () => {
    renderWithAntd(<KanbanView {...defaultProps} />);
    expect(screen.getByTestId('kanban-sort-select')).toBeInTheDocument();
    expect(screen.getByTestId('kanban-filter-select')).toBeInTheDocument();
  });

  it('renders KanbanCard with data-priority attribute', () => {
    const task = makeTask({ title: '高优任务', status: TaskStatus.IN_PROGRESS, priority: TaskPriority.HIGH });
    renderWithAntd(<KanbanView {...defaultProps} tasks={[task]} />);
    const card = screen.getByText('高优任务').closest('[data-priority]');
    expect(card).toBeInTheDocument();
  });
});
