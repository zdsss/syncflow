import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfigProvider, message } from 'antd';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import PersonalPage from './index';

vi.mock('antd', async (importOriginal) => {
  const actual = await importOriginal<typeof import('antd')>();
  return {
    ...actual,
    message: {
      ...actual.message,
      success: vi.fn(),
      error: vi.fn(),
      info: vi.fn(),
    },
  };
});

const mockFiles = [
  { id: '1', name: '文档.pdf', type: '文档', extension: 'pdf', size: '2MB', createdAt: '2026-01-15' },
  { id: '2', name: '图片.png', type: '图片', extension: 'png', size: '500KB', createdAt: '2026-02-10' },
];

const mockGetPersonalFiles = vi.fn();
const mockDeletePersonalFile = vi.fn();
const mockGetNotes = vi.fn().mockResolvedValue({ code: 0, data: { items: [], total: 0 } });

vi.mock('@/services/personal.service', () => ({
  getPersonalFiles: (...args: any[]) => mockGetPersonalFiles(...args),
  deletePersonalFile: (...args: any[]) => mockDeletePersonalFile(...args),
  getNotes: (...args: any[]) => mockGetNotes(...args),
  createNote: vi.fn(),
  updateNote: vi.fn(),
  deleteNote: vi.fn(),
}));

vi.mock('@/services/task.service', () => ({
  getTasks: vi.fn().mockResolvedValue({
    data: [
      { id: 't1', name: '任务1', status: 'pending_assign', priority: 'urgent', projectId: 'p1', assigneeId: 'user-1', progress: 0, milestone: false, dependencies: [], tags: [], participantIds: [], createdAt: '2026-01-01', updatedAt: '2026-01-01' },
      { id: 't2', name: '任务2', status: 'in_progress', priority: 'high', projectId: 'p1', assigneeId: 'user-1', progress: 50, milestone: false, dependencies: [], tags: [], participantIds: [], createdAt: '2026-01-02', updatedAt: '2026-01-02' },
      { id: 't3', name: '任务3', status: 'completed', priority: 'medium', projectId: 'p2', assigneeId: 'user-1', progress: 100, milestone: false, dependencies: [], tags: [], participantIds: [], createdAt: '2026-01-03', updatedAt: '2026-01-03' },
    ],
  }),
  updateTask: vi.fn(),
  deleteTask: vi.fn(),
}));

vi.mock('@/services/project.service', () => ({
  getProjects: vi.fn().mockResolvedValue({
    data: [
      { id: 'p1', name: '项目A', status: 'in_progress', completion: 65, leaderId: 'user-1', startDate: '2026-01-01', endDate: '2026-12-31', phase: 'development', category: '', createdAt: '2026-01-01', updatedAt: '2026-01-01' },
      { id: 'p2', name: '项目B', status: 'completed', completion: 100, leaderId: 'user-1', startDate: '2026-01-01', endDate: '2026-06-30', phase: 'mass_production', category: '', createdAt: '2026-01-01', updatedAt: '2026-01-01' },
    ],
  }),
}));

vi.mock('@/stores/useAuthStore', () => ({
  useAuthStore: (selector: any) => selector({ currentUser: { id: 'user-1' } }),
}));

vi.mock('./NotesList', () => ({
  default: () => <div data-testid="notes-list">NotesList Mock</div>,
}));

vi.mock('./PersonalPage.module.css', () => ({
  default: {
    page: 'page',
    header: 'header',
    title: 'title',
    sidebar: 'sidebar',
    sidebarItem: 'sidebarItem',
    sidebarItemActive: 'sidebarItemActive',
    content: 'content',
    statCard: 'statCard',
    statRow: 'statRow',
    sectionTitle: 'sectionTitle',
    activityItem: 'activityItem',
    priorityDot: 'priorityDot',
    taskTable: 'taskTable',
    notebookItem: 'notebookItem',
    knowledgeSidebar: 'knowledgeSidebar',
    knowledgeContent: 'knowledgeContent',
    headerActions: 'headerActions',
    searchInput: 'searchInput',
    fileIcon: 'fileIcon',
    fileSize: 'fileSize',
  },
}));

const renderWithAntd = (ui: React.ReactElement) =>
  render(<ConfigProvider>{ui}</ConfigProvider>);

describe('PersonalPage - redesigned', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetPersonalFiles.mockResolvedValue({ code: 0, data: mockFiles });
    mockDeletePersonalFile.mockResolvedValue({ code: 0 });
  });

  // --- Title ---
  it('renders page title as 个人空间', () => {
    renderWithAntd(<PersonalPage />);
    expect(screen.getByText('个人空间')).toBeInTheDocument();
  });

  // --- Sidebar navigation ---
  it('renders sidebar with 4 navigation items', () => {
    renderWithAntd(<PersonalPage />);
    expect(screen.getByText('个人概览')).toBeInTheDocument();
    expect(screen.getByText('我的任务')).toBeInTheDocument();
    expect(screen.getByText('笔记本')).toBeInTheDocument();
    expect(screen.getByText('知识库')).toBeInTheDocument();
  });

  it('defaults to 个人概览 view', () => {
    renderWithAntd(<PersonalPage />);
    expect(screen.getByTestId('overview-section')).toBeInTheDocument();
  });

  it('switches to 我的任务 view when clicked', async () => {
    const user = userEvent.setup();
    renderWithAntd(<PersonalPage />);
    await user.click(screen.getByText('我的任务'));
    expect(screen.getByTestId('my-tasks-section')).toBeInTheDocument();
  });

  it('switches to 笔记本 view when clicked', async () => {
    const user = userEvent.setup();
    renderWithAntd(<PersonalPage />);
    await user.click(screen.getByText('笔记本'));
    expect(screen.getByTestId('notes-list')).toBeInTheDocument();
  });

  it('switches to 知识库 view when clicked', async () => {
    const user = userEvent.setup();
    renderWithAntd(<PersonalPage />);
    await user.click(screen.getByText('知识库'));
    expect(screen.getByTestId('knowledge-section')).toBeInTheDocument();
  });

  it('switches back to 个人概览 from another view', async () => {
    const user = userEvent.setup();
    renderWithAntd(<PersonalPage />);
    await user.click(screen.getByText('我的任务'));
    expect(screen.getByTestId('my-tasks-section')).toBeInTheDocument();
    await user.click(screen.getByText('个人概览'));
    expect(screen.getByTestId('overview-section')).toBeInTheDocument();
  });

  // --- 个人概览 ---
  it('renders project stats section in overview', () => {
    renderWithAntd(<PersonalPage />);
    expect(screen.getByText('项目统计')).toBeInTheDocument();
    expect(screen.getByText('在进行')).toBeInTheDocument();
    expect(screen.getByText('逾期')).toBeInTheDocument();
  });

  it('renders project stats completed label in overview', () => {
    renderWithAntd(<PersonalPage />);
    const completedLabels = screen.getAllByText('已完成');
    expect(completedLabels.length).toBeGreaterThanOrEqual(1);
  });

  it('renders task stats section in overview', () => {
    renderWithAntd(<PersonalPage />);
    expect(screen.getByText('任务统计')).toBeInTheDocument();
    expect(screen.getByText('总任务')).toBeInTheDocument();
    expect(screen.getByText('待处理')).toBeInTheDocument();
  });

  it('renders recent activity list in overview', () => {
    renderWithAntd(<PersonalPage />);
    expect(screen.getByText('最近动态')).toBeInTheDocument();
  });

  it('fetches projects and tasks on mount for overview stats', async () => {
    const { getProjects } = await import('@/services/project.service');
    const { getTasks } = await import('@/services/task.service');
    renderWithAntd(<PersonalPage />);
    await waitFor(() => {
      expect(getProjects).toHaveBeenCalled();
      expect(getTasks).toHaveBeenCalled();
    });
  });

  // --- 我的任务 ---
  it('renders task summary in 我的任务', async () => {
    const user = userEvent.setup();
    renderWithAntd(<PersonalPage />);
    await user.click(screen.getByText('我的任务'));
    expect(screen.getByText('待办')).toBeInTheDocument();
  });

  it('renders priority distribution in 我的任务', async () => {
    const user = userEvent.setup();
    renderWithAntd(<PersonalPage />);
    await user.click(screen.getByText('我的任务'));
    expect(screen.getByText('优先级分布')).toBeInTheDocument();
  });

  it('renders task list in 我的任务', async () => {
    const user = userEvent.setup();
    renderWithAntd(<PersonalPage />);
    await user.click(screen.getByText('我的任务'));
    await waitFor(() => {
      expect(screen.getByText('任务1')).toBeInTheDocument();
      expect(screen.getByText('任务2')).toBeInTheDocument();
      expect(screen.getByText('任务3')).toBeInTheDocument();
    });
  });

  // --- Knowledge base ---
  it('renders knowledge base with section', async () => {
    const user = userEvent.setup();
    renderWithAntd(<PersonalPage />);
    await user.click(screen.getByText('知识库'));
    expect(screen.getByTestId('knowledge-section')).toBeInTheDocument();
  });

  it('renders knowledge base categories', async () => {
    const user = userEvent.setup();
    renderWithAntd(<PersonalPage />);
    await user.click(screen.getByText('知识库'));
    expect(screen.getByTestId('knowledge-cat-all')).toBeInTheDocument();
    expect(screen.getByTestId('knowledge-cat-personal')).toBeInTheDocument();
    expect(screen.getByTestId('knowledge-cat-tech')).toBeInTheDocument();
    expect(screen.getByTestId('knowledge-cat-project')).toBeInTheDocument();
    expect(screen.getByTestId('knowledge-cat-process')).toBeInTheDocument();
  });
});
