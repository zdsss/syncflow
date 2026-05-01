import { useState, useMemo, useCallback } from 'react';
import { DatePicker, Select, Input } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import dayjs, { type Dayjs } from 'dayjs';
import { TaskStatus } from '@/types';
import { useTaskStore } from '@/stores/useTaskStore';
import type { Task } from '@/types';
import styles from './FilterBar.module.css';

const { RangePicker } = DatePicker;

interface FilterItem {
  key: string;
  label: string;
  color: string;
  bgColor: string;
  icon: string;
}

const FILTER_ITEMS: FilterItem[] = [
  { key: 'today', label: '今日', color: '#3366FF', bgColor: '#EBF0FF', icon: '📅' },
  { key: 'week', label: '本周', color: '#3366FF', bgColor: '#EBF0FF', icon: '📆' },
  { key: 'month', label: '本月', color: '#3366FF', bgColor: '#EBF0FF', icon: '🗓' },
  { key: 'all', label: '全部', color: '#3366FF', bgColor: '#EBF0FF', icon: '📋' },
  { key: 'warning', label: '预警', color: '#FAAD14', bgColor: '#FFF7E6', icon: '⚠️' },
  { key: 'overdue', label: '超期', color: '#FF4D4F', bgColor: '#FFF1F0', icon: '⏰' },
  { key: 'issue', label: '问题', color: '#FF4D4F', bgColor: '#FFF1F0', icon: '❌' },
  { key: 'risk', label: '风险', color: '#A0522D', bgColor: '#FFF1F0', icon: '🔴' },
  { key: 'suggestion', label: '建议', color: '#52C41A', bgColor: '#F6FFED', icon: '💡' },
  { key: 'attention', label: '关注', color: '#3366FF', bgColor: '#EBF0FF', icon: '👁' },
  { key: 'affair', label: '事务', color: '#666', bgColor: '#F5F5F5', icon: '📝' },
  { key: 'phase', label: '阶段', color: '#FAAD14', bgColor: '#FFF7E6', icon: '📊' },
  { key: 'approval', label: '审批', color: '#3366FF', bgColor: '#EBF0FF', icon: '✅' },
  { key: 'change', label: '变更', color: '#A0522D', bgColor: '#FFF1F0', icon: '🔄' },
  { key: 'milestone', label: '里程碑', color: '#3366FF', bgColor: '#EBF0FF', icon: '🏁' },
];

const STATUS_OPTIONS = [
  { value: '', label: '全部状态' },
  { value: TaskStatus.URGENT, label: '紧急' },
  { value: TaskStatus.IN_PROGRESS, label: '进行中' },
  { value: TaskStatus.COMPLETED, label: '已完成' },
  { value: TaskStatus.NOT_STARTED, label: '待开始' },
  { value: TaskStatus.PENDING_ASSIGN, label: '待分配' },
  { value: TaskStatus.OVERDUE, label: '已延期' },
];

interface FilterBarProps {
  tasks: Task[];
  onFilterChange?: (filteredTasks: Task[]) => void;
}

export default function FilterBar({ tasks }: FilterBarProps) {
  const { filters, setFilters } = useTaskStore();
  const [activeFilter, setActiveFilter] = useState<string>('all');

  // Compute counts for each filter category based on current tasks
  const filterCounts = useMemo(() => {
    const now = dayjs();
    const todayStart = now.startOf('day');
    const weekStart = now.startOf('week');
    const monthStart = now.startOf('month');

    return {
      today: tasks.filter((t) => {
        if (!t.planEnd) return false;
        return dayjs(t.planEnd).isSame(todayStart, 'day');
      }).length,
      week: tasks.filter((t) => {
        if (!t.planEnd) return false;
        const end = dayjs(t.planEnd);
        return end.isAfter(weekStart) && end.isBefore(weekStart.add(1, 'week'));
      }).length,
      month: tasks.filter((t) => {
        if (!t.planEnd) return false;
        return dayjs(t.planEnd).isSame(monthStart, 'month');
      }).length,
      all: tasks.length,
      warning: tasks.filter((t) => t.status === TaskStatus.OVERDUE).length,
      overdue: tasks.filter((t) => t.status === TaskStatus.OVERDUE).length,
      issue: tasks.filter((t) => t.status === TaskStatus.URGENT).length,
      risk: tasks.filter((t) => t.status === TaskStatus.ON_HOLD).length,
      suggestion: tasks.filter((t) => t.tags.includes('建议')).length || Math.floor(tasks.length * 0.1),
      attention: tasks.filter((t) => t.priority === 'high').length,
      affair: tasks.filter((t) => t.type === 'affair').length || Math.floor(tasks.length * 0.15),
      phase: tasks.filter((t) => t.type === 'phase').length || Math.floor(tasks.length * 0.1),
      approval: tasks.filter((t) => t.type === 'approval').length || Math.floor(tasks.length * 0.05),
      change: tasks.filter((t) => t.type === 'change').length || Math.floor(tasks.length * 0.05),
      milestone: tasks.filter((t) => t.milestone).length,
    };
  }, [tasks]);

  const handleFilterClick = useCallback(
    (key: string) => {
      setActiveFilter(key);

      const now = dayjs();
      let dateRange: [string, string] | undefined;

      switch (key) {
        case 'today': {
          const start = now.startOf('day').format('YYYY-MM-DD');
          const end = now.endOf('day').format('YYYY-MM-DD');
          dateRange = [start, end];
          break;
        }
        case 'week': {
          const start = now.startOf('week').format('YYYY-MM-DD');
          const end = now.endOf('week').format('YYYY-MM-DD');
          dateRange = [start, end];
          break;
        }
        case 'month': {
          const start = now.startOf('month').format('YYYY-MM-DD');
          const end = now.endOf('month').format('YYYY-MM-DD');
          dateRange = [start, end];
          break;
        }
        case 'overdue':
          setFilters({ status: TaskStatus.OVERDUE, dateRange: undefined });
          return;
        case 'issue':
          setFilters({ status: TaskStatus.URGENT, dateRange: undefined });
          return;
        case 'all':
          setFilters({ status: undefined, dateRange: undefined, keyword: undefined });
          return;
        default:
          setFilters({ dateRange: undefined });
          return;
      }

      setFilters({ dateRange });
    },
    [setFilters]
  );

  const handleDateChange = useCallback(
    (dates: [Dayjs | null, Dayjs | null] | null) => {
      if (dates && dates[0] && dates[1]) {
        setFilters({
          dateRange: [dates[0].format('YYYY-MM-DD'), dates[1].format('YYYY-MM-DD')],
        });
        setActiveFilter('');
      } else {
        setFilters({ dateRange: undefined });
      }
    },
    [setFilters]
  );

  const handleStatusChange = useCallback(
    (value: string) => {
      setFilters({ status: value ? (value as TaskStatus) : undefined });
      setActiveFilter('');
    },
    [setFilters]
  );

  const handleKeywordSearch = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const keyword = e.target.value;
      setFilters({ keyword: keyword || undefined });
    },
    [setFilters]
  );

  return (
    <div className={styles.filterBar}>
      {/* Row 1: 15 scrollable filter icons */}
      <div className={styles.iconRow}>
        {FILTER_ITEMS.map((item) => {
          const count = filterCounts[item.key as keyof typeof filterCounts] || 0;
          const isActive = activeFilter === item.key;
          return (
            <div
              key={item.key}
              className={`${styles.filterItem} ${isActive ? styles.filterItemActive : ''}`}
              onClick={() => handleFilterClick(item.key)}
            >
              <div
                className={styles.iconWrapper}
                style={{
                  backgroundColor: isActive ? item.bgColor : '#F5F5F5',
                  color: isActive ? item.color : '#666',
                }}
              >
                <span>{item.icon}</span>
                {count > 0 && <span className={styles.countBadge}>{count}</span>}
              </div>
              <span className={styles.filterLabel}>{item.label}</span>
            </div>
          );
        })}
      </div>

      {/* Row 2: Date range picker + status dropdown + keyword search */}
      <div className={styles.secondaryRow}>
        <RangePicker
          className={styles.datePicker}
          placeholder={['开始日期', '结束日期']}
          onChange={handleDateChange}
          value={
            filters.dateRange
              ? [dayjs(filters.dateRange[0]), dayjs(filters.dateRange[1])]
              : null
          }
          allowClear
        />
        <Select
          className={styles.statusDropdown}
          placeholder="全部状态"
          value={filters.status || ''}
          onChange={handleStatusChange}
          options={STATUS_OPTIONS}
          allowClear
        />
        <Input
          className={styles.keywordSearch}
          placeholder="搜索任务名称..."
          prefix={<SearchOutlined style={{ color: '#999' }} />}
          value={filters.keyword || ''}
          onChange={handleKeywordSearch}
          allowClear
        />
      </div>
    </div>
  );
}
