import { Tag } from 'antd';
import type { PickerProps } from './index';
import type { TaskType } from '@/types/task';
import styles from '../QuickCreateBar.module.css';

const TASK_TYPE_OPTIONS: { type: TaskType; label: string; color: string }[] = [
  { type: 'TASK', label: '任务', color: 'blue' },
  { type: 'MILESTONE', label: '里程碑', color: 'purple' },
  { type: 'ISSUE', label: '问题', color: 'red' },
  { type: 'RISK', label: '风险', color: 'orange' },
  { type: 'SUGGESTION', label: '建议', color: 'green' },
  { type: 'CHANGE', label: '变更', color: 'cyan' },
  { type: 'ACTIVITY', label: '活动', color: 'geekblue' },
  { type: 'STAGE', label: '阶段', color: 'magenta' },
  { type: 'APPROVAL', label: '审批', color: 'gold' },
];

// Default task type from system settings (configurable)
const DEFAULT_TASK_TYPE = 'TASK';

export default function TypePicker({ searchQuery, onSelect }: PickerProps) {
  const query = searchQuery.toLowerCase().trim();

  const filtered = query
    ? TASK_TYPE_OPTIONS.filter(
        (t) =>
          t.label.includes(query) ||
          t.type.toLowerCase().includes(query)
      )
    : TASK_TYPE_OPTIONS;

  return (
    <div data-testid="type-picker">
      <div className={styles.pickerChips}>
        {filtered.map((item) => (
          <Tag
            key={item.type}
            color={item.color}
            style={{ cursor: 'pointer', border: item.type === DEFAULT_TASK_TYPE ? '2px solid #1890ff' : undefined }}
            onClick={() => onSelect(item.label)}
          >
            {item.label}
            {item.type === DEFAULT_TASK_TYPE && <span style={{ fontSize: 10, marginLeft: 2 }}>默认</span>}
          </Tag>
        ))}
      </div>
      {filtered.length === 0 && (
        <div style={{ padding: '8px 12px', color: '#999', fontSize: 13 }}>无匹配类型</div>
      )}
    </div>
  );
}
