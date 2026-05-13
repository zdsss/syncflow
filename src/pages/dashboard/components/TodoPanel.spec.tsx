import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfigProvider } from 'antd';
import TodoPanel from './TodoPanel';
import { TaskStatus, TaskPriority } from '@/types';
import type { Task } from '@/types';

const renderWithAntd = (ui: React.ReactElement) =>
  render(<ConfigProvider>{ui}</ConfigProvider>);

const baseTask: Task = {
  id: 1,
  taskNo: 'P3-L2-010',
  title: '电池模组结构强度分析',
  type: 'TASK',
  projectId: 1,
  priority: TaskPriority.HIGH,
  status: TaskStatus.IN_PROGRESS,
  assigneeId: 1,
  assigneeName: '邓智豪',
  reporterName: '张三',
  projectName: '项目A',
  plannedStart: '2025-03-01',
  plannedEnd: '2025-06-01',
  progress: 50,
  tags: '',
  isWatching: false,
  isOverdue: false,
  isWarning: false,
  commentCount: 0,
  watcherCount: 0,
  createdAt: '2025-01-01T08:00:00Z',
  updatedAt: '2025-04-01T08:00:00Z',
};

const mockTasks: Task[] = [
  baseTask,
  {
    ...baseTask,
    id: 2,
    taskNo: 'P3-L1-005',
    title: 'BOM清单审核',
    priority: TaskPriority.MEDIUM,
    status: TaskStatus.COMPLETED,
    assigneeId: 2,
    assigneeName: '李四',
    isOverdue: false,
    isWarning: false,
  },
  {
    ...baseTask,
    id: 3,
    taskNo: 'P3-L2-020',
    title: '电池Pack热管理方案评审',
    priority: TaskPriority.URGENT,
    status: TaskStatus.OVERDUE,
    assigneeId: 3,
    assigneeName: '王五',
    isOverdue: true,
    isWarning: false,
  },
];

describe('TodoPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the panel structure', () => {
    renderWithAntd(<TodoPanel tasks={mockTasks} />);
    expect(screen.getByTestId('todo-panel')).toBeInTheDocument();
    expect(screen.getByTestId('todo-action-bar')).toBeInTheDocument();
    expect(screen.getByTestId('todo-tabs')).toBeInTheDocument();
    expect(screen.getByTestId('filter-chips')).toBeInTheDocument();
    expect(screen.getByTestId('task-list')).toBeInTheDocument();
  });

  it('renders action bar with view toggle and icon buttons', () => {
    renderWithAntd(<TodoPanel tasks={mockTasks} />);
    expect(screen.getByTestId('view-list-btn')).toBeInTheDocument();
    expect(screen.getByTestId('view-calendar-btn')).toBeInTheDocument();
    expect(screen.getByTestId('ai-assistant-btn')).toBeInTheDocument();
    expect(screen.getByTestId('search-btn')).toBeInTheDocument();
  });

  it('renders tabs with default "all" tab active', () => {
    renderWithAntd(<TodoPanel tasks={mockTasks} />);
    expect(screen.getByTestId('tab-my')).toBeInTheDocument();
    expect(screen.getByTestId('tab-all')).toBeInTheDocument();
    expect(screen.getByText('我的任务')).toBeInTheDocument();
    expect(screen.getByText('所有任务')).toBeInTheDocument();
  });

  it('switches active tab on click', async () => {
    const user = userEvent.setup();
    renderWithAntd(<TodoPanel tasks={mockTasks} />);
    await user.click(screen.getByTestId('tab-my'));
    expect(screen.getByTestId('tab-my')).toBeInTheDocument();
  });

  it('renders task count', () => {
    renderWithAntd(<TodoPanel tasks={mockTasks} />);
    expect(screen.getByTestId('task-count')).toHaveTextContent('共3个任务');
  });

  it('updates task count when tasks change', () => {
    const { rerender } = renderWithAntd(<TodoPanel tasks={mockTasks} />);
    expect(screen.getByTestId('task-count')).toHaveTextContent('共3个任务');
    rerender(
      <ConfigProvider>
        <TodoPanel tasks={mockTasks.slice(0, 1)} />
      </ConfigProvider>
    );
    expect(screen.getByTestId('task-count')).toHaveTextContent('共1个任务');
  });

  it('renders filter chips', () => {
    renderWithAntd(<TodoPanel tasks={mockTasks} />);
    expect(screen.getByTestId('chip-all')).toBeInTheDocument();
    expect(screen.getByTestId('chip-today')).toBeInTheDocument();
    expect(screen.getByTestId('chip-week')).toBeInTheDocument();
    expect(screen.getByTestId('chip-overdue')).toBeInTheDocument();
    expect(screen.getByTestId('chip-risk')).toBeInTheDocument();
    expect(screen.getByText('全部')).toBeInTheDocument();
    expect(screen.getByText('今天')).toBeInTheDocument();
    expect(screen.getByText('本周')).toBeInTheDocument();
    expect(screen.getByText('预警')).toBeInTheDocument();
    expect(screen.getAllByText('逾期').length).toBeGreaterThanOrEqual(1);
  });

  it('clicking a filter chip highlights it', async () => {
    const user = userEvent.setup();
    renderWithAntd(<TodoPanel tasks={mockTasks} />);
    const overdueChip = screen.getByTestId('chip-overdue');
    await user.click(overdueChip);
    expect(screen.getByTestId('task-count')).toHaveTextContent('共1个任务');
  });

  it('renders task cards', () => {
    renderWithAntd(<TodoPanel tasks={mockTasks} />);
    expect(screen.getByTestId('task-card-1')).toBeInTheDocument();
    expect(screen.getByTestId('task-card-2')).toBeInTheDocument();
    expect(screen.getByTestId('task-card-3')).toBeInTheDocument();
  });

  it('task cards display code, name, status, priority', () => {
    renderWithAntd(<TodoPanel tasks={mockTasks} />);
    expect(screen.getByText('P3-L2-010')).toBeInTheDocument();
    expect(screen.getByText('电池模组结构强度分析')).toBeInTheDocument();
    expect(screen.getByText('进行中')).toBeInTheDocument();
    expect(screen.getByText('高')).toBeInTheDocument();
  });

  it('task cards display code field when available', () => {
    renderWithAntd(<TodoPanel tasks={mockTasks} />);
    const codes = screen.getAllByTestId('task-code');
    expect(codes[0]).toHaveTextContent('P3-L2-010');
    expect(codes[1]).toHaveTextContent('P3-L1-005');
  });

  it('task card falls back to id when taskNo is not provided', () => {
    const noCodeTask: Task = { ...baseTask, id: 99, taskNo: '' };
    renderWithAntd(<TodoPanel tasks={[noCodeTask]} />);
    const code = screen.getByTestId('task-code');
    expect(code).toHaveTextContent('99');
  });

  it('renders list/calendar view toggle', async () => {
    const user = userEvent.setup();
    renderWithAntd(<TodoPanel tasks={mockTasks} />);
    const listBtn = screen.getByTestId('view-list-btn');
    const calBtn = screen.getByTestId('view-calendar-btn');
    expect(listBtn).toBeInTheDocument();
    expect(calBtn).toBeInTheDocument();
    await user.click(calBtn);
    expect(calBtn).toBeInTheDocument();
  });

  it('search button toggles search input', async () => {
    const user = userEvent.setup();
    renderWithAntd(<TodoPanel tasks={mockTasks} />);
    expect(screen.queryByTestId('search-input')).not.toBeInTheDocument();
    await user.click(screen.getByTestId('search-btn'));
    expect(screen.getByTestId('search-input')).toBeInTheDocument();
  });

  it('search filters tasks by keyword', async () => {
    renderWithAntd(<TodoPanel tasks={mockTasks} />);
    fireEvent.click(screen.getByTestId('search-btn'));
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'BOM' } });
    expect(screen.getByTestId('task-count')).toHaveTextContent('共1个任务');
    expect(screen.getByText('BOM清单审核')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    renderWithAntd(<TodoPanel tasks={[]} loading={true} />);
    expect(screen.getByText('加载中...')).toBeInTheDocument();
  });

  it('shows empty state when no tasks', () => {
    renderWithAntd(<TodoPanel tasks={[]} />);
    expect(screen.getByText('暂无任务')).toBeInTheDocument();
  });
});
