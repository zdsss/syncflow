import type React from 'react';
import styles from './ViewSwitcher.module.css';

interface ViewSwitcherProps {
  value: 'schedule' | 'kanban';
  onChange: (mode: 'schedule' | 'kanban') => void;
}

export default function ViewSwitcher({ value, onChange }: ViewSwitcherProps) {
  return (
    <div className={styles.switcher}>
      <button
        className={`${styles.btn} ${value === 'schedule' ? styles.active : ''}`}
        onClick={() => onChange('schedule')}
        type="button"
      >
        排期视图
      </button>
      <button
        className={`${styles.btn} ${value === 'kanban' ? styles.active : ''}`}
        onClick={() => onChange('kanban')}
        type="button"
      >
        看板视图
      </button>
    </div>
  );
}
