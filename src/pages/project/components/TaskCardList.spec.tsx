import { render, screen, fireEvent } from '@testing-library/react';
import { ConfigProvider } from 'antd';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TaskCardList from './TaskCardList';
import type { Task } from '@/types';
import { TaskStatus, TaskPriority } from '@/types';

vi.mock('./TaskCardList.module.css', () => ({
  default: {
    container: 'container',
    toolbar: 'toolbar',
    filterTabs: 'filterTabs',
    filterTab: 'filterTab',
    filterTabActive: 'filterTabActive',
    searchInput: 'searchInput',
    emptyState: 'emptyState',
    taskRow: 'taskRow',
    selected: 'selected',
    expandArrow: 'expandArrow',
    expanded: 'expanded',
    statusIcon: 'statusIcon',
    taskInfo: 'taskInfo',
    taskName: 'taskName',
    taskDescription: 'taskDescription',
    taskSubInfo: 'taskSubInfo',
    taskRight: 'taskRight',
    progressPercent: 'progressPercent',
    starIcon: 'starIcon',
    inactive: 'inactive',
    thumbnail: 'thumbnail',
    thumbnailImg: 'thumbnailImg',
  },
}));

vi.mock('@/services/file.service', () => ({
  getFiles: vi.fn().mockResolvedValue({ data: [] }),
}));

const mockTasks: Task[] = [
  {
    id: 1, taskNo: 'T-001', title: '任务一', description: '描述一', type: 'TASK', projectId: 1,
    priority: TaskPriority.HIGH, status: TaskStatus.IN_PROGRESS, assigneeId: 1, assigneeName: '张三', reporterName: '管理员', projectName: '测试项目',
    progress: 50, milestoneId: 1, dependencies: [], tags: '',
    plannedStart: '2025-01-01', plannedEnd: '2025-06-01', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z',
    plannedHours: 20, actualHours: 8,
    isWatching: false, isOverdue: false, isWarning: false, commentCount: 0, watcherCount: 0,
  },
  {
    id: 2, taskNo: 'T-002', title: '任务二', description: '', type: 'TASK', projectId: 1,
    priority: TaskPriority.LOW, status: TaskStatus.COMPLETED, assigneeId: 2, assigneeName: '李四', reporterName: '管理员', projectName: '测试项目',
    progress: 100, dependencies: [], tags: '',
    plannedStart: '2025-02-01', plannedEnd: '2025-07-01', createdAt: '2025-02-01T00:00:00Z', updatedAt: '2025-02-01T00:00:00Z',
    plannedHours: 10, actualHours: 10,
    isWatching: false, isOverdue: false, isWarning: false, commentCount: 0, watcherCount: 0,
  },
];

const mockOnTaskClick = vi.fn();

const renderWithAntd = (ui: React.ReactElement) =>
  render(<ConfigProvider>{ui}</ConfigProvider>);

describe('TaskCardList', () => {
  beforeEach(() => {
    mockOnTaskClick.mockClear();
  });

  it('renders without crashing', () => {
    renderWithAntd(<TaskCardList tasks={mockTasks} onTaskClick={mockOnTaskClick} />);
    expect(screen.getByText('任务一')).toBeInTheDocument();
    expect(screen.getByText('任务二')).toBeInTheDocument();
  });

  it('renders filter tabs', () => {
    renderWithAntd(<TaskCardList tasks={mockTasks} onTaskClick={mockOnTaskClick} />);
    expect(screen.getByText('全部')).toBeInTheDocument();
    expect(screen.getByText('未完成')).toBeInTheDocument();
    expect(screen.getByText('已完成')).toBeInTheDocument();
  });

  it('renders search input', () => {
    renderWithAntd(<TaskCardList tasks={mockTasks} onTaskClick={mockOnTaskClick} />);
    expect(screen.getByPlaceholderText('搜索任务...')).toBeInTheDocument();
  });

  it('shows empty state when no tasks', () => {
    renderWithAntd(<TaskCardList tasks={[]} onTaskClick={mockOnTaskClick} />);
    expect(screen.getByText('暂无任务')).toBeInTheDocument();
  });

  it('displays task progress', () => {
    renderWithAntd(<TaskCardList tasks={mockTasks} onTaskClick={mockOnTaskClick} />);
    expect(screen.getByText('50%')).toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('displays task assignee names', () => {
    renderWithAntd(<TaskCardList tasks={mockTasks} onTaskClick={mockOnTaskClick} />);
    expect(screen.getByText(/张三/)).toBeInTheDocument();
  });

  it('calls onTaskClick when task row is clicked', () => {
    renderWithAntd(<TaskCardList tasks={mockTasks} onTaskClick={mockOnTaskClick} />);
    fireEvent.click(screen.getByTestId('task-row-1'));
    expect(mockOnTaskClick).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }));
  });

  it('filters tasks by search text', () => {
    renderWithAntd(<TaskCardList tasks={mockTasks} onTaskClick={mockOnTaskClick} />);
    const input = screen.getByPlaceholderText('搜索任务...');
    fireEvent.change(input, { target: { value: '任务一' } });
    expect(screen.getByText('任务一')).toBeInTheDocument();
    expect(screen.queryByText('任务二')).not.toBeInTheDocument();
  });
});
