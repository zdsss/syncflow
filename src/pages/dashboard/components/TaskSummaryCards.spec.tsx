import { render, screen } from '@testing-library/react';
import { ConfigProvider } from 'antd';
import { describe, it, expect } from 'vitest';
import TaskSummaryCards from './TaskSummaryCards';

const renderWithAntd = (ui: React.ReactElement) =>
  render(<ConfigProvider>{ui}</ConfigProvider>);

const mockData = {
  todayTasks: 3,
  weekTasks: 15,
  warningTasks: 2,
  overdueTasks: 1,
};

describe('TaskSummaryCards', () => {
  it('renders with data', () => {
    renderWithAntd(<TaskSummaryCards data={mockData} />);
    expect(screen.getByTestId('task-summary-cards')).toBeInTheDocument();
    expect(screen.getByText('任务统计')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('renders zero values without empty state', () => {
    const emptyData = { todayTasks: 0, weekTasks: 0, warningTasks: 0, overdueTasks: 0 };
    renderWithAntd(<TaskSummaryCards data={emptyData} />);
    expect(screen.queryByText('暂无任务数据')).not.toBeInTheDocument();
    expect(screen.getByTestId('task-summary-cards')).toBeInTheDocument();
  });

  it('renders loading state', () => {
    renderWithAntd(<TaskSummaryCards data={mockData} loading={true} />);
    expect(screen.getByTestId('task-summary-cards')).toBeInTheDocument();
  });

  it('highlights overdue count when overdue > 0', () => {
    renderWithAntd(<TaskSummaryCards data={mockData} />);
    const overdueStat = screen.getByTestId('stat-overdue');
    expect(overdueStat).toBeInTheDocument();
  });

  it('does not show empty state when some values are non-zero', () => {
    const partialData = { todayTasks: 1, weekTasks: 0, warningTasks: 0, overdueTasks: 0 };
    renderWithAntd(<TaskSummaryCards data={partialData} />);
    expect(screen.queryByText('暂无任务数据')).not.toBeInTheDocument();
  });
});
