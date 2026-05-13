import { render, screen } from '@testing-library/react';
import { ConfigProvider } from 'antd';
import { describe, it, expect } from 'vitest';
import PersonalOverview from './PersonalOverview';
import type { Task, Project } from '@/types';
import { TaskStatus, TaskPriority, ProjectStatus } from '@/types';

vi.mock('./PersonalPage.module.css', () => ({
  default: {
    sectionTitle: 'sectionTitle',
    statRow: 'statRow',
    statCard: 'statCard',
    statLabel: 'statLabel',
    statValue: 'statValue',
  },
}));

const mockProjects: Project[] = [
  {
    id: 'p1', name: '项目一', code: 'PRJ-001', status: ProjectStatus.IN_PROGRESS,
    phase: 'development', ownerId: 'user1', description: '', startDate: '2025-01-01',
    endDate: '2025-12-31', createdAt: '2025-01-01', updatedAt: '2025-01-01',
  },
  {
    id: 'p2', name: '项目二', code: 'PRJ-002', status: ProjectStatus.COMPLETED,
    phase: 'testing', ownerId: 'user2', description: '', startDate: '2025-01-01',
    endDate: '2025-06-30', createdAt: '2025-01-01', updatedAt: '2025-06-30',
  },
  {
    id: 'p3', name: '项目三', code: 'PRJ-003', status: ProjectStatus.DELAYED,
    phase: 'planning', ownerId: 'user3', description: '', startDate: '2025-03-01',
    endDate: '2025-09-30', createdAt: '2025-03-01', updatedAt: '2025-04-01',
  },
];

const mockTasks: Task[] = [
  {
    id: '1', code: 'T-001', name: '任务一', description: '', projectId: 'p1',
    priority: TaskPriority.HIGH, status: TaskStatus.IN_PROGRESS, assigneeId: 'user1',
    participantIds: [], progress: 50, milestone: false, dependencies: [], tags: [],
    planEnd: '2025-06-01', createdAt: '2025-01-01', updatedAt: '2025-06-01',
    plannedHours: 20, loggedHours: 8,
  },
  {
    id: '2', code: 'T-002', name: '任务二', description: '', projectId: 'p1',
    priority: TaskPriority.LOW, status: TaskStatus.COMPLETED, assigneeId: 'user2',
    participantIds: [], progress: 100, milestone: false, dependencies: [], tags: [],
    planEnd: '2025-07-01', createdAt: '2025-02-01', updatedAt: '2025-05-01',
    plannedHours: 10, loggedHours: 10,
  },
];

const renderWithAntd = (ui: React.ReactElement) =>
  render(<ConfigProvider>{ui}</ConfigProvider>);

describe('PersonalOverview', () => {
  it('renders without crashing', () => {
    renderWithAntd(<PersonalOverview projects={mockProjects} tasks={mockTasks} />);
    expect(screen.getByTestId('overview-section')).toBeInTheDocument();
  });

  it('displays project statistics section', () => {
    renderWithAntd(<PersonalOverview projects={mockProjects} tasks={mockTasks} />);
    expect(screen.getByText('项目统计')).toBeInTheDocument();
    expect(screen.getByText('在进行')).toBeInTheDocument();
    expect(screen.getByText('逾期')).toBeInTheDocument();
  });

  it('displays task statistics section', () => {
    renderWithAntd(<PersonalOverview projects={mockProjects} tasks={mockTasks} />);
    expect(screen.getByText('任务统计')).toBeInTheDocument();
    expect(screen.getByText('总任务')).toBeInTheDocument();
    expect(screen.getByText('待处理')).toBeInTheDocument();
  });

  it('displays recent activity section', () => {
    renderWithAntd(<PersonalOverview projects={mockProjects} tasks={mockTasks} />);
    expect(screen.getByText('最近动态')).toBeInTheDocument();
  });

  it('renders task names in recent activity table', () => {
    renderWithAntd(<PersonalOverview projects={mockProjects} tasks={mockTasks} />);
    expect(screen.getByText('任务一')).toBeInTheDocument();
    expect(screen.getByText('任务二')).toBeInTheDocument();
  });

  it('handles empty projects and tasks', () => {
    renderWithAntd(<PersonalOverview projects={[]} tasks={[]} />);
    expect(screen.getByTestId('overview-section')).toBeInTheDocument();
    expect(screen.getByText('项目统计')).toBeInTheDocument();
  });
});
