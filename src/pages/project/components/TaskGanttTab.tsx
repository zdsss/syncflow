import type React from 'react';
import { useMemo, useState } from 'react';
import { Checkbox } from 'antd';
import dayjs from 'dayjs';
import type { Task } from '@/types';
import { TaskStatus } from '@/types';
import { TASK_STATUS_CONFIG } from '@/constants';
import styles from './TaskGanttTab.module.css';

interface TaskGanttTabProps {
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
}

const DEPARTMENTS = [
  { id: 'all', label: '全部' },
  { id: 'design', label: '设计部' },
  { id: 'product', label: '产品部' },
  { id: 'dev', label: '研发部' },
  { id: 'test', label: '测试部' },
  { id: 'production', label: '生产部' },
];

const STATUS_BAR_COLORS: Record<string, string> = {
  [TaskStatus.IN_PROGRESS]: '#3366FF',
  [TaskStatus.NOT_STARTED]: '#FAAD14',
  [TaskStatus.PENDING_ASSIGN]: '#FAAD14',
  [TaskStatus.COMPLETED]: '#52C41A',
  [TaskStatus.OVERDUE]: '#FF4D4F',
  [TaskStatus.URGENT]: '#FF4D4F',
  [TaskStatus.ON_HOLD]: '#00BCD4',
  [TaskStatus.CANCELLED]: '#BFBFBF',
};

function getMonthWeekColumns(startYear: number, monthCount: number) {
  const months: { key: string; label: string; weeks: { key: string; label: string; days: number }[] }[] = [];
  const d = dayjs(`${startYear}-01-01`);
  for (let i = 0; i < monthCount; i++) {
    const m = d.add(i, 'month');
    const weeks: { key: string; label: string; days: number }[] = [];
    const startOfMonth = m.startOf('month');
    const endOfMonth = m.endOf('month');
    let weekStart = startOfMonth.startOf('week').add(1, 'day');
    let wNum = 1;
    while (weekStart.isBefore(endOfMonth)) {
      weeks.push({ key: `${m.format('YYYY-MM')}-W${wNum}`, label: `W${wNum}`, days: 7 });
      weekStart = weekStart.add(1, 'week');
      wNum++;
    }
    if (weeks.length === 0) weeks.push({ key: startOfMonth.format('YYYY-MM-DD'), label: 'W1', days: 7 });
    months.push({ key: m.format('YYYY-MM'), label: m.format('M月'), weeks });
  }
  return months;
}

export default function TaskGanttTab({ tasks, onTaskClick }: TaskGanttTabProps) {
  const [selectedDepts, setSelectedDepts] = useState<string[]>(['all']);
  const startYear = 2025;
  const monthCount = 12;
  const monthWeeks = useMemo(() => getMonthWeekColumns(startYear, monthCount), []);
  const totalWeeks = monthWeeks.reduce((s, m) => s + m.weeks.length, 0);
  const weekWidth = 60;
  const timelineStart = dayjs(`${startYear}-01-01`);
  const timelineEnd = timelineStart.add(monthCount, 'month');
  const totalDays = timelineEnd.diff(timelineStart, 'day');
  const totalTimelineWidth = totalWeeks * weekWidth;

  // Group tasks by department (simplified: use tags to simulate department)
  const deptTaskMap = useMemo(() => {
    const map: Record<string, Task[]> = {};
    for (const task of tasks) {
      const dept = task.tags[0] || 'other';
      if (!map[dept]) map[dept] = [];
      map[dept].push(task);
    }
    return map;
  }, [tasks]);

  const visibleTasks = useMemo(() => {
    if (selectedDepts.includes('all')) return tasks;
    return tasks.filter((t) => {
      const dept = t.tags[0] || 'other';
      return selectedDepts.includes(dept);
    });
  }, [tasks, selectedDepts]);

  const getBarForTask = (task: Task) => {
    if (!task.planStart || !task.planEnd) return null;
    const s = dayjs(task.planStart);
    const e = dayjs(task.planEnd);
    if (e.isBefore(timelineStart) || s.isAfter(timelineEnd)) return null;
    const startOffset = Math.max(0, s.diff(timelineStart, 'day'));
    const endOffset = Math.min(totalDays, e.diff(timelineStart, 'day'));
    return {
      left: (startOffset / totalDays) * totalTimelineWidth,
      width: Math.max(20, ((endOffset - startOffset) / totalDays) * totalTimelineWidth),
    };
  };

  const handleDeptToggle = (deptId: string) => {
    if (deptId === 'all') {
      setSelectedDepts(['all']);
    } else {
      const newDepts = selectedDepts.includes(deptId)
        ? selectedDepts.filter((d) => d !== deptId)
        : [...selectedDepts.filter((d) => d !== 'all'), deptId];
      setSelectedDepts(newDepts.length === 0 ? ['all'] : newDepts);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.layout}>
        {/* Left filter panel */}
        <div className={styles.filterPanel}>
          <div className={styles.filterTitle}>部门筛选</div>
          {DEPARTMENTS.map((dept) => (
            <label key={dept.id} className={styles.filterItem}>
              <Checkbox
                checked={selectedDepts.includes(dept.id)}
                onChange={() => handleDeptToggle(dept.id)}
              >
                {dept.label}
                {dept.id !== 'all' && (
                  <span className={styles.filterCount}>
                    ({(deptTaskMap[dept.id] || []).length})
                  </span>
                )}
              </Checkbox>
            </label>
          ))}
        </div>

        {/* Right gantt */}
        <div className={styles.ganttArea}>
          <div className={styles.ganttScroll}>
            <div className={styles.ganttInner}>
              {/* Month header */}
              <div className={styles.ganttHeader}>
                {monthWeeks.map((m) => (
                  <div key={m.key} className={styles.monthCell} style={{ width: m.weeks.length * weekWidth }}>
                    {m.label}
                  </div>
                ))}
              </div>
              {/* Week header */}
              <div className={styles.ganttSubHeader}>
                {monthWeeks.flatMap((m) =>
                  m.weeks.map((w) => (
                    <div key={w.key} className={styles.weekCell} style={{ width: weekWidth }}>
                      {w.label}
                    </div>
                  ))
                )}
              </div>
              {/* Task rows */}
              <div className={styles.ganttBody}>
                {visibleTasks.map((task) => {
                  const bar = getBarForTask(task);
                  const barColor = STATUS_BAR_COLORS[task.status] || '#BFBFBF';
                  return (
                    <div
                      key={task.id}
                      className={styles.ganttRow}
                      onClick={() => onTaskClick?.(task)}
                    >
                      <div className={styles.timelineRow}>
                        {monthWeeks.flatMap((m) =>
                          m.weeks.map((w) => (
                            <div key={w.key} className={styles.gridCell} style={{ width: weekWidth }} />
                          ))
                        )}
                        {bar && (
                          <div
                            className={styles.ganttBar}
                            style={{ left: bar.left, width: bar.width, backgroundColor: barColor }}
                            title={task.name}
                          >
                            <span className={styles.barLabel}>{task.name}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                {visibleTasks.length === 0 && (
                  <div className={styles.emptyState}>暂无任务数据</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
