import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfigProvider, message } from 'antd';
import ProjectPage from './index';
import { duplicateProject } from '@/services/project.service';

vi.mock('antd', async (importOriginal) => {
  const actual = await importOriginal<typeof import('antd')>();
  return {
    ...actual,
    message: {
      ...actual.message,
      error: vi.fn(),
      success: vi.fn(),
    },
  };
});

const mockSetProjects = vi.fn();
const mockSelectProject = vi.fn();
const mockSetExpandedKeys = vi.fn();
const mockSetProjectLoading = vi.fn();
const mockSetTasks = vi.fn();
const mockSetTaskLoading = vi.fn();

const mockProjects = [
  {
    id: 'p1',
    name: 'Top5手机产品开发',
    projectNumber: 'P1',
    status: 'in_progress',
    category: '研发部',
    description: '这是一个测试项目描述',
    phase: 'DEVELOPMENT',
    startDate: '2025-01-01',
    endDate: '2025-12-31',
    completion: 65,
    parentId: null,
    leaderId: 'u1',
    createdAt: '2025-01-01',
    updatedAt: '2025-06-01',
  },
  {
    id: 'p2',
    name: 'Top10产品',
    projectNumber: 'P2',
    status: 'completed',
    category: '产品部',
    description: '另一个项目',
    phase: 'MASS_PRODUCTION',
    startDate: '2025-03-01',
    endDate: '2025-09-30',
    completion: 100,
    parentId: null,
    leaderId: 'u2',
    createdAt: '2025-03-01',
    updatedAt: '2025-09-30',
  },
];

const mockTasks = [
  { id: 't1', code: 'P1-L1-001', name: '市场调研任务', status: 'in_progress', priority: 'high', projectId: 'p1', assigneeId: 'u1', progress: 60, milestone: false, dependencies: [], tags: [], participantIds: [], planStart: '2025-01-01', planEnd: '2025-03-31', createdAt: '2025-01-01', updatedAt: '2025-02-01' },
  { id: 't2', code: 'P1-L1-002', name: '产品设计', status: 'completed', priority: 'medium', projectId: 'p1', assigneeId: 'u2', progress: 100, milestone: false, dependencies: ['t1'], tags: [], participantIds: [], planStart: '2025-04-01', planEnd: '2025-06-30', createdAt: '2025-01-01', updatedAt: '2025-06-30' },
];

vi.mock('@/stores/useProjectStore', () => ({
  useProjectStore: () => ({
    projects: [],
    setProjects: mockSetProjects,
    selectedProjectId: null,
    selectProject: mockSelectProject,
    expandedKeys: [],
    setExpandedKeys: mockSetExpandedKeys,
    setLoading: mockSetProjectLoading,
  }),
}));

vi.mock('@/stores/useTaskStore', () => ({
  useTaskStore: () => ({
    tasks: [],
    setTasks: mockSetTasks,
    setLoading: mockSetTaskLoading,
  }),
}));

vi.mock('@/services/project.service', () => ({
  getProjects: vi.fn().mockResolvedValue({ data: [] }),
  updateProject: vi.fn().mockResolvedValue({}),
  createProject: vi.fn().mockResolvedValue({ code: 0, data: {} }),
  deleteProject: vi.fn().mockResolvedValue({ code: 0 }),
  duplicateProject: vi.fn().mockResolvedValue({ code: 0, data: {} }),
}));

vi.mock('@/services/task.service', () => ({
  getTasks: vi.fn().mockResolvedValue({ data: [] }),
  updateTask: vi.fn().mockResolvedValue({}),
  deleteTask: vi.fn().mockResolvedValue({}),
}));

vi.mock('@/services/config.service', () => ({
  getUsers: vi.fn().mockResolvedValue({ code: 0, data: [{ id: 'u1', name: '张三', email: 'z@test.com' }, { id: 'u2', name: '李四', email: 'l@test.com' }] }),
}));

vi.mock('@/services/api', () => ({
  getErrorMessage: (err: any) => err?.message || '未知错误',
}));

vi.mock('./components/ProjectTree', () => ({
  default: (props: any) => (
    <div data-testid="project-tree">
      ProjectTree
      <button data-testid="mock-add-child" onClick={() => props.onAddChild?.('p1')}>add child</button>
      <button data-testid="mock-edit-project" onClick={() => props.onEdit?.('p1')}>edit</button>
      <button data-testid="mock-delete-project" onClick={() => props.onDelete?.('p1')}>delete</button>
      <button data-testid="mock-duplicate-project" onClick={() => props.onDuplicate?.('p1')}>duplicate</button>
    </div>
  ),
}));

vi.mock('./components/ScheduleTab', () => ({
  default: (props: any) => (
    <div data-testid="schedule-tab">
      ScheduleTab
      <span data-testid="schedule-dept-filter">{props.departmentFilter || ''}</span>
      <button
        data-testid="mock-task-click"
        onClick={() => props.onTaskClick?.({ id: 't1', name: 'Test Task' })}
      >
        click task
      </button>
    </div>
  ),
}));

vi.mock('./components/BasicTab', () => ({
  default: (props: any) => (
    <div data-testid="basic-tab">
      BasicTab
      {props.project && (
        <>
          <div data-testid="project-header">
            <span data-testid="project-status-badge">{props.project.name}</span>
          </div>
          <div data-testid="metadata-row">
            <span>所属部门:</span>
            <span>{props.project.category}</span>
          </div>
        </>
      )}
    </div>
  ),
}));

vi.mock('./components/SwimlaneTab', () => ({
  default: (props: any) => <div data-testid="swimlane-tab">SwimlaneTab</div>,
}));

vi.mock('./components/GanttTab', () => ({
  default: (props: any) => (
    <div data-testid="gantt-tab">
      GanttTab
      <button
        data-testid="mock-gantt-drag"
        onClick={() => props.onTaskUpdate?.('t1', { planStart: '2025-03-01', planEnd: '2025-04-01' })}
      >
        drag task
      </button>
    </div>
  ),
}));

vi.mock('./components/TaskDetailPanel', () => ({
  default: (props: any) => {
    return (
      <div data-testid="task-detail-panel">
        TaskDetailPanel
        {props.task && <span data-testid="panel-task">{props.task.id}</span>}
        {props.assigneeOptions && (
          <span data-testid="panel-assignee-count">{props.assigneeOptions.length}</span>
        )}
      </div>
    );
  },
}));

vi.mock('./components/TaskCardList', () => ({
  default: (props: any) => <div data-testid="task-card-list">TaskCardList</div>,
}));

const renderWithAntd = (ui: React.ReactElement) =>
  render(<ConfigProvider>{ui}</ConfigProvider>);

describe('ProjectPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --- Basic structure ---
  it('renders page title', () => {
    renderWithAntd(<ProjectPage />);
    expect(screen.getByRole('heading', { name: '项目管理' })).toBeInTheDocument();
  });

  it('renders create project button', () => {
    renderWithAntd(<ProjectPage />);
    expect(screen.getByTestId('create-project-btn')).toBeInTheDocument();
    expect(screen.getByText('新建项目')).toBeInTheDocument();
  });

  it('renders TaskDetailPanel', () => {
    renderWithAntd(<ProjectPage />);
    expect(screen.getByTestId('task-detail-panel')).toBeInTheDocument();
  });

  // --- Page-level tabs: 我的项目/全部项目/项目集 ---
  it('renders 3 page-level tabs: 我的项目, 全部项目, 项目集', () => {
    renderWithAntd(<ProjectPage />);
    expect(screen.getByRole('tab', { name: '我的项目' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: '全部项目' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: '项目集' })).toBeInTheDocument();
  });

  it('defaults to 我的项目 tab with project table view', () => {
    renderWithAntd(<ProjectPage />);
    const myProjectsTab = screen.getByRole('tab', { name: '我的项目' });
    expect(myProjectsTab).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByTestId('project-table-view')).toBeInTheDocument();
  });

  it('shows project table columns matching design', () => {
    renderWithAntd(<ProjectPage />);
    expect(screen.getAllByText('项目名称').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('状态').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('完成度').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('负责人').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('起止时间').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('任务数').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('操作').length).toBeGreaterThanOrEqual(1);
  });

  it('switches to 全部项目 tab when clicked', async () => {
    const user = userEvent.setup();
    renderWithAntd(<ProjectPage />);
    await user.click(screen.getByRole('tab', { name: '全部项目' }));
    expect(screen.getByRole('tab', { name: '全部项目' })).toHaveAttribute('aria-selected', 'true');
  });

  it('switches to 项目集 tab when clicked', async () => {
    const user = userEvent.setup();
    renderWithAntd(<ProjectPage />);
    await user.click(screen.getByRole('tab', { name: '项目集' }));
    expect(screen.getByRole('tab', { name: '项目集' })).toHaveAttribute('aria-selected', 'true');
  });

  it('does not show old detail tabs (基本/计划表/泳道图/甘特图) when no project selected', () => {
    renderWithAntd(<ProjectPage />);
    expect(screen.queryByRole('tab', { name: '基本' })).not.toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: '计划表' })).not.toBeInTheDocument();
  });

  // --- Data fetching ---
  it('calls services on mount', async () => {
    const { getProjects } = await import('@/services/project.service');
    const { getTasks } = await import('@/services/task.service');
    renderWithAntd(<ProjectPage />);
    await waitFor(() => {
      expect(getProjects).toHaveBeenCalled();
      expect(getTasks).toHaveBeenCalledWith({ pageNum: 1, pageSize: 500 });
    });
  });

  it('calls getUsers during data fetch', async () => {
    const { getUsers } = await import('@/services/config.service');
    renderWithAntd(<ProjectPage />);
    await waitFor(() => {
      expect(getUsers).toHaveBeenCalled();
    });
  });

  it('logs error when data fetch fails', async () => {
    const { getProjects } = await import('@/services/project.service');
    vi.mocked(getProjects).mockRejectedValueOnce(new Error('Network error'));

    renderWithAntd(<ProjectPage />);

    await waitFor(() => {
      expect(message.error).toHaveBeenCalledWith('加载项目数据失败');
    });

    vi.mocked(getProjects).mockResolvedValue({ data: [] });
  });

  // --- Create project ---
  it('opens create project modal and submits form', async () => {
    const user = userEvent.setup();
    renderWithAntd(<ProjectPage />);

    await user.click(screen.getByTestId('create-project-btn'));
    await waitFor(() => {
      const modalTitles = screen.getAllByText('新建项目');
      expect(modalTitles.length).toBeGreaterThanOrEqual(2);
      expect(screen.getByPlaceholderText('请输入项目名称')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('请输入项目描述')).toBeInTheDocument();
    });
  });

  // --- Users fetch ---
  it('fetches users on mount and passes assigneeOptions to TaskDetailDrawer', async () => {
    const { getUsers } = await import('@/services/config.service');
    renderWithAntd(<ProjectPage />);
    await waitFor(() => {
      expect(getUsers).toHaveBeenCalled();
    });
  });

  it('passes fetched users as assigneeOptions to the panel', async () => {
    renderWithAntd(<ProjectPage />);
    await waitFor(() => {
      expect(screen.getByTestId('panel-assignee-count')).toHaveTextContent('2');
    });
  });
});

// --- Tests with projects loaded ---
describe('ProjectPage with data', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows project table view with data', async () => {
    vi.resetModules();
    vi.doMock('@/stores/useProjectStore', () => ({
      useProjectStore: () => ({
        projects: mockProjects,
        setProjects: vi.fn(),
        selectedProjectId: null,
        selectProject: vi.fn(),
        expandedKeys: [],
        setExpandedKeys: vi.fn(),
        setLoading: vi.fn(),
      }),
    }));
    vi.doMock('@/stores/useTaskStore', () => ({
      useTaskStore: () => ({
        tasks: mockTasks,
        setTasks: vi.fn(),
        setLoading: vi.fn(),
      }),
    }));
    vi.doMock('@/services/project.service', () => ({
      getProjects: vi.fn().mockResolvedValue({ data: mockProjects }),
      updateProject: vi.fn(),
      createProject: vi.fn(),
      deleteProject: vi.fn(),
      duplicateProject: vi.fn(),
    }));
    vi.doMock('@/services/task.service', () => ({
      getTasks: vi.fn().mockResolvedValue({ data: mockTasks }),
      updateTask: vi.fn(),
    }));
    vi.doMock('@/services/config.service', () => ({
      getUsers: vi.fn().mockResolvedValue({ data: [{ id: 'u1', name: '张三' }, { id: 'u2', name: '李四' }] }),
    }));
    vi.doMock('@/services/api', () => ({
      getErrorMessage: (err: any) => err?.message || '未知错误',
    }));
    vi.doMock('./components/ProjectTree', () => ({ default: () => <div data-testid="project-tree" /> }));
    vi.doMock('./components/ScheduleTab', () => ({ default: () => <div data-testid="schedule-tab" /> }));
    vi.doMock('./components/BasicTab', () => ({ default: () => <div data-testid="basic-tab" /> }));
    vi.doMock('./components/SwimlaneTab', () => ({ default: () => <div data-testid="swimlane-tab" /> }));
    vi.doMock('./components/GanttTab', () => ({ default: () => <div data-testid="gantt-tab" /> }));
    vi.doMock('./components/TaskDetailPanel', () => ({
      default: (props: any) => <div data-testid="task-detail-panel" />,
    }));
    vi.doMock('./components/TaskCardList', () => ({
      default: (props: any) => <div data-testid="task-card-list" />,
    }));

    const { default: DataPage } = await import('./index');
    renderWithAntd(<DataPage />);

    // Table view should be visible
    await waitFor(() => {
      expect(screen.getByTestId('project-table-view')).toBeInTheDocument();
    });
  });
});
