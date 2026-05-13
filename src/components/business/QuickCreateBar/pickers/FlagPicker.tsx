import { Tag } from 'antd';
import { FlagOutlined, EyeOutlined } from '@ant-design/icons';
import type { PickerProps } from './index';
import styles from '../QuickCreateBar.module.css';

const FLAG_OPTIONS = [
  { label: '里程碑', icon: <FlagOutlined />, color: 'purple' },
  { label: '关注', icon: <EyeOutlined />, color: 'blue' },
];

export default function FlagPicker({ onSelect }: PickerProps) {
  return (
    <div data-testid="flag-picker">
      <div className={styles.pickerChips}>
        {FLAG_OPTIONS.map((flag) => (
          <Tag
            key={flag.label}
            icon={flag.icon}
            color={flag.color}
            style={{ cursor: 'pointer' }}
            onClick={() => onSelect(flag.label)}
          >
            {flag.label}
          </Tag>
        ))}
      </div>
    </div>
  );
}
