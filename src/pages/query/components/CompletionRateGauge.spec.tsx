import { render, screen } from '@testing-library/react';
import { ConfigProvider } from 'antd';
import { describe, it, expect, vi } from 'vitest';
import CompletionRateGauge from './CompletionRateGauge';

vi.mock('echarts-for-react', () => ({
  default: (props: any) => (
    <div data-testid="gauge-chart" data-option={JSON.stringify(props.option)} />
  ),
}));

const renderWithAntd = (ui: React.ReactElement) =>
  render(<ConfigProvider>{ui}</ConfigProvider>);

describe('CompletionRateGauge', () => {
  it('renders gauge chart container', () => {
    renderWithAntd(<CompletionRateGauge rate={50} />);
    expect(screen.getByTestId('gauge-chart')).toBeInTheDocument();
  });

  it('renders with 0% rate', () => {
    renderWithAntd(<CompletionRateGauge rate={0} />);
    expect(screen.getByTestId('gauge-chart')).toBeInTheDocument();
  });

  it('renders with 100% rate', () => {
    renderWithAntd(<CompletionRateGauge rate={100} />);
    expect(screen.getByTestId('gauge-chart')).toBeInTheDocument();
  });

  it('uses gauge chart type', () => {
    renderWithAntd(<CompletionRateGauge rate={75} />);
    const chart = screen.getByTestId('gauge-chart');
    const option = JSON.parse(chart.getAttribute('data-option')!);
    expect(option.series[0].type).toBe('gauge');
  });

  it('passes rate value to gauge data', () => {
    renderWithAntd(<CompletionRateGauge rate={65} />);
    const chart = screen.getByTestId('gauge-chart');
    const option = JSON.parse(chart.getAttribute('data-option')!);
    expect(option.series[0].data[0].value).toBe(65);
  });

  it('uses default title "项目完成率"', () => {
    renderWithAntd(<CompletionRateGauge rate={50} />);
    const chart = screen.getByTestId('gauge-chart');
    const option = JSON.parse(chart.getAttribute('data-option')!);
    expect(option.title.text).toBe('项目完成率');
  });

  it('uses custom title when provided', () => {
    renderWithAntd(<CompletionRateGauge rate={50} title="团队完成率" />);
    const chart = screen.getByTestId('gauge-chart');
    const option = JSON.parse(chart.getAttribute('data-option')!);
    expect(option.title.text).toBe('团队完成率');
  });

  it('displays percentage in detail formatter', () => {
    renderWithAntd(<CompletionRateGauge rate={80} />);
    const chart = screen.getByTestId('gauge-chart');
    const option = JSON.parse(chart.getAttribute('data-option')!);
    expect(option.series[0].detail.formatter).toBe('{value}%');
  });

  it('sets gauge range from 0 to 100', () => {
    renderWithAntd(<CompletionRateGauge rate={30} />);
    const chart = screen.getByTestId('gauge-chart');
    const option = JSON.parse(chart.getAttribute('data-option')!);
    expect(option.series[0].min).toBe(0);
    expect(option.series[0].max).toBe(100);
  });

  it('uses green color for high completion rate (>=80)', () => {
    renderWithAntd(<CompletionRateGauge rate={85} />);
    const chart = screen.getByTestId('gauge-chart');
    const option = JSON.parse(chart.getAttribute('data-option')!);
    expect(option.series[0].itemStyle.color).toBe('#52c41a');
  });

  it('uses yellow color for medium completion rate (>=50)', () => {
    renderWithAntd(<CompletionRateGauge rate={60} />);
    const chart = screen.getByTestId('gauge-chart');
    const option = JSON.parse(chart.getAttribute('data-option')!);
    expect(option.series[0].itemStyle.color).toBe('#faad14');
  });

  it('uses red color for low completion rate (<50)', () => {
    renderWithAntd(<CompletionRateGauge rate={30} />);
    const chart = screen.getByTestId('gauge-chart');
    const option = JSON.parse(chart.getAttribute('data-option')!);
    expect(option.series[0].itemStyle.color).toBe('#ff4d4f');
  });
});
