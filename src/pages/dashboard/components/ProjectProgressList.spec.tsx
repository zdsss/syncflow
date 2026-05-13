import { render, screen } from '@testing-library/react';
import { ConfigProvider } from 'antd';
import { describe, it, expect } from 'vitest';
import ProjectProgressList from './ProjectProgressList';

const renderWithAntd = (ui: React.ReactElement) =>
  render(<ConfigProvider>{ui}</ConfigProvider>);

const mockProjects = [
  { id: 1, name: '项目A', progress: 80, status: 'in_progress', dueDate: '2026-06-01' },
  { id: 2, name: '项目B', progress: 45, status: 'in_progress', dueDate: '2026-07-15' },
  { id: 3, name: '项目C', progress: 100, status: 'completed', dueDate: '2026-05-01' },
];

describe('ProjectProgressList', () => {
  it('renders with projects data', () => {
    renderWithAntd(<ProjectProgressList projects={mockProjects} />);
    expect(screen.getByTestId('project-progress-list')).toBeInTheDocument();
    expect(screen.getByText('项目进度')).toBeInTheDocument();
    expect(screen.getByText('项目A')).toBeInTheDocument();
    expect(screen.getByText('项目B')).toBeInTheDocument();
    expect(screen.getByText('项目C')).toBeInTheDocument();
  });

  it('renders empty state when no projects', () => {
    renderWithAntd(<ProjectProgressList projects={[]} />);
    expect(screen.getByText('暂无项目数据')).toBeInTheDocument();
  });

  it('renders loading state', () => {
    renderWithAntd(<ProjectProgressList projects={[]} loading={true} />);
    expect(screen.getByTestId('project-progress-list')).toBeInTheDocument();
  });

  it('sorts projects by progress descending', () => {
    renderWithAntd(<ProjectProgressList projects={mockProjects} />);
    const items = screen.getAllByTestId(/^project-progress-item-/);
    expect(items[0]).toHaveAttribute('data-testid', 'project-progress-item-3');
    expect(items[1]).toHaveAttribute('data-testid', 'project-progress-item-1');
    expect(items[2]).toHaveAttribute('data-testid', 'project-progress-item-2');
  });

  it('displays due dates', () => {
    renderWithAntd(<ProjectProgressList projects={mockProjects} />);
    expect(screen.getByText(/2026-06-01/)).toBeInTheDocument();
  });
});
