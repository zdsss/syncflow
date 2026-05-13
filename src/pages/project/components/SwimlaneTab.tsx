import { useMemo, useRef, useCallback, useEffect } from 'react';
import { Avatar, Badge, Button, message } from 'antd';
import dayjs from 'dayjs';
import minMax from 'dayjs/plugin/minMax';
import type { Task, Project } from '@/types';
import { TaskStatus } from '@/types';
import { startMilestone, completeMilestone } from '@/services/project.service';
import styles from './SwimlaneTab.module.css';

dayjs.extend(minMax);

interface SwimlaneTabProps {
  tasks: Task[];
  projects: Project[];
  onTaskClick?: (task: Task) => void;
  onTaskMove?: (taskId: string, newPhase: string) => void;
  onTaskUpdate?: (taskId: string, data: Partial<Task>) => Promise<void>;
  onRefresh?: () => void;
}

// Department name to color mapping
const DEPT_COLORS: Record<string, string> = {
  '公司管理层': '#2F54EB',
  '设计部': '#3366FF',
  '产品部': '#52C41A',
  '研发部': '#722ED1',
  '测试部': '#13C2C2',
  '品质部': '#EB2F96',
  '工程部': '#FAAD14',
};

const STATUS_COLORS: Record<number, string> = {
  [TaskStatus.COMPLETED]: '#FAAD14',      // yellow as per requirement
  [TaskStatus.IN_PROGRESS]: '#3366FF',     // blue
  [TaskStatus.PENDING]: '#BFBFBF',         // gray
  [TaskStatus.CANCELLED]: '#D9D9D9',
  [TaskStatus.PENDING_REVIEW]: '#FAAD14',
};

function getLaneData(tasks: Task[]) {
  const laneMap = new Map<string, Task[]>();
  for (const task of tasks) {
    // Group by department (deptName from extended task data)
    const dept = (task as any).deptName || '未分配部门';
    if (!laneMap.has(dept)) {
      laneMap.set(dept, []);
    }
    laneMap.get(dept)!.push(task);
  }
  // Ensure at least one lane exists
  if (laneMap.size === 0) {
    laneMap.set('未分配部门', []);
  }
  return Array.from(laneMap.entries()).map(([label, laneTasks]) => ({
    id: label,
    label,
    color: DEPT_COLORS[label] || '#8C8C8C',
    tasks: laneTasks,
  }));
}

const LANE_HEIGHT = 120;
const MONTH_COL_WIDTH = 140;

function getContrastColor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.6 ? '#333' : '#fff';
}

function TaskCard({ task, onTaskClick, onMilestoneStarted }: {
  task: Task;
  onTaskClick?: (task: Task) => void;
  onMilestoneStarted?: () => void;
}) {
  const statusColor = STATUS_COLORS[task.status] || '#BFBFBF';
  const textColor = getContrastColor(statusColor);
  const isMilestone = task.type === 'MILESTONE';

  const handleStart = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await startMilestone(task.id);
      message.success('里程碑已启动');
      onMilestoneStarted?.();
    } catch {
      message.error('启动失败');
    }
  }, [task.id, onMilestoneStarted]);

  const handleComplete = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await completeMilestone(task.id);
      message.success('里程碑已完成，等待审批');
      onMilestoneStarted?.();
    } catch {
      message.error('操作失败');
    }
  }, [task.id, onMilestoneStarted]);

  if (isMilestone) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <div
          className={styles.milestoneMarker}
          onClick={() => onTaskClick?.(task)}
          data-testid={`task-card-${task.id}`}
          style={{ backgroundColor: statusColor }}
          title={task.title}
        />
        {task.status === TaskStatus.PENDING && (
          <Button
            size="small"
            type="link"
            style={{ padding: '0 2px', fontSize: 11 }}
            onClick={handleStart}
            data-testid={`start-milestone-${task.id}`}
          >
            启动
          </Button>
        )}
        {task.status === TaskStatus.IN_PROGRESS && (
          <Button
            size="small"
            type="link"
            style={{ padding: '0 2px', fontSize: 11 }}
            onClick={handleComplete}
            data-testid={`complete-milestone-${task.id}`}
          >
            完成
          </Button>
        )}
      </div>
    );
  }

  return (
    <div
      className={styles.taskCard}
      onClick={() => onTaskClick?.(task)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onTaskClick?.(task); } }}
      tabIndex={0}
      role="button"
      aria-label={`任务: ${task.title ?? (task as any).name}`}
      data-testid={`task-card-${task.id}`}
      style={{ position: 'relative', backgroundColor: statusColor, color: textColor, borderColor: statusColor }}
    >
      <div className={styles.cardContent}>
        <span className={styles.taskName} style={{ color: textColor }}>{task.title ?? (task as any).name}</span>
        <div className={styles.cardMeta}>
          <Avatar size="small" style={{ backgroundColor: 'rgba(255,255,255,0.3)', color: textColor, fontSize: 10 }} data-testid={`assignee-${task.id}`}>
            {(task.assigneeName ?? String(task.assigneeId ?? '')).slice(-2).toUpperCase()}
          </Avatar>
        </div>
      </div>
    </div>
  );
}

export default function SwimlaneTab({ tasks, projects, onTaskClick, onRefresh }: SwimlaneTabProps) {
  const monthHeaderRef = useRef<HTMLDivElement>(null);
  const laneContentRefs = useRef<HTMLDivElement[]>([]);

  // Compute timeline range from projects or tasks
  const { timelineStart, timelineEnd, monthCount } = useMemo(() => {
    let minDate = dayjs().startOf('year');
    let maxDate = dayjs().endOf('year');
    for (const p of projects) {
      if (p.plannedStart) minDate = dayjs.min(minDate, dayjs(p.plannedStart));
      if (p.plannedEnd) maxDate = dayjs.max(maxDate, dayjs(p.plannedEnd));
    }
    for (const t of tasks) {
      if (t.plannedStart) minDate = dayjs.min(minDate, dayjs(t.plannedStart));
      if (t.plannedEnd) maxDate = dayjs.max(maxDate, dayjs(t.plannedEnd));
    }
    const start = minDate.startOf('month');
    const end = maxDate.endOf('month');
    const months = end.diff(start, 'month') + 1;
    return { timelineStart: start, timelineEnd: end, monthCount: Math.max(months, 6) };
  }, [projects, tasks]);

  const monthColumns = useMemo(() => {
    const cols: { key: string; label: string }[] = [];
    for (let i = 0; i < monthCount; i++) {
      const m = timelineStart.add(i, 'month');
      cols.push({ key: m.format('YYYY-MM'), label: m.format('YYYY年M月') });
    }
    return cols;
  }, [timelineStart, monthCount]);

  const totalDays = timelineEnd.diff(timelineStart, 'day');
  const timelineWidth = monthCount * MONTH_COL_WIDTH;

  // Today line position
  const today = dayjs();
  const todayOffset = today.diff(timelineStart, 'day');
  const showTodayLine = todayOffset >= 0 && todayOffset <= totalDays;
  const todayLeft = (todayOffset / totalDays) * timelineWidth;

  const laneData = useMemo(() => getLaneData(tasks), [tasks]);

  // Compute vertical offsets for overlapping tasks within each lane
  const getTaskPosition = useCallback((task: Task, laneTasks: Task[]): React.CSSProperties | null => {
    if (!task.plannedStart || !task.plannedEnd) return null;
    const s = dayjs(task.plannedStart);
    const e = dayjs(task.plannedEnd);
    if (e.isBefore(timelineStart) || s.isAfter(timelineEnd)) return null;
    const startOffset = Math.max(0, s.diff(timelineStart, 'day'));
    const endOffset = Math.min(totalDays, e.diff(timelineStart, 'day'));

    // Calculate vertical row index for overlapping tasks
    const CARD_HEIGHT = 40;
    const MAX_ROWS = Math.floor((LANE_HEIGHT - 12) / CARD_HEIGHT);
    const taskIdx = laneTasks.indexOf(task);
    const taskStart = startOffset;
    const taskEnd = endOffset;
    let row = 0;
    // Find the first row where this task doesn't overlap with previous tasks in the same row
    const occupied: Set<number>[] = [];
    for (let i = 0; i < taskIdx; i++) {
      const prev = laneTasks[i];
      if (!prev.plannedStart || !prev.plannedEnd) continue;
      const ps = Math.max(0, dayjs(prev.plannedStart).diff(timelineStart, 'day'));
      const pe = Math.min(totalDays, dayjs(prev.plannedEnd).diff(timelineStart, 'day'));
      if (pe <= taskStart || ps >= taskEnd) continue;
      // Find which row prev task is in
      let prevRow = 0;
      for (let r = 0; r < occupied.length; r++) {
        if (!occupied[r]) occupied[r] = new Set();
      }
      // Simple: assign row based on overlap count
      for (let r = 0; r < MAX_ROWS; r++) {
        if (!occupied[r]) occupied[r] = new Set();
        let overlap = false;
        for (let d = Math.floor(ps); d <= Math.floor(pe); d++) {
          if (occupied[r].has(d)) { overlap = true; break; }
        }
        if (!overlap) { prevRow = r; break; }
      }
    }
    // Find row for current task
    for (let r = 0; r < MAX_ROWS; r++) {
      if (!occupied[r]) occupied[r] = new Set();
      let overlap = false;
      for (let d = Math.floor(taskStart); d <= Math.floor(taskEnd); d++) {
        if (occupied[r].has(d)) { overlap = true; break; }
      }
      if (!overlap) { row = r; break; }
    }
    // Mark this row as occupied
    if (!occupied[row]) occupied[row] = new Set();
    for (let d = Math.floor(taskStart); d <= Math.floor(taskEnd); d++) {
      occupied[row].add(d);
    }

    return {
      left: (startOffset / totalDays) * timelineWidth,
      width: Math.max(80, ((endOffset - startOffset) / totalDays) * timelineWidth),
      top: 8 + row * CARD_HEIGHT,
    };
  }, [timelineStart, timelineEnd, totalDays, timelineWidth]);

  // Scroll synchronization
  const handleLaneScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const scrollLeft = e.currentTarget.scrollLeft;
    if (monthHeaderRef.current) {
      monthHeaderRef.current.scrollLeft = scrollLeft;
    }
    // Sync other lanes
    laneContentRefs.current.forEach((ref) => {
      if (ref && ref !== e.currentTarget) {
        ref.scrollLeft = scrollLeft;
      }
    });
  }, []);

  return (
    <div className={styles.container} data-testid="swimlane-container">
      {/* Time axis header */}
      <div className={styles.timeAxis}>
        <div className={styles.laneLabelHeader}>部门</div>
        <div className={styles.monthHeaderRow} ref={monthHeaderRef}>
          {monthColumns.map((col) => (
            <div key={col.key} className={styles.monthCell} style={{ width: MONTH_COL_WIDTH }}>
              {col.label}
            </div>
          ))}
        </div>
      </div>

      {/* Swimlane rows */}
      <div className={styles.swimlanes}>
        {laneData.map((lane, idx) => (
          <div
            key={lane.id}
            className={styles.swimlane}
            data-testid={`swimlane-${lane.id}`}
            style={{ height: LANE_HEIGHT }}
          >
            <div className={styles.laneLabel}>
              <span className={styles.laneLabelText} style={{ color: lane.color }}>
                {lane.label}
              </span>
              <Badge count={lane.tasks.length} className={styles.laneBadge} />
            </div>
            <div
              className={styles.laneContent}
              style={{ width: timelineWidth, position: 'relative' }}
              ref={(el) => { if (el) laneContentRefs.current[idx] = el; }}
              onScroll={handleLaneScroll}
            >
              {monthColumns.map((col, i) => (
                <div
                  key={col.key}
                  className={styles.monthGridLine}
                  style={{ left: i * MONTH_COL_WIDTH, width: MONTH_COL_WIDTH }}
                />
              ))}
              {/* Today line */}
              {showTodayLine && (
                <div className={styles.todayLine} style={{ left: todayLeft }}>
                  <span className={styles.todayMarker}>今天</span>
                </div>
              )}
              {lane.tasks.map((task) => {
                const position = getTaskPosition(task, lane.tasks);
                if (!position) return null;
                return (
                  <div
                    key={task.id}
                    className={styles.cardPositioned}
                    style={{ left: position.left, width: position.width, top: position.top }}
                  >
                    <TaskCard
                      task={task}
                      onTaskClick={onTaskClick}
                      onMilestoneStarted={onRefresh}
                    />
                  </div>
                );
              })}
              {lane.tasks.length === 0 && (
                <div className={styles.emptyLane}>暂无任务</div>
              )}
            </div>
            {idx < laneData.length - 1 && (
              <div className={styles.separatorLine} data-testid={`separator-${lane.id}`} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
