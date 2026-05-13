import { useEffect, useState, useMemo, useCallback } from 'react';
import { Select, Input, message, Button, Modal, Switch, Checkbox, Radio } from 'antd';
import { SearchOutlined, BellOutlined } from '@ant-design/icons';
import { getTasks } from '@/services/task.service';
import { useAuthStore } from '@/stores/useAuthStore';
import { TaskStatus, TaskPriority } from '@/types';
import { TASK_STATUS_CONFIG, TASK_PRIORITY_CONFIG } from '@/constants/enums';
import { useAsyncData } from '@/hooks/useAsyncData';
import TaskList from '@/pages/todo/components/TaskList';
import SlidePanel from '@/components/ui/SlidePanel/SlidePanel';
import type { Task } from '@/types';
import styles from './MyTasksPage.module.css';

const STATUS_OPTIONS = [
  { value: '', label: '全部状态' },
  { value: TaskStatus.PENDING, label: TASK_STATUS_CONFIG[TaskStatus.PENDING].label },
  { value: TaskStatus.IN_PROGRESS, label: TASK_STATUS_CONFIG[TaskStatus.IN_PROGRESS].label },
  { value: TaskStatus.PENDING_REVIEW, label: TASK_STATUS_CONFIG[TaskStatus.PENDING_REVIEW].label },
  { value: TaskStatus.COMPLETED, label: TASK_STATUS_CONFIG[TaskStatus.COMPLETED].label },
  { value: TaskStatus.CANCELLED, label: TASK_STATUS_CONFIG[TaskStatus.CANCELLED].label },
];

const PRIORITY_OPTIONS = [
  { value: '', label: '全部优先级' },
  { value: TaskPriority.URGENT, label: TASK_PRIORITY_CONFIG[TaskPriority.URGENT].label },
  { value: TaskPriority.HIGH, label: TASK_PRIORITY_CONFIG[TaskPriority.HIGH].label },
  { value: TaskPriority.MEDIUM, label: TASK_PRIORITY_CONFIG[TaskPriority.MEDIUM].label },
  { value: TaskPriority.LOW, label: TASK_PRIORITY_CONFIG[TaskPriority.LOW].label },
];

export default function MyTasksPage() {
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [keyword, setKeyword] = useState('');
  const [reminderModalOpen, setReminderModalOpen] = useState(false);
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [channels, setChannels] = useState<string[]>(['email', 'inApp']);
  const [reminderTime, setReminderTime] = useState<string>('1');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const fetcher = useCallback(async () => {
    const currentUser = useAuthStore.getState().currentUser;
    const assigneeId = currentUser?.id;
    const params: Record<string, string | number> = { pageNum: 1, pageSize: 200 };
    if (assigneeId) {
      params.assigneeId = assigneeId;
    }
    const res = await getTasks(params);
    return (res.data?.records ?? []) as Task[];
  }, []);

  const { data: tasksData, loading, refresh: fetchTasks } = useAsyncData(fetcher, '加载任务失败');
  const tasks = tasksData || [];

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === TaskStatus.COMPLETED).length;
    const inProgress = tasks.filter((t) => t.status === TaskStatus.IN_PROGRESS).length;
    const pending = tasks.filter((t) => t.status === TaskStatus.PENDING).length;
    const overdue = tasks.filter((t) => t.isOverdue).length;
    return { total, completed, inProgress, pending, overdue };
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    let result = [...tasks];
    if (statusFilter) {
      result = result.filter((t) => t.status === statusFilter);
    }
    if (priorityFilter) {
      result = result.filter((t) => t.priority === priorityFilter);
    }
    if (keyword) {
      const kw = keyword.toLowerCase();
      result = result.filter((t) => (t.title || '').toLowerCase().includes(kw));
    }
    return result;
  }, [tasks, statusFilter, priorityFilter, keyword]);

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>我的任务</h1>
        <Button icon={<BellOutlined />} onClick={() => setReminderModalOpen(true)}>
          提醒设置
        </Button>
      </div>

      {/* Summary Cards */}
      <div className={styles.cards}>
        <div className={styles.card}>
          <div className={styles.cardTitle}>总任务</div>
          <div className={styles.cardValue}>{stats.total}</div>
        </div>
        <div className={styles.card}>
          <div className={styles.cardTitle}>已完成</div>
          <div className={styles.cardValue}>{stats.completed}</div>
        </div>
        <div className={styles.card}>
          <div className={styles.cardTitle}>进行中</div>
          <div className={styles.cardValue}>{stats.inProgress}</div>
        </div>
        <div className={styles.card}>
          <div className={styles.cardTitle}>待处理</div>
          <div className={styles.cardValue}>{stats.pending}</div>
        </div>
        <div className={styles.card}>
          <div className={styles.cardTitle}>已逾期</div>
          <div className={styles.cardValue} style={{ color: stats.overdue > 0 ? '#ff4d4f' : undefined }}>{stats.overdue}</div>
        </div>
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        <Select
          className={styles.statusSelect}
          placeholder="全部状态"
          value={statusFilter || undefined}
          onChange={(val) => setStatusFilter(val || '')}
          options={STATUS_OPTIONS}
          allowClear
          style={{ width: 140 }}
        />
        <Select
          className={styles.prioritySelect}
          placeholder="全部优先级"
          value={priorityFilter || undefined}
          onChange={(val) => setPriorityFilter(val || '')}
          options={PRIORITY_OPTIONS}
          allowClear
          style={{ width: 140 }}
        />
        <Input
          className={styles.searchInput}
          placeholder="搜索任务..."
          prefix={<SearchOutlined style={{ color: '#999' }} />}
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          allowClear
          style={{ width: 220 }}
        />
      </div>

      {/* Task List */}
      <div className={styles.taskArea}>
        <TaskList
          tasks={filteredTasks}
          loading={loading}
          onRowClick={(task: Task) => setSelectedTask(task)}
        />
      </div>

      {/* Task Detail Panel */}
      <SlidePanel
        open={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        title={selectedTask?.title || '任务详情'}
        width={480}
      >
        {selectedTask && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Status & Priority */}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{
                padding: '2px 8px',
                borderRadius: 4,
                fontSize: 12,
                background: (TASK_STATUS_CONFIG[selectedTask.status as TaskStatus]?.color || '#8c8c8c') + '20',
                color: TASK_STATUS_CONFIG[selectedTask.status as TaskStatus]?.color || '#8c8c8c',
              }}>
                {TASK_STATUS_CONFIG[selectedTask.status as TaskStatus]?.label ?? '未知'}
              </span>
              <span style={{
                padding: '2px 8px',
                borderRadius: 4,
                fontSize: 12,
                background: (TASK_PRIORITY_CONFIG[selectedTask.priority as TaskPriority]?.color || '#8c8c8c') + '20',
                color: TASK_PRIORITY_CONFIG[selectedTask.priority as TaskPriority]?.color || '#8c8c8c',
              }}>
                {TASK_PRIORITY_CONFIG[selectedTask.priority as TaskPriority]?.label ?? '未知'}
              </span>
            </div>

            {/* Progress */}
            <div>
              <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 4 }}>进度</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ flex: 1, height: 6, background: '#f0f0f0', borderRadius: 3 }}>
                  <div style={{ width: `${selectedTask.progress || 0}%`, height: '100%', background: '#3366FF', borderRadius: 3 }} />
                </div>
                <span style={{ fontSize: 12, color: '#595959' }}>{selectedTask.progress || 0}%</span>
              </div>
            </div>

            {/* Key fields */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 16px' }}>
              <div>
                <div style={{ fontSize: 12, color: '#8c8c8c' }}>编号</div>
                <div style={{ fontSize: 14 }}>{selectedTask.taskNo ?? '-'}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: '#8c8c8c' }}>负责人</div>
                <div style={{ fontSize: 14 }}>{selectedTask.assigneeName ?? '-'}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: '#8c8c8c' }}>计划开始</div>
                <div style={{ fontSize: 14 }}>{selectedTask.plannedStart ?? '-'}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: '#8c8c8c' }}>计划结束</div>
                <div style={{ fontSize: 14 }}>{selectedTask.plannedEnd ?? '-'}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: '#8c8c8c' }}>所属项目</div>
                <div style={{ fontSize: 14 }}>{selectedTask.projectName ?? '-'}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: '#8c8c8c' }}>工期(天)</div>
                <div style={{ fontSize: 14 }}>{selectedTask.plannedDays ?? '-'}</div>
              </div>
            </div>

            {/* Description */}
            {selectedTask.description && (
              <div>
                <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 4 }}>描述</div>
                <div style={{ fontSize: 14, lineHeight: 1.6, color: '#262626' }}>{selectedTask.description}</div>
              </div>
            )}
          </div>
        )}
      </SlidePanel>

      {/* Reminder Settings Modal */}
      <Modal
        title="提醒设置"
        open={reminderModalOpen}
        onCancel={() => setReminderModalOpen(false)}
        onOk={() => {
          setReminderModalOpen(false);
          message.success('提醒设置已保存');
        }}
        okText="保存"
        cancelText="取消"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>启用提醒</span>
            <Switch checked={reminderEnabled} onChange={setReminderEnabled} />
          </div>
          <div>
            <div style={{ marginBottom: 8 }}>通知渠道</div>
            <Checkbox.Group
              value={channels}
              onChange={(val) => setChannels(val as string[])}
              options={[
                { label: '邮件', value: 'email' },
                { label: '应用内', value: 'inApp' },
                { label: '短信', value: 'sms' },
              ]}
            />
          </div>
          <div>
            <div style={{ marginBottom: 8 }}>提醒时间</div>
            <Radio.Group
              value={reminderTime}
              onChange={(e) => setReminderTime(e.target.value)}
              options={[
                { label: '提前1天', value: '1' },
                { label: '提前3天', value: '3' },
                { label: '提前7天', value: '7' },
              ]}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
