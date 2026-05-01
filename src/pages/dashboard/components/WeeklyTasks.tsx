import type React from 'react';
import type { Task } from '@/types';
import { TASK_PRIORITY_CONFIG } from '@/constants';
import { TASK_STATUS_CONFIG } from '@/constants';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import styles from './WeeklyTasks.module.css';

dayjs.extend(isBetween);

interface WeeklyTasksProps {
  tasks: Task[];
}

const WEEKDAYS = ['周一', '周二', '周三', '周四', '周五'];

function getWeekDates(): { date: string; label: string }[] {
  const startOfWeek = dayjs().startOf('week').add(1, 'day'); // Monday
  return WEEKDAYS.map((day, i) => {
    const d = startOfWeek.add(i, 'day');
    return {
      date: d.format('YYYY-MM-DD'),
      label: `${d.format('M/D')} ${day}`,
    };
  });
}

export default function WeeklyTasks({ tasks = [] }: WeeklyTasksProps) {
  const weekDates = getWeekDates();

  const getTasksForDate = (date: string): Task[] => {
    return tasks.filter((t) => {
      if (!t.planStart || !t.planEnd) return false;
      return dayjs(date).isBetween(dayjs(t.planStart), dayjs(t.planEnd), 'day', '[]');
    });
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>本周任务</div>
      <div className={styles.weekGrid}>
        {weekDates.map((wd) => {
          const dayTasks = getTasksForDate(wd.date);
          return (
            <div key={wd.date} className={styles.dayColumn}>
              <div className={styles.dayHeader}>
                <span className={styles.dayLabel}>{wd.label}</span>
                <span className={styles.dayCount}>{dayTasks.length}项</span>
              </div>
              <div className={styles.taskList}>
                {dayTasks.length === 0 ? (
                  <div className={styles.emptyDay}>暂无任务</div>
                ) : (
                  dayTasks.slice(0, 4).map((task) => {
                    const priorityCfg = TASK_PRIORITY_CONFIG[task.priority];
                    const statusCfg = TASK_STATUS_CONFIG[task.status];
                    return (
                      <div key={task.id} className={styles.taskCard}>
                        <div
                          className={styles.priorityBar}
                          style={{ backgroundColor: priorityCfg?.color || '#8C8C8C' }}
                        />
                        <div className={styles.taskContent}>
                          <div className={styles.taskTitle}>{task.name}</div>
                          <div className={styles.taskMeta}>
                            <span
                              className={styles.statusTag}
                              style={{
                                color: statusCfg?.color || '#8C8C8C',
                                backgroundColor: statusCfg?.bgColor || '#F5F5F5',
                              }}
                            >
                              {statusCfg?.label || task.status}
                            </span>
                            {task.planEnd && (
                              <span className={styles.dueDate}>
                                {dayjs(task.planEnd).format('M/D')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
