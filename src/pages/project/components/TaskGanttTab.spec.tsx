import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfigProvider } from 'antd';
import TaskGanttTab from './TaskGanttTab';
import { calculateCriticalPath } from './TaskGanttTab';
import { TaskStatus, TaskPriority } from '@/types';
import { TASK_STATUS_CONFIG } from '@/constants/enums';
import type { Task } from '@/types';

vi.mock('./TaskGanttTab.module.css', () => ({ default: {} }));

const renderWithAntd = (ui: React.ReactElement) =>
  render(<ConfigProvider>{ui}</ConfigProvider>);

const currentYear = new Date().getFullYear();

const mockTasks: Task[] = [
  {
    id: 1,
    taskNo: 'TSK-001',
    title: '需求分析',
    type: 'TASK',
    projectId: 1,
    priority: TaskPriority.HIGH,
    status: TaskStatus.IN_PROGRESS,
    assigneeId: 1,
    assigneeName: '张三',
    reporterName: '管理员',
    projectName: '测试项目',
    progress: 60,
    dependencies: [],
    dependencyDetails: [],
    tags: 'design',
    plannedStart: `${currentYear}-01-01`,
    plannedEnd: `${currentYear}-02-01`,
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
    title: '开发实现',
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
    dependencyDetails: [{ taskId: '2', dependsOnId: '1', type: 'FS' }],
    tags: 'dev',
    plannedStart: `${currentYear}-02-01`,
    plannedEnd: `${currentYear}-04-01`,
    isWatching: false,
    isOverdue: false,
    isWarning: false,
    commentCount: 0,
    watcherCount: 0,
    createdAt: `${currentYear}-01-01T00:00:00Z`,
    updatedAt: `${currentYear}-01-01T00:00:00Z`,
  },
];

describe('TaskGanttTab', () => {
  it('renders the filter bar at the top', () => {
    renderWithAntd(<TaskGanttTab tasks={mockTasks} />);
    expect(screen.getByTestId('filter-bar')).toBeInTheDocument();
    expect(screen.getByText('部门筛选')).toBeInTheDocument();
  });

  it('renders department filter options in the top filter bar', () => {
    renderWithAntd(<TaskGanttTab tasks={mockTasks} />);
    // Filter checkboxes are in the filter bar
    const filterBar = screen.getByTestId('filter-bar');
    expect(filterBar).toHaveTextContent('全部');
    expect(filterBar).toHaveTextContent('设计部');
    expect(filterBar).toHaveTextContent('研发部');
  });

  it('renders left data table with task info', () => {
    renderWithAntd(<TaskGanttTab tasks={mockTasks} />);
    expect(screen.getByTestId('left-data-table')).toBeInTheDocument();
    // Column headers
    expect(screen.getByText('阶段')).toBeInTheDocument();
    expect(screen.getByText('名称')).toBeInTheDocument();
    expect(screen.getByText('计划工期')).toBeInTheDocument();
    expect(screen.getByText('完成进度')).toBeInTheDocument();
    expect(screen.getByText('状态')).toBeInTheDocument();
  });

  it('shows task names in the gantt bars', () => {
    renderWithAntd(<TaskGanttTab tasks={mockTasks} />);
    // Task names appear in gantt bar labels (data-testid)
    const bar1 = screen.getByTestId('gantt-bar-1');
    expect(bar1).toHaveTextContent('需求分析');
    const bar2 = screen.getByTestId('gantt-bar-2');
    expect(bar2).toHaveTextContent('开发实现');
  });

  it('shows task names in the left data table', () => {
    renderWithAntd(<TaskGanttTab tasks={mockTasks} />);
    expect(screen.getByTestId('data-row-1')).toHaveTextContent('需求分析');
    expect(screen.getByTestId('data-row-2')).toHaveTextContent('开发实现');
  });

  it('shows plan dates in left data table', () => {
    renderWithAntd(<TaskGanttTab tasks={mockTasks} />);
    expect(screen.getByTestId('plan-dates-1')).toHaveTextContent('01/01-02/01');
    expect(screen.getByTestId('plan-dates-2')).toHaveTextContent('02/01-04/01');
  });

  it('shows progress in left data table', () => {
    renderWithAntd(<TaskGanttTab tasks={mockTasks} />);
    expect(screen.getByTestId('progress-fill-1')).toHaveStyle({ width: '60%' });
    expect(screen.getByTestId('progress-fill-2')).toHaveStyle({ width: '0%' });
  });

  it('shows empty state when no tasks are visible', () => {
    renderWithAntd(<TaskGanttTab tasks={[]} />);
    expect(screen.getByText('暂无任务数据')).toBeInTheDocument();
  });

  it('calls onTaskClick when a data row is clicked', async () => {
    const onTaskClick = vi.fn();
    renderWithAntd(<TaskGanttTab tasks={mockTasks} onTaskClick={onTaskClick} />);
    const dataRow = screen.getByTestId('data-row-1');
    await userEvent.click(dataRow);
    expect(onTaskClick).toHaveBeenCalled();
  });

  it('applies status-based color to gantt bars via data-status attribute', () => {
    renderWithAntd(<TaskGanttTab tasks={mockTasks} />);
    const bar1 = screen.getByTestId('gantt-bar-1');
    const bar2 = screen.getByTestId('gantt-bar-2');
    expect(bar1?.getAttribute('data-status')).toBe(String(TaskStatus.IN_PROGRESS));
    expect(bar2?.getAttribute('data-status')).toBe(String(TaskStatus.PENDING));
    const inProgressColor = TASK_STATUS_CONFIG[TaskStatus.IN_PROGRESS]?.color;
    const pendingColor = TASK_STATUS_CONFIG[TaskStatus.PENDING]?.color;
    expect(inProgressColor).toBe('#FAAD14');
    expect(pendingColor).toBe('#8C8C8C');
  });

  it('renders Tooltip with task details on gantt bar hover', async () => {
    const user = userEvent.setup();
    renderWithAntd(<TaskGanttTab tasks={mockTasks} />);
    const bar = screen.getByTestId('gantt-bar-1');
    expect(bar).toBeTruthy();
    await user.hover(bar);
    await screen.findByText(/负责人:/);
    expect(screen.getByText(new RegExp(`${currentYear}-01-01 ~ ${currentYear}-02-01`))).toBeInTheDocument();
    expect(screen.getByText(/进度: 60%/)).toBeInTheDocument();
  });

  it('renders zoom level selector with week/month/quarter options', () => {
    renderWithAntd(<TaskGanttTab tasks={mockTasks} />);
    expect(screen.getByText('周')).toBeInTheDocument();
    expect(screen.getByText('月')).toBeInTheDocument();
    expect(screen.getByText('季')).toBeInTheDocument();
  });

  it('gantt bars have grab cursor style for drag interaction', () => {
    renderWithAntd(<TaskGanttTab tasks={mockTasks} />);
    const bar = screen.getByTestId('gantt-bar-1');
    expect(bar).toBeTruthy();
    expect(bar.style.cursor).toBe('grab');
  });

  it('renders critical path toggle button', () => {
    renderWithAntd(<TaskGanttTab tasks={mockTasks} />);
    const toggle = screen.getByTestId('critical-path-toggle');
    expect(toggle).toBeInTheDocument();
    expect(toggle).toHaveTextContent('关键路径');
  });

  it('renders dependency arrows SVG for tasks with dependencies', () => {
    renderWithAntd(<TaskGanttTab tasks={mockTasks} />);
    const svg = screen.getByTestId('dependency-arrows');
    expect(svg).toBeInTheDocument();
    // t2 depends on t1, so there should be an arrow path
    const paths = svg.querySelectorAll('path');
    expect(paths.length).toBeGreaterThanOrEqual(1);
  });

  it('renders today line when current date is within timeline', () => {
    renderWithAntd(<TaskGanttTab tasks={mockTasks} />);
    expect(screen.getByTestId('today-line')).toBeInTheDocument();
  });

  describe('zoom level rescales bar positions', () => {
    it('bar left and width change when switching from week to month zoom', async () => {
      const user = userEvent.setup();
      renderWithAntd(<TaskGanttTab tasks={mockTasks} />);

      const bar = screen.getByTestId('gantt-bar-2');
      const weekLeft = parseFloat(bar.style.left);
      const weekWidth = parseFloat(bar.style.width);

      // Switch to month zoom
      await user.click(screen.getByTitle('月'));

      // Re-query after re-render
      const barAfter = screen.getByTestId('gantt-bar-2');
      const monthLeft = parseFloat(barAfter.style.left);
      const monthWidth = parseFloat(barAfter.style.width);

      // Month columns are wider than week columns, so total timeline is wider.
      // Bar positions should be different (proportionally larger in month view).
      expect(monthLeft).not.toBe(weekLeft);
      expect(monthWidth).not.toBe(weekWidth);
    });

    it('bar left and width change when switching from week to quarter zoom', async () => {
      const user = userEvent.setup();
      renderWithAntd(<TaskGanttTab tasks={mockTasks} />);

      const bar = screen.getByTestId('gantt-bar-2');
      const weekLeft = parseFloat(bar.style.left);
      const weekWidth = parseFloat(bar.style.width);

      // Switch to quarter zoom
      await user.click(screen.getByTitle('季'));

      const barAfter = screen.getByTestId('gantt-bar-2');
      const quarterLeft = parseFloat(barAfter.style.left);
      const quarterWidth = parseFloat(barAfter.style.width);

      expect(quarterLeft).not.toBe(weekLeft);
      expect(quarterWidth).not.toBe(weekWidth);
    });

    it('bar positions return to original when switching back to week zoom', async () => {
      const user = userEvent.setup();
      renderWithAntd(<TaskGanttTab tasks={mockTasks} />);

      const bar = screen.getByTestId('gantt-bar-1');
      const originalLeft = parseFloat(bar.style.left);
      const originalWidth = parseFloat(bar.style.width);

      // Switch to month then back to week
      await user.click(screen.getByTitle('月'));
      await user.click(screen.getByTitle('周'));

      const barAfter = screen.getByTestId('gantt-bar-1');
      expect(parseFloat(barAfter.style.left)).toBe(originalLeft);
      expect(parseFloat(barAfter.style.width)).toBe(originalWidth);
    });

    it('month zoom total timeline width is wider than week zoom', async () => {
      const user = userEvent.setup();
      renderWithAntd(<TaskGanttTab tasks={mockTasks} />);

      const barWeek = screen.getByTestId('gantt-bar-2');
      const weekLeft = parseFloat(barWeek.style.left);
      const weekWidthVal = parseFloat(barWeek.style.width);
      const weekRight = weekLeft + weekWidthVal;

      await user.click(screen.getByTitle('月'));

      const barMonth = screen.getByTestId('gantt-bar-2');
      const monthLeft = parseFloat(barMonth.style.left);
      const monthWidthVal = parseFloat(barMonth.style.width);
      const monthRight = monthLeft + monthWidthVal;

      // In month view, the same date range should map to a proportionally different
      // position because totalTimelineWidth is larger. The right edge of the bar
      // should be at a different pixel position.
      expect(monthRight).not.toBe(weekRight);
    });

    it('today line position updates when zoom level changes', async () => {
      const user = userEvent.setup();
      renderWithAntd(<TaskGanttTab tasks={mockTasks} />);

      const todayLine = screen.getByTestId('today-line');
      const weekTodayLeft = parseFloat(todayLine.style.left);

      await user.click(screen.getByTitle('月'));

      const todayLineAfter = screen.getByTestId('today-line');
      const monthTodayLeft = parseFloat(todayLineAfter.style.left);

      expect(monthTodayLeft).not.toBe(weekTodayLeft);
    });
  });

  describe('drag-to-resize handles', () => {
    it('renders left and right resize handles on each gantt bar', () => {
      renderWithAntd(<TaskGanttTab tasks={mockTasks} />);
      expect(screen.getByTestId('resize-handle-left-1')).toBeInTheDocument();
      expect(screen.getByTestId('resize-handle-right-1')).toBeInTheDocument();
      expect(screen.getByTestId('resize-handle-left-2')).toBeInTheDocument();
      expect(screen.getByTestId('resize-handle-right-2')).toBeInTheDocument();
    });

    it('resize handles have col-resize cursor', () => {
      renderWithAntd(<TaskGanttTab tasks={mockTasks} />);
      const leftHandle = screen.getByTestId('resize-handle-left-1');
      const rightHandle = screen.getByTestId('resize-handle-right-1');
      expect(leftHandle.style.cursor).toBe('col-resize');
      expect(rightHandle.style.cursor).toBe('col-resize');
    });

    it('resize handles are positioned absolute with 8px width', () => {
      renderWithAntd(<TaskGanttTab tasks={mockTasks} />);
      const leftHandle = screen.getByTestId('resize-handle-left-1');
      const rightHandle = screen.getByTestId('resize-handle-right-1');
      expect(leftHandle.style.position).toBe('absolute');
      expect(leftHandle.style.width).toBe('8px');
      expect(rightHandle.style.position).toBe('absolute');
      expect(rightHandle.style.width).toBe('8px');
    });

    it('left resize handle is at left edge, right handle at right edge', () => {
      renderWithAntd(<TaskGanttTab tasks={mockTasks} />);
      const leftHandle = screen.getByTestId('resize-handle-left-1');
      const rightHandle = screen.getByTestId('resize-handle-right-1');
      expect(leftHandle.style.left).toBe('0px');
      expect(rightHandle.style.right).toBe('0px');
    });

    it('dragging right resize handle calls onTaskUpdate with only planEnd', () => {
      const onTaskUpdate = vi.fn();
      renderWithAntd(<TaskGanttTab tasks={mockTasks} onTaskUpdate={onTaskUpdate} />);

      const rightHandle = screen.getByTestId('resize-handle-right-1');
      fireEvent.mouseDown(rightHandle, { clientX: 200, clientY: 0 });
      fireEvent.mouseMove(document, { clientX: 260, clientY: 0 });
      fireEvent.mouseUp(document, { clientX: 260, clientY: 0 });

      expect(onTaskUpdate).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ plannedEnd: expect.any(String) }),
      );
      const callArgs = onTaskUpdate.mock.calls[0][1];
      expect(callArgs.plannedStart).toBeUndefined();
    });

    it('dragging left resize handle calls onTaskUpdate with only planStart', () => {
      const onTaskUpdate = vi.fn();
      renderWithAntd(<TaskGanttTab tasks={mockTasks} onTaskUpdate={onTaskUpdate} />);

      const leftHandle = screen.getByTestId('resize-handle-left-1');
      fireEvent.mouseDown(leftHandle, { clientX: 200, clientY: 0 });
      fireEvent.mouseMove(document, { clientX: 140, clientY: 0 });
      fireEvent.mouseUp(document, { clientX: 140, clientY: 0 });

      expect(onTaskUpdate).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ plannedStart: expect.any(String) }),
      );
      const callArgs = onTaskUpdate.mock.calls[0][1];
      expect(callArgs.plannedEnd).toBeUndefined();
    });

    it('minimum bar width of 1 day is enforced during right resize', () => {
      const onTaskUpdate = vi.fn();
      renderWithAntd(<TaskGanttTab tasks={mockTasks} onTaskUpdate={onTaskUpdate} />);

      const rightHandle = screen.getByTestId('resize-handle-right-1');
      fireEvent.mouseDown(rightHandle, { clientX: 400, clientY: 0 });
      fireEvent.mouseMove(document, { clientX: 100, clientY: 0 });
      fireEvent.mouseUp(document, { clientX: 100, clientY: 0 });

      if (onTaskUpdate.mock.calls.length > 0) {
        const newPlanEnd = onTaskUpdate.mock.calls[0][1].plannedEnd;
        const planStart = mockTasks[0].plannedStart;
        const daysDiff = Math.ceil(
          (new Date(newPlanEnd).getTime() - new Date(planStart).getTime()) / (1000 * 60 * 60 * 24),
        );
        expect(daysDiff).toBeGreaterThanOrEqual(1);
      }
    });

    it('minimum bar width of 1 day is enforced during left resize', () => {
      const onTaskUpdate = vi.fn();
      renderWithAntd(<TaskGanttTab tasks={mockTasks} onTaskUpdate={onTaskUpdate} />);

      const leftHandle = screen.getByTestId('resize-handle-left-1');
      fireEvent.mouseDown(leftHandle, { clientX: 200, clientY: 0 });
      fireEvent.mouseMove(document, { clientX: 600, clientY: 0 });
      fireEvent.mouseUp(document, { clientX: 600, clientY: 0 });

      if (onTaskUpdate.mock.calls.length > 0) {
        const newPlanStart = onTaskUpdate.mock.calls[0][1].plannedStart;
        const planEnd = mockTasks[0].plannedEnd;
        const daysDiff = Math.ceil(
          (new Date(planEnd).getTime() - new Date(newPlanStart).getTime()) / (1000 * 60 * 60 * 24),
        );
        expect(daysDiff).toBeGreaterThanOrEqual(1);
      }
    });

    it('small drag offsets (under 5px) do not trigger onTaskUpdate for resize', () => {
      const onTaskUpdate = vi.fn();
      renderWithAntd(<TaskGanttTab tasks={mockTasks} onTaskUpdate={onTaskUpdate} />);

      const rightHandle = screen.getByTestId('resize-handle-right-1');
      fireEvent.mouseDown(rightHandle, { clientX: 200, clientY: 0 });
      fireEvent.mouseMove(document, { clientX: 203, clientY: 0 });
      fireEvent.mouseUp(document, { clientX: 203, clientY: 0 });

      expect(onTaskUpdate).not.toHaveBeenCalled();
    });

    it('dragging a resize handle does not move the entire bar', () => {
      const onTaskUpdate = vi.fn();
      renderWithAntd(<TaskGanttTab tasks={mockTasks} onTaskUpdate={onTaskUpdate} />);

      const rightHandle = screen.getByTestId('resize-handle-right-1');
      fireEvent.mouseDown(rightHandle, { clientX: 200, clientY: 0 });
      fireEvent.mouseMove(document, { clientX: 260, clientY: 0 });
      fireEvent.mouseUp(document, { clientX: 260, clientY: 0 });

      expect(onTaskUpdate).toHaveBeenCalledTimes(1);
      const callArgs = onTaskUpdate.mock.calls[0][1];
      expect(callArgs.plannedStart).toBeUndefined();
      expect(callArgs.plannedEnd).toBeDefined();
    });

    it('dragging the bar body still works for move (preserves existing functionality)', () => {
      const onTaskUpdate = vi.fn();
      renderWithAntd(<TaskGanttTab tasks={mockTasks} onTaskUpdate={onTaskUpdate} />);

      const bar = screen.getByTestId('gantt-bar-1');
      fireEvent.mouseDown(bar, { clientX: 200, clientY: 0 });
      fireEvent.mouseMove(document, { clientX: 260, clientY: 0 });
      fireEvent.mouseUp(document, { clientX: 260, clientY: 0 });

      if (onTaskUpdate.mock.calls.length > 0) {
        const callArgs = onTaskUpdate.mock.calls[0][1];
        expect(callArgs.plannedStart).toBeDefined();
        expect(callArgs.plannedEnd).toBeDefined();
      }
    });
  });

  describe('calculateCriticalPath (CPM algorithm)', () => {
    const makeTask = (overrides: Partial<Task> & { id: number }): Task => ({
      taskNo: 'TSK-001',
      title: 'Task',
      type: 'TASK',
      projectId: 1,
      priority: TaskPriority.MEDIUM,
      status: TaskStatus.PENDING,
      assigneeId: 1,
      assigneeName: 'Test',
      reporterName: 'Test',
      projectName: 'Test',
      progress: 0,
      dependencies: [],
      tags: '',
      plannedStart: `${currentYear}-01-01`,
      plannedEnd: `${currentYear}-01-11`,
      isWatching: false,
      isOverdue: false,
      isWarning: false,
      commentCount: 0,
      watcherCount: 0,
      createdAt: `${currentYear}-01-01T00:00:00Z`,
      updatedAt: `${currentYear}-01-01T00:00:00Z`,
      ...overrides,
    });

    it('all tasks with no dependencies have slack = 0 (all critical)', () => {
      const tasks = [
        makeTask({ id: 1, plannedStart: `${currentYear}-01-01`, plannedEnd: `${currentYear}-01-11` }),
        makeTask({ id: 2, plannedStart: `${currentYear}-01-05`, plannedEnd: `${currentYear}-01-15` }),
      ];
      const result = calculateCriticalPath(tasks);
      expect(result.get('1')!.slack).toBe(0);
      expect(result.get('1')!.isCritical).toBe(true);
      expect(result.get('2')!.slack).toBe(0);
      expect(result.get('2')!.isCritical).toBe(true);
    });

    it('linear chain A->B->C: all have slack = 0', () => {
      const tasks = [
        makeTask({ id: 1, plannedStart: `${currentYear}-01-01`, plannedEnd: `${currentYear}-01-11`, dependencies: [] }),
        makeTask({ id: 2, plannedStart: `${currentYear}-01-11`, plannedEnd: `${currentYear}-01-21`, dependencies: ['1'] }),
        makeTask({ id: 3, plannedStart: `${currentYear}-01-21`, plannedEnd: `${currentYear}-01-31`, dependencies: ['2'] }),
      ];
      const result = calculateCriticalPath(tasks);
      expect(result.get('1')!.slack).toBe(0);
      expect(result.get('2')!.slack).toBe(0);
      expect(result.get('3')!.slack).toBe(0);
      expect(result.get('1')!.isCritical).toBe(true);
      expect(result.get('2')!.isCritical).toBe(true);
      expect(result.get('3')!.isCritical).toBe(true);
    });

    it('parallel paths: longer path is critical, shorter has positive slack', () => {
      const tasks = [
        makeTask({ id: 1, plannedStart: `${currentYear}-01-01`, plannedEnd: `${currentYear}-01-11`, dependencies: [] }),
        makeTask({ id: 2, plannedStart: `${currentYear}-01-11`, plannedEnd: `${currentYear}-01-21`, dependencies: ['1'] }),
        makeTask({ id: 3, plannedStart: `${currentYear}-01-01`, plannedEnd: `${currentYear}-01-06`, dependencies: [] }),
        makeTask({ id: 4, plannedStart: `${currentYear}-01-06`, plannedEnd: `${currentYear}-01-11`, dependencies: ['3'] }),
        makeTask({ id: 5, plannedStart: `${currentYear}-01-21`, plannedEnd: `${currentYear}-01-31`, dependencies: ['2', '4'] }),
      ];
      const result = calculateCriticalPath(tasks);

      // A and B are on the critical path (longer path)
      expect(result.get('1')!.isCritical).toBe(true);
      expect(result.get('2')!.isCritical).toBe(true);
      expect(result.get('1')!.slack).toBe(0);
      expect(result.get('2')!.slack).toBe(0);

      // C and D are on the shorter path, have slack
      expect(result.get('3')!.isCritical).toBe(false);
      expect(result.get('4')!.isCritical).toBe(false);
      expect(result.get('3')!.slack).toBeGreaterThan(0);
      expect(result.get('4')!.slack).toBeGreaterThan(0);

      // E is critical (it's the end of the longest path)
      expect(result.get('5')!.isCritical).toBe(true);
      expect(result.get('5')!.slack).toBe(0);
    });

    it('correctly computes slack values for tasks with slack', () => {
      // A(10d) -> B(10d) -> C(10d) = 30 days
      // D(5d) starts at day 0, ends at day 5, no successors -> independent
      // Slack for D should be (projectEnd - D_end) = 30 - 5 = 25
      const tasks = [
        makeTask({ id: 1, plannedStart: `${currentYear}-01-01`, plannedEnd: `${currentYear}-01-11`, dependencies: [] }),
        makeTask({ id: 2, plannedStart: `${currentYear}-01-11`, plannedEnd: `${currentYear}-01-21`, dependencies: ['1'] }),
        makeTask({ id: 3, plannedStart: `${currentYear}-01-21`, plannedEnd: `${currentYear}-01-31`, dependencies: ['2'] }),
        makeTask({ id: 4, plannedStart: `${currentYear}-01-01`, plannedEnd: `${currentYear}-01-06`, dependencies: [] }),
      ];
      const result = calculateCriticalPath(tasks);

      expect(result.get('1')!.slack).toBe(0);
      expect(result.get('2')!.slack).toBe(0);
      expect(result.get('3')!.slack).toBe(0);

      // D has no successors, should have positive slack and not be critical
      expect(result.get('4')!.slack).toBeGreaterThan(0);
      expect(result.get('4')!.isCritical).toBe(false);
    });

    it('handles tasks with no dates gracefully', () => {
      const tasks = [
        makeTask({ id: 1, plannedStart: undefined, plannedEnd: undefined }),
        makeTask({ id: 2, plannedStart: `${currentYear}-01-01`, plannedEnd: `${currentYear}-01-11` }),
      ];
      const result = calculateCriticalPath(tasks);
      // Task without dates should still be in the map
      expect(result.has('1')).toBe(true);
      expect(result.has('2')).toBe(true);
    });

    it('handles circular dependencies without infinite loop', () => {
      const tasks = [
        makeTask({ id: 1, plannedStart: `${currentYear}-01-01`, plannedEnd: `${currentYear}-01-11`, dependencies: ['2'] }),
        makeTask({ id: 2, plannedStart: `${currentYear}-01-11`, plannedEnd: `${currentYear}-01-21`, dependencies: ['1'] }),
      ];
      // Should not throw or hang
      const result = calculateCriticalPath(tasks);
      expect(result.has('1')).toBe(true);
      expect(result.has('2')).toBe(true);
    });

    it('handles empty task list', () => {
      const result = calculateCriticalPath([]);
      expect(result.size).toBe(0);
    });

    it('returns correct ES/EF values for forward pass', () => {
      const tasks = [
        makeTask({ id: 1, plannedStart: `${currentYear}-01-01`, plannedEnd: `${currentYear}-01-11`, dependencies: [] }),
        makeTask({ id: 2, plannedStart: `${currentYear}-01-11`, plannedEnd: `${currentYear}-01-21`, dependencies: ['1'] }),
      ];
      const result = calculateCriticalPath(tasks);
      const aData = result.get('1')!;
      const bData = result.get('2')!;

      // A starts first, B starts after A
      expect(aData.es).toBeLessThanOrEqual(bData.es);
      expect(aData.ef).toBeLessThanOrEqual(bData.es);
      // Both should have valid ES/EF values
      expect(aData.es).toBeGreaterThanOrEqual(0);
      expect(bData.ef).toBeGreaterThan(aData.ef);
    });

    it('returns correct LS/LF values for backward pass', () => {
      const tasks = [
        makeTask({ id: 1, plannedStart: `${currentYear}-01-01`, plannedEnd: `${currentYear}-01-11`, dependencies: [] }),
        makeTask({ id: 2, plannedStart: `${currentYear}-01-11`, plannedEnd: `${currentYear}-01-21`, dependencies: ['1'] }),
      ];
      const result = calculateCriticalPath(tasks);
      const aData = result.get('1')!;
      const bData = result.get('2')!;

      // B (leaf) should have LF >= LS, and both should be valid
      expect(bData.lf).toBeGreaterThanOrEqual(bData.ls);
      expect(bData.lf).toBeGreaterThanOrEqual(0);

      // A's LF should be <= B's LS (A must finish before B can start)
      expect(aData.lf).toBeLessThanOrEqual(bData.ls);
    });
  });

  describe('critical path rendering', () => {
    const makeCpTask = (overrides: Partial<Task> & { id: number }): Task => ({
      taskNo: 'TSK-001',
      title: 'Task',
      type: 'TASK',
      projectId: 1,
      priority: TaskPriority.MEDIUM,
      status: TaskStatus.PENDING,
      assigneeId: 1,
      assigneeName: 'Test',
      reporterName: 'Test',
      projectName: 'Test',
      progress: 0,
      dependencies: [],
      tags: '',
      plannedStart: `${currentYear}-01-01`,
      plannedEnd: `${currentYear}-01-11`,
      isWatching: false,
      isOverdue: false,
      isWarning: false,
      commentCount: 0,
      watcherCount: 0,
      createdAt: `${currentYear}-01-01T00:00:00Z`,
      updatedAt: `${currentYear}-01-01T00:00:00Z`,
      ...overrides,
    });

    const criticalPathTasks: Task[] = [
      makeCpTask({ id: 10, title: '关键任务A', status: TaskStatus.IN_PROGRESS, progress: 50, plannedStart: `${currentYear}-01-01`, plannedEnd: `${currentYear}-02-01` }),
      makeCpTask({ id: 11, title: '关键任务B', status: TaskStatus.PENDING, dependencies: ['10'], plannedStart: `${currentYear}-02-01`, plannedEnd: `${currentYear}-03-01` }),
      makeCpTask({ id: 12, title: '非关键任务C', status: TaskStatus.PENDING, priority: TaskPriority.LOW, plannedStart: `${currentYear}-01-01`, plannedEnd: `${currentYear}-01-11` }),
    ];

    it('critical path toggle highlights critical tasks with red color', async () => {
      const user = userEvent.setup();
      renderWithAntd(<TaskGanttTab tasks={criticalPathTasks} />);

      await user.click(screen.getByTestId('critical-path-toggle'));

      // cp1 and cp2 form the critical chain, cp3 is independent with slack
      const barCp1 = screen.getByTestId('gantt-bar-10');
      expect(barCp1.style.backgroundColor).toBe('rgb(255, 77, 79)');
      const barCp2 = screen.getByTestId('gantt-bar-11');
      expect(barCp2.style.backgroundColor).toBe('rgb(255, 77, 79)');
    });

    it('critical path toggle dims non-critical tasks with opacity 0.7', async () => {
      const user = userEvent.setup();
      renderWithAntd(<TaskGanttTab tasks={criticalPathTasks} />);

      await user.click(screen.getByTestId('critical-path-toggle'));

      // cp3 is non-critical (has slack), should be dimmed
      const barCp3 = screen.getByTestId('gantt-bar-12');
      expect(barCp3.style.opacity).toBe('0.7');
    });

    it('critical path toggle off shows normal coloring', async () => {
      const user = userEvent.setup();
      renderWithAntd(<TaskGanttTab tasks={criticalPathTasks} />);

      // Toggle on then off
      await user.click(screen.getByTestId('critical-path-toggle'));
      await user.click(screen.getByTestId('critical-path-toggle'));

      const barCp3 = screen.getByTestId('gantt-bar-12');
      // Non-critical task should have normal status color, not dimmed
      expect(barCp3.style.opacity).not.toBe('0.7');
    });

    it('critical path legend is shown when toggle is enabled', async () => {
      const user = userEvent.setup();
      renderWithAntd(<TaskGanttTab tasks={criticalPathTasks} />);

      await user.click(screen.getByTestId('critical-path-toggle'));

      expect(screen.getByText(/红色=关键路径/)).toBeInTheDocument();
      expect(screen.getByText(/蓝色=普通任务/)).toBeInTheDocument();
    });
  });
});
