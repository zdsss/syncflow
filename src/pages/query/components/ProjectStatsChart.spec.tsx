import { render, screen } from '@testing-library/react';
import { ConfigProvider } from 'antd';
import { describe, it, expect, vi } from 'vitest';
import ProjectStatsChart from './ProjectStatsChart';

vi.mock('echarts-for-react', () => ({
  default: (props: any) => (
    <div data-testid="chart" data-option={JSON.stringify(props.option)} />
  ),
}));

const renderWithAntd = (ui: React.ReactElement) =>
  render(<ConfigProvider>{ui}</ConfigProvider>);

const mockData = [
  { status: 'NOT_STARTED', _count: { id: 3 } },
  { status: 'IN_PROGRESS', _count: { id: 8 } },
  { status: 'COMPLETED', _count: { id: 15 } },
  { status: 'DELAYED', _count: { id: 2 } },
];

describe('ProjectStatsChart', () => {
  it('renders chart container', () => {
    renderWithAntd(<ProjectStatsChart data={mockData} />);
    expect(screen.getByTestId('chart')).toBeInTheDocument();
  });

  it('renders with empty data', () => {
    renderWithAntd(<ProjectStatsChart data={[]} />);
    expect(screen.getByTestId('chart')).toBeInTheDocument();
  });

  it('has both stacked bar and pie series', () => {
    renderWithAntd(<ProjectStatsChart data={mockData} />);
    const chart = screen.getByTestId('chart');
    const option = JSON.parse(chart.getAttribute('data-option')!);
    const seriesTypes = option.series.map((s: any) => s.type);
    expect(seriesTypes).toContain('bar');
    expect(seriesTypes).toContain('pie');
  });

  it('bar series uses stacked configuration', () => {
    renderWithAntd(<ProjectStatsChart data={mockData} />);
    const chart = screen.getByTestId('chart');
    const option = JSON.parse(chart.getAttribute('data-option')!);
    const barSeries = option.series.filter((s: any) => s.type === 'bar');
    barSeries.forEach((s: any) => {
      expect(s.stack).toBe('total');
    });
  });

  it('has one bar series per status', () => {
    renderWithAntd(<ProjectStatsChart data={mockData} />);
    const chart = screen.getByTestId('chart');
    const option = JSON.parse(chart.getAttribute('data-option')!);
    const barSeries = option.series.filter((s: any) => s.type === 'bar');
    expect(barSeries.length).toBe(4);
  });

  it('bar series uses correct values', () => {
    renderWithAntd(<ProjectStatsChart data={mockData} />);
    const chart = screen.getByTestId('chart');
    const option = JSON.parse(chart.getAttribute('data-option')!);
    const barSeries = option.series.filter((s: any) => s.type === 'bar');
    const values = barSeries.map((s: any) => s.data[0]);
    expect(values).toEqual([3, 8, 15, 2]);
  });

  it('pie chart has correct data', () => {
    renderWithAntd(<ProjectStatsChart data={mockData} />);
    const chart = screen.getByTestId('chart');
    const option = JSON.parse(chart.getAttribute('data-option')!);
    const pieSeries = option.series.find((s: any) => s.type === 'pie');
    const names = pieSeries.data.map((d: any) => d.name);
    expect(names).toEqual(['未开始', '进行中', '已完成', '延期']);
    const values = pieSeries.data.map((d: any) => d.value);
    expect(values).toEqual([3, 8, 15, 2]);
  });

  it('applies correct status colors', () => {
    renderWithAntd(<ProjectStatsChart data={mockData} />);
    const chart = screen.getByTestId('chart');
    const option = JSON.parse(chart.getAttribute('data-option')!);
    const pieSeries = option.series.find((s: any) => s.type === 'pie');
    const colors = pieSeries.data.map((d: any) => d.itemStyle.color);
    expect(colors).toEqual(['#d9d9d9', '#3366FF', '#52c41a', '#8B4513']);
  });

  it('has tooltip with axis trigger for bar chart', () => {
    renderWithAntd(<ProjectStatsChart data={mockData} />);
    const chart = screen.getByTestId('chart');
    const option = JSON.parse(chart.getAttribute('data-option')!);
    expect(option.tooltip.trigger).toBe('axis');
  });

  it('displays total count in title', () => {
    renderWithAntd(<ProjectStatsChart data={mockData} />);
    const chart = screen.getByTestId('chart');
    const option = JSON.parse(chart.getAttribute('data-option')!);
    expect(option.title.text).toContain('28');
    expect(option.title.text).toContain('项目状态统计');
  });

  it('handles unknown status gracefully', () => {
    const dataWithUnknown = [
      { status: 'UNKNOWN', _count: { id: 5 } },
    ];
    renderWithAntd(<ProjectStatsChart data={dataWithUnknown} />);
    const chart = screen.getByTestId('chart');
    const option = JSON.parse(chart.getAttribute('data-option')!);
    const pieSeries = option.series.find((s: any) => s.type === 'pie');
    expect(pieSeries.data[0].name).toBe('UNKNOWN');
    expect(pieSeries.data[0].itemStyle.color).toBe('#3366FF');
  });
});
