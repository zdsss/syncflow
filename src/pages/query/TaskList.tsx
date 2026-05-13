import { Input, Tag } from 'antd';
import { SearchOutlined, StarOutlined, StarFilled, FileTextOutlined, EditOutlined } from '@ant-design/icons';
import { useState } from 'react';
import styles from './QueryPage.module.css';

export interface TaskItem {
  id: string;
  code: string;
  name: string;
  status: string;
  statusLabel: string;
  priority: string;
  priorityLabel: string;
  assignee: string;
  dueDate: string;
  overdue?: boolean;
  progress: number;
  starred: boolean;
}

type FilterTab = 'all' | 'incomplete' | 'completed';

const STATUS_COLORS: Record<string, string> = {
  '进行中': 'processing',
  '已完成': 'success',
  '未开始': 'default',
  '逾期': 'error',
  '审批中': 'warning',
  '待分配': 'default',
};

const PRIORITY_COLORS: Record<string, string> = {
  '紧急': 'red',
  '高': 'orange',
  '中': 'blue',
  '低': 'green',
};

const FILTER_TABS: { key: FilterTab; label: string; count: number }[] = [
  { key: 'all', label: '全部', count: 8 },
  { key: 'incomplete', label: '未完成', count: 5 },
  { key: 'completed', label: '已完成', count: 3 },
];

const MOCK_TASKS: TaskItem[] = [
  { id: '1', code: 'P3-L2-010', name: '电芯来料异常处理', status: '进行中', statusLabel: '进行中', priority: '紧急', priorityLabel: '紧急', assignee: '邓智豪', dueDate: '2026/05/10', overdue: false, progress: 40, starred: true },
  { id: '2', code: 'P3-L2-011', name: '模组焊接工艺验证', status: '进行中', statusLabel: '进行中', priority: '高', priorityLabel: '高', assignee: '李明', dueDate: '2026/05/12', overdue: false, progress: 50, starred: false },
  { id: '3', code: 'P3-L2-012', name: 'Pack组装线平衡优化', status: '已完成', statusLabel: '已完成', priority: '中', priorityLabel: '中', assignee: '王芳', dueDate: '2026/05/08', overdue: false, progress: 100, starred: false },
  { id: '4', code: 'P3-L2-013', name: 'BMS固件升级测试', status: '逾期', statusLabel: '逾期', priority: '紧急', priorityLabel: '紧急', assignee: '张伟', dueDate: '2026/04/30', overdue: true, progress: 30, starred: true },
  { id: '5', code: 'P3-L2-014', name: '热管理方案评审', status: '审批中', statusLabel: '审批中', priority: '高', priorityLabel: '高', assignee: '陈静', dueDate: '2026/05/15', overdue: false, progress: 60, starred: false },
];

interface TaskListProps {
  onTaskSelect?: (task: TaskItem) => void;
  selectedTaskId?: string;
}

export default function TaskList({ onTaskSelect, selectedTaskId }: TaskListProps) {
  const [searchValue, setSearchValue] = useState('');
  const [filterTab, setFilterTab] = useState<FilterTab>('all');

  const filteredTasks = MOCK_TASKS.filter((t) => {
    const matchesSearch = !searchValue || t.code.includes(searchValue) || t.name.includes(searchValue) || t.assignee.includes(searchValue);
    const matchesFilter = filterTab === 'all' || (filterTab === 'completed' && t.status === '已完成') || (filterTab === 'incomplete' && t.status !== '已完成');
    return matchesSearch && matchesFilter;
  });

  return (
    <div className={styles.taskListPanel} data-testid="task-list">
      {/* Header: title + search on same row */}
      <div className={styles.taskListHeader}>
        <div className={styles.headerRow}>
          <h2 className={styles.taskListTitle}>综合查询</h2>
          <Input
            className={styles.searchInput}
            placeholder="搜索任务编码、名称、负责人"
            prefix={<SearchOutlined />}
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            allowClear
            style={{ width: 260 }}
          />
        </div>
        <div className={styles.filterTabs} data-testid="filter-tabs">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.key}
              className={`${styles.filterTab} ${filterTab === tab.key ? styles.activeFilterTab : ''}`}
              onClick={() => setFilterTab(tab.key)}
            >
              {tab.label}({tab.count})
            </button>
          ))}
        </div>
      </div>
      <div className={styles.taskListContent}>
        {filteredTasks.map((task) => (
          <div
            key={task.id}
            className={`${styles.taskCard} ${selectedTaskId === task.id ? styles.activeTaskCard : ''}`}
            onClick={() => onTaskSelect?.(task)}
            data-testid={`task-card-${task.id}`}
          >
            {/* Row 1: code + tags + action icons */}
            <div className={styles.taskCardHeader}>
              <div className={styles.taskCardLeft}>
                <span className={styles.taskCode}>{task.code}</span>
                <Tag data-testid={`status-tag-${task.id}`} color={STATUS_COLORS[task.status] || 'default'}>{task.statusLabel}</Tag>
                <Tag data-testid={`priority-tag-${task.id}`} color={PRIORITY_COLORS[task.priority] || 'default'}>{task.priorityLabel}</Tag>
              </div>
              <div className={styles.taskCardActions}>
                <span
                  className={styles.starIcon}
                  data-testid={`star-icon-${task.id}`}
                  onClick={(e) => e.stopPropagation()}
                >
                  {task.starred ? <StarFilled style={{ color: '#fadb14' }} /> : <StarOutlined />}
                </span>
                <span className={styles.actionIcon} data-testid={`file-icon-${task.id}`} onClick={(e) => e.stopPropagation()}>
                  <FileTextOutlined />
                </span>
                <span className={styles.actionIcon} data-testid={`edit-icon-${task.id}`} onClick={(e) => e.stopPropagation()}>
                  <EditOutlined />
                </span>
              </div>
            </div>
            {/* Row 2: task name */}
            <div className={styles.taskName}>{task.name}</div>
            {/* Row 3: assignee + progress + date, right-aligned */}
            <div className={styles.taskMeta}>
              <span className={styles.taskAssignee}>{task.assignee}</span>
              <span className={styles.taskProgress} data-testid={`progress-${task.id}`}>{task.progress}%</span>
              <span className={`${styles.taskDueDate} ${task.overdue ? styles.overdueDate : ''}`}>{task.dueDate}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
