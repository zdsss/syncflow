import { render, screen } from '@testing-library/react';
import { ConfigProvider } from 'antd';
import { describe, it, expect } from 'vitest';
import UpcomingMilestones from './UpcomingMilestones';

const renderWithAntd = (ui: React.ReactElement) =>
  render(<ConfigProvider>{ui}</ConfigProvider>);

const mockMilestones = [
  { id: 1, name: '设计评审', dueDate: '2026-05-15', status: 'pending', projectName: '项目A' },
  { id: 2, name: '原型交付', dueDate: '2026-05-20', status: 'in_progress', projectName: '项目B' },
  { id: 3, name: '测试完成', dueDate: '2026-06-01', status: 'delayed', projectName: '项目A' },
];

describe('UpcomingMilestones', () => {
  it('renders with milestones data', () => {
    renderWithAntd(<UpcomingMilestones milestones={mockMilestones} />);
    expect(screen.getByTestId('upcoming-milestones')).toBeInTheDocument();
    expect(screen.getByText('近期里程碑')).toBeInTheDocument();
    expect(screen.getByText('设计评审')).toBeInTheDocument();
    expect(screen.getByText('原型交付')).toBeInTheDocument();
    expect(screen.getByText('测试完成')).toBeInTheDocument();
  });

  it('renders empty state when no milestones', () => {
    renderWithAntd(<UpcomingMilestones milestones={[]} />);
    expect(screen.getByText('暂无里程碑')).toBeInTheDocument();
  });

  it('renders loading state', () => {
    renderWithAntd(<UpcomingMilestones milestones={[]} loading={true} />);
    expect(screen.getByTestId('upcoming-milestones')).toBeInTheDocument();
  });

  it('displays milestone due dates', () => {
    renderWithAntd(<UpcomingMilestones milestones={mockMilestones} />);
    expect(screen.getByText(/2026-05-15/)).toBeInTheDocument();
  });

  it('displays project names', () => {
    renderWithAntd(<UpcomingMilestones milestones={mockMilestones} />);
    const projects = screen.getAllByText('项目A');
    expect(projects.length).toBeGreaterThanOrEqual(1);
  });

  it('displays status tags', () => {
    renderWithAntd(<UpcomingMilestones milestones={mockMilestones} />);
    expect(screen.getByText('待完成')).toBeInTheDocument();
    expect(screen.getByText('延期')).toBeInTheDocument();
  });
});
