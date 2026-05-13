import { useState, useMemo } from 'react';
import {
  UnorderedListOutlined,
  CalendarOutlined,
  RobotOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { Button, Input } from 'antd';
import dayjs from 'dayjs';
import type { Task } from '@/types';
import { TaskStatus, TaskPriority } from '@/types';
import { TASK_STATUS_CONFIG, TASK_PRIORITY_CONFIG } from '@/constants/enums';
import TaskCard from './TaskCard';
import styles from './TodoPanel.module.css';

interface TodoPanelProps {
  tasks: Task[];
  loading?: boolean;
  taskCounts?: Record<string, number>;
}

const FILTER_CHIPS = [
  { key: 'all', label: '全部' },
  { key: 'today', label: '今天' },
  { key: 'week', label: '本周' },
  { key: 'overdue', label: '逾期' },
  { key: 'warning', label: '预警' },
  { key: 'risk', label: '风险' },
];

export default function TodoPanel({ tasks, loading }: TodoPanelProps) {
  const [activeTab, setActiveTab] = useState<'my' | 'all'>('all');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');

  const filteredTasks = useMemo(() => {
    let result = tasks;
    if (searchKeyword) {
      result = result.filter((t) =>
        (t.title || t.name || '').toLowerCase().includes(searchKeyword.toLowerCase())
      );
    }
    if (activeFilter !== 'all') {
      const now = dayjs();
      result = result.filter((t) => {
        switch (activeFilter) {
          case 'today':
            return t.plannedEnd && dayjs(t.plannedEnd).isSame(now, 'day');
          case 'week': {
            const weekEnd = now.endOf('week');
            return t.plannedEnd && dayjs(t.plannedEnd).isBefore(weekEnd);
          }
          case 'month':
            return t.plannedEnd && dayjs(t.plannedEnd).isSame(now, 'month');
          case 'overdue':
            return t.status === TaskStatus.OVERDUE || t.isOverdue;
          case 'warning':
            return t.isWarning;
          case 'risk':
            return t.priority === TaskPriority.URGENT || t.priority === TaskPriority.HIGH;
          default:
            return true;
        }
      });
    }
    return result;
  }, [tasks, activeFilter, searchKeyword]);

  return (
    <div className={styles.panel} data-testid="todo-panel">
      {/* Action bar */}
      <div className={styles.actionBar} data-testid="todo-action-bar">
        <div className={styles.viewToggle}>
          <button
            type="button"
            className={`${styles.viewBtn} ${viewMode === 'list' ? styles.viewBtnActive : ''}`}
            onClick={() => setViewMode('list')}
            data-testid="view-list-btn"
          >
            <UnorderedListOutlined />
          </button>
          <button
            type="button"
            className={`${styles.viewBtn} ${viewMode === 'calendar' ? styles.viewBtnActive : ''}`}
            onClick={() => setViewMode('calendar')}
            data-testid="view-calendar-btn"
          >
            <CalendarOutlined />
          </button>
        </div>
        <div className={styles.actionIcons}>
          <Button type="primary" size="small" icon={<RobotOutlined />} data-testid="ai-assistant-btn">
            AI助手
          </Button>
          <button
            type="button"
            className={styles.iconBtn}
            onClick={() => setSearchVisible(!searchVisible)}
            data-testid="search-btn"
          >
            <SearchOutlined />
          </button>
        </div>
      </div>

      {/* Search */}
      {searchVisible && (
        <div className={styles.searchBar}>
          <Input
            size="small"
            placeholder="搜索任务..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            data-testid="search-input"
          />
        </div>
      )}

      {/* Tabs */}
      <div className={styles.tabBar} data-testid="todo-tabs">
        <div className={styles.tabs}>
          <button
            type="button"
            className={`${styles.tab} ${activeTab === 'my' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('my')}
            data-testid="tab-my"
          >
            我的任务
          </button>
          <button
            type="button"
            className={`${styles.tab} ${activeTab === 'all' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('all')}
            data-testid="tab-all"
          >
            所有任务
          </button>
        </div>
        <span className={styles.taskCount} data-testid="task-count">
          共{filteredTasks.length}个任务
        </span>
      </div>

      {/* Filter chips */}
      <div className={styles.filterRow} data-testid="filter-chips">
        {FILTER_CHIPS.map((chip) => (
          <button
            key={chip.key}
            type="button"
            className={`${styles.chip} ${activeFilter === chip.key ? styles.chipActive : ''}`}
            onClick={() => setActiveFilter(chip.key)}
            data-testid={`chip-${chip.key}`}
          >
            {chip.label}
</button>
        ))}
      </div>

      {/* Task list */}
      <div className={styles.taskList} data-testid="task-list">
        {loading ? (
          <div className={styles.loading}>加载中...</div>
        ) : filteredTasks.length === 0 ? (
          <div className={styles.empty}>暂无任务</div>
        ) : (
          filteredTasks.map((task) => {
            const statusCfg = TASK_STATUS_CONFIG[task.status];
            const priorityCfg = TASK_PRIORITY_CONFIG[task.priority];
            return (
              <TaskCard
                key={task.id}
                id={task.id}
                code={task.taskNo}
                name={task.title || task.name || ''}
                status={task.status}
                statusLabel={statusCfg?.label || String(task.status)}
                statusColor={statusCfg?.color || '#8C8C8C'}
                priority={task.priority}
                priorityLabel={priorityCfg?.label || String(task.priority)}
                priorityColor={priorityCfg?.color || '#8C8C8C'}
                assignee={task.assigneeName}
                dueDate={task.plannedEnd}
              />
            );
          })
        )}
      </div>
    </div>
  );
}
