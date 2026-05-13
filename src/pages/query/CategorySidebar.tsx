import styles from './QueryPage.module.css';

interface Category {
  key: string;
  label: string;
  count?: number;
  dotColor: string;
}

const CATEGORIES: Category[] = [
  { key: 'today', label: '今日', count: 5, dotColor: 'dotOrange' },
  { key: 'week', label: '本周', count: 18, dotColor: 'dotBlue' },
  { key: 'month', label: '本月', count: 45, dotColor: 'dotBlue' },
  { key: 'all', label: '全部任务', dotColor: 'dotBlue' },
  { key: 'warning', label: '预警', count: 3, dotColor: 'dotRed' },
  { key: 'overdue', label: '超期', count: 5, dotColor: 'dotRed' },
  { key: 'issue', label: '问题', count: 2, dotColor: 'dotRed' },
  { key: 'risk', label: '风险', count: 4, dotColor: 'dotOrange' },
  { key: 'suggestion', label: '建议', count: 1, dotColor: 'dotYellow' },
  { key: 'attention', label: '关注', count: 8, dotColor: 'dotYellow' },
  { key: 'affair', label: '事务', count: 12, dotColor: 'dotYellow' },
  { key: 'phase', label: '阶段', count: 6, dotColor: 'dotBlue' },
  { key: 'approval', label: '审批', count: 3, dotColor: 'dotBlue' },
  { key: 'change', label: '变更', count: 2, dotColor: 'dotGreen' },
  { key: 'milestone', label: '里程碑', count: 7, dotColor: 'dotPurple' },
];

interface CategorySidebarProps {
  activeCategory?: string;
  onCategoryChange?: (key: string) => void;
}

export default function CategorySidebar({ activeCategory = 'all', onCategoryChange }: CategorySidebarProps) {
  return (
    <aside
      className={styles.sidebar}
      data-testid="category-sidebar"
      data-active-category={CATEGORIES.find(c => c.key === activeCategory)?.label || ''}
    >
      <ul className={styles.categoryList}>
        {CATEGORIES.map((cat) => (
          <li
            key={cat.key}
            className={`${styles.categoryItem} ${activeCategory === cat.key ? styles.activeCategory : ''}`}
            onClick={() => onCategoryChange?.(cat.key)}
          >
            <span className={styles.categoryLabel}>
              <span className={`${styles.categoryDot} ${styles[cat.dotColor as keyof typeof styles] || ''}`} />
              {cat.label}
            </span>
            {cat.count !== undefined && (
              <span className={styles.categoryCount}>{cat.count}</span>
            )}
          </li>
        ))}
      </ul>
    </aside>
  );
}
