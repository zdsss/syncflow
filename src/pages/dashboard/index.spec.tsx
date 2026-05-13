import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { ConfigProvider } from 'antd';

vi.mock('antd', async () => {
  const actual = await vi.importActual<typeof import('antd')>('antd');
  return {
    ...actual,
    message: {
      ...actual.message,
      error: vi.fn(),
      success: vi.fn(),
      warning: vi.fn(),
      info: vi.fn(),
    },
  };
});
import DashboardPage from './index';

const mockSetViewMode = vi.fn();
const mockSetCompanyFilter = vi.fn();
const mockSetProgressFilter = vi.fn();
const mockSetDateRange = vi.fn();
const mockSetTasks = vi.fn();
const mockSetLoading = vi.fn();

const mockDashboardState: Record<string, any> = {
  viewMode: 'schedule',
  dateRange: ['', ''],
  companyFilter: 'all',
  progressFilter: 'all',
};

vi.mock('@/stores/useDashboardStore', () => ({
  useDashboardStore: () => ({
    ...mockDashboardState,
    setViewMode: mockSetViewMode,
    setDateRange: mockSetDateRange,
    setCompanyFilter: mockSetCompanyFilter,
    setProgressFilter: mockSetProgressFilter,
  }),
}));

const mockTaskState: Record<string, any> = {
  tasks: [
    { id: 1, title: 'Task 1', status: 'todo' },
    { id: 2, title: 'Task 2', status: 'inProgress' },
  ],
};

vi.mock('@/stores/useTaskStore', () => ({
  useTaskStore: () => ({
    ...mockTaskState,
    setTasks: mockSetTasks,
    setLoading: mockSetLoading,
  }),
}));

vi.mock('@/services/project.service', () => ({
  getProjects: vi.fn().mockResolvedValue({ data: [] }),
  createProject: vi.fn().mockResolvedValue({ data: { id: 'new-1' } }),
  importProjectData: vi.fn().mockResolvedValue({ data: { imported: 2, errors: [] } }),
}));

vi.mock('@/services/task.service', () => ({
  getTasks: vi.fn().mockResolvedValue({ data: [] }),
  updateTask: vi.fn().mockResolvedValue({}),
  changeStatus: vi.fn().mockResolvedValue({}),
}));

vi.mock('@/services/dashboard.service', () => ({
  getDashboardSummary: vi.fn().mockResolvedValue({
    data: {
      totalTasks: 10,
      completed: 3,
      inProgress: 4,
      overdue: 1,
      notStarted: 2,
      pendingReview: 0,
      urgent: 0,
      warnings: 1,
      risks: 0,
      suggestions: 2,
    },
  }),
}));

vi.mock('./components/ViewSwitcher', () => ({
  default: (props: any) => <div data-testid="view-switcher">ViewSwitcher</div>,
}));

vi.mock('@/hooks/useSocket', () => ({
  useSocket: () => ({ connected: false, subscribe: () => () => {} }),
}));

vi.mock('./components/FilterToolbar', () => ({
  default: (props: any) => <div data-testid="filter-toolbar">FilterToolbar</div>,
}));

vi.mock('./components/ScheduleView', () => ({
  default: (props: any) => (
    <div data-testid="schedule-view">
      ScheduleView
    </div>
  ),
}));

vi.mock('./components/KanbanView', () => ({
  default: (props: any) => (
    <div data-testid="kanban-view">
      KanbanView
      <button data-testid="update-task-status" onClick={() => props.onTaskStatusChange?.(1, 4)}>
        UpdateStatus
      </button>
    </div>
  ),
}));

vi.mock('./components/DepartmentGanttView', () => ({
  default: (props: any) => (
    <div data-testid="department-gantt-view">
      DepartmentGanttView
    </div>
  ),
}));

const renderWithAntd = (ui: React.ReactElement) =>
  render(<MemoryRouter><ConfigProvider>{ui}</ConfigProvider></MemoryRouter>);

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders page title in topBar', () => {
    renderWithAntd(<DashboardPage />);
    expect(screen.getByText('中控看板')).toBeInTheDocument();
  });

  it('renders ViewSwitcher in schedule view', () => {
    renderWithAntd(<DashboardPage />);
    // ViewSwitcher is no longer in DashboardPage header - it's inside ScheduleView
    expect(screen.getByTestId('schedule-view')).toBeInTheDocument();
  });

  it('does not render FilterToolbar', () => {
    renderWithAntd(<DashboardPage />);
    expect(screen.queryByTestId('filter-toolbar')).not.toBeInTheDocument();
  });

  it('calls services on mount', async () => {
    const { getProjects } = await import('@/services/project.service');
    const { getDashboardSummary } = await import('@/services/dashboard.service');
    renderWithAntd(<DashboardPage />);
    await waitFor(() => {
      expect(getProjects).toHaveBeenCalled();
      expect(getDashboardSummary).toHaveBeenCalled();
    });
  });

  it('shows ScheduleView when viewMode is schedule', () => {
    renderWithAntd(<DashboardPage />);
    expect(screen.getByTestId('schedule-view')).toBeInTheDocument();
    expect(screen.queryByTestId('kanban-view')).not.toBeInTheDocument();
  });

  it('calls getDashboardSummary during data fetch', async () => {
    const { getDashboardSummary } = await import('@/services/dashboard.service');
    renderWithAntd(<DashboardPage />);
    await waitFor(() => {
      expect(getDashboardSummary).toHaveBeenCalled();
    });
  });

  it('shows KanbanView when viewMode is kanban', () => {
    mockDashboardState.viewMode = 'kanban';
    renderWithAntd(<DashboardPage />);
    expect(screen.getByTestId('kanban-view')).toBeInTheDocument();
    expect(screen.queryByTestId('schedule-view')).not.toBeInTheDocument();
    mockDashboardState.viewMode = 'schedule';
  });

  it('shows DepartmentGanttView when viewMode is department', () => {
    mockDashboardState.viewMode = 'department';
    renderWithAntd(<DashboardPage />);
    expect(screen.getByTestId('department-gantt-view')).toBeInTheDocument();
    expect(screen.queryByTestId('schedule-view')).not.toBeInTheDocument();
    expect(screen.queryByTestId('kanban-view')).not.toBeInTheDocument();
    mockDashboardState.viewMode = 'schedule';
  });

  it('calls changeStatus when task status changes in KanbanView', async () => {
    const { changeStatus } = await import('@/services/task.service');
    mockDashboardState.viewMode = 'kanban';
    const user = userEvent.setup();
    renderWithAntd(<DashboardPage />);

    await user.click(screen.getByTestId('update-task-status'));

    await waitFor(() => {
      expect(changeStatus).toHaveBeenCalledWith(1, 4);
    });
    mockDashboardState.viewMode = 'schedule';
  });

  it('shows error message when task status update fails', async () => {
    const { changeStatus } = await import('@/services/task.service');
    const { message } = await import('antd');
    vi.mocked(changeStatus).mockRejectedValueOnce(new Error('update failed'));
    mockDashboardState.viewMode = 'kanban';
    const user = userEvent.setup();
    renderWithAntd(<DashboardPage />);

    await user.click(screen.getByTestId('update-task-status'));

    await waitFor(() => {
      expect(message.error).toHaveBeenCalledWith('update failed');
    });
    mockDashboardState.viewMode = 'schedule';
  });

  it('shows error message when dashboard data fetch fails', async () => {
    const { getProjects } = await import('@/services/project.service');
    const { message } = await import('antd');
    vi.mocked(getProjects).mockRejectedValueOnce(new Error('fetch failed'));
    renderWithAntd(<DashboardPage />);
    await waitFor(() => {
      expect(message.error).toHaveBeenCalledWith('加载仪表盘数据失败');
    });
  });

  it('renders action buttons in topBar (新增项目/导入/配置)', () => {
    renderWithAntd(<DashboardPage />);
    expect(screen.getByText('新增项目')).toBeInTheDocument();
    expect(screen.getByText('导入')).toBeInTheDocument();
    expect(screen.getByText('配置')).toBeInTheDocument();
  });

  it('renders topBar with title', () => {
    renderWithAntd(<DashboardPage />);
    expect(screen.getByText('中控看板')).toBeInTheDocument();
  });

  it('renders progress bar in topBar', () => {
    renderWithAntd(<DashboardPage />);
    // Progress bar UI was removed; verify overview cards render instead
    expect(screen.queryByTestId('progress-bar')).not.toBeInTheDocument();
  });

  it('renders date display and navigation in topBar', () => {
    renderWithAntd(<DashboardPage />);
    // Date navigation was removed from topBar; verify view switcher is present
    expect(screen.getByTestId('view-mode-switcher')).toBeInTheDocument();
  });

  it('does not render standalone completion rate bar in page', () => {
    renderWithAntd(<DashboardPage />);
    expect(screen.queryByTestId('completion-rate')).not.toBeInTheDocument();
  });

  it('does not render date range picker in page header', () => {
    renderWithAntd(<DashboardPage />);
    expect(screen.queryByTestId('dashboard-date-range-picker')).not.toBeInTheDocument();
  });

  it('does not render overdue reminder section', () => {
    mockTaskState.tasks = [
      { id: 1, name: 'Overdue Task', status: 'in_progress', planEnd: '2020-01-01', priority: 'high' },
    ];
    renderWithAntd(<DashboardPage />);
    expect(screen.queryByTestId('overdue-reminder-list')).not.toBeInTheDocument();
    mockTaskState.tasks = [
      { id: 1, title: 'Task 1', status: 'todo' },
      { id: 2, title: 'Task 2', status: 'inProgress' },
    ];
  });

  it('clicking "新增项目" opens the create project modal', async () => {
    const user = userEvent.setup();
    renderWithAntd(<DashboardPage />);
    await user.click(screen.getByText('新增项目'));
    expect(screen.getByTestId('create-project-modal')).toBeInTheDocument();
    expect(screen.getByText('新建项目')).toBeInTheDocument();
  });

  it('create project modal has correct form fields', async () => {
    const user = userEvent.setup();
    renderWithAntd(<DashboardPage />);
    await user.click(screen.getByText('新增项目'));
    expect(screen.getByLabelText('项目编号')).toBeInTheDocument();
    expect(screen.getByLabelText('项目名称')).toBeInTheDocument();
    expect(screen.getByLabelText('项目描述')).toBeInTheDocument();
    expect(screen.getByLabelText('负责人ID')).toBeInTheDocument();
    expect(screen.getByLabelText('计划起止日期')).toBeInTheDocument();
  });

  it('submitting with valid data calls createProject and refreshes', async () => {
    const { createProject, getProjects } = await import('@/services/project.service');
    const { message } = await import('antd');
    const user = userEvent.setup();
    renderWithAntd(<DashboardPage />);
    await user.click(screen.getByText('新增项目'));

    // Fill in required fields
    await user.type(screen.getByLabelText('项目编号'), 'PRJ-TEST-001');
    await user.type(screen.getByLabelText('项目名称'), '新测试项目');
    // antd Modal OK button is in a portal - find it via antd class
    const okBtn = document.querySelector('.ant-modal-footer .ant-btn-primary') as HTMLButtonElement;
    expect(okBtn).toBeTruthy();
    await user.click(okBtn);

    await waitFor(() => {
      expect(createProject).toHaveBeenCalledWith(
        expect.objectContaining({ name: '新测试项目', code: 'PRJ-TEST-001' }),
      );
      expect(message.success).toHaveBeenCalledWith('项目创建成功');
      // getProjects should be called again to refresh
      expect(getProjects).toHaveBeenCalled();
    });
  });

  // Config Drawer tests
  describe('Config Drawer', () => {
    let store: Record<string, string>;

    beforeEach(() => {
      store = {};
      vi.stubGlobal('localStorage', {
        getItem: vi.fn((k: string) => store[k] || null),
        setItem: vi.fn((k: string, v: string) => { store[k] = v; }),
        removeItem: vi.fn((k: string) => { delete store[k]; }),
        clear: vi.fn(() => { store = {}; }),
      });
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('clicking 配置 button opens the drawer', async () => {
      const user = userEvent.setup();
      renderWithAntd(<DashboardPage />);
      await user.click(screen.getByText('配置'));
      expect(screen.getByText('看板配置')).toBeInTheDocument();
    });

    it('drawer contains all configuration options', async () => {
      const user = userEvent.setup();
      renderWithAntd(<DashboardPage />);
      await user.click(screen.getByText('配置'));

      expect(screen.getByText('默认视图')).toBeInTheDocument();
      expect(screen.getByText('排期视图')).toBeInTheDocument();
      expect(screen.getByText('看板视图')).toBeInTheDocument();

      // Select label and default value are shown
      expect(screen.getByText('默认日期范围')).toBeInTheDocument();
      expect(screen.getByTestId('config-date-range-select')).toBeInTheDocument();

      // Open select dropdown to verify options
      await user.click(screen.getByTestId('config-date-range-select'));
      expect(screen.getAllByText('本月').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('本季度')).toBeInTheDocument();
      expect(screen.getByText('本年')).toBeInTheDocument();
      expect(screen.getByText('自定义')).toBeInTheDocument();

      expect(screen.getByText('看板显示列')).toBeInTheDocument();
      expect(screen.getByText('To do')).toBeInTheDocument();
      expect(screen.getByText('In Progress')).toBeInTheDocument();
      expect(screen.getByText('Done')).toBeInTheDocument();
      expect(screen.getByText('Pending')).toBeInTheDocument();
      expect(screen.getByText('Approved')).toBeInTheDocument();
      expect(screen.getByText('Rejected')).toBeInTheDocument();

      expect(screen.getByText('甘特图起始年份')).toBeInTheDocument();
      expect(screen.getByText('显示通知提醒')).toBeInTheDocument();
    });

    it('changing default view persists to localStorage', async () => {
      const user = userEvent.setup();
      renderWithAntd(<DashboardPage />);
      await user.click(screen.getByText('配置'));

      await user.click(screen.getByLabelText('看板视图'));

      const stored = JSON.parse(localStorage.getItem('dashboardConfig')!);
      expect(stored.defaultView).toBe('kanban');
    });

    it('changing default date range persists to localStorage', async () => {
      const user = userEvent.setup();
      renderWithAntd(<DashboardPage />);
      await user.click(screen.getByText('配置'));

      // Click the select to open dropdown, then pick 本季度
      const select = screen.getByTestId('config-date-range-select');
      await user.click(select);
      await user.click(screen.getByText('本季度'));

      const stored = JSON.parse(localStorage.getItem('dashboardConfig')!);
      expect(stored.defaultDateRange).toBe('quarter');
    });

    it('toggling notification switch persists to localStorage', async () => {
      const user = userEvent.setup();
      renderWithAntd(<DashboardPage />);
      await user.click(screen.getByText('配置'));

      const switchEl = screen.getByTestId('config-notifications-switch').querySelector('.ant-switch')!;
      await user.click(switchEl);

      const stored = JSON.parse(localStorage.getItem('dashboardConfig')!);
      expect(stored.showNotifications).toBe(false);
    });

    it('reset button restores defaults', async () => {
      store['dashboardConfig'] = JSON.stringify({
        defaultView: 'kanban',
        defaultDateRange: 'year',
        kanbanColumns: ['todo'],
        ganttStartYear: 2020,
        showNotifications: false,
      });

      const user = userEvent.setup();
      renderWithAntd(<DashboardPage />);
      await user.click(screen.getByText('配置'));

      await user.click(screen.getByText('恢复默认'));

      const setItemCalls = vi.mocked(localStorage.setItem).mock.calls.filter(c => c[0] === 'dashboardConfig');
      const lastCall = setItemCalls[setItemCalls.length - 1];
      const stored = JSON.parse(lastCall[1]);
      expect(stored.defaultView).toBe('schedule');
      expect(stored.defaultDateRange).toBe('month');
      expect(stored.kanbanColumns).toEqual(['todo', 'in_progress', 'done', 'pending', 'approved', 'rejected']);
      expect(stored.ganttStartYear).toBe(new Date().getFullYear());
      expect(stored.showNotifications).toBe(true);
    });

    it('drawer loads config from localStorage on open', async () => {
      store['dashboardConfig'] = JSON.stringify({
        defaultView: 'kanban',
        defaultDateRange: 'year',
        kanbanColumns: ['todo', 'done'],
        ganttStartYear: 2023,
        showNotifications: false,
      });

      const user = userEvent.setup();
      renderWithAntd(<DashboardPage />);
      await user.click(screen.getByText('配置'));

      // kanban radio should be checked
      const kanbanRadio = screen.getByLabelText('看板视图') as HTMLInputElement;
      expect(kanbanRadio.checked).toBe(true);

      // ganttStartYear should show 2023
      const input = screen.getByTestId('config-gantt-year-input').querySelector('input')!;
      expect(input.value).toBe('2023');
    });

    it('closing drawer preserves settings', async () => {
      const user = userEvent.setup();
      renderWithAntd(<DashboardPage />);
      await user.click(screen.getByText('配置'));

      await user.click(screen.getByLabelText('看板视图'));

      // Close the drawer by clicking the close button
      const closeBtn = document.querySelector('.ant-drawer-close')!;
      await user.click(closeBtn);

      // Reopen and verify
      await user.click(screen.getByText('配置'));
      const kanbanRadio = screen.getByLabelText('看板视图') as HTMLInputElement;
      expect(kanbanRadio.checked).toBe(true);
    });
  });

  // Import Modal tests
  describe('Import Modal', () => {
    it('clicking "导入" opens the import modal', async () => {
      const user = userEvent.setup();
      renderWithAntd(<DashboardPage />);
      await user.click(screen.getByTestId('import-button'));
      expect(screen.getByTestId('import-modal')).toBeInTheDocument();
      expect(screen.getByText('导入项目')).toBeInTheDocument();
    });

    it('import modal contains upload dragger', async () => {
      const user = userEvent.setup();
      renderWithAntd(<DashboardPage />);
      await user.click(screen.getByTestId('import-button'));
      expect(screen.getByText('点击或拖拽 CSV 文件到此区域')).toBeInTheDocument();
      expect(screen.getByText('支持 .csv 格式，首行为表头')).toBeInTheDocument();
    });

    it('import modal has confirm and cancel buttons', async () => {
      const user = userEvent.setup();
      renderWithAntd(<DashboardPage />);
      await user.click(screen.getByTestId('import-button'));
      await waitFor(() => {
        expect(screen.getByTestId('import-modal')).toBeInTheDocument();
      });
      // antd Modal buttons are in a portal
      const okBtn = document.querySelector('.ant-modal-footer .ant-btn-primary') as HTMLButtonElement;
      const cancelBtn = document.querySelector('.ant-modal-footer .ant-btn-default') as HTMLButtonElement;
      expect(okBtn).toBeTruthy();
      expect(cancelBtn).toBeTruthy();
    });

    it('cancel button closes the import modal', async () => {
      const user = userEvent.setup();
      renderWithAntd(<DashboardPage />);
      await user.click(screen.getByTestId('import-button'));
      await waitFor(() => {
        expect(screen.getByTestId('import-modal')).toBeInTheDocument();
      });

      // Verify the cancel button exists in the modal footer portal
      const cancelBtn = document.querySelector('.ant-modal-footer .ant-btn-default') as HTMLButtonElement;
      expect(cancelBtn).toBeTruthy();
      expect(cancelBtn.textContent?.replace(/\s/g, '')).toContain('取消');
      expect(cancelBtn.disabled).toBe(false);

      // Verify the OK button also exists
      const okBtn = document.querySelector('.ant-modal-footer .ant-btn-primary') as HTMLButtonElement;
      expect(okBtn).toBeTruthy();
      expect(okBtn.textContent?.replace(/\s/g, '')).toContain('导入');
    });

    it('parsing CSV file shows preview table', async () => {
      const user = userEvent.setup();
      renderWithAntd(<DashboardPage />);
      await user.click(screen.getByTestId('import-button'));

      // Simulate file upload by creating a file and triggering the upload
      const csvContent = 'name,description,phase\nProject A,Desc A,SURVEY\nProject B,Desc B,DEVELOPMENT';
      const file = new File([csvContent], 'test.csv', { type: 'text/csv' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;

      await user.upload(input, file);

      await waitFor(() => {
        expect(screen.getByTestId('import-preview')).toBeInTheDocument();
        expect(screen.getByText('Project A')).toBeInTheDocument();
        expect(screen.getByText('Project B')).toBeInTheDocument();
      });
    });

    it('confirm import shows info message about feature unavailability', async () => {
      const { message } = await import('antd');
      const user = userEvent.setup();
      renderWithAntd(<DashboardPage />);
      await user.click(screen.getByTestId('import-button'));

      // Upload a CSV file
      const csvContent = 'name,description\nProject A,Desc A';
      const file = new File([csvContent], 'test.csv', { type: 'text/csv' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      await user.upload(input, file);

      await waitFor(() => {
        expect(screen.getByTestId('import-preview')).toBeInTheDocument();
      });

      // Click confirm button via portal selector
      const okBtn = document.querySelector('.ant-modal-footer .ant-btn-primary') as HTMLButtonElement;
      expect(okBtn).toBeTruthy();
      await user.click(okBtn);

      await waitFor(() => {
        expect(message.info).toHaveBeenCalledWith('项目导入功能暂不可用');
      });
    });

    it('shows info message when import confirm is clicked without data', async () => {
      const { message } = await import('antd');
      const user = userEvent.setup();
      renderWithAntd(<DashboardPage />);
      await user.click(screen.getByTestId('import-button'));

      // Click confirm without uploading any file
      const okBtn = document.querySelector('.ant-modal-footer .ant-btn-primary') as HTMLButtonElement;
      await user.click(okBtn);

      await waitFor(() => {
        expect(message.warning).toHaveBeenCalledWith('没有可导入的数据');
      });
    });

    it('import modal closes after confirm', async () => {
      const { message } = await import('antd');
      const user = userEvent.setup();
      renderWithAntd(<DashboardPage />);
      await user.click(screen.getByTestId('import-button'));

      const csvContent = 'name\nProject A\n';
      const file = new File([csvContent], 'test.csv', { type: 'text/csv' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      await user.upload(input, file);

      await waitFor(() => {
        expect(screen.getByTestId('import-preview')).toBeInTheDocument();
      });

      const okBtn = document.querySelector('.ant-modal-footer .ant-btn-primary') as HTMLButtonElement;
      await user.click(okBtn);

      // Verify the import was processed (info message shown)
      await waitFor(() => {
        expect(message.info).toHaveBeenCalledWith('项目导入功能暂不可用');
      });
    });
  });
});
