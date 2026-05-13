import { render, screen } from '@testing-library/react';
import { ConfigProvider } from 'antd';
import BasicTab from './BasicTab';
import type { Project, Task } from '@/types';
import { ProjectStatus, TaskStatus, TaskPriority } from '@/types';

const mockProject: Project = {
  id: 1,
  code: 'PRJ-2024-001',
  name: '比亚迪底部水冷项目',
  description: '底部水冷系统研发',
  status: ProjectStatus.IN_PROGRESS,
  ownerId: 1,
  ownerName: '张三',
  projectType: '技术部',
  plannedStart: '2024-12-17',
  plannedEnd: '2026-03-25',
  progress: 30,
  createdAt: '2024-12-01T00:00:00Z',
  updatedAt: '2025-03-01T00:00:00Z',
};

const mockTasks: Task[] = [
  {
    id: 1,
    taskNo: 'TASK-001',
    title: '需求分析',
    type: 'TASK',
    projectId: 1,
    priority: TaskPriority.HIGH,
    status: TaskStatus.COMPLETED,
    assigneeId: 1,
    assigneeName: '张三',
    reporterName: '李四',
    projectName: '比亚迪底部水冷项目',
    plannedStart: '2024-12-17',
    plannedEnd: '2025-01-15',
    progress: 100,
    tags: '',
    isWatching: false,
    isOverdue: false,
    isWarning: false,
    commentCount: 0,
    watcherCount: 0,
    createdAt: '2024-12-01T00:00:00Z',
    updatedAt: '2025-01-15T00:00:00Z',
  },
];

const renderWithAntd = (ui: React.ReactElement) =>
  render(<ConfigProvider>{ui}</ConfigProvider>);

describe('BasicTab', () => {
  it('renders project number from code field', () => {
    renderWithAntd(<BasicTab project={mockProject} tasks={mockTasks} />);
    expect(screen.getByTestId('project-number')).toHaveTextContent('PRJ-2024-001');
  });

  it('renders project name', () => {
    renderWithAntd(<BasicTab project={mockProject} tasks={mockTasks} />);
    expect(screen.getByTestId('project-name')).toHaveTextContent('比亚迪底部水冷项目');
  });

  it('renders description', () => {
    renderWithAntd(<BasicTab project={mockProject} tasks={mockTasks} />);
    expect(screen.getByTestId('project-description')).toHaveTextContent('底部水冷系统研发');
  });

  it('renders leader info using ownerName', () => {
    renderWithAntd(<BasicTab project={mockProject} tasks={mockTasks} />);
    expect(screen.getByTestId('project-leader')).toBeInTheDocument();
    expect(screen.getByTestId('project-leader')).toHaveTextContent('张三');
  });

  it('renders project type', () => {
    renderWithAntd(<BasicTab project={mockProject} tasks={mockTasks} />);
    expect(screen.getByTestId('project-type')).toHaveTextContent('技术部');
  });

  it('renders planned duration as date range', () => {
    renderWithAntd(<BasicTab project={mockProject} tasks={mockTasks} />);
    expect(screen.getByTestId('planned-duration')).toHaveTextContent('2024-12-17 ~ 2026-03-25');
  });

  it('renders start and end dates', () => {
    renderWithAntd(<BasicTab project={mockProject} tasks={mockTasks} />);
    expect(screen.getByTestId('planned-start-date')).toHaveTextContent('2024-12-17 - 2026-03-25');
  });

  it('renders status indicator with correct label', () => {
    renderWithAntd(<BasicTab project={mockProject} tasks={mockTasks} />);
    expect(screen.getByTestId('status-indicator')).toHaveTextContent('进行中');
  });

  it('renders progress bar', () => {
    renderWithAntd(<BasicTab project={mockProject} tasks={mockTasks} />);
    const progressBar = screen.getByTestId('project-progress').querySelector('[role="progressbar"]');
    expect(progressBar).toBeInTheDocument();
  });

  it('shows 0% progress for project with progress=0', () => {
    const project = { ...mockProject, progress: 0 };
    renderWithAntd(<BasicTab project={project} tasks={mockTasks} />);
    const indicator = screen.getByTestId('project-progress').querySelector('[title]');
    expect(indicator).toHaveAttribute('title', '0%');
  });

  it('renders timeline section when dates are set', () => {
    renderWithAntd(<BasicTab project={mockProject} tasks={mockTasks} />);
    expect(screen.getByTestId('project-timeline')).toBeInTheDocument();
  });

  it('renders info grid', () => {
    renderWithAntd(<BasicTab project={mockProject} tasks={mockTasks} />);
    expect(screen.getByTestId('info-grid')).toBeInTheDocument();
  });

  it('shows 未设置 for missing code', () => {
    const project = { ...mockProject, code: undefined };
    renderWithAntd(<BasicTab project={project} tasks={mockTasks} />);
    expect(screen.getByTestId('project-number')).toHaveTextContent('未设置');
  });

  it('shows 未设置 for missing description', () => {
    const project = { ...mockProject, description: undefined };
    renderWithAntd(<BasicTab project={project} tasks={mockTasks} />);
    expect(screen.getByTestId('project-description')).toHaveTextContent('未设置');
  });

  it('shows 未设置 for missing dates', () => {
    const project = { ...mockProject, plannedStart: '', plannedEnd: '' };
    renderWithAntd(<BasicTab project={project} tasks={mockTasks} />);
    expect(screen.getByTestId('planned-duration')).toHaveTextContent('未设置');
  });

  it('does not render timeline when dates missing', () => {
    const project = { ...mockProject, plannedStart: '', plannedEnd: '' };
    renderWithAntd(<BasicTab project={project} tasks={mockTasks} />);
    expect(screen.queryByTestId('project-timeline')).not.toBeInTheDocument();
  });

  it('falls back to ownerId when ownerName is missing', () => {
    const project = { ...mockProject, ownerName: undefined };
    renderWithAntd(<BasicTab project={project} tasks={mockTasks} />);
    expect(screen.getByTestId('project-leader')).toHaveTextContent('ID: 1');
  });

  it('shows 未设置 for missing project type', () => {
    const project = { ...mockProject, projectType: undefined };
    renderWithAntd(<BasicTab project={project} tasks={mockTasks} />);
    expect(screen.getByTestId('project-type')).toHaveTextContent('未设置');
  });
});
