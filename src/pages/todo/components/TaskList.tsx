import { useState, useCallback, useMemo, useEffect } from 'react';
import { Table, Select, Pagination, Modal, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { AimOutlined, StarOutlined, StarFilled, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { Task } from '@/types';
import { TaskStatus, TaskPriority } from '@/types';
import { TASK_STATUS_CONFIG, TASK_PRIORITY_CONFIG } from '@/constants/enums';
import { useTaskStore } from '@/stores/useTaskStore';
import { getUsers } from '@/services/config.service';
import styles from './TaskList.module.css';

const ALL_STATUSES = [
  TaskStatus.PENDING,
  TaskStatus.IN_PROGRESS,
  TaskStatus.PENDING_REVIEW,
  TaskStatus.COMPLETED,
  TaskStatus.CANCELLED,
];

interface TaskListProps {
  tasks: Task[];
  loading: boolean;
  favorites?: string[];
  onToggleFavorite?: (id: string) => void;
  onRowClick?: (task: Task) => void;
}

export default function TaskList({ tasks = [], loading, favorites = [], onToggleFavorite, onRowClick }: TaskListProps) {
  const { pageNum, pageSize, setPagination, updateTask, changeStatus: storeChangeStatus, completeTask: storeCompleteTask } = useTaskStore();
  const [changingStatus, setChangingStatus] = useState<string | null>(null);
  const [assigningTask, setAssigningTask] = useState<string | null>(null);
  const [users, setUsers] = useState<Array<{ id: string; name: string; email: string }>>([]);

  useEffect(() => {
    getUsers()
      .then((res) => {
        if (res.code === 0) {
          const userData = res.data as { records?: Array<{ id: string; name: string; email: string }> } | Array<{ id: string; name: string; email: string }>;
          setUsers(Array.isArray(userData) ? userData : userData?.records ?? []);
        }
      })
      .catch(() => {
        // Silently handle - users list is optional
      });
  }, []);

  // Paginate the tasks received from parent (parent handles all filtering)
  const paginatedTasks = useMemo(() => {
    const start = (pageNum - 1) * pageSize;
    return tasks.slice(start, start + pageSize);
  }, [tasks, pageNum, pageSize]);

  const handlePageChange = useCallback(
    (newPage: number, newPageSize: number) => {
      setPagination(newPage, newPageSize);
    },
    [setPagination]
  );

  const handleStatusChange = useCallback(
    async (taskId: string, newStatus: TaskStatus) => {
      try {
        const statusNum = Number(newStatus) as TaskStatus;
        if (statusNum === TaskStatus.COMPLETED) {
          await storeCompleteTask(Number(taskId));
          message.success('任务已提交完成');
        } else {
          await storeChangeStatus(Number(taskId), statusNum);
          message.success('状态已更新');
        }
      } catch {
        message.error('状态更新失败');
      }
      setChangingStatus(null);
    },
    [storeChangeStatus, storeCompleteTask]
  );

  const handleAssignChange = useCallback(
    async (taskId: number, newUserId: number) => {
      try {
        updateTask(taskId, { assigneeId: newUserId });
        message.success('负责人已更新');
      } catch {
        message.error('负责人更新失败');
      }
      setAssigningTask(null);
    },
    [updateTask]
  );

  const TAG_COLORS: Record<string, string> = {
    '紧急': '#FF4D4F',
    '前端': '#3366FF',
    '后端': '#52C41A',
    '设计': '#722ED1',
    '测试': '#FAAD14',
    '运维': '#13C2C2',
    '文档': '#666',
  };

  const columns: ColumnsType<Task> = [
    {
      title: '',
      key: 'favorite',
      width: 40,
      render: (_: unknown, record: Task) => (
        <span
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite?.(record.id);
          }}
          style={{ cursor: 'pointer' }}
          data-testid={`task-fav-${record.id}`}
        >
          {favorites.includes(record.id) ? (
            <StarFilled style={{ color: '#FAAD14' }} />
          ) : (
            <StarOutlined style={{ color: '#ccc' }} />
          )}
        </span>
      ),
    },
    {
      title: '编号',
      dataIndex: 'taskNo',
      key: 'taskNo',
      width: 100,
      render: (code: string) => (
        <span className={styles.taskCode}>{code || '-'}</span>
      ),
    },
    {
      title: '任务名称',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      render: (title: string, record: Task) => (
        <div>
          <span className={styles.taskName}>{title}</span>
          {record.milestoneId && (
            <AimOutlined className={styles.milestoneIcon} data-testid="milestone-icon" />
          )}
          {record.tags && record.tags.length > 0 && (
            <div className={styles.tagsRow}>
              {(Array.isArray(record.tags) ? record.tags : record.tags.split(',').filter(Boolean)).map((tag) => (
                <span
                  key={tag}
                  className={styles.tagBadge}
                  style={{ backgroundColor: TAG_COLORS[tag] || '#888' }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      ),
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
      width: 120,
      render: (assigneeId: string, record: Task) => {
        const assigneeUser = users.find((u) => u.id === assigneeId);
        const displayName = assigneeUser ? assigneeUser.name : assigneeId;

        if (assigningTask === record.id) {
          return (
            <Select
              size="small"
              defaultValue={assigneeId}
              style={{ width: 110 }}
              onChange={(val) => handleAssignChange(record.id, val as number)}
              onBlur={() => setAssigningTask(null)}
              autoFocus
              options={users.map((u) => ({
                value: u.id,
                label: u.name,
              }))}
            />
          );
        }
        return (
          <span
            className={styles.assignee}
            onClick={(e) => {
              e.stopPropagation();
              setAssigningTask(record.id);
            }}
            title="点击更改负责人"
          >
            {displayName}
          </span>
        );
      },
    },
    {
      title: '截止日期',
      dataIndex: 'plannedEnd',
      key: 'plannedEnd',
      width: 100,
      render: (date: string) =>
        date ? <span className={styles.dueDate}>{dayjs(date).format('MM/DD')}</span> : '-',
    },
    {
      title: '操作',
      key: 'actions',
      width: 80,
      render: (_: unknown, record: Task) => (
        <div style={{ display: 'flex', gap: 8 }}>
          <EditOutlined
            data-testid="edit-btn"
            style={{ color: '#3366FF', cursor: 'pointer' }}
            onClick={(e) => {
              e.stopPropagation();
              onRowClick?.(record);
            }}
          />
          <DeleteOutlined
            data-testid="delete-btn"
            style={{ color: '#FF4D4F', cursor: 'pointer' }}
            onClick={(e) => {
              e.stopPropagation();
              Modal.confirm({
                title: '确认删除',
                content: `确定要删除任务「${record.title}」吗？此操作不可撤销。`,
                okText: '删除',
                okType: 'danger',
                cancelText: '取消',
                onOk: async () => {
                  try {
                    await useTaskStore.getState().deleteTask(Number(record.id));
                    message.success('任务已删除');
                  } catch {
                    message.error('删除失败');
                  }
                },
              });
            }}
          />
        </div>
      ),
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
          scroll={{ x: 'max-content' }}
          onRow={onRowClick ? (record) => ({
            onClick: () => onRowClick(record),
            style: { cursor: 'pointer' },
          }) : undefined}
        />
      </div>
      <div className={styles.paginationWrapper}>
        <Pagination
          current={pageNum}
          pageSize={pageSize}
          total={tasks.length}
          showSizeChanger
          showQuickJumper
          showTotal={(total) => `共 ${total} 条`}
          onChange={handlePageChange}
        />
      </div>
    </div>
  );
}
