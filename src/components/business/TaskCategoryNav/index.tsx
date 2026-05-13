import { useMemo } from 'react';
import { Badge } from 'antd';
import { useAuthStore } from '@/stores/useAuthStore';
import {
  AppstoreOutlined,
  CalendarOutlined,
  CalendarTwoTone,
  ClockCircleOutlined,
  WarningOutlined,
  FieldTimeOutlined,
  FlagOutlined,
  CheckSquareOutlined,
  ExclamationCircleOutlined,
  AlertOutlined,
  BulbOutlined,
  ThunderboltOutlined,
  SwapOutlined,
  StarOutlined,
  AimOutlined,
  UserOutlined,
} from '@ant-design/icons';
import type { Task } from '@/types';
import type { ReactNode } from 'react';
import styles from './TaskCategoryNav.module.css';

// ---------------------------------------------------------------------------
// Category definitions
// ---------------------------------------------------------------------------
export type CategoryKey =
  | 'all'
  | 'myTasks'
  | 'today'
  | 'thisWeek'
  | 'thisMonth'
  | 'warning'
  | 'overdue'
  | 'stage'
  | 'task'
  | 'issue'
  | 'risk'
  | 'suggestion'
  | 'activity'
  | 'change'
  | 'followed'
  | 'milestone';

export interface CategoryItem {
  key: CategoryKey;
  label: string;
  icon: ReactNode;
  group: string;
}

export const CATEGORIES: CategoryItem[] = [
  // General
  { key: 'all', label: '全部任务', icon: <AppstoreOutlined />, group: '通用' },
  { key: 'myTasks', label: '指派给我', icon: <UserOutlined />, group: '通用' },
  // Time range
  { key: 'today', label: '今日', icon: <CalendarOutlined />, group: '时间范围' },
  { key: 'thisWeek', label: '本周', icon: <CalendarTwoTone />, group: '时间范围' },
  { key: 'thisMonth', label: '本月', icon: <ClockCircleOutlined />, group: '时间范围' },
  // System alerts
  { key: 'warning', label: '预警', icon: <WarningOutlined />, group: '系统提醒' },
  { key: 'overdue', label: '超期', icon: <FieldTimeOutlined />, group: '系统提醒' },
  // Task type
  { key: 'stage', label: '阶段', icon: <FlagOutlined />, group: '任务类型' },
  { key: 'task', label: '任务', icon: <CheckSquareOutlined />, group: '任务类型' },
  { key: 'issue', label: '问题', icon: <ExclamationCircleOutlined />, group: '任务类型' },
  { key: 'risk', label: '风险', icon: <AlertOutlined />, group: '任务类型' },
  { key: 'suggestion', label: '建议', icon: <BulbOutlined />, group: '任务类型' },
  { key: 'activity', label: '活动', icon: <ThunderboltOutlined />, group: '任务类型' },
  { key: 'change', label: '变更', icon: <SwapOutlined />, group: '任务类型' },
  // User marks
  { key: 'followed', label: '关注', icon: <StarOutlined />, group: '用户标记' },
  { key: 'milestone', label: '里程碑', icon: <AimOutlined />, group: '用户标记' },
];

// Group order for rendering
const GROUP_ORDER = ['通用', '时间范围', '系统提醒', '任务类型', '用户标记'];

// ---------------------------------------------------------------------------
// Count computation
// ---------------------------------------------------------------------------
function computeCounts(tasks: Task[], currentUserId?: number): Record<CategoryKey, number> {
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);

  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - ((now.getDay() + 6) % 7)); // Monday
  const startOfWeekStr = startOfWeek.toISOString().slice(0, 10);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfMonthStr = startOfMonth.toISOString().slice(0, 10);

  const typeMap: Record<string, CategoryKey> = {
    STAGE: 'stage',
    TASK: 'task',
    ISSUE: 'issue',
    RISK: 'risk',
    SUGGESTION: 'suggestion',
    ACTIVITY: 'activity',
    CHANGE: 'change',
  };

  const counts: Record<CategoryKey, number> = {
    all: 0,
    myTasks: 0,
    today: 0,
    thisWeek: 0,
    thisMonth: 0,
    warning: 0,
    overdue: 0,
    stage: 0,
    task: 0,
    issue: 0,
    risk: 0,
    suggestion: 0,
    activity: 0,
    change: 0,
    followed: 0,
    milestone: 0,
  };

  for (const t of tasks) {
    counts.all++;
    if (currentUserId && t.assigneeId === currentUserId) counts.myTasks++;
    const planDate = t.plannedEnd?.slice(0, 10);
    if (planDate === todayStr) counts.today++;
    if (planDate && planDate >= startOfWeekStr) counts.thisWeek++;
    if (planDate && planDate >= startOfMonthStr) counts.thisMonth++;
    if (t.isWarning) counts.warning++;
    if (t.isOverdue) counts.overdue++;
    const typeKey = typeMap[t.type?.toUpperCase()];
    if (typeKey) counts[typeKey]++;
    if (t.isWatching) counts.followed++;
    if (t.type === 'MILESTONE') counts.milestone++;
  }

  return counts;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface TaskCategoryNavProps {
  tasks: Task[];
  activeCategory: CategoryKey;
  onCategoryChange: (key: CategoryKey) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function TaskCategoryNav({
  tasks,
  activeCategory,
  onCategoryChange,
}: TaskCategoryNavProps) {
  const { currentUser } = useAuthStore();
  const counts = useMemo(() => computeCounts(tasks, currentUser?.id as number | undefined), [tasks, currentUser?.id]);

  // Group categories
  const grouped = useMemo(() => {
    const map = new Map<string, CategoryItem[]>();
    for (const cat of CATEGORIES) {
      const arr = map.get(cat.group) || [];
      arr.push(cat);
      map.set(cat.group, arr);
    }
    return GROUP_ORDER.filter((g) => map.has(g)).map((g) => ({
      group: g,
      items: map.get(g)!,
    }));
  }, []);

  return (
    <nav className={styles.nav} data-testid="task-category-nav">
      {grouped.map(({ group, items }) => (
        <div key={group} className={styles.group}>
          <div className={styles.groupTitle}>{group}</div>
          {items.map((item) => {
            const isActive = activeCategory === item.key;
            const count = counts[item.key];
            return (
              <div
                key={item.key}
                className={`${styles.item} ${isActive ? styles.itemActive : ''}`}
                onClick={() => onCategoryChange(item.key)}
                data-testid={`category-${item.key}`}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') onCategoryChange(item.key);
                }}
              >
                <span className={styles.icon}>{item.icon}</span>
                <span className={styles.label}>{item.label}</span>
                {count > 0 && (
                  <Badge
                    count={count}
                    className={styles.badge}
                    size="small"
                    overflowCount={999}
                    data-testid={`count-${item.key}`}
                  />
                )}
              </div>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
