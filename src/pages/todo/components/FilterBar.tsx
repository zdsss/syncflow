import { useCallback } from 'react';
import type { CategoryKey } from '@/components/business/TaskCategoryNav';
import styles from './FilterBar.module.css';

interface FilterItem {
  key: CategoryKey;
  label: string;
  color: string;
  bgColor: string;
}

const FILTER_ITEMS: FilterItem[] = [
  { key: 'today', label: '今日', color: '#3366FF', bgColor: '#EBF0FF' },
  { key: 'thisWeek', label: '本周', color: '#3366FF', bgColor: '#EBF0FF' },
  { key: 'overdue', label: '逾期', color: '#FF4D4F', bgColor: '#FFF1F0' },
  { key: 'warning', label: '预警', color: '#FAAD14', bgColor: '#FFF7E6' },
];

interface FilterBarProps {
  activeCategory: string;
  onCategoryChange: (key: CategoryKey) => void;
}

export default function FilterBar({ activeCategory, onCategoryChange }: FilterBarProps) {
  const handleFilterClick = useCallback(
    (key: CategoryKey) => {
      onCategoryChange(key);
    },
    [onCategoryChange]
  );

  return (
    <div className={styles.filterBar} data-testid="filter-bar">
      {FILTER_ITEMS.map((item) => {
        const isActive = activeCategory === item.key;
        return (
          <button
            key={item.key}
            type="button"
            className={`${styles.chip} ${isActive ? styles.chipActive : ''}`}
            onClick={() => handleFilterClick(item.key)}
            style={isActive ? { backgroundColor: item.bgColor, color: item.color, borderColor: item.color } : undefined}
            data-testid={`filter-${item.key}`}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
