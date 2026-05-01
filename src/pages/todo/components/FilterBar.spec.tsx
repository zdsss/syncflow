import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfigProvider } from 'antd';
import FilterBar from './FilterBar';
import type { Task } from '@/types';
import { TaskStatus, TaskPriority } from '@/types';

const mockSetFilters = vi.fn();

vi.mock('@/stores/useTaskStore', () => ({
  useTaskStore: () => ({
    filters: {},
    setFilters: mockSetFilters,
  }),
}));

const makeTasks = (count: number): Task[] =>
  Array.from({ length: count }, (_, i) => ({
    id: String(i + 1),
    name: `Task ${i + 1}`,
    projectId: 'p1',
    priority: TaskPriority.MEDIUM,
    status: TaskStatus.NOT_STARTED,
    assigneeId: 'u1',
    participantIds: [],
    progress: 0,
    milestone: false,
    dependencies: [],
    tags: [],
    createdAt: '2025-01-01',
    updatedAt: '2025-01-01',
  }));

const renderWithAntd = (ui: React.ReactElement) =>
  render(<ConfigProvider>{ui}</ConfigProvider>);

const FILTER_LABELS = [
  '今日', '本周', '本月', '全部', '预警', '超期',
  '问题', '风险', '建议', '关注', '事务', '阶段',
  '审批', '变更', '里程碑',
];

describe('FilterBar', () => {
  beforeEach(() => {
    mockSetFilters.mockClear();
  });

  it('renders all 15 filter items', () => {
    renderWithAntd(<FilterBar tasks={makeTasks(5)} />);
    for (const label of FILTER_LABELS) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it('clicking a filter item toggles active state and calls setFilters', async () => {
    const user = userEvent.setup();
    renderWithAntd(<FilterBar tasks={makeTasks(3)} />);

    const todayLabel = screen.getByText('今日');
    const todayItem = todayLabel.closest('[class*="filterItem"]')!;
    expect(todayItem.className).not.toContain('filterItemActive');

    await user.click(todayItem);
    expect(todayItem.className).toContain('filterItemActive');
    expect(mockSetFilters).toHaveBeenCalledWith(
      expect.objectContaining({ dateRange: expect.any(Array) }),
    );
  });

  it('clicking "all" filter clears filters', async () => {
    const user = userEvent.setup();
    renderWithAntd(<FilterBar tasks={makeTasks(2)} />);

    const allItem = screen.getByText('全部').closest('[class*="filterItem"]')!;
    await user.click(allItem);

    expect(mockSetFilters).toHaveBeenCalledWith({
      status: undefined,
      dateRange: undefined,
      keyword: undefined,
    });
  });

  it('renders status dropdown', () => {
    renderWithAntd(<FilterBar tasks={makeTasks(1)} />);
    expect(screen.getByText('全部状态')).toBeInTheDocument();
  });

  it('renders date range picker with placeholders', () => {
    renderWithAntd(<FilterBar tasks={makeTasks(1)} />);
    expect(screen.getByPlaceholderText('开始日期')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('结束日期')).toBeInTheDocument();
  });
});
