import { render, screen, fireEvent } from '@testing-library/react';
import ScheduleTab from './ScheduleTab';
import { TaskStatus, TaskPriority } from '@/types';

vi.mock('./ScheduleTab.module.css', () => ({
  default: new Proxy({}, {
    get: (_target, prop: string) => prop,
  }),
}));
const currentYear = new Date().getFullYear();

const mockTasks: Task[] = [
  {
    id: 1,
    taskNo: 'TSK-001',
    title: '需求评审',
    type: 'TASK',
    projectId: 1,
    priority: TaskPriority.HIGH,
    status: TaskStatus.IN_PROGRESS,
    assigneeId: 1,
    assigneeName: '张三',
    reporterName: '管理员',
    projectName: '测试项目',
    progress: 40,
    dependencies: [],
    tags: '研发部',
    plannedStart: `${currentYear}-02-01`,
    plannedEnd: `${currentYear}-05-20`,
    actualStart: `${currentYear}-02-10`,
    isWatching: false,
    isOverdue: false,
    isWarning: false,
    commentCount: 0,
    watcherCount: 0,
    createdAt: `${currentYear}-01-01T00:00:00Z`,
    updatedAt: `${currentYear}-01-15T00:00:00Z`,
  },
  {
    id: 2,
    taskNo: 'TSK-002',
    title: '系统测试',
    type: 'TASK',
    projectId: 1,
    priority: TaskPriority.MEDIUM,
    status: TaskStatus.PENDING,
    assigneeId: 2,
    assigneeName: '李四',
    reporterName: '管理员',
    projectName: '测试项目',
    progress: 0,
    dependencies: ['1'],
    tags: '测试部',
    plannedStart: `${currentYear}-04-01`,
    plannedEnd: `${currentYear}-06-15`,
    isWatching: false,
    isOverdue: false,
    isWarning: false,
    commentCount: 0,
    watcherCount: 0,
    createdAt: `${currentYear}-01-01T00:00:00Z`,
    updatedAt: `${currentYear}-01-01T00:00:00Z`,
  },
  {
    id: 3,
    taskNo: 'TSK-003',
    title: '代码审查',
    type: 'TASK',
    projectId: 1,
    priority: TaskPriority.LOW,
    status: TaskStatus.COMPLETED,
    assigneeId: 1,
    assigneeName: '张三',
    reporterName: '管理员',
    projectName: '测试项目',
    progress: 100,
    dependencies: [],
    tags: '研发部',
    plannedStart: `${currentYear}-03-01`,
    plannedEnd: `${currentYear}-04-30`,
    isWatching: false,
    isOverdue: false,
    isWarning: false,
    commentCount: 0,
    watcherCount: 0,
    createdAt: `${currentYear}-01-01T00:00:00Z`,
    updatedAt: `${currentYear}-04-30T00:00:00Z`,
  },
];

describe('ScheduleTab', () => {
  it('renders left column headers including new columns', () => {
    render(<ScheduleTab tasks={mockTasks} />);
    expect(screen.getByText('阶段')).toBeInTheDocument();
    expect(screen.getByText('序号')).toBeInTheDocument();
    expect(screen.getByText('代号')).toBeInTheDocument();
    expect(screen.getByText('名称')).toBeInTheDocument();
    expect(screen.getByText('交付物')).toBeInTheDocument();
    expect(screen.getByText('负责人')).toBeInTheDocument();
    expect(screen.getByText('部门')).toBeInTheDocument();
    expect(screen.getByText('计划工期')).toBeInTheDocument();
    expect(screen.getByText('完成进度')).toBeInTheDocument();
    expect(screen.getByText('操作')).toBeInTheDocument();
  });

  it('renders top filter bar with phase checkboxes and progress', () => {
    render(<ScheduleTab tasks={mockTasks} />);
    expect(screen.getByTestId('top-bar')).toBeInTheDocument();
    expect(screen.getByText('阶段：')).toBeInTheDocument();
    expect(screen.getByTestId('overall-progress')).toBeInTheDocument();
  });

  it('renders phase group rows (P1/P2)', () => {
    render(<ScheduleTab tasks={mockTasks} />);
    // P1 group (研发部 -> P1)
    const groupToggle = screen.getByTestId('group-toggle-P1');
    expect(groupToggle).toBeInTheDocument();
    expect(groupToggle).toHaveTextContent('P1');

    // P2 group (测试部 -> P2)
    const groupToggle2 = screen.getByTestId('group-toggle-P2');
    expect(groupToggle2).toBeInTheDocument();
    expect(groupToggle2).toHaveTextContent('P2');
  });

  it('renders task data in rows', () => {
    render(<ScheduleTab tasks={mockTasks} />);
    expect(screen.getByText('需求评审')).toBeInTheDocument();
    expect(screen.getByText('系统测试')).toBeInTheDocument();
    expect(screen.getByText('代码审查')).toBeInTheDocument();
  });

  it('renders phase badges on task rows', () => {
    render(<ScheduleTab tasks={mockTasks} />);
    expect(screen.getByTestId('phase-1')).toHaveTextContent('P1');
    expect(screen.getByTestId('phase-2')).toHaveTextContent('P2');
    expect(screen.getByTestId('phase-3')).toHaveTextContent('P1');
  });

  it('renders deliverable count badges', () => {
    render(<ScheduleTab tasks={mockTasks} />);
    // t1 has 0 dependencies -> 1 deliverable
    expect(screen.getByTestId('deliverable-1')).toHaveTextContent('1');
    // t2 has 1 dependency -> 1 deliverable
    expect(screen.getByTestId('deliverable-2')).toHaveTextContent('1');
    // t3 has 0 dependencies -> 1 deliverable
    expect(screen.getByTestId('deliverable-3')).toHaveTextContent('1');
  });

  it('renders gantt bars with correct status colors', () => {
    render(<ScheduleTab tasks={mockTasks} />);
    fireEvent.click(screen.getByText('时间轴'));
    expect(screen.getByTestId('gantt-bar-1')).toHaveStyle({ backgroundColor: '#1890FF' });
    expect(screen.getByTestId('gantt-bar-2')).toHaveStyle({ backgroundColor: '#FAAD14' });
    expect(screen.getByTestId('gantt-bar-3')).toHaveStyle({ backgroundColor: '#52C41A' });
  });

  it('shows progress percentage', () => {
    render(<ScheduleTab tasks={mockTasks} />);
    expect(screen.getByText('40%')).toBeInTheDocument();
    expect(screen.getAllByText('0%').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('shows progress fill bar with correct width', () => {
    render(<ScheduleTab tasks={mockTasks} />);
    expect(screen.getByTestId('progress-fill-1')).toHaveStyle({ width: '40%' });
    expect(screen.getByTestId('progress-fill-2')).toHaveStyle({ width: '0%' });
    expect(screen.getByTestId('progress-fill-3')).toHaveStyle({ width: '100%' });
  });

  it('collapse/expand phase groups', () => {
    render(<ScheduleTab tasks={mockTasks} />);
    const toggleBtn = screen.getByTestId('group-toggle-P1');
    expect(toggleBtn).toBeInTheDocument();

    // Initially expanded: P1 tasks visible
    expect(screen.getByText('需求评审')).toBeInTheDocument();
    expect(screen.getByText('代码审查')).toBeInTheDocument();

    // Click to collapse P1
    fireEvent.click(toggleBtn);

    // After collapse, P1 tasks not visible
    expect(screen.queryByText('需求评审')).not.toBeInTheDocument();
    expect(screen.queryByText('代码审查')).not.toBeInTheDocument();

    // P2 task should still be visible
    expect(screen.getByText('系统测试')).toBeInTheDocument();

    // Click again to expand
    fireEvent.click(toggleBtn);
    expect(screen.getByText('需求评审')).toBeInTheDocument();
    expect(screen.getByText('代码审查')).toBeInTheDocument();
  });

  it('filters by department when departmentFilter is set', () => {
    render(<ScheduleTab tasks={mockTasks} departmentFilter="研发部" />);
    expect(screen.getByText('需求评审')).toBeInTheDocument();
    expect(screen.getByText('代码审查')).toBeInTheDocument();
    expect(screen.queryByText('系统测试')).not.toBeInTheDocument();
  });

  it('shows plan duration as date range format (MM/DD-MM/DD)', () => {
    render(<ScheduleTab tasks={mockTasks} />);
    expect(screen.getByTestId('plan-duration-1')).toHaveTextContent('02/01-05/20');
    expect(screen.getByTestId('plan-duration-2')).toHaveTextContent('04/01-06/15');
    expect(screen.getByTestId('plan-duration-3')).toHaveTextContent('03/01-04/30');
  });

  it('renders department from tags[0] or shows "未分配"', () => {
    const tasksNoDept = [{ ...mockTasks[0], id: 4, tags: "" }];
    render(<ScheduleTab tasks={tasksNoDept} />);
    const elements = screen.getAllByText('未分配');
    expect(elements.length).toBeGreaterThanOrEqual(1);
  });

  it('renders task ID prefix as 代号', () => {
    render(<ScheduleTab tasks={mockTasks} />);
    expect(screen.getByTestId('task-code-1')).toHaveTextContent('TSK-00');
    expect(screen.getByTestId('task-code-2')).toHaveTextContent('TSK-00');
    expect(screen.getByTestId('task-code-3')).toHaveTextContent('TSK-00');
  });

  it('renders gantt bars with progress fill', () => {
    render(<ScheduleTab tasks={mockTasks} />);
    fireEvent.click(screen.getByText('时间轴'));
    const bar1 = screen.getByTestId('gantt-bar-1');
    const progressInBar = bar1.querySelector('[data-testid="gantt-progress-1"]');
    expect(progressInBar).toBeTruthy();
    expect(progressInBar).toHaveStyle({ width: '40%' });
  });

  it('renders time axis month headers for current year', () => {
    render(<ScheduleTab tasks={mockTasks} />);
    fireEvent.click(screen.getByText('时间轴'));
    expect(screen.getByText(`${currentYear}年1月`)).toBeInTheDocument();
    expect(screen.getByText(`${currentYear}年6月`)).toBeInTheDocument();
    expect(screen.getByText(`${currentYear}年12月`)).toBeInTheDocument();
  });

  it('renders week sub-headers in MM/DD format', () => {
    render(<ScheduleTab tasks={mockTasks} />);
    fireEvent.click(screen.getByText('时间轴'));
    const weekHeaders = screen.getAllByTestId(/^week-header-/);
    expect(weekHeaders.length).toBeGreaterThan(0);
    const firstWeekText = weekHeaders[0].textContent;
    expect(firstWeekText).toMatch(/^\d{2}\/\d{2}$/);
  });

  it('calls onTaskClick when a task row is clicked', () => {
    const onTaskClick = vi.fn();
    render(<ScheduleTab tasks={mockTasks} onTaskClick={onTaskClick} />);
    const taskRow = screen.getByTestId('task-row-1');
    fireEvent.click(taskRow);
    expect(onTaskClick).toHaveBeenCalledWith(mockTasks[0]);
  });

  it('renders more button on each row', () => {
    render(<ScheduleTab tasks={mockTasks} />);
    expect(screen.getByTestId('more-btn-1')).toBeInTheDocument();
    expect(screen.getByTestId('more-btn-2')).toBeInTheDocument();
    expect(screen.getByTestId('more-btn-3')).toBeInTheDocument();
  });

  it('hides pagination bar when items fit in one page', () => {
    render(<ScheduleTab tasks={mockTasks} />);
    expect(screen.queryByTestId('pagination')).not.toBeInTheDocument();
  });

  it('renders row numbers', () => {
    render(<ScheduleTab tasks={mockTasks} />);
    // Row numbers within their phase groups
    expect(screen.getByTestId('row-num-1')).toBeInTheDocument();
    expect(screen.getByTestId('row-num-2')).toBeInTheDocument();
    expect(screen.getByTestId('row-num-3')).toBeInTheDocument();
  });

  // --- Inline date editing tests ---

  it('enters edit mode when clicking a plan duration cell', () => {
    render(<ScheduleTab tasks={mockTasks} onSave={vi.fn()} />);
    const durationCell = screen.getByTestId('plan-duration-1');
    fireEvent.click(durationCell);
    // Should show two date inputs (start and end)
    expect(screen.getByTestId('edit-start-1')).toBeInTheDocument();
    expect(screen.getByTestId('edit-end-1')).toBeInTheDocument();
    expect(screen.getByTestId('edit-confirm-1')).toBeInTheDocument();
    expect(screen.getByTestId('edit-cancel-1')).toBeInTheDocument();
  });

  it('calls onSave with correct dates when clicking confirm', () => {
    const onSave = vi.fn();
    render(<ScheduleTab tasks={mockTasks} onSave={onSave} />);
    fireEvent.click(screen.getByTestId('plan-duration-1'));

    const startInput = screen.getByTestId('edit-start-1') as HTMLInputElement;
    const endInput = screen.getByTestId('edit-end-1') as HTMLInputElement;

    // Change the date values
    fireEvent.change(startInput, { target: { value: `${currentYear}-03-01` } });
    fireEvent.change(endInput, { target: { value: `${currentYear}-06-30` } });

    fireEvent.click(screen.getByTestId('edit-confirm-1'));

    expect(onSave).toHaveBeenCalledWith(1, {
      plannedStart: `${currentYear}-03-01`,
      plannedEnd: `${currentYear}-06-30`,
    });
  });

  it('exits edit mode after confirming without calling onSave when no callback provided', () => {
    render(<ScheduleTab tasks={mockTasks} />);
    fireEvent.click(screen.getByTestId('plan-duration-1'));
    expect(screen.getByTestId('edit-start-1')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('edit-confirm-1'));
    // Should exit edit mode - no edit inputs visible
    expect(screen.queryByTestId('edit-start-1')).not.toBeInTheDocument();
  });

  it('exits edit mode when clicking cancel without calling onSave', () => {
    const onSave = vi.fn();
    render(<ScheduleTab tasks={mockTasks} onSave={onSave} />);
    fireEvent.click(screen.getByTestId('plan-duration-1'));

    fireEvent.click(screen.getByTestId('edit-cancel-1'));

    expect(screen.queryByTestId('edit-start-1')).not.toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
  });

  it('exits edit mode when pressing Escape key', () => {
    const onSave = vi.fn();
    render(<ScheduleTab tasks={mockTasks} onSave={onSave} />);
    fireEvent.click(screen.getByTestId('plan-duration-1'));
    expect(screen.getByTestId('edit-start-1')).toBeInTheDocument();

    fireEvent.keyDown(screen.getByTestId('edit-start-1'), { key: 'Escape' });

    expect(screen.queryByTestId('edit-start-1')).not.toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
  });

  it('only allows one row to be editable at a time', () => {
    render(<ScheduleTab tasks={mockTasks} onSave={vi.fn()} />);
    fireEvent.click(screen.getByTestId('plan-duration-1'));
    expect(screen.getByTestId('edit-start-1')).toBeInTheDocument();

    // Click on another row's duration cell
    fireEvent.click(screen.getByTestId('plan-duration-2'));
    expect(screen.queryByTestId('edit-start-1')).not.toBeInTheDocument();
    expect(screen.getByTestId('edit-start-2')).toBeInTheDocument();
  });

  it('adds a visual indicator (editing class) on the row being edited', () => {
    render(<ScheduleTab tasks={mockTasks} onSave={vi.fn()} />);
    fireEvent.click(screen.getByTestId('plan-duration-1'));
    const editingRow = screen.getByTestId('task-row-1');
    expect(editingRow.className).toContain('editing');
  });
});
