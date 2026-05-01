import { Drawer, Badge, Progress, Button, Tag, Space } from 'antd';
import { EditOutlined, DeleteOutlined, SwapOutlined } from '@ant-design/icons';
import type { Task } from '@/types';
import { TASK_STATUS_CONFIG, TASK_PRIORITY_CONFIG } from '@/constants';
import dayjs from 'dayjs';
import styles from './TaskDetailDrawer.module.css';

interface TaskDetailDrawerProps {
  task: Task | null;
  open: boolean;
  onClose: () => void;
}

export default function TaskDetailDrawer({ task, open, onClose }: TaskDetailDrawerProps) {
  if (!task) return null;

  const statusCfg = TASK_STATUS_CONFIG[task.status];
  const priorityCfg = TASK_PRIORITY_CONFIG[task.priority];

  return (
    <Drawer
      title={null}
      open={open}
      onClose={onClose}
      width={480}
      placement="right"
      styles={{ body: { padding: 0 } }}
    >
      <div className={styles.drawerContent}>
        <div className={styles.header}>
          <h2 className={styles.taskName}>{task.name}</h2>
          <span
            className={styles.statusBadge}
            style={{
              color: statusCfg?.color || '#8C8C8C',
              backgroundColor: statusCfg?.bgColor || '#F5F5F5',
            }}
          >
            {statusCfg?.label || task.status}
          </span>
        </div>

        <div className={styles.infoGrid}>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>所属项目</span>
            <span className={styles.infoValue}>{task.projectId}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>负责人</span>
            <span className={styles.infoValue}>{task.assigneeId}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>优先级</span>
            <span
              className={styles.priorityTag}
              style={{
                color: priorityCfg?.color || '#8C8C8C',
                backgroundColor: priorityCfg?.bgColor || '#F5F5F5',
              }}
            >
              {priorityCfg?.label || task.priority}
            </span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>截止日期</span>
            <span className={styles.infoValue}>
              {task.planEnd ? dayjs(task.planEnd).format('YYYY-MM-DD') : '-'}
            </span>
          </div>
          {task.planStart && (
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>计划开始</span>
              <span className={styles.infoValue}>
                {dayjs(task.planStart).format('YYYY-MM-DD')}
              </span>
            </div>
          )}
          {task.plannedHours && (
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>计划工时</span>
              <span className={styles.infoValue}>{task.plannedHours}h</span>
            </div>
          )}
        </div>

        <div className={styles.section}>
          <div className={styles.sectionTitle}>描述</div>
          <p className={styles.description}>{task.description || '暂无描述'}</p>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionTitle}>进度</div>
          <div className={styles.progressRow}>
            <Progress
              percent={task.progress}
              strokeColor={task.progress >= 100 ? '#52C41A' : '#3366FF'}
              trailColor="#F0F0F0"
            />
          </div>
        </div>

        {task.tags.length > 0 && (
          <div className={styles.section}>
            <div className={styles.sectionTitle}>标签</div>
            <Space size={[8, 8]} wrap>
              {task.tags.map((tag) => (
                <Tag key={tag} color="blue">{tag}</Tag>
              ))}
            </Space>
          </div>
        )}

        <div className={styles.actions}>
          <Button type="primary" icon={<EditOutlined />}>编辑</Button>
          <Button icon={<SwapOutlined />}>指派</Button>
          <Button icon={<SwapOutlined />}>状态变更</Button>
          <Button danger icon={<DeleteOutlined />}>删除</Button>
        </div>
      </div>
    </Drawer>
  );
}
