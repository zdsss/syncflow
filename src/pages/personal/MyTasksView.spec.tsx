import { render, screen } from '@testing-library/react';
import { ConfigProvider } from 'antd';
import { describe, it, expect } from 'vitest';
import MyTasksView from './MyTasksView';
import type { Task } from '@/types';
import { TaskStatus, TaskPriority } from '@/types';

vi.mock('./PersonalPage.module.css', () => ({
  default: {
    sectionTitle: 'sectionTitle',
    statRow: 'statRow',
    statCard: 'statCard',
    statLabel: 'statLabel',
    statValue: 'statValue',
    priorityDot: 'priorityDot',
  },
}));

const mockTasks: Task[] = [
  {
    id: '1', code: 'T-001', name: '任务一', description: '', projectId: 'p1',
    priority: TaskPriority.HIGH, status: TaskStatus.IN_PROGRESS, assigneeId: 'user1',
    participantIds: [], progress: 50, milestone: false, dependencies: [], tags: [],
    planEnd: '2025-06-01', createdAt: '2025-01-01', updatedAt: '2025-01-01',
    plannedHours: 20, loggedHours: 8,
  },
  {
    id: '2', code: 'T-002', name: '任务二', description: '', projectId: 'p1',
    priority: TaskPriority.LOW, status: TaskStatus.COMPLETED, assigneeId: 'user2',
    participantIds: [], progress: 100, milestone: false, dependencies: [], tags: [],
    planEnd: '2025-07-01', createdAt: '2025-02-01', updatedAt: '2025-02-01',
    plannedHours: 10, loggedHours: 10,
  },
  {
    id: '3', code: 'T-003', name: '任务三', description: '', projectId: 'p1',
    priority: TaskPriority.URGENT, status: TaskStatus.PENDING, assigneeId: 'user3',
    participantIds: [], progress: 0, milestone: false, dependencies: [], tags: [],
    planEnd: '2025-08-01', createdAt: '2025-03-01', updatedAt: '2025-03-01',
    plannedHours: 15, loggedHours: 0,
  },
];

const renderWithAntd = (ui: React.ReactElement) =>
  render(<ConfigProvider>{ui}</ConfigProvider>);

describe('MyTasksView', () => {
  it('renders without crashing', () => {
    renderWithAntd(<MyTasksView tasks={mockTasks} />);
    expect(screen.getByTestId('my-tasks-section')).toBeInTheDocument();
  });

  it('displays section headings', () => {
    renderWithAntd(<MyTasksView tasks={mockTasks} />);
    expect(screen.getByText('任务汇总')).toBeInTheDocument();
    expect(screen.getByText('优先级分布')).toBeInTheDocument();
    expect(screen.getByText('任务列表')).toBeInTheDocument();
  });

  it('displays task summary stats', () => {
    renderWithAntd(<MyTasksView tasks={mockTasks} />);
    expect(screen.getByText('待办')).toBeInTheDocument();
    expect(screen.getAllByText('进行中').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('已完成').length).toBeGreaterThanOrEqual(1);
  });

  it('displays priority distribution stats', () => {
    renderWithAntd(<MyTasksView tasks={mockTasks} />);
    expect(screen.getAllByText('紧急').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('高').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('中').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('低').length).toBeGreaterThanOrEqual(1);
  });

  it('renders task table with names', () => {
    renderWithAntd(<MyTasksView tasks={mockTasks} />);
    expect(screen.getByText('任务一')).toBeInTheDocument();
    expect(screen.getByText('任务二')).toBeInTheDocument();
    expect(screen.getByText('任务三')).toBeInTheDocument();
  });

  it('renders task codes in table', () => {
    renderWithAntd(<MyTasksView tasks={mockTasks} />);
    expect(screen.getByText('T-001')).toBeInTheDocument();
    expect(screen.getByText('T-002')).toBeInTheDocument();
  });

  it('handles empty tasks array', () => {
    renderWithAntd(<MyTasksView tasks={[]} />);
    expect(screen.getByTestId('my-tasks-section')).toBeInTheDocument();
    expect(screen.getByText('任务列表')).toBeInTheDocument();
  });
});
