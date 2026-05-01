import type React from 'react';
import { Select, Badge } from 'antd';
import { AlertOutlined, SafetyCertificateOutlined, BulbOutlined } from '@ant-design/icons';
import type { Project } from '@/types';
import type { Task } from '@/types';
import { TaskStatus } from '@/types';
import { TASK_STATUS_CONFIG } from '@/constants';
import dayjs from 'dayjs';
import styles from './InfoPanel.module.css';

const { Option } = Select;

interface InfoPanelProps {
  projects: Project[];
  tasks: Task[];
  selectedProjectId: string | null;
  onProjectChange: (id: string) => void;
  summary: {
    warnings: number;
    risks: number;
    suggestions: number;
    overdue: number;
    todayTasks: number;
    pendingAssign: number;
  };
}

export default function InfoPanel({
  projects,
  tasks,
  selectedProjectId,
  onProjectChange,
  summary,
}: InfoPanelProps) {
  const overdueTasks = tasks
    .filter((t) => t.status === TaskStatus.OVERDUE || (t.planEnd && dayjs(t.planEnd).isBefore(dayjs()) && t.status !== TaskStatus.COMPLETED))
    .slice(0, 5);

  const getOverdueDays = (planEnd: string) => {
    return dayjs().diff(dayjs(planEnd), 'day');
  };

  return (
    <div className={styles.panel}>
      <div className={styles.section}>
        <Select
          value={selectedProjectId || undefined}
          onChange={onProjectChange}
          placeholder="选择项目"
          style={{ width: '100%' }}
          size="middle"
          allowClear
        >
          {projects.map((p) => (
            <Option key={p.id} value={p.id}>{p.name}</Option>
          ))}
        </Select>
      </div>

      <div className={styles.metricsRow}>
        <div className={styles.metricCard}>
          <AlertOutlined style={{ color: '#FF4D4F', fontSize: 18 }} />
          <span className={styles.metricValue}>{summary.warnings}</span>
          <span className={styles.metricLabel}>预警</span>
        </div>
        <div className={styles.metricCard}>
          <SafetyCertificateOutlined style={{ color: '#FAAD14', fontSize: 18 }} />
          <span className={styles.metricValue}>{summary.risks}</span>
          <span className={styles.metricLabel}>风险</span>
        </div>
        <div className={styles.metricCard}>
          <BulbOutlined style={{ color: '#3366FF', fontSize: 18 }} />
          <span className={styles.metricValue}>{summary.suggestions}</span>
          <span className={styles.metricLabel}>建议</span>
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>待办事项详情 Todo</div>
        <div className={styles.todoStats}>
          <div className={styles.todoRow}>
            <span className={styles.todoLabel}>今日待办</span>
            <span className={styles.todoEn}>Today</span>
            <Badge count={summary.todayTasks} style={{ backgroundColor: '#3366FF' }} />
          </div>
          <div className={styles.todoRow}>
            <span className={styles.todoLabel}>超期</span>
            <span className={styles.todoEn}>Overdue</span>
            <Badge count={summary.overdue} style={{ backgroundColor: '#FF4D4F' }} />
          </div>
          <div className={styles.todoRow}>
            <span className={styles.todoLabel}>待分配</span>
            <span className={styles.todoEn}>Pending</span>
            <Badge count={summary.pendingAssign} style={{ backgroundColor: '#8C8C8C' }} />
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>超期提醒</div>
        <div className={styles.overdueList}>
          {overdueTasks.length === 0 ? (
            <div className={styles.emptyText}>暂无超期任务</div>
          ) : (
            overdueTasks.map((task) => {
              const days = task.planEnd ? getOverdueDays(task.planEnd) : 0;
              return (
                <div key={task.id} className={styles.overdueItem}>
                  <span className={styles.overdueName}>{task.name}</span>
                  <span className={styles.overdueTag}>超期{days}天</span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
