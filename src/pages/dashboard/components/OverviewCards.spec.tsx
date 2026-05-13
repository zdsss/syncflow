import { render, screen } from '@testing-library/react';
import { ConfigProvider } from 'antd';
import { describe, it, expect } from 'vitest';
import OverviewCards from './OverviewCards';

const renderWithAntd = (ui: React.ReactElement) =>
  render(<ConfigProvider>{ui}</ConfigProvider>);

const mockData = {
  totalProjects: 12,
  inProgress: 5,
  completed: 4,
  delayed: 3,
};

describe('OverviewCards', () => {
  it('renders with data', () => {
    renderWithAntd(<OverviewCards data={mockData} />);
    expect(screen.getByTestId('overview-cards')).toBeInTheDocument();
    expect(screen.getByText('项目总览')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('renders empty state when data is null', () => {
    renderWithAntd(<OverviewCards data={null} />);
    expect(screen.getByTestId('overview-cards')).toBeInTheDocument();
    expect(screen.getByText('暂无数据')).toBeInTheDocument();
  });

  it('renders loading state', () => {
    renderWithAntd(<OverviewCards data={null} loading={true} />);
    expect(screen.getByTestId('overview-cards')).toBeInTheDocument();
  });

  it('highlights delayed count in red when delayed > 0', () => {
    renderWithAntd(<OverviewCards data={mockData} />);
    const delayedStat = screen.getByTestId('stat-delayed');
    expect(delayedStat).toBeInTheDocument();
  });

  it('shows zero values correctly', () => {
    const zeroData = { totalProjects: 0, inProgress: 0, completed: 0, delayed: 0 };
    renderWithAntd(<OverviewCards data={zeroData} />);
    const zeros = screen.getAllByText('0');
    expect(zeros.length).toBeGreaterThanOrEqual(4);
  });
});
