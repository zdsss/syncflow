import { render, screen } from '@testing-library/react';
import { ConfigProvider } from 'antd';
import ScheduleView from './ScheduleView';
import { ProjectStatus } from '@/types';
import type { Task, Project } from '@/types';

vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DragOverlay: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  closestCorners: vi.fn(),
  PointerSensor: vi.fn(),
  useSensor: vi.fn(),
  useSensors: vi.fn(() => []),
  useDroppable: () => ({ setNodeRef: vi.fn(), isOver: false }),
  useDraggable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    isDragging: false,
  }),
}));

const renderWithAntd = (ui: React.ReactElement) =>
  render(<ConfigProvider>{ui}</ConfigProvider>);

const projects: Project[] = [
  {
    id: 1,
    name: '项目A',
    status: ProjectStatus.IN_PROGRESS,
    ownerId: 1,
    ownerName: 'u1',
    plannedStart: '2026-08-01',
    plannedEnd: '2026-12-01',
    progress: 50,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  },
  {
    id: 2,
    name: '项目B',
    status: ProjectStatus.NOT_STARTED,
    ownerId: 2,
    ownerName: 'u2',
    plannedStart: '2027-01-01',
    plannedEnd: '2027-06-01',
    progress: 0,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  },
];

const tasks: Task[] = [];

const defaultProps = {
  projects,
  tasks,
  dateRange: ['2026-07-01', '2027-06-30'] as [string, string],
  onDateRangeChange: vi.fn(),
};

describe('ScheduleView', () => {
  it('renders gantt header with "项目名称" and "负责人 / 进度" labels', () => {
    renderWithAntd(<ScheduleView {...defaultProps} />);
    expect(screen.getByText('项目名称')).toBeInTheDocument();
    // Data rows show ownerName and progress
    expect(screen.getByText('u1')).toBeInTheDocument();
  });

  it('renders gantt header with year labels', () => {
    renderWithAntd(<ScheduleView {...defaultProps} />);
    expect(screen.getByText('2026')).toBeInTheDocument();
    expect(screen.getByText('2027')).toBeInTheDocument();
  });

  it('renders project rows for projects with dates', () => {
    renderWithAntd(<ScheduleView {...defaultProps} />);
    expect(screen.getByText('项目A')).toBeInTheDocument();
    expect(screen.getByText('项目B')).toBeInTheDocument();
  });

  it('hides projects without dates from gantt', () => {
    const noDateProject: Project = {
      id: 3,
      name: '无日期项目',
      status: ProjectStatus.NOT_STARTED,
      ownerId: 3,
      plannedStart: '',
      plannedEnd: '',
      progress: 0,
      createdAt: '2025-01-01',
      updatedAt: '2025-01-01',
    };
    renderWithAntd(
      <ScheduleView
        {...defaultProps}
        projects={[...projects, noDateProject]}
      />
    );
    expect(screen.queryByText('无日期项目')).not.toBeInTheDocument();
  });

  it('renders gantt bars for projects with dates', () => {
    const { container } = renderWithAntd(<ScheduleView {...defaultProps} />);
    const bars = container.querySelectorAll('[class*="ganttBar"]');
    expect(bars.length).toBeGreaterThanOrEqual(1);
  });

  it('renders TodoPanel in right panel', () => {
    renderWithAntd(<ScheduleView {...defaultProps} />);
    expect(screen.getByTestId('todo-panel')).toBeInTheDocument();
  });

  it('renders gantt row assignee and progress percent', () => {
    renderWithAntd(<ScheduleView {...defaultProps} />);
    const percentEls = screen.getAllByText(/50%/);
    expect(percentEls.length).toBeGreaterThanOrEqual(1);
  });

  it('renders gantt bar with progress info', () => {
    renderWithAntd(<ScheduleView {...defaultProps} />);
    const progressEls = screen.getAllByText(/50%/);
    expect(progressEls.length).toBeGreaterThanOrEqual(1);
  });

  it('timeline starts from July 2026', () => {
    renderWithAntd(<ScheduleView {...defaultProps} />);
    const julCells = screen.getAllByText('7月');
    expect(julCells.length).toBeGreaterThanOrEqual(1);
  });

  it('does not render topBar elements (moved to DashboardPage)', () => {
    renderWithAntd(<ScheduleView {...defaultProps} />);
    expect(screen.queryByText('邓智豪')).not.toBeInTheDocument();
    expect(screen.queryByTestId('user-avatar')).not.toBeInTheDocument();
    expect(screen.queryByTestId('progress-bar')).not.toBeInTheDocument();
    expect(screen.queryByTestId('date-display')).not.toBeInTheDocument();
    expect(screen.queryByTestId('date-prev-btn')).not.toBeInTheDocument();
    expect(screen.queryByTestId('date-next-btn')).not.toBeInTheDocument();
  });
});
