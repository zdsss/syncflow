import { Card, Tag, Table } from 'antd';
import type { Task } from '@/types';
import type { Project } from '@/types';
import { TASK_STATUS_CONFIG, PROJECT_STATUS_CONFIG } from '@/constants/enums';
import styles from './PersonalPage.module.css';

interface PersonalOverviewProps {
  projects: Project[];
  tasks: Task[];
}

export default function PersonalOverview({ projects, tasks }: PersonalOverviewProps) {
  const projectsInProgress = projects.filter((p) => p.status === 'in_progress').length;
  const projectsCompleted = projects.filter((p) => p.status === 'completed').length;
  const projectsDelayed = projects.filter((p) => p.status === 'delayed').length;

  const totalTasks = tasks.length;
  const pendingTasks = tasks.filter((t) => t.status === 'pending_assign' || t.status === 'not_started').length;
  const inProgressTasks = tasks.filter((t) => t.status === 'in_progress').length;
  const completedTasks = tasks.filter((t) => t.status === 'completed').length;

  const recentTasks = [...tasks]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 8);

  const activityColumns = [
    {
      title: '任务',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const cfg = TASK_STATUS_CONFIG[status as keyof typeof TASK_STATUS_CONFIG];
        return cfg ? <Tag color={cfg.color}>{cfg.label}</Tag> : <Tag>{status}</Tag>;
      },
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      render: (date: string) => new Date(date).toLocaleDateString('zh-CN'),
    },
  ];

  return (
    <div data-testid="overview-section">
      <h3 className={styles.sectionTitle}>项目统计</h3>
      <div className={styles.statRow}>
        <Card size="small" className={styles.statCard}>
          <div className={styles.statLabel}>在进行</div>
          <div className={styles.statValue} style={{ color: '#FAAD14' }}>{projectsInProgress}</div>
        </Card>
        <Card size="small" className={styles.statCard}>
          <div className={styles.statLabel}>已完成</div>
          <div className={styles.statValue} style={{ color: '#52C41A' }}>{projectsCompleted}</div>
        </Card>
        <Card size="small" className={styles.statCard}>
          <div className={styles.statLabel}>逾期</div>
          <div className={styles.statValue} style={{ color: '#FF4D4F' }}>{projectsDelayed}</div>
        </Card>
      </div>

      <h3 className={styles.sectionTitle}>任务统计</h3>
      <div className={styles.statRow}>
        <Card size="small" className={styles.statCard}>
          <div className={styles.statLabel}>总任务</div>
          <div className={styles.statValue}>{totalTasks}</div>
        </Card>
        <Card size="small" className={styles.statCard}>
          <div className={styles.statLabel}>待处理</div>
          <div className={styles.statValue} style={{ color: '#8C8C8C' }}>{pendingTasks}</div>
        </Card>
        <Card size="small" className={styles.statCard}>
          <div className={styles.statLabel}>进行中</div>
          <div className={styles.statValue} style={{ color: '#FAAD14' }}>{inProgressTasks}</div>
        </Card>
        <Card size="small" className={styles.statCard}>
          <div className={styles.statLabel}>已完成</div>
          <div className={styles.statValue} style={{ color: '#52C41A' }}>{completedTasks}</div>
        </Card>
      </div>

      <h3 className={styles.sectionTitle}>最近动态</h3>
      <Table
        columns={activityColumns}
        dataSource={recentTasks}
        rowKey="id"
        size="small"
        pagination={false}
      />
    </div>
  );
}
