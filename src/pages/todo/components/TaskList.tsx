import { useState, useCallback, useMemo } from 'react';
import { Table, Select, Pagination, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import type { Task } from '@/types';
import { TaskStatus, TaskPriority } from '@/types';
import { TASK_STATUS_CONFIG, TASK_PRIORITY_CONFIG } from '@/constants/enums';
import { useTaskStore } from '@/stores/useTaskStore';
import styles from './TaskList.module.css';

const ALL_STATUSES = [
  TaskStatus.PENDING_ASSIGN,
  TaskStatus.NOT_STARTED,
  TaskStatus.IN_PROGRESS,
  TaskStatus.ON_HOLD,
  TaskStatus.COMPLETED,
  TaskStatus.OVERDUE,
  TaskStatus.CANCELLED,
  TaskStatus.URGENT,
];

interface TaskListProps {
  tasks: Task[];
  loading: boolean;
}

export default function TaskList({ tasks, loading }: TaskListProps) {
  const { filters, page, pageSize, total, setPagination, updateTask } = useTaskStore();
  const [editingProgress, setEditingProgress] = useState<string | null>(null);
  const [progressValue, setProgressValue] = useState<number>(0);
  const [changingStatus, setChangingStatus] = useState<string | null>(null);

  // Apply client-side filtering on the passed tasks
  const filteredTasks = useMemo(() => {
    let result = [...tasks];

    if (filters.status) {
      result = result.filter((t) => t.status === filters.status);
    }
    if (filters.priority) {
      result = result.filter((t) => t.priority === filters.priority);
    }
    if (filters.keyword) {
      const kw = filters.keyword.toLowerCase();
      result = result.filter((t) => t.name.toLowerCase().includes(kw));
    }
    if (filters.dateRange) {
      const [start, end] = filters.dateRange;
      result = result.filter((t) => {
        if (!t.planEnd) return false;
        const planEnd = dayjs(t.planEnd);
        return planEnd.isAfter(dayjs(start).subtract(1, 'day')) && planEnd.isBefore(dayjs(end).add(1, 'day'));
      });
    }

    return result;
  }, [tasks, filters]);

  // Paginate
  const paginatedTasks = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredTasks.slice(start, start + pageSize);
  }, [filteredTasks, page, pageSize]);

  const handlePageChange = useCallback(
    (newPage: number, newPageSize: number) => {
      setPagination(newPage, newPageSize);
    },
    [setPagination]
  );

  const handleStatusChange = useCallback(
    async (taskId: string, newStatus: TaskStatus) => {
      try {
        updateTask(taskId, { status: newStatus });
        if (newStatus === TaskStatus.COMPLETED) {
          updateTask(taskId, { progress: 100 });
        }
        message.success('状态已更新');
      } catch {
        message.error('状态更新失败');
      }
      setChangingStatus(null);
    },
    [updateTask]
  );

  const handleProgressEdit = useCallback(
    (taskId: string, currentProgress: number) => {
      setEditingProgress(taskId);
      setProgressValue(currentProgress);
    },
    []
  );

  const handleProgressSave = useCallback(
    (taskId: string) => {
      const value = Math.min(100, Math.max(0, progressValue));
      updateTask(taskId, { progress: value });
      if (value === 100) {
        updateTask(taskId, { status: TaskStatus.COMPLETED });
      }
      setEditingProgress(null);
      message.success('进度已更新');
    },
    [progressValue, updateTask]
  );

  const getProgressColor = (progress: number, status: TaskStatus): string => {
    if (status === TaskStatus.COMPLETED) return '#52C41A';
    if (status === TaskStatus.OVERDUE) return '#A0522D';
    if (status === TaskStatus.URGENT) return '#FF4D4F';
    if (progress < 30) return '#FF4D4F';
    if (progress < 70) return '#FAAD14';
    return '#3366FF';
  };

  const columns: ColumnsType<Task> = [
    {
      title: '任务名称',
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
      render: (name: string) => <span className={styles.taskName}>{name}</span>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: TaskStatus, record: Task) => {
        const config = TASK_STATUS_CONFIG[status];
        if (changingStatus === record.id) {
          return (
            <Select
              size="small"
              defaultValue={status}
              style={{ width: 90 }}
              onChange={(val) => handleStatusChange(record.id, val as TaskStatus)}
              onBlur={() => setChangingStatus(null)}
              autoFocus
              options={ALL_STATUSES.map((s) => ({
                value: s,
                label: TASK_STATUS_CONFIG[s].label,
              }))}
            />
          );
        }
        return (
          <span
            className={styles.statusBadge}
            style={{ color: config.color, backgroundColor: config.bgColor }}
            onClick={(e) => {
              e.stopPropagation();
              setChangingStatus(record.id);
            }}
            title="点击切换状态"
          >
            {config.label}
          </span>
        );
      },
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 80,
      render: (priority: TaskPriority) => {
        const config = TASK_PRIORITY_CONFIG[priority];
        return (
          <span
            className={styles.priorityBadge}
            style={{ color: config.color, backgroundColor: config.bgColor }}
          >
            {config.label}
          </span>
        );
      },
    },
    {
      title: '负责人',
      dataIndex: 'assigneeId',
      key: 'assigneeId',
      width: 100,
      render: (assigneeId: string) => (
        <span className={styles.assignee}>{assigneeId}</span>
      ),
    },
    {
      title: '截止日期',
      dataIndex: 'planEnd',
      key: 'planEnd',
      width: 100,
      render: (date: string) =>
        date ? <span className={styles.dueDate}>{dayjs(date).format('MM/DD')}</span> : '-',
    },
    {
      title: '进度',
      dataIndex: 'progress',
      key: 'progress',
      width: 150,
      render: (progress: number, record: Task) => {
        if (editingProgress === record.id) {
          return (
            <input
              className={styles.progressInput}
              type="number"
              min={0}
              max={100}
              value={progressValue}
              onChange={(e) => setProgressValue(Number(e.target.value))}
              onBlur={() => handleProgressSave(record.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleProgressSave(record.id);
                if (e.key === 'Escape') setEditingProgress(null);
              }}
              autoFocus
            />
          );
        }
        return (
          <div className={styles.progressCell}>
            <div
              className={styles.progressBar}
              onClick={(e) => {
                e.stopPropagation();
                handleProgressEdit(record.id, progress);
              }}
              title="点击编辑进度"
            >
              <div
                className={styles.progressFill}
                style={{
                  width: `${progress}%`,
                  backgroundColor: getProgressColor(progress, record.status),
                }}
              />
            </div>
            <span className={styles.progressText}>{progress}%</span>
          </div>
        );
      },
    },
  ];

  return (
    <div className={styles.taskListWrapper}>
      <div className={styles.tableWrapper}>
        <Table<Task>
          columns={columns}
          dataSource={paginatedTasks}
          rowKey="id"
          loading={loading}
          pagination={false}
          size="middle"
        />
      </div>
      <div className={styles.paginationWrapper}>
        <Pagination
          current={page}
          pageSize={pageSize}
          total={filteredTasks.length}
          showSizeChanger
          showQuickJumper
          showTotal={(total) => `共 ${total} 条`}
          onChange={handlePageChange}
        />
      </div>
    </div>
  );
}
