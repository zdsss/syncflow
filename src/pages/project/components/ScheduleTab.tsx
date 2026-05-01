import type React from 'react';
import { useMemo } from 'react';
import dayjs from 'dayjs';
import type { Task } from '@/types';
import { TASK_STATUS_CONFIG } from '@/constants';
import styles from './ScheduleTab.module.css';

interface ScheduleTabProps {
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
}

function getMonthWeekColumns(startYear: number, monthCount: number) {
  const months: { key: string; label: string; weeks: { key: string; label: string }[] }[] = [];
  const d = dayjs(`${startYear}-01-01`);
  for (let i = 0; i < monthCount; i++) {
    const m = d.add(i, 'month');
    const weeksInMonth: { key: string; label: string }[] = [];
    const startOfMonth = m.startOf('month');
    const endOfMonth = m.endOf('month');
    let weekStart = startOfMonth.startOf('week').add(1, 'day'); // Monday
    let weekNum = 1;
    while (weekStart.isBefore(endOfMonth)) {
      weeksInMonth.push({
        key: weekStart.format('YYYY-MM-DD'),
        label: `W${weekNum}`,
      });
      weekStart = weekStart.add(1, 'week');
      weekNum++;
    }
    if (weeksInMonth.length === 0) {
      weeksInMonth.push({
        key: startOfMonth.format('YYYY-MM-DD'),
        label: 'W1',
      });
    }
    months.push({
      key: m.format('YYYY-MM'),
      label: m.format('M月'),
      weeks: weeksInMonth,
    });
  }
  return months;
}

export default function ScheduleTab({ tasks, onTaskClick }: ScheduleTabProps) {
  const startYear = 2025;
  const monthCount = 12;
  const monthWeeks = useMemo(() => getMonthWeekColumns(startYear, monthCount), []);
  const totalWeeks = useMemo(() => monthWeeks.reduce((sum, m) => sum + m.weeks.length, 0), [monthWeeks]);
  const weekWidth = 60;
  const timelineStart = dayjs(`${startYear}-01-01`);
  const timelineEnd = timelineStart.add(monthCount, 'month');
  const totalDays = timelineEnd.diff(timelineStart, 'day');
  const totalTimelineWidth = totalWeeks * weekWidth;

  const getBarForTask = (task: Task) => {
    if (!task.planStart || !task.planEnd) return null;
    const s = dayjs(task.planStart);
    const e = dayjs(task.planEnd);
    if (e.isBefore(timelineStart) || s.isAfter(timelineEnd)) return null;

    const startOffset = Math.max(0, s.diff(timelineStart, 'day'));
    const endOffset = Math.min(totalDays, e.diff(timelineStart, 'day'));
    const left = (startOffset / totalDays) * totalTimelineWidth;
    const width = Math.max(20, ((endOffset - startOffset) / totalDays) * totalTimelineWidth);
    return { left, width };
  };

  return (
    <div className={styles.container}>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.fixedHeader} rowSpan={2} style={{ width: 200 }}>任务名称</th>
              <th className={styles.fixedHeader} rowSpan={2} style={{ width: 70 }}>进度</th>
              <th className={styles.fixedHeader} rowSpan={2} style={{ width: 80 }}>状态</th>
              {monthWeeks.map((m) => (
                <th key={m.key} className={styles.monthHeader} colSpan={m.weeks.length}>
                  {m.label}
                </th>
              ))}
            </tr>
            <tr>
              {monthWeeks.flatMap((m) =>
                m.weeks.map((w) => (
                  <th key={w.key} className={styles.weekHeader}>
                    {w.label}
                  </th>
                ))
              )}
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => {
              const statusCfg = TASK_STATUS_CONFIG[task.status];
              const bar = getBarForTask(task);
              return (
                <tr key={task.id} className={styles.bodyRow} onClick={() => onTaskClick?.(task)}>
                  <td className={styles.fixedCell}>
                    <span className={styles.taskName}>{task.name}</span>
                  </td>
                  <td className={styles.fixedCell}>
                    <span className={styles.progressText}>{task.progress}%</span>
                  </td>
                  <td className={styles.fixedCell}>
                    <span
                      className={styles.statusTag}
                      style={{
                        color: statusCfg?.color || '#8C8C8C',
                        backgroundColor: statusCfg?.bgColor || '#F5F5F5',
                      }}
                    >
                      {statusCfg?.label || task.status}
                    </span>
                  </td>
                  <td
                    className={styles.timelineCell}
                    colSpan={totalWeeks}
                    style={{ position: 'relative', minWidth: totalTimelineWidth }}
                  >
                    {bar && (
                      <div
                        className={styles.ganttBar}
                        style={{
                          left: bar.left,
                          width: bar.width,
                          backgroundColor: statusCfg?.color || '#8C8C8C',
                        }}
                        title={`${task.name}: ${task.planStart} ~ ${task.planEnd}`}
                      />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
