import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfigProvider } from 'antd';
import SwimlaneTab from './SwimlaneTab';
import { TaskStatus, TaskPriority, ProjectStatus } from '@/types';

vi.mock('./SwimlaneTab.module.css', () => ({
  default: new Proxy({}, { get: (_t, p: string) => p }),
}));

const mockProjects = [
  {
    id: 1, code: 'PA', name: '项目A', status: ProjectStatus.IN_PROGRESS, ownerId: 1, ownerName: '张三',
    plannedStart: '2025-01-01', plannedEnd: '2025-12-31', progress: 30, projectType: '子系统', priority: 2,
    createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z',
  },
];

const currentYear = new Date().getFullYear();

const mockTasks = [
  {
    id: 1, title: '需求调研', projectId: 1, type: 'TASK' as const, priority: TaskPriority.HIGH,
    status: TaskStatus.IN_PROGRESS, assigneeId: 1, assigneeName: '张三', reporterName: '李四',
    projectName: '项目A', progress: 50, isWatching: false, isOverdue: false,
    isWarning: false, commentCount: 0, watcherCount: 0, dependencies: [], tags: '', taskNo: 'P1-001',
    plannedStart: `${currentYear}-02-01`, plannedEnd: `${currentYear}-03-01`,
    createdAt: `${currentYear}-01-01T00:00:00Z`, updatedAt: `${currentYear}-01-15T00:00:00Z`,
    deptName: '设计部',
  },
  {
    id: 2, title: '功能开发', projectId: 1, type: 'ACTIVITY' as const, priority: TaskPriority.MEDIUM,
    status: TaskStatus.PENDING, assigneeId: 2, assigneeName: '李四', reporterName: '王五',
    projectName: '项目A', progress: 0, isWatching: false, isOverdue: false,
    isWarning: false, commentCount: 0, watcherCount: 0, dependencies: [], tags: '', taskNo: 'P2-001',
    plannedStart: `${currentYear}-04-01`, plannedEnd: `${currentYear}-05-15`,
    createdAt: `${currentYear}-01-01T00:00:00Z`, updatedAt: `${currentYear}-01-01T00:00:00Z`,
    deptName: '研发部',
  },
];

const renderWithAntd = (ui: React.ReactElement) =>
  render(<ConfigProvider>{ui}</ConfigProvider>);

describe('SwimlaneTab', () => {
  it('renders the swimlane container', () => {
    renderWithAntd(<SwimlaneTab tasks={mockTasks} projects={mockProjects as any} />);
    expect(screen.getByTestId('swimlane-container')).toBeInTheDocument();
  });

  it('renders department swimlane rows', () => {
    renderWithAntd(<SwimlaneTab tasks={mockTasks} projects={mockProjects as any} />);
    expect(screen.getByTestId('swimlane-设计部')).toBeInTheDocument();
    expect(screen.getByTestId('swimlane-研发部')).toBeInTheDocument();
  });

  it('renders department labels', () => {
    renderWithAntd(<SwimlaneTab tasks={mockTasks} projects={mockProjects as any} />);
    expect(screen.getByText('设计部')).toBeInTheDocument();
    expect(screen.getByText('研发部')).toBeInTheDocument();
  });

  it('renders time axis header with month columns', () => {
    renderWithAntd(<SwimlaneTab tasks={mockTasks} projects={mockProjects as any} />);
    expect(screen.getByText('部门')).toBeInTheDocument();
    // Month labels now use YYYY年M月 format
    expect(screen.getByText(`${currentYear}年2月`)).toBeInTheDocument();
  });

  it('groups tasks into correct department swimlanes', () => {
    renderWithAntd(<SwimlaneTab tasks={mockTasks} projects={mockProjects as any} />);
    const designLane = screen.getByTestId('swimlane-设计部');
    const devLane = screen.getByTestId('swimlane-研发部');
    expect(designLane).toHaveTextContent('需求调研');
    expect(devLane).toHaveTextContent('功能开发');
  });

  it('renders task cards with status-based background color', () => {
    renderWithAntd(<SwimlaneTab tasks={mockTasks} projects={mockProjects as any} />);
    const card1 = screen.getByTestId('task-card-1');
    const card2 = screen.getByTestId('task-card-2');
    // IN_PROGRESS -> #3366FF (blue)
    expect(card1.style.backgroundColor).toContain('51, 102, 255');
    // PENDING -> #BFBFBF (gray)
    expect(card2.style.backgroundColor).toContain('191, 191, 191');
  });

  it('renders yellow background for completed tasks', () => {
    const completedTasks = [{
      ...mockTasks[0], id: 3, status: TaskStatus.COMPLETED, title: '已完成任务', deptName: '测试部',
    }];
    renderWithAntd(<SwimlaneTab tasks={completedTasks as any} projects={mockProjects as any} />);
    const card = screen.getByTestId('task-card-3');
    // COMPLETED -> #FAAD14 (yellow)
    expect(card.style.backgroundColor).toContain('250, 173, 20');
  });

  it('shows assignee avatar on task cards', () => {
    renderWithAntd(<SwimlaneTab tasks={mockTasks} projects={mockProjects as any} />);
    expect(screen.getByTestId('assignee-1')).toBeInTheDocument();
    expect(screen.getByTestId('assignee-2')).toBeInTheDocument();
  });

  it('calls onTaskClick when a task card is clicked', async () => {
    const onTaskClick = vi.fn();
    renderWithAntd(
      <SwimlaneTab tasks={mockTasks} projects={mockProjects as any} onTaskClick={onTaskClick} />,
    );
    const card = screen.getByTestId('task-card-1');
    await userEvent.click(card);
    expect(onTaskClick).toHaveBeenCalled();
  });

  it('renders separator lines between swimlanes', () => {
    renderWithAntd(<SwimlaneTab tasks={mockTasks} projects={mockProjects as any} />);
    expect(screen.getByTestId('separator-设计部')).toBeInTheDocument();
    expect(screen.queryByTestId('separator-研发部')).not.toBeInTheDocument();
  });

  it('shows empty lane message when no tasks in lane', () => {
    renderWithAntd(<SwimlaneTab tasks={[]} projects={mockProjects as any} />);
    const emptyMessages = screen.getAllByText('暂无任务');
    expect(emptyMessages.length).toBeGreaterThanOrEqual(1);
  });

  it('renders milestone as diamond marker', () => {
    const milestoneTasks = [{
      ...mockTasks[0], id: 10, type: 'MILESTONE' as const, title: '设计评审', deptName: '设计部',
    }];
    renderWithAntd(<SwimlaneTab tasks={milestoneTasks as any} projects={mockProjects as any} />);
    expect(screen.getByTestId('task-card-10')).toBeInTheDocument();
  });
});
