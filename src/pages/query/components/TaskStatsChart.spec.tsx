import { render, screen } from '@testing-library/react';
import { ConfigProvider } from 'antd';
import { describe, it, expect, vi } from 'vitest';
import TaskStatsChart from './TaskStatsChart';

vi.mock('echarts-for-react', () => ({
  default: (props: any) => (
    <div data-testid="chart" data-option={JSON.stringify(props.option)} />
  ),
}));

const renderWithAntd = (ui: React.ReactElement) =>
  render(<ConfigProvider>{ui}</ConfigProvider>);

const mockData = [
  { status: 'NOT_STARTED', _count: { id: 5 } },
  { status: 'IN_PROGRESS', _count: { id: 10 } },
  { status: 'COMPLETED', _count: { id: 20 } },
  { status: 'OVERDUE', _count: { id: 3 } },
  { status: 'PENDING_ASSIGN', _count: { id: 2 } },
  { status: 'URGENT', _count: { id: 1 } },
];

describe('TaskStatsChart', () => {
  it('renders chart container', () => {
    renderWithAntd(<TaskStatsChart data={mockData} />);
    expect(screen.getByTestId('chart')).toBeInTheDocument();
  });

  it('renders with empty data', () => {
    renderWithAntd(<TaskStatsChart data={[]} />);
    expect(screen.getByTestId('chart')).toBeInTheDocument();
  });

  it('displays total count in title text', () => {
    renderWithAntd(<TaskStatsChart data={mockData} />);
    const chart = screen.getByTestId('chart');
    const option = JSON.parse(chart.getAttribute('data-option')!);
    expect(option.title.text).toContain('41');
    expect(option.title.text).toContain('任务状态统计');
  });

  it('has both bar and pie series', () => {
    renderWithAntd(<TaskStatsChart data={mockData} />);
    const chart = screen.getByTestId('chart');
    const option = JSON.parse(chart.getAttribute('data-option')!);
    const seriesTypes = option.series.map((s: any) => s.type);
    expect(seriesTypes).toContain('bar');
    expect(seriesTypes).toContain('pie');
  });

  it('bar chart uses correct data', () => {
    renderWithAntd(<TaskStatsChart data={mockData} />);
    const chart = screen.getByTestId('chart');
    const option = JSON.parse(chart.getAttribute('data-option')!);
    const barSeries = option.series.find((s: any) => s.type === 'bar');
    expect(barSeries.data.map((d: any) => d.value)).toEqual([5, 10, 20, 3, 2, 1]);
  });

  it('pie chart uses correct data', () => {
    renderWithAntd(<TaskStatsChart data={mockData} />);
    const chart = screen.getByTestId('chart');
    const option = JSON.parse(chart.getAttribute('data-option')!);
    const pieSeries = option.series.find((s: any) => s.type === 'pie');
    const names = pieSeries.data.map((d: any) => d.name);
    expect(names).toEqual(['未开始', '进行中', '已完成', '已逾期', '待分配', '紧急']);
    const values = pieSeries.data.map((d: any) => d.value);
    expect(values).toEqual([5, 10, 20, 3, 2, 1]);
  });

  it('maps category axis with Chinese status labels', () => {
    renderWithAntd(<TaskStatsChart data={mockData} />);
    const chart = screen.getByTestId('chart');
    const option = JSON.parse(chart.getAttribute('data-option')!);
    expect(option.xAxis.type).toBe('category');
    expect(option.xAxis.data).toEqual([
      '未开始', '进行中', '已完成', '已逾期', '待分配', '紧急',
    ]);
  });

  it('has tooltip with axis trigger', () => {
    renderWithAntd(<TaskStatsChart data={mockData} />);
    const chart = screen.getByTestId('chart');
    const option = JSON.parse(chart.getAttribute('data-option')!);
    expect(option.tooltip.trigger).toBe('axis');
  });

  it('has value type on yAxis', () => {
    renderWithAntd(<TaskStatsChart data={mockData} />);
    const chart = screen.getByTestId('chart');
    const option = JSON.parse(chart.getAttribute('data-option')!);
    expect(option.yAxis.type).toBe('value');
  });

  it('applies correct status colors to pie segments', () => {
    renderWithAntd(<TaskStatsChart data={mockData} />);
    const chart = screen.getByTestId('chart');
    const option = JSON.parse(chart.getAttribute('data-option')!);
    const pieSeries = option.series.find((s: any) => s.type === 'pie');
    const colors = pieSeries.data.map((d: any) => d.itemStyle.color);
    expect(colors).toEqual(['#d9d9d9', '#faad14', '#52c41a', '#ff4d4f', '#d9d9d9', '#ff4d4f']);
  });

  it('applies correct status colors to bar segments', () => {
    renderWithAntd(<TaskStatsChart data={mockData} />);
    const chart = screen.getByTestId('chart');
    const option = JSON.parse(chart.getAttribute('data-option')!);
    const barSeries = option.series.find((s: any) => s.type === 'bar');
    const colors = barSeries.data.map((d: any) => d.itemStyle.color);
    expect(colors).toEqual(['#d9d9d9', '#faad14', '#52c41a', '#ff4d4f', '#d9d9d9', '#ff4d4f']);
  });

  it('handles unknown status gracefully', () => {
    const dataWithUnknown = [
      { status: 'UNKNOWN_STATUS', _count: { id: 7 } },
    ];
    renderWithAntd(<TaskStatsChart data={dataWithUnknown} />);
    const chart = screen.getByTestId('chart');
    const option = JSON.parse(chart.getAttribute('data-option')!);
    expect(option.xAxis.data[0]).toBe('UNKNOWN_STATUS');
    const barSeries = option.series.find((s: any) => s.type === 'bar');
    expect(barSeries.data[0].value).toBe(7);
  });
});
