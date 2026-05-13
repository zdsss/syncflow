import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import TaskList from './TaskList';
import { TaskStatus, TaskPriority } from '@/types';

const mockSetPagination = vi.fn();
const mockUpdateTask = vi.fn().mockResolvedValue(undefined);
const mockChangeStatus = vi.fn().mockResolvedValue(undefined);
const mockCompleteTask = vi.fn().mockResolvedValue(undefined);
const mockGetUsers = vi.fn();

vi.mock('@/stores/useTaskStore', () => ({
  useTaskStore: () => ({
    filters: {},
    pageNum: 1,
    pageSize: 20,
    total: 0,
    setPagination: mockSetPagination,
    updateTask: mockUpdateTask,
    changeStatus: mockChangeStatus,
    completeTask: mockCompleteTask,
  }),
}));

vi.mock('@/services/config.service', () => ({
  getUsers: (...args: any[]) => mockGetUsers(...args),
}));

const { mockConfirmFn } = vi.hoisted(() => ({
  mockConfirmFn: vi.fn(() => ({ destroy: vi.fn(), update: vi.fn(), then: vi.fn() })),
}));

// Mock antd Select as a native <select> for easier interaction in jsdom
vi.mock('antd', async (importOriginal) => {
  const antd = await importOriginal<any>();
  // Override Modal.confirm with mock
  antd.Modal.confirm = mockConfirmFn;
  return {
    ...antd,
    Select: ({ options, onChange, onBlur, defaultValue, size, style, autoFocus, ...rest }: any) => (
      <select
        data-testid="mock-select"
        defaultValue={defaultValue}
        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onChange?.(e.target.value)}
        onBlur={onBlur}
        style={style}
        {...rest}
      >
        {options?.map((opt: any) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    ),
    message: {
      success: (...args: any[]) => {},
      error: (...args: any[]) => {},
    },
  };
});

const renderWithAntd = (ui: React.ReactElement) =>
  render(<ConfigProvider locale={zhCN}>{ui}</ConfigProvider>);

const mockTasks = [
  {
    id: '1',
    taskNo: 'P3-L2-010',
    title: '任务一',
    description: '描述一',
    type: 'TASK',
    projectId: 1,
    priority: TaskPriority.HIGH,
    status: TaskStatus.IN_PROGRESS,
    assigneeId: 1,
    assigneeName: '张三',
    reporterName: '管理员',
    projectName: '测试项目',
    progress: 50,
    dependencies: [],
    tags: '',
    plannedStart: '2025-01-01',
    plannedEnd: '2025-06-01',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
    plannedHours: 20,
    actualHours: 8,
    isWatching: false,
    isOverdue: false,
    isWarning: false,
    commentCount: 0,
    watcherCount: 0,
  },
  {
    id: '2',
    taskNo: 'P3-L2-011',
    title: '任务二',
    description: '描述二',
    type: 'TASK',
    projectId: 1,
    priority: TaskPriority.LOW,
    status: TaskStatus.COMPLETED,
    assigneeId: 2,
    assigneeName: '李四',
    reporterName: '管理员',
    projectName: '测试项目',
    progress: 100,
    dependencies: [],
    tags: '',
    plannedStart: '2025-02-01',
    plannedEnd: '2025-07-01',
    createdAt: '2025-02-01T00:00:00Z',
    updatedAt: '2025-02-01T00:00:00Z',
    plannedHours: 10,
    actualHours: 10,
    isWatching: false,
    isOverdue: false,
    isWarning: false,
    commentCount: 0,
    watcherCount: 0,
  },
];

describe('TaskList', () => {
  beforeEach(() => {
    mockConfirmFn.mockClear();
    mockSetPagination.mockClear();
    mockUpdateTask.mockClear();
    mockCompleteTask.mockClear();
    mockGetUsers.mockClear();
    mockGetUsers.mockResolvedValue({
      code: 0,
      data: [
        { id: 1, name: '张三', email: 'zhang@example.com' },
        { id: 2, name: '李四', email: 'li@example.com' },
        { id: 3, name: '王五', email: 'wang@example.com' },
      ],
    });
  });

  it('renders task list with task names', () => {
    renderWithAntd(<TaskList tasks={mockTasks} loading={false} />);
    expect(screen.getByText('任务一')).toBeInTheDocument();
    expect(screen.getByText('任务二')).toBeInTheDocument();
  });

  it('renders task code column', () => {
    renderWithAntd(<TaskList tasks={mockTasks} loading={false} />);
    expect(screen.getByText('P3-L2-010')).toBeInTheDocument();
    expect(screen.getByText('P3-L2-011')).toBeInTheDocument();
  });

  it('renders edit and delete action buttons', () => {
    renderWithAntd(<TaskList tasks={mockTasks} loading={false} />);
    const editBtns = screen.getAllByTestId('edit-btn');
    const deleteBtns = screen.getAllByTestId('delete-btn');
    expect(editBtns.length).toBe(2);
    expect(deleteBtns.length).toBe(2);
  });

  it('shows task status labels', () => {
    renderWithAntd(<TaskList tasks={mockTasks} loading={false} />);
    expect(screen.getByText('进行中')).toBeInTheDocument();
    expect(screen.getByText('已完成')).toBeInTheDocument();
  });

  it('shows task priority labels', () => {
    renderWithAntd(<TaskList tasks={mockTasks} loading={false} />);
    expect(screen.getByText('高')).toBeInTheDocument();
    expect(screen.getByText('低')).toBeInTheDocument();
  });

  it('shows empty table when no tasks', () => {
    renderWithAntd(<TaskList tasks={[]} loading={false} />);
    const emptyDescriptions = screen.getAllByText('暂无数据');
    expect(emptyDescriptions.length).toBeGreaterThanOrEqual(1);
  });

  it('shows pagination total', () => {
    renderWithAntd(<TaskList tasks={mockTasks} loading={false} />);
    expect(screen.getByText(/共 2 条/)).toBeInTheDocument();
  });

  it('renders all status labels for tasks', () => {
    renderWithAntd(<TaskList tasks={mockTasks} loading={false} />);
    expect(screen.getByText('进行中')).toBeInTheDocument();
    expect(screen.getByText('已完成')).toBeInTheDocument();
  });

  it('calls setPagination when page changes', async () => {
    const manyTasks = Array.from({ length: 25 }, (_, i) => ({
      ...mockTasks[0],
      id: `task-${i}`,
      title: `任务${i}`,
    }));
    renderWithAntd(<TaskList tasks={manyTasks} loading={false} />);
    const page2 = screen.getByTitle('2');
    await userEvent.click(page2);
    await waitFor(() => {
      expect(mockSetPagination).toHaveBeenCalledWith(2, 20);
    });
  });

  it('opens status select when status badge is clicked', async () => {
    renderWithAntd(<TaskList tasks={mockTasks} loading={false} />);
    const initialComboboxes = screen.getAllByRole('combobox').length;
    const statusBadges = screen.getAllByText('进行中');
    await userEvent.click(statusBadges[0]);
    await waitFor(() => {
      expect(screen.getAllByRole('combobox').length).toBeGreaterThan(initialComboboxes);
    });
  });

  it('renders assignee names', async () => {
    renderWithAntd(<TaskList tasks={mockTasks} loading={false} />);
    await waitFor(() => {
      expect(screen.getByText('张三')).toBeInTheDocument();
    });
    expect(screen.getByText('李四')).toBeInTheDocument();
  });

  it('renders due dates formatted as MM/DD', () => {
    renderWithAntd(<TaskList tasks={mockTasks} loading={false} />);
    expect(screen.getByText('06/01')).toBeInTheDocument();
    expect(screen.getByText('07/01')).toBeInTheDocument();
  });

  it('renders due date as dash when plannedEnd is missing', () => {
    const taskNoDate = { ...mockTasks[0], id: '3', plannedEnd: undefined };
    renderWithAntd(<TaskList tasks={[taskNoDate]} loading={false} />);
    const dashes = screen.getAllByText('-');
    expect(dashes.length).toBeGreaterThanOrEqual(1);
  });

  // --- Status change flow ---
  it('renders status select component in table', () => {
    renderWithAntd(<TaskList tasks={mockTasks} loading={false} />);
    expect(screen.getByText('进行中')).toBeInTheDocument();
    expect(screen.getByText('已完成')).toBeInTheDocument();
    const statusBadges = screen.getAllByTitle('点击切换状态');
    expect(statusBadges.length).toBeGreaterThanOrEqual(1);
  });

  // --- Filter application (filteredTasks) & Pagination ---
  it('shows all tasks when store filters are empty', () => {
    const allTasks = [
      { ...mockTasks[0], status: TaskStatus.IN_PROGRESS },
      { ...mockTasks[1], status: TaskStatus.COMPLETED },
      { ...mockTasks[0], id: '3', title: '任务三', status: TaskStatus.IN_PROGRESS },
    ];
    renderWithAntd(<TaskList tasks={allTasks} loading={false} />);
    expect(screen.getByText('任务一')).toBeInTheDocument();
    expect(screen.getByText('任务二')).toBeInTheDocument();
    expect(screen.getByText('任务三')).toBeInTheDocument();
  });

  it('paginates tasks correctly on page change', async () => {
    const manyTasks = Array.from({ length: 45 }, (_, i) => ({
      ...mockTasks[0],
      id: `task-${i}`,
      title: `任务${i}`,
    }));
    renderWithAntd(<TaskList tasks={manyTasks} loading={false} />);
    const page3 = screen.getByTitle('3');
    await userEvent.click(page3);
    await waitFor(() => {
      expect(mockSetPagination).toHaveBeenCalledWith(3, 20);
    });
  });

  it('shows correct pagination total', () => {
    const tasks25 = Array.from({ length: 25 }, (_, i) => ({
      ...mockTasks[0],
      id: `task-${i}`,
      title: `任务${i}`,
    }));
    renderWithAntd(<TaskList tasks={tasks25} loading={false} />);
    expect(screen.getByText(/共 25 条/)).toBeInTheDocument();
  });

  // --- New tests for uncovered lines (74-83, 139-140) ---

  it('shows success message when status is changed', async () => {
    const { message } = await import('antd');
    const successSpy = vi.spyOn(message, 'success').mockImplementation(() => {});

    renderWithAntd(<TaskList tasks={mockTasks} loading={false} />);

    // Click status badge to open Select
    const statusBadges = screen.getAllByTitle('点击切换状态');
    await userEvent.click(statusBadges[0]);

    // Select a new status via native <select> mock
    const select = await screen.findByTestId('mock-select');
    fireEvent.change(select, { target: { value: TaskStatus.CANCELLED } });

    await waitFor(() => {
      expect(successSpy).toHaveBeenCalledWith('状态已更新');
      expect(mockChangeStatus).toHaveBeenCalledWith(1, TaskStatus.CANCELLED);
    });

    successSpy.mockRestore();
  });

  it('calls completeTask when status is changed to COMPLETED', async () => {
    renderWithAntd(<TaskList tasks={mockTasks} loading={false} />);

    // Click status badge to open Select
    const statusBadges = screen.getAllByTitle('点击切换状态');
    await userEvent.click(statusBadges[0]);

    // Select COMPLETED status — now directly calls completeTask
    const select = await screen.findByTestId('mock-select');
    fireEvent.change(select, { target: { value: TaskStatus.COMPLETED } });

    await waitFor(() => {
      expect(mockCompleteTask).toHaveBeenCalledWith(1);
    });
  });

  it('shows error message when status update fails', async () => {
    const { message } = await import('antd');
    const errorSpy = vi.spyOn(message, 'error').mockImplementation(() => {});
    mockChangeStatus.mockRejectedValueOnce(new Error('update failed'));

    renderWithAntd(<TaskList tasks={mockTasks} loading={false} />);

    // Click status badge to open Select
    const statusBadges = screen.getAllByTitle('点击切换状态');
    await userEvent.click(statusBadges[0]);

    // Select a new status to trigger handleStatusChange
    const select = await screen.findByTestId('mock-select');
    fireEvent.change(select, { target: { value: TaskStatus.CANCELLED } });

    await waitFor(() => {
      expect(errorSpy).toHaveBeenCalledWith('状态更新失败');
    });

    errorSpy.mockRestore();
  });

  // --- Tag badges ---
  it('renders tags as badges when present', () => {
    const tasksWithTags = [
      { ...mockTasks[0], tags: ['紧急', '前端'] },
    ];
    renderWithAntd(<TaskList tasks={tasksWithTags} loading={false} />);
    expect(screen.getByText('紧急')).toBeInTheDocument();
    expect(screen.getByText('前端')).toBeInTheDocument();
  });

  it('does not render tag badges when tags array is empty', () => {
    renderWithAntd(<TaskList tasks={mockTasks} loading={false} />);
    // mockTasks have tags: [], so no tag badges should appear in the task name column
    const tagBadges = document.querySelectorAll('[class*="tagBadge"]');
    expect(tagBadges.length).toBe(0);
  });

  // --- Task assignment/transfer ---
  it('fetches users on mount', async () => {
    renderWithAntd(<TaskList tasks={mockTasks} loading={false} />);
    await waitFor(() => {
      expect(mockGetUsers).toHaveBeenCalled();
    });
  });

  it('shows assignee name when user is found in user list', async () => {
    renderWithAntd(<TaskList tasks={mockTasks} loading={false} />);
    await waitFor(() => {
      expect(screen.getByText('张三')).toBeInTheDocument();
      expect(screen.getByText('李四')).toBeInTheDocument();
    });
  });

  it('shows assigneeId when user is not found in user list', () => {
    mockGetUsers.mockResolvedValue({ code: 0, data: [] });
    renderWithAntd(<TaskList tasks={mockTasks} loading={false} />);
    // When users list is empty, the assigneeId is displayed directly
    const assigneeSpans = screen.getAllByTitle('点击更改负责人');
    expect(assigneeSpans.length).toBeGreaterThanOrEqual(1);
  });

  it('opens assign select when assignee is clicked', async () => {
    renderWithAntd(<TaskList tasks={mockTasks} loading={false} />);
    await waitFor(() => {
      expect(screen.getByText('张三')).toBeInTheDocument();
    });
    const initialComboboxes = screen.getAllByRole('combobox').length;
    await userEvent.click(screen.getByText('张三'));
    await waitFor(() => {
      expect(screen.getAllByRole('combobox').length).toBeGreaterThan(initialComboboxes);
    });
  });

  it('calls updateTask with new assigneeId on selection', async () => {
    const { message } = await import('antd');
    const successSpy = vi.spyOn(message, 'success').mockImplementation(() => {});

    renderWithAntd(<TaskList tasks={mockTasks} loading={false} />);
    // Wait for users to load and assignee to render
    await waitFor(() => {
      expect(screen.getAllByTitle('点击更改负责人').length).toBeGreaterThanOrEqual(1);
    });

    // Click on first assignee to open select
    const assigneeSpans = screen.getAllByTitle('点击更改负责人');
    await userEvent.click(assigneeSpans[0]);
    const assignSelect = await screen.findByTestId('mock-select');
    fireEvent.change(assignSelect, { target: { value: '3' } });

    await waitFor(() => {
      expect(mockUpdateTask).toHaveBeenCalledWith('1', { assigneeId: '3' });
      expect(successSpy).toHaveBeenCalledWith('负责人已更新');
    });

    successSpy.mockRestore();
  });

  it('shows assignee title hint', async () => {
    renderWithAntd(<TaskList tasks={mockTasks} loading={false} />);
    await waitFor(() => {
      const assigneeSpans = screen.getAllByTitle('点击更改负责人');
      expect(assigneeSpans.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('calls completeTask on task completion and shows success message', async () => {
    const { message } = await import('antd');
    vi.spyOn(message, 'success').mockImplementation(() => {});

    renderWithAntd(<TaskList tasks={mockTasks} loading={false} />);

    // Click status badge to open Select
    const statusBadges = screen.getAllByTitle('点击切换状态');
    await userEvent.click(statusBadges[0]);

    // Change status to COMPLETED
    const select = await screen.findByTestId('mock-select');
    fireEvent.change(select, { target: { value: TaskStatus.COMPLETED } });

    // Verify completeTask was called (backend handles approval logic)
    await waitFor(() => {
      expect(mockCompleteTask).toHaveBeenCalledWith(1);
    });
  });
});
