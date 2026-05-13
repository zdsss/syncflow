import { Card, Table, Tag } from 'antd';
import type { Task } from '@/types';
import { TaskStatus, TaskPriority } from '@/types';
import { TASK_STATUS_CONFIG, TASK_PRIORITY_CONFIG } from '@/constants/enums';
import styles from './PersonalPage.module.css';

interface MyTasksViewProps {
  tasks: Task[];
}

export default function MyTasksView({ tasks }: MyTasksViewProps) {
  const pendingCount = tasks.filter((t) => t.status === TaskStatus.PENDING).length;
  const inProgressCount = tasks.filter((t) => t.status === TaskStatus.IN_PROGRESS).length;
  const completedCount = tasks.filter((t) => t.status === TaskStatus.COMPLETED).length;

  const urgentCount = tasks.filter((t) => t.priority === TaskPriority.URGENT).length;
  const highCount = tasks.filter((t) => t.priority === TaskPriority.HIGH).length;
  const mediumCount = tasks.filter((t) => t.priority === TaskPriority.MEDIUM).length;
  const lowCount = tasks.filter((t) => t.priority === TaskPriority.LOW).length;

  const columns = [
    {
      title: '任务编号',
      dataIndex: 'code',
      key: 'code',
      render: (_: string, record: Task) => record.code || record.taskNo || '-',
    },
    {
      title: '任务名称',
      dataIndex: 'name',
      key: 'name',
      render: (_: string, record: Task) => record.title || record.name || '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: number) => {
        const cfg = TASK_STATUS_CONFIG[status as keyof typeof TASK_STATUS_CONFIG];
        return cfg ? <Tag color={cfg.color}>{cfg.label}</Tag> : <Tag>{status}</Tag>;
      },
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority: number) => {
        const cfg = TASK_PRIORITY_CONFIG[priority as keyof typeof TASK_PRIORITY_CONFIG];
        return cfg ? (
          <span>
            <span
              className={styles.priorityDot}
              style={{ backgroundColor: cfg.color }}
            />
            {cfg.label}
          </span>
        ) : priority;
      },
    },
    {
      title: '截止日期',
      dataIndex: 'plannedEnd',
      key: 'plannedEnd',
      render: (date: string) => (date ? new Date(date).toLocaleDateString('zh-CN') : '-'),
    },
  ];

  return (
    <div data-testid="my-tasks-section">
      <h3 className={styles.sectionTitle}>任务汇总</h3>
      <div className={styles.statRow}>
        <Card size="small" className={styles.statCard}>
          <div className={styles.statLabel}>待办</div>
          <div className={styles.statValue} style={{ color: '#8C8C8C' }}>{pendingCount}</div>
        </Card>
        <Card size="small" className={styles.statCard}>
          <div className={styles.statLabel}>进行中</div>
          <div className={styles.statValue} style={{ color: '#FAAD14' }}>{inProgressCount}</div>
        </Card>
        <Card size="small" className={styles.statCard}>
          <div className={styles.statLabel}>已完成</div>
          <div className={styles.statValue} style={{ color: '#52C41A' }}>{completedCount}</div>
        </Card>
      </div>

      <h3 className={styles.sectionTitle}>优先级分布</h3>
      <div className={styles.statRow}>
        <Card size="small" className={styles.statCard}>
          <div className={styles.statLabel}>紧急</div>
          <div className={styles.statValue} style={{ color: '#FF4D4F' }}>{urgentCount}</div>
        </Card>
        <Card size="small" className={styles.statCard}>
          <div className={styles.statLabel}>高</div>
          <div className={styles.statValue} style={{ color: '#FF9C00' }}>{highCount}</div>
        </Card>
        <Card size="small" className={styles.statCard}>
          <div className={styles.statLabel}>中</div>
          <div className={styles.statValue} style={{ color: '#FAAD14' }}>{mediumCount}</div>
        </Card>
        <Card size="small" className={styles.statCard}>
          <div className={styles.statLabel}>低</div>
          <div className={styles.statValue} style={{ color: '#52C41A' }}>{lowCount}</div>
        </Card>
      </div>

      <h3 className={styles.sectionTitle}>任务列表</h3>
      <Table
        columns={columns}
        dataSource={tasks}
        rowKey="id"
        size="small"
        pagination={{ pageSize: 10 }}
      />
    </div>
  );
}
