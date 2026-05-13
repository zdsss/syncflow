import dayjs from 'dayjs';
import type { Task } from '@/types';
import { TASK_STATUS_CONFIG } from '@/constants/enums';
import { calcDays } from './useGanttColumns';
import styles from '../TaskGanttTab.module.css';

export interface GanttLeftTableProps {
  visibleTasks: Task[];
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

export function GanttLeftTable({ visibleTasks, onTaskClick }: GanttLeftTableProps) {
  return (
    <div className={styles.leftPanel} data-testid="left-data-table">
      <table>
        <thead>
          <tr className={styles.headerRow}>
            <th style={{ width: 50 }}>阶段</th>
            <th style={{ width: 120 }}>名称</th>
            <th style={{ width: 120 }}>计划工期</th>
            <th style={{ width: 80 }}>完成进度</th>
            <th style={{ width: 60 }}>状态</th>
          </tr>
        </thead>
        <tbody>
          {visibleTasks.map((task) => {
            const dept = task.tags?.split(',')[0]?.trim() || 'other';
            const deptLabel = DEPARTMENTS.find((d) => d.id === dept)?.label || dept;
            const statusConfig = TASK_STATUS_CONFIG[task.status];
            return (
              <tr
                key={task.id}
                className={styles.dataRow}
                data-testid={`data-row-${task.id}`}
                onClick={() => onTaskClick?.(task)}
              >
                <td style={{ width: 50 }}>{deptLabel}</td>
                <td style={{ width: 120, textAlign: 'left', paddingLeft: 8 }}>{task.title}</td>
                <td style={{ width: 120 }} data-testid={`plan-dates-${task.id}`}>
                  {task.plannedStart && task.plannedEnd
                    ? `${dayjs(task.plannedStart).format('MM/DD')}-${dayjs(task.plannedEnd).format('MM/DD')}`
                    : '-'}
                </td>
                <td style={{ width: 80 }}>
                  <div className={styles.progressCell}>
                    <span className={styles.progressBar}>
                      <span
                        className={styles.progressBarFill}
                        data-testid={`progress-fill-${task.id}`}
                        style={{ width: `${task.progress}%` }}
                      />
                    </span>
                    <span className={styles.progressText}>{task.progress}%</span>
                  </div>
                </td>
                <td style={{ width: 60 }}>
                  <span style={{ color: statusConfig?.color || '#666', fontSize: 11 }}>
                    {statusConfig?.label || task.status}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
