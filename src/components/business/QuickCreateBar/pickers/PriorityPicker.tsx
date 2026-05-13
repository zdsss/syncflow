import { Tag } from 'antd';
import { TaskPriority } from '@/types/task';
import { TASK_PRIORITY_CONFIG } from '@/constants/enums';
import type { PickerProps } from './index';
import styles from '../QuickCreateBar.module.css';

export default function PriorityPicker({ onSelect }: PickerProps) {
  const priorities = Object.entries(TASK_PRIORITY_CONFIG) as [
    string,
    { label: string; color: string; bgColor: string },
  ][];

  return (
    <div data-testid="priority-picker">
      <div className={styles.pickerChips}>
        {priorities.map(([key, config]) => (
          <Tag
            key={key}
            color={config.color}
            style={{
              cursor: 'pointer',
              borderColor: config.color,
              backgroundColor: config.bgColor,
              color: config.color,
            }}
            onClick={() => onSelect(config.label)}
          >
            {config.label}
          </Tag>
        ))}
      </div>
    </div>
  );
}
