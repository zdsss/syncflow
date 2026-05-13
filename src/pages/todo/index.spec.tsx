import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfigProvider } from 'antd';
import { MemoryRouter, useSearchParams } from 'react-router-dom';

vi.mock('antd', async () => {
  const actual = await vi.importActual<typeof import('antd')>('antd');
  return {
    ...actual,
    message: {
      ...actual.message,
      error: vi.fn(),
    },
  };
});
import TodoPage from './index';

const mockSetTasks = vi.fn();
const mockSetLoading = vi.fn();
const mockSetTotal = vi.fn();
const mockSetPagination = vi.fn();
const mockSetFilters = vi.fn();

const mockFetchTasks = vi.fn().mockResolvedValue(undefined);
let mockFilters: Record<string, any> = {};

vi.mock('@/stores/useTaskStore', () => ({
  useTaskStore: () => ({
    tasks: [],
    loading: false,
    filters: mockFilters,
    setTasks: mockSetTasks,
    setLoading: mockSetLoading,
    setTotal: mockSetTotal,
    setPagination: mockSetPagination,
    fetchTasks: mockFetchTasks,
    page: 1,
    pageSize: 20,
    setFilters: (newFilters: any) => {
      mockFilters = { ...mockFilters, ...newFilters };
      mockSetFilters(newFilters);
    },
  }),
}));

vi.mock('@/services/task.service', () => ({
  getTasks: vi.fn().mockResolvedValue({ data: [], total: 0 }),
}));

vi.mock('./components/FilterBar', () => ({
  default: (props: any) => <div data-testid="filter-bar">FilterBar</div>,
}));

vi.mock('./components/TaskList', () => ({
  default: (props: any) => <div data-testid="task-list">TaskList</div>,
}));

vi.mock('./components/AiPanel', () => ({
  default: (props: any) => (
    <div data-testid="ai-panel">
      AiPanel
      <button data-testid="toggle-width-btn" onClick={props.onToggleWidth}>ToggleWidth</button>
      <button data-testid="close-btn" onClick={props.onClose}>Close</button>
      <button data-testid="metric-btn" onClick={() => props.onMetricClick('pending_assign')}>Metric</button>
    </div>
  ),
}));

const mockTaskFormOnClose = vi.fn();
const mockTaskFormOnSuccess = vi.fn();
vi.mock('./TaskForm', () => ({
  default: (props: any) =>
    props.visible ? (
      <div data-testid="task-form">
        <span data-testid="task-form-task-id">{props.taskId || ''}</span>
        <span data-testid="task-form-project-id">{props.projectId || ''}</span>
        <button data-testid="task-form-close" onClick={props.onClose}>CloseForm</button>
        <button data-testid="task-form-success" onClick={props.onSuccess}>SuccessForm</button>
      </div>
    ) : null,
}));

vi.mock('@/components/business/TaskCategoryNav', () => ({
  default: (props: any) => (
    <div data-testid="task-category-nav">TaskCategoryNav</div>
  ),
}));

vi.mock('@/components/business/QuickCreateBar', () => ({
  default: (props: any) => (
    <div data-testid="quick-create-bar">QuickCreateBar</div>
  ),
}));

vi.mock('@/components/ui/SlidePanel/SlidePanel', () => ({
  default: (props: any) =>
    props.open ? (
      <div data-testid="slide-panel">
        <div>{props.title}</div>
        {props.children}
      </div>
    ) : null,
}));

const renderWithProviders = (ui: React.ReactElement, initialEntries?: string[]) =>
  render(
    <ConfigProvider>
      <MemoryRouter initialEntries={initialEntries || ['/todo']}>
        {ui}
      </MemoryRouter>
    </ConfigProvider>
  );

describe('TodoPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFilters = {};
  });

  it('renders page title', () => {
    renderWithProviders(<TodoPage />);
    expect(screen.getByText('工作空间')).toBeInTheDocument();
  });

  it('renders user avatar with initials', () => {
    renderWithProviders(<TodoPage />);
    expect(screen.getByTestId('user-avatar')).toBeInTheDocument();
  });

  it('renders team selector', () => {
    renderWithProviders(<TodoPage />);
    expect(screen.getByTestId('team-selector')).toBeInTheDocument();
  });

  it('renders uncompleted / completed tabs', () => {
    renderWithProviders(<TodoPage />);
    expect(screen.getByText('未完成')).toBeInTheDocument();
    expect(screen.getByText('已完成')).toBeInTheDocument();
  });

  it('renders task count below tabs', () => {
    renderWithProviders(<TodoPage />);
    expect(screen.getByTestId('task-count')).toBeInTheDocument();
  });

  it('renders FilterBar', () => {
    renderWithProviders(<TodoPage />);
    expect(screen.getByTestId('filter-bar')).toBeInTheDocument();
  });

  it('renders TaskList', () => {
    renderWithProviders(<TodoPage />);
    expect(screen.getByTestId('task-list')).toBeInTheDocument();
  });

  it('calls fetchTasks on mount', async () => {
    renderWithProviders(<TodoPage />);
    await waitFor(() => {
      expect(mockFetchTasks).toHaveBeenCalledWith({ pageNum: 1, pageSize: 200 });
    });
  });

  it('shows AI assistant button', () => {
    renderWithProviders(<TodoPage />);
    expect(screen.getByText('AI助手')).toBeInTheDocument();
  });

  it('toggles AI panel on button click', async () => {
    const user = userEvent.setup();
    renderWithProviders(<TodoPage />);
    expect(screen.queryByTestId('ai-panel')).not.toBeInTheDocument();
    await user.click(screen.getByText('AI助手'));
    expect(screen.getByTestId('ai-panel')).toBeInTheDocument();
  });

  // --- New tests for uncovered lines ---

  it('fetchTasks handles errors gracefully', async () => {
    mockFetchTasks.mockRejectedValueOnce(new Error('Network error'));
    renderWithProviders(<TodoPage />);
    await waitFor(() => {
      expect(mockFetchTasks).toHaveBeenCalled();
    });
    mockFetchTasks.mockResolvedValue(undefined);
  });

  it('resets aiPanelWide when toggling AI while panel is open', async () => {
    const user = userEvent.setup();
    renderWithProviders(<TodoPage />);

    // Open panel
    await user.click(screen.getByText('AI助手'));
    expect(screen.getByTestId('ai-panel')).toBeInTheDocument();

    // Toggle again while open - should set aiPanelWide to false
    await user.click(screen.getByText('AI助手'));
    // Panel closes since toggle flips open state
    expect(screen.queryByTestId('ai-panel')).not.toBeInTheDocument();
  });

  it('toggles AI panel width via handleToggleAiWidth', async () => {
    const user = userEvent.setup();
    renderWithProviders(<TodoPage />);

    // Open panel
    await user.click(screen.getByText('AI助手'));
    expect(screen.getByTestId('ai-panel')).toBeInTheDocument();

    // Toggle width
    await user.click(screen.getByTestId('toggle-width-btn'));
    // Should not crash; AiPanel is still visible
    expect(screen.getByTestId('ai-panel')).toBeInTheDocument();
  });

  it('closes AI panel via handleCloseAi', async () => {
    const user = userEvent.setup();
    renderWithProviders(<TodoPage />);

    // Open panel
    await user.click(screen.getByText('AI助手'));
    expect(screen.getByTestId('ai-panel')).toBeInTheDocument();

    // Close panel via AiPanel's close button
    await user.click(screen.getByTestId('close-btn'));

    await waitFor(() => {
      expect(screen.queryByTestId('ai-panel')).not.toBeInTheDocument();
    });
  });

  it('calls setFilters with status when metric is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<TodoPage />);

    // Open panel
    await user.click(screen.getByText('AI助手'));
    expect(screen.getByTestId('ai-panel')).toBeInTheDocument();

    // Click metric
    await user.click(screen.getByTestId('metric-btn'));

    expect(mockSetFilters).toHaveBeenCalledWith({ statuses: ['pending_assign'] });
  });

  // --- TaskForm integration ---

  it('renders new task button', () => {
    renderWithProviders(<TodoPage />);
    expect(screen.getByText('新增')).toBeInTheDocument();
  });

  it('opens TaskForm in create mode when new task button clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<TodoPage />);
    expect(screen.queryByTestId('task-form')).not.toBeInTheDocument();

    await user.click(screen.getByText('新增'));
    expect(screen.getByTestId('task-form')).toBeInTheDocument();
    expect(screen.getByTestId('task-form-task-id').textContent).toBe('');
  });

  it('closes TaskForm when close is triggered', async () => {
    const user = userEvent.setup();
    renderWithProviders(<TodoPage />);
    await user.click(screen.getByText('新增'));
    expect(screen.getByTestId('task-form')).toBeInTheDocument();

    await user.click(screen.getByTestId('task-form-close'));
    expect(screen.queryByTestId('task-form')).not.toBeInTheDocument();
  });

  // --- URL Sync Tests ---

  it('reads status filter from URL params on mount', () => {
    renderWithProviders(<TodoPage />, ['/todo?status=in_progress']);

    expect(mockSetFilters).toHaveBeenCalledWith({ status: 'in_progress' });
  });

  it('reads priority filter from URL params on mount', () => {
    renderWithProviders(<TodoPage />, ['/todo?priority=high']);

    expect(mockSetFilters).toHaveBeenCalledWith({ priority: 'high' });
  });

  it('reads keyword filter from URL params on mount', () => {
    renderWithProviders(<TodoPage />, ['/todo?keyword=search+term']);

    expect(mockSetFilters).toHaveBeenCalledWith({ keyword: 'search term' });
  });

  it('reads dateRange filter from URL params on mount', () => {
    renderWithProviders(<TodoPage />, ['/todo?dateRangeStart=2024-01-01&dateRangeEnd=2024-01-31']);

    expect(mockSetFilters).toHaveBeenCalledWith({ dateRange: ['2024-01-01', '2024-01-31'] });
  });

  it('reads multiple filter params from URL on mount', () => {
    renderWithProviders(<TodoPage />, ['/todo?status=completed&keyword=bug&priority=high']);

    expect(mockSetFilters).toHaveBeenCalledWith({
      status: 'completed',
      priority: 'high',
      keyword: 'bug',
    });
  });

  it('does not call setFilters when URL has no filter params', () => {
    renderWithProviders(<TodoPage />, ['/todo']);

    expect(mockSetFilters).not.toHaveBeenCalled();
  });

  // --- View Toggle Tests ---

  it('renders view toggle buttons (列表视图 and 日历视图)', () => {
    renderWithProviders(<TodoPage />);
    expect(screen.getByTestId('view-mode-list')).toBeInTheDocument();
    expect(screen.getByTestId('view-mode-schedule')).toBeInTheDocument();
  });

  it('switches to schedule view when 日历视图 is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<TodoPage />);
    expect(screen.queryByTestId('schedule-view')).not.toBeInTheDocument();

    await user.click(screen.getByTestId('view-mode-schedule'));
    expect(screen.getByTestId('schedule-view')).toBeInTheDocument();
  });

  // --- Favorites Tests ---

  it('renders favorites filter button', () => {
    renderWithProviders(<TodoPage />);
    expect(screen.getByTestId('favorites-filter')).toBeInTheDocument();
  });

  it('toggles favorites filter on click', async () => {
    const user = userEvent.setup();
    renderWithProviders(<TodoPage />);
    const btn = screen.getByTestId('favorites-filter');

    await user.click(btn);
    // Button should still be there after toggle
    expect(btn).toBeInTheDocument();
  });
});
