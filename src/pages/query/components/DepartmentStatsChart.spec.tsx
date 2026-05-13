import { render, screen } from '@testing-library/react';
import { ConfigProvider } from 'antd';
import { describe, it, expect, vi } from 'vitest';
import DepartmentStatsChart from './DepartmentStatsChart';

vi.mock('echarts-for-react', () => ({
  default: (props: any) => (
    <div data-testid="chart" data-option={JSON.stringify(props.option)} />
  ),
}));

const renderWithAntd = (ui: React.ReactElement) =>
  render(<ConfigProvider>{ui}</ConfigProvider>);

const mockData = [
  {
    id: 'u1',
    name: '张三',
    taskCount: 10,
    byStatus: { COMPLETED: 5, IN_PROGRESS: 3, NOT_STARTED: 2 },
  },
  {
    id: 'u2',
    name: '李四',
    taskCount: 8,
    byStatus: { COMPLETED: 3, IN_PROGRESS: 4, NOT_STARTED: 1 },
  },
  {
    id: 'u3',
    name: '王五',
    taskCount: 6,
    byStatus: { COMPLETED: 2, IN_PROGRESS: 2, NOT_STARTED: 2 },
  },
];

describe('DepartmentStatsChart', () => {
  it('renders chart container', () => {
    renderWithAntd(<DepartmentStatsChart data={mockData} />);
    expect(screen.getByTestId('chart')).toBeInTheDocument();
  });

  it('renders with empty data', () => {
    renderWithAntd(<DepartmentStatsChart data={[]} />);
    expect(screen.getByTestId('chart')).toBeInTheDocument();
  });

  it('uses horizontal bar chart (yAxis as category)', () => {
    renderWithAntd(<DepartmentStatsChart data={mockData} />);
    const chart = screen.getByTestId('chart');
    const option = JSON.parse(chart.getAttribute('data-option')!);
    expect(option.yAxis.type).toBe('category');
    expect(option.xAxis.type).toBe('value');
  });

  it('maps user names to yAxis categories', () => {
    renderWithAntd(<DepartmentStatsChart data={mockData} />);
    const chart = screen.getByTestId('chart');
    const option = JSON.parse(chart.getAttribute('data-option')!);
    expect(option.yAxis.data).toEqual(['张三', '李四', '王五']);
  });

  it('creates stacked series for each status', () => {
    renderWithAntd(<DepartmentStatsChart data={mockData} />);
    const chart = screen.getByTestId('chart');
    const option = JSON.parse(chart.getAttribute('data-option')!);
    expect(option.series.length).toBe(3);
    expect(option.series[0].name).toBe('已完成');
    expect(option.series[1].name).toBe('进行中');
    expect(option.series[2].name).toBe('未开始');
  });

  it('uses bar type with stack for all series', () => {
    renderWithAntd(<DepartmentStatsChart data={mockData} />);
    const chart = screen.getByTestId('chart');
    const option = JSON.parse(chart.getAttribute('data-option')!);
    option.series.forEach((s: any) => {
      expect(s.type).toBe('bar');
      expect(s.stack).toBe('total');
    });
  });

  it('maps correct data for completed series', () => {
    renderWithAntd(<DepartmentStatsChart data={mockData} />);
    const chart = screen.getByTestId('chart');
    const option = JSON.parse(chart.getAttribute('data-option')!);
    expect(option.series[0].data).toEqual([5, 3, 2]);
  });

  it('maps correct data for in-progress series', () => {
    renderWithAntd(<DepartmentStatsChart data={mockData} />);
    const chart = screen.getByTestId('chart');
    const option = JSON.parse(chart.getAttribute('data-option')!);
    expect(option.series[1].data).toEqual([3, 4, 2]);
  });

  it('applies correct colors for each series', () => {
    renderWithAntd(<DepartmentStatsChart data={mockData} />);
    const chart = screen.getByTestId('chart');
    const option = JSON.parse(chart.getAttribute('data-option')!);
    expect(option.series[0].itemStyle.color).toBe('#52c41a');
    expect(option.series[1].itemStyle.color).toBe('#3366FF');
    expect(option.series[2].itemStyle.color).toBe('#d9d9d9');
  });

  it('has tooltip configured', () => {
    renderWithAntd(<DepartmentStatsChart data={mockData} />);
    const chart = screen.getByTestId('chart');
    const option = JSON.parse(chart.getAttribute('data-option')!);
    expect(option.tooltip).toBeDefined();
    expect(option.tooltip.trigger).toBe('axis');
  });

  it('has legend configured', () => {
    renderWithAntd(<DepartmentStatsChart data={mockData} />);
    const chart = screen.getByTestId('chart');
    const option = JSON.parse(chart.getAttribute('data-option')!);
    expect(option.legend).toBeDefined();
  });

  it('displays title with department stats', () => {
    renderWithAntd(<DepartmentStatsChart data={mockData} />);
    const chart = screen.getByTestId('chart');
    const option = JSON.parse(chart.getAttribute('data-option')!);
    expect(option.title.text).toContain('部门任务统计');
  });
});
