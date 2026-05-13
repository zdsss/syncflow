import { render, screen, fireEvent } from '@testing-library/react';
import { ConfigProvider } from 'antd';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TaskList from './TaskList';

vi.mock('./QueryPage.module.css', () => ({
  default: {
    taskListPanel: 'taskListPanel',
    taskListHeader: 'taskListHeader',
    headerRow: 'headerRow',
    taskListTitle: 'taskListTitle',
    searchInput: 'searchInput',
    filterTabs: 'filterTabs',
    filterTab: 'filterTab',
    activeFilterTab: 'activeFilterTab',
    taskListContent: 'taskListContent',
    taskCard: 'taskCard',
    activeTaskCard: 'activeTaskCard',
    taskCardHeader: 'taskCardHeader',
    taskCardLeft: 'taskCardLeft',
    taskCode: 'taskCode',
    taskCardActions: 'taskCardActions',
    starIcon: 'starIcon',
    actionIcon: 'actionIcon',
    taskName: 'taskName',
    taskMeta: 'taskMeta',
    taskAssignee: 'taskAssignee',
    taskProgress: 'taskProgress',
    taskDueDate: 'taskDueDate',
    overdueDate: 'overdueDate',
  },
}));

const mockOnTaskSelect = vi.fn();

const renderWithAntd = (ui: React.ReactElement) =>
  render(<ConfigProvider>{ui}</ConfigProvider>);

describe('TaskList (query)', () => {
  beforeEach(() => {
    mockOnTaskSelect.mockClear();
  });

  it('renders without crashing', () => {
    renderWithAntd(<TaskList />);
    expect(screen.getByTestId('task-list')).toBeInTheDocument();
  });

  it('displays page title', () => {
    renderWithAntd(<TaskList />);
    expect(screen.getByText('综合查询')).toBeInTheDocument();
  });

  it('renders search input', () => {
    renderWithAntd(<TaskList />);
    expect(screen.getByPlaceholderText('搜索任务编码、名称、负责人')).toBeInTheDocument();
  });

  it('displays filter tabs', () => {
    renderWithAntd(<TaskList />);
    expect(screen.getByTestId('filter-tabs')).toBeInTheDocument();
  });

  it('displays mock task names', () => {
    renderWithAntd(<TaskList />);
    expect(screen.getByText('电芯来料异常处理')).toBeInTheDocument();
    expect(screen.getByText('模组焊接工艺验证')).toBeInTheDocument();
    expect(screen.getByText('Pack组装线平衡优化')).toBeInTheDocument();
  });

  it('displays task codes', () => {
    renderWithAntd(<TaskList />);
    expect(screen.getByText('P3-L2-010')).toBeInTheDocument();
    expect(screen.getByText('P3-L2-011')).toBeInTheDocument();
  });

  it('displays task assignees', () => {
    renderWithAntd(<TaskList />);
    expect(screen.getByText('邓智豪')).toBeInTheDocument();
    expect(screen.getByText('李明')).toBeInTheDocument();
  });

  it('displays task progress', () => {
    renderWithAntd(<TaskList />);
    expect(screen.getByTestId('progress-1')).toHaveTextContent('40%');
    expect(screen.getByTestId('progress-2')).toHaveTextContent('50%');
  });

  it('calls onTaskSelect when task card is clicked', () => {
    renderWithAntd(<TaskList onTaskSelect={mockOnTaskSelect} />);
    fireEvent.click(screen.getByTestId('task-card-1'));
    expect(mockOnTaskSelect).toHaveBeenCalledWith(expect.objectContaining({ id: '1' }));
  });

  it('filters tasks by search value', () => {
    renderWithAntd(<TaskList />);
    const input = screen.getByPlaceholderText('搜索任务编码、名称、负责人');
    fireEvent.change(input, { target: { value: '电芯' } });
    expect(screen.getByText('电芯来料异常处理')).toBeInTheDocument();
    expect(screen.queryByText('模组焊接工艺验证')).not.toBeInTheDocument();
  });
});
