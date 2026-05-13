import { render, screen } from '@testing-library/react';
import { ConfigProvider } from 'antd';
import { describe, it, expect, vi } from 'vitest';
import WorkloadChart from './WorkloadChart';

vi.mock('echarts-for-react', () => ({
  default: (props: any) => (
    <div data-testid="chart" data-option={JSON.stringify(props.option)} />
  ),
}));

const renderWithAntd = (ui: React.ReactElement) =>
  render(<ConfigProvider>{ui}</ConfigProvider>);

const mockData = {
  total: 20,
  byStatus: { COMPLETED: 12, IN_PROGRESS: 5, NOT_STARTED: 3 },
};

describe('WorkloadChart', () => {
  it('renders chart container', () => {
    renderWithAntd(<WorkloadChart data={mockData} />);
    expect(screen.getByTestId('chart')).toBeInTheDocument();
  });

  it('renders with empty data', () => {
    renderWithAntd(<WorkloadChart data={{ total: 0, byStatus: {} }} />);
    expect(screen.getByTestId('chart')).toBeInTheDocument();
  });

  it('uses a combined option with multiple series (pie + bar)', () => {
    renderWithAntd(<WorkloadChart data={mockData} />);
    const chart = screen.getByTestId('chart');
    const option = JSON.parse(chart.getAttribute('data-option')!);
    expect(option.series.length).toBe(2);
  });

  it('first series is a pie/ring chart for completion rate', () => {
    renderWithAntd(<WorkloadChart data={mockData} />);
    const chart = screen.getByTestId('chart');
    const option = JSON.parse(chart.getAttribute('data-option')!);
    expect(option.series[0].type).toBe('pie');
    expect(option.series[0].radius).toEqual(['40%', '70%']);
  });

  it('pie series shows completed vs remaining', () => {
    renderWithAntd(<WorkloadChart data={mockData} />);
    const chart = screen.getByTestId('chart');
    const option = JSON.parse(chart.getAttribute('data-option')!);
    const pieData = option.series[0].data;
    expect(pieData).toHaveLength(2);
    expect(pieData[0].name).toBe('已完成');
    expect(pieData[0].value).toBe(12);
    expect(pieData[1].name).toBe('未完成');
    expect(pieData[1].value).toBe(8);
  });

  it('second series is a bar chart for status breakdown', () => {
    renderWithAntd(<WorkloadChart data={mockData} />);
    const chart = screen.getByTestId('chart');
    const option = JSON.parse(chart.getAttribute('data-option')!);
    expect(option.series[1].type).toBe('bar');
  });

  it('bar chart maps status labels and counts', () => {
    renderWithAntd(<WorkloadChart data={mockData} />);
    const chart = screen.getByTestId('chart');
    const option = JSON.parse(chart.getAttribute('data-option')!);
    expect(option.xAxis.data).toEqual(['已完成', '进行中', '未开始']);
    const values = option.series[1].data.map((d: any) => d.value);
    expect(values).toEqual([12, 5, 3]);
  });

  it('applies correct colors for bar data items', () => {
    renderWithAntd(<WorkloadChart data={mockData} />);
    const chart = screen.getByTestId('chart');
    const option = JSON.parse(chart.getAttribute('data-option')!);
    const colors = option.series[1].data.map((d: any) => d.itemStyle.color);
    expect(colors).toEqual(['#52c41a', '#3366FF', '#d9d9d9']);
  });

  it('applies correct colors for pie segments', () => {
    renderWithAntd(<WorkloadChart data={mockData} />);
    const chart = screen.getByTestId('chart');
    const option = JSON.parse(chart.getAttribute('data-option')!);
    const colors = option.series[0].data.map((d: any) => d.itemStyle.color);
    expect(colors).toEqual(['#52c41a', '#d9d9d9']);
  });

  it('pie shows completion percentage label', () => {
    renderWithAntd(<WorkloadChart data={mockData} />);
    const chart = screen.getByTestId('chart');
    const option = JSON.parse(chart.getAttribute('data-option')!);
    expect(option.series[0].label).toBeDefined();
  });

  it('handles all completed tasks', () => {
    const data = { total: 5, byStatus: { COMPLETED: 5 } };
    renderWithAntd(<WorkloadChart data={data} />);
    const chart = screen.getByTestId('chart');
    const option = JSON.parse(chart.getAttribute('data-option')!);
    expect(option.series[0].data[0].value).toBe(5);
    expect(option.series[0].data[1].value).toBe(0);
  });
});
