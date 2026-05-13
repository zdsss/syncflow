import { Fragment, useRef, useEffect } from 'react';
import dayjs from 'dayjs';
import type { Task } from '@/types';
import type { WeekInfo, MonthGroup } from './scheduleHelpers';
import { STATUS_COLORS } from './scheduleHelpers';
import styles from '../ScheduleTab.module.css';

export interface ScheduleTimeAxisProps {
  weeks: WeekInfo[];
  monthGroups: MonthGroup[];
  paginatedGroupedTasks: { phase: string; tasks: Task[] }[];
  collapsedGroups: Set<string>;
  timelineStart: dayjs.Dayjs;
  timelineEnd: dayjs.Dayjs;
  totalDays: number;
  totalWidth: number;
}

export default function ScheduleTimeAxis({
  weeks,
  monthGroups,
  paginatedGroupedTasks,
  collapsedGroups,
  timelineStart,
  timelineEnd,
  totalDays,
  totalWidth,
}: ScheduleTimeAxisProps) {
  const getBarStyle = (task: Task): React.CSSProperties | null => {
    if (!task.plannedStart || !task.plannedEnd) return null;
    const s = dayjs(task.plannedStart);
    const e = dayjs(task.plannedEnd);
    if (e.isBefore(timelineStart) || s.isAfter(timelineEnd)) return null;
    const startOffset = Math.max(0, s.diff(timelineStart, 'day'));
    const endOffset = Math.min(totalDays, e.diff(timelineStart, 'day'));
    return {
      left: (startOffset / totalDays) * totalWidth,
      width: Math.max(20, ((endOffset - startOffset) / totalDays) * totalWidth),
    };
  };

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      const now = dayjs();
      const currentWeekOffset = Math.max(0, now.diff(timelineStart, 'week') - 2);
      scrollRef.current.scrollLeft = currentWeekOffset * 60;
    }
  }, [timelineStart]);

  return (
    <div className={styles.rightScroll} data-testid="right-scroll" ref={scrollRef}>
      <div className={styles.rightScrollInner} style={{ minWidth: totalWidth }}>
        <div className={styles.monthHeaderRight}>
          {monthGroups.map((mg) => (
            <div
              key={mg.month}
              className={styles.monthCellRight}
              style={{ width: mg.weekCount * 60 }}
            >
              {mg.label}
            </div>
          ))}
        </div>
        <div className={styles.weekHeader}>
          {weeks.map((week) => (
            <div
              key={week.key}
              className={styles.weekCell}
              data-testid={`week-header-${week.key}`}
            >
              {week.label}
            </div>
          ))}
        </div>
        {paginatedGroupedTasks.map((group) => {
          const isCollapsed = collapsedGroups.has(group.phase);
          return (
            <Fragment key={group.phase}>
              <div className={styles.groupGanttRow} />
              {!isCollapsed &&
                group.tasks.map((task) => {
                  const barStyle = getBarStyle(task);
                  const barColor = STATUS_COLORS[task.status] || '#BFBFBF';

                  return (
                    <div
                      key={task.id}
                      className={styles.ganttRow}
                      data-testid={`gantt-row-${task.id}`}
                    >
                      {weeks.map((week) => (
                        <div key={week.key} className={styles.gridCell} />
                      ))}
                      {barStyle && (
                        <div
                          className={styles.ganttBar}
                          data-testid={`gantt-bar-${task.id}`}
                          style={{
                            ...barStyle,
                            backgroundColor: barColor,
                          }}
                          title={`${task.title} ${task.plannedStart} ~ ${task.plannedEnd}`}
                        >
                          <div
                            className={styles.progressFill}
                            data-testid={`gantt-progress-${task.id}`}
                            style={{
                              width: `${task.progress}%`,
                              backgroundColor: barColor,
                            }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}
