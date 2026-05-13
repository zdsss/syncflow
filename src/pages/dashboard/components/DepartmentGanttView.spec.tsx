import { render, screen } from '@testing-library/react';
import { ConfigProvider } from 'antd';
import DepartmentGanttView from './DepartmentGanttView';
import { ProjectStatus } from '@/types';
import type { Project } from '@/types';

const renderWithAntd = (ui: React.ReactElement) =>
  render(<ConfigProvider>{ui}</ConfigProvider>);

const departments = [
  { id: 'd1', name: '品质部' },
  { id: 'd2', name: '设计部' },
  { id: 'd3', name: '工程部' },
];

const projects: Project[] = [
  {
    id: 1,
    name: '项目A',
    projectType: '品质部',
    status: ProjectStatus.IN_PROGRESS,
    ownerId: 1,
    plannedStart: '2026-08-01',
    plannedEnd: '2026-12-01',
    progress: 50,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  },
  {
    id: 2,
    name: '项目B',
    projectType: '设计部',
    status: ProjectStatus.NOT_STARTED,
    ownerId: 2,
    plannedStart: '2027-01-01',
    plannedEnd: '2027-06-01',
    progress: 0,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  },
  {
    id: 3,
    name: '项目C',
    projectType: '品质部',
    status: ProjectStatus.COMPLETED,
    ownerId: 3,
    plannedStart: '2026-03-01',
    plannedEnd: '2026-07-01',
    progress: 100,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  },
];

const defaultProps = {
  departments,
  projects,
  dateRange: ['2026-01-01', '2027-12-31'] as [string, string],
  onDateRangeChange: vi.fn(),
};

describe('DepartmentGanttView', () => {
  it('renders department labels in the left column', () => {
    renderWithAntd(<DepartmentGanttView {...defaultProps} />);
    expect(screen.getByText('品质部')).toBeInTheDocument();
    expect(screen.getByText('设计部')).toBeInTheDocument();
    expect(screen.getByText('工程部')).toBeInTheDocument();
  });

  it('renders projects grouped under their department', () => {
    renderWithAntd(<DepartmentGanttView {...defaultProps} />);
    // 品质部 has 项目A and 项目C
    expect(screen.getByText('项目A')).toBeInTheDocument();
    expect(screen.getByText('项目C')).toBeInTheDocument();
    // 设计部 has 项目B
    expect(screen.getByText('项目B')).toBeInTheDocument();
  });

  it('renders gantt bars for projects with dates', () => {
    const { container } = renderWithAntd(<DepartmentGanttView {...defaultProps} />);
    const bars = container.querySelectorAll('[title*="项目"]');
    expect(bars.length).toBe(3);
  });

  it('renders year header in timeline', () => {
    renderWithAntd(<DepartmentGanttView {...defaultProps} />);
    expect(screen.getByText('2026')).toBeInTheDocument();
    expect(screen.getByText('2027')).toBeInTheDocument();
  });

  it('renders month columns in timeline', () => {
    renderWithAntd(<DepartmentGanttView {...defaultProps} />);
    const janCells = screen.getAllByText('1月');
    expect(janCells.length).toBeGreaterThanOrEqual(1);
  });

  it('does not render projects without dates', () => {
    const noDateProject: Project = {
      id: 4,
      name: '无日期项目',
      projectType: '工程部',
      status: ProjectStatus.NOT_STARTED,
      ownerId: 4,
      plannedStart: '',
      plannedEnd: '',
      progress: 0,
      createdAt: '2025-01-01',
      updatedAt: '2025-01-01',
    };
    renderWithAntd(
      <DepartmentGanttView
        {...defaultProps}
        projects={[...projects, noDateProject]}
      />
    );
    expect(screen.queryByText('无日期项目')).not.toBeInTheDocument();
  });

  it('renders department rows even when department has no projects', () => {
    const deptOnly = [{ id: 'd4', name: '测试部' }];
    renderWithAntd(
      <DepartmentGanttView
        {...defaultProps}
        departments={deptOnly}
      />
    );
    expect(screen.getByText('测试部')).toBeInTheDocument();
  });

  it('renders gantt bar with project status label', () => {
    const { container } = renderWithAntd(<DepartmentGanttView {...defaultProps} />);
    const bar = container.querySelector('[title*="项目A"]');
    expect(bar).toBeInTheDocument();
    expect(bar?.getAttribute('title')).toContain('2026-08-01');
    expect(bar?.getAttribute('title')).toContain('2026-12-01');
  });
});
