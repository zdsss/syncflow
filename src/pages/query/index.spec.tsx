import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfigProvider } from 'antd';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import QueryPage from './index';

vi.mock('echarts-for-react', () => ({
  default: () => <div data-testid="chart" />,
}));

vi.mock('./QueryPage.module.css', () => ({
  default: new Proxy({}, { get: (_, key) => String(key) }),
}));

const renderWithAntd = (ui: React.ReactElement) =>
  render(<ConfigProvider>{ui}</ConfigProvider>);

describe('QueryPage - 综合查询', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the three-column layout', async () => {
    renderWithAntd(<QueryPage />);
    expect(screen.getByTestId('query-layout')).toBeInTheDocument();
    expect(screen.getByTestId('category-sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('task-list')).toBeInTheDocument();
    expect(screen.getByTestId('task-detail-panel')).toBeInTheDocument();
  });

  it('renders sidebar with time-based categories (今日/本周/本月)', async () => {
    renderWithAntd(<QueryPage />);
    expect(screen.getByText('今日')).toBeInTheDocument();
    expect(screen.getByText('本周')).toBeInTheDocument();
    expect(screen.getByText('本月')).toBeInTheDocument();
    expect(screen.getByText('全部任务')).toBeInTheDocument();
  });

  it('renders sidebar with status categories', async () => {
    renderWithAntd(<QueryPage />);
    expect(screen.getByText('预警')).toBeInTheDocument();
    expect(screen.getByText('超期')).toBeInTheDocument();
    expect(screen.getByText('问题')).toBeInTheDocument();
    expect(screen.getByText('风险')).toBeInTheDocument();
    expect(screen.getByText('里程碑')).toBeInTheDocument();
  });

  it('shows category counts', async () => {
    renderWithAntd(<QueryPage />);
    expect(screen.getByText('45')).toBeInTheDocument();
    expect(screen.getByText('18')).toBeInTheDocument();
    // 5 appears in multiple categories (今日, 超期)
    expect(screen.getAllByText('5').length).toBeGreaterThanOrEqual(2);
  });

  it('renders 综合查询 title and search on same row', async () => {
    renderWithAntd(<QueryPage />);
    expect(screen.getByText('综合查询')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('搜索任务编码、名称、负责人')).toBeInTheDocument();
  });

  it('renders filter tabs with counts: 全部(8), 未完成(5), 已完成(3)', async () => {
    renderWithAntd(<QueryPage />);
    expect(screen.getByTestId('filter-tabs')).toBeInTheDocument();
    expect(screen.getByText('全部(8)')).toBeInTheDocument();
    expect(screen.getByText('未完成(5)')).toBeInTheDocument();
    expect(screen.getByText('已完成(3)')).toBeInTheDocument();
  });

  it('filters tasks when clicking filter tabs', async () => {
    const user = userEvent.setup();
    renderWithAntd(<QueryPage />);
    await waitFor(() => {
      expect(screen.getByText('P3-L2-010')).toBeInTheDocument();
    });
    const filterTabs = screen.getByTestId('filter-tabs');
    const completedTab = filterTabs.querySelector('button:nth-child(3)')!;
    await user.click(completedTab);
    expect(screen.getByText('P3-L2-012')).toBeInTheDocument();
    expect(screen.queryByText('P3-L2-010')).not.toBeInTheDocument();
  });

  it('renders task cards with task code, name, status, assignee', async () => {
    renderWithAntd(<QueryPage />);
    await waitFor(() => {
      expect(screen.getByText('P3-L2-010')).toBeInTheDocument();
      expect(screen.getByText('电芯来料异常处理')).toBeInTheDocument();
      expect(screen.getByText('邓智豪')).toBeInTheDocument();
    });
  });

  it('shows progress percentage on task cards', async () => {
    renderWithAntd(<QueryPage />);
    await waitFor(() => {
      expect(screen.getByText('40%')).toBeInTheDocument();
      expect(screen.getByText('50%')).toBeInTheDocument();
    });
  });

  it('shows star/favorite icon on task cards', async () => {
    renderWithAntd(<QueryPage />);
    await waitFor(() => {
      const starIcons = screen.getAllByTestId(/star-icon-/);
      expect(starIcons.length).toBeGreaterThan(0);
    });
  });

  it('shows file and edit action icons in card header', async () => {
    renderWithAntd(<QueryPage />);
    await waitFor(() => {
      const fileIcons = screen.getAllByTestId(/file-icon-/);
      expect(fileIcons.length).toBeGreaterThan(0);
      const editIcons = screen.getAllByTestId(/edit-icon-/);
      expect(editIcons.length).toBeGreaterThan(0);
    });
  });

  it('renders task detail panel with action buttons', async () => {
    renderWithAntd(<QueryPage />);
    expect(screen.getByText('选择流程')).toBeInTheDocument();
    expect(screen.getAllByText('流程记录').length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText('设置参与人')).toBeInTheDocument();
    expect(screen.getByText('标记重要')).toBeInTheDocument();
    expect(screen.getByText('完成任务')).toBeInTheDocument();
  });

  it('renders business type dropdown in detail panel', async () => {
    renderWithAntd(<QueryPage />);
    expect(screen.getByText('业务类型')).toBeInTheDocument();
    expect(screen.getByTestId('business-type-select')).toBeInTheDocument();
  });

  it('renders navigation buttons at bottom of detail panel', async () => {
    renderWithAntd(<QueryPage />);
    expect(screen.getByText('上一步')).toBeInTheDocument();
    expect(screen.getByText('下一步')).toBeInTheDocument();
    expect(screen.getByTestId('detail-navigation')).toBeInTheDocument();
  });

  it('allows clicking a category to filter', async () => {
    const user = userEvent.setup();
    renderWithAntd(<QueryPage />);
    await user.click(screen.getByText('预警'));
    expect(screen.getByTestId('category-sidebar')).toHaveAttribute('data-active-category', '预警');
  });

  it('allows clicking a task card to select it', async () => {
    const user = userEvent.setup();
    renderWithAntd(<QueryPage />);
    await waitFor(() => {
      expect(screen.getByText('P3-L2-010')).toBeInTheDocument();
    });
    await user.click(screen.getByText('P3-L2-010'));
    await waitFor(() => {
      expect(screen.getByTestId('task-detail-panel')).toHaveAttribute('data-selected-task', 'P3-L2-010');
    });
  });

  it('shows task status tags with correct colors', async () => {
    renderWithAntd(<QueryPage />);
    await waitFor(() => {
      const statusTags = screen.getAllByTestId(/status-tag-/);
      expect(statusTags.length).toBeGreaterThan(0);
    });
  });

  it('renders task detail panel with template section', async () => {
    renderWithAntd(<QueryPage />);
    expect(screen.getByText('流程选择')).toBeInTheDocument();
    expect(screen.getByText('请选择流程模板')).toBeInTheDocument();
  });

  it('renders task detail panel with process records and participant sections', async () => {
    renderWithAntd(<QueryPage />);
    const processRecordElements = screen.getAllByText('流程记录');
    expect(processRecordElements.length).toBeGreaterThanOrEqual(2);
    const participantElements = screen.getAllByText('参与人设置');
    expect(participantElements.length).toBeGreaterThanOrEqual(1);
  });
});
