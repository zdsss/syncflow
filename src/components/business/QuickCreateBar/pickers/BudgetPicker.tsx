import { useState, useRef, useEffect } from 'react';
import { InputNumber } from 'antd';
import type { PickerProps } from './index';

export default function BudgetPicker({ searchQuery, onSelect, onClose }: PickerProps) {
  const [hours, setHours] = useState<number | null>(
    searchQuery && !isNaN(Number(searchQuery)) ? Number(searchQuery) : null
  );
  const [duration, setDuration] = useState<number | null>(null);
  const inputRef = useRef<any>(null);

  useEffect(() => {
    inputRef.current?.focus?.();
  }, []);

  const handleConfirm = () => {
    const parts: string[] = [];
    if (hours != null && hours > 0) parts.push(`￥${hours}`);
    if (duration != null && duration > 0) parts.push(`￥${duration}d`);
    if (parts.length > 0) {
      onSelect(parts.join(' '));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  };

  return (
    <div data-testid="budget-picker" style={{ padding: '4px 8px' }} onKeyDown={handleKeyDown}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
        <div>
          <div style={{ fontSize: 11, color: '#999', marginBottom: 2 }}>工时(小时)</div>
          <InputNumber
            ref={inputRef}
            value={hours}
            onChange={setHours}
            onPressEnter={handleConfirm}
            min={0}
            precision={1}
            placeholder="小时"
            style={{ width: 100 }}
            size="small"
            data-testid="hours-input"
          />
        </div>
        <div>
          <div style={{ fontSize: 11, color: '#999', marginBottom: 2 }}>工期(天)</div>
          <InputNumber
            value={duration}
            onChange={setDuration}
            onPressEnter={handleConfirm}
            min={0}
            precision={0}
            placeholder="天数"
            style={{ width: 100 }}
            size="small"
            data-testid="duration-input"
          />
        </div>
        <span
          style={{ color: '#1890ff', cursor: 'pointer', fontSize: 12, whiteSpace: 'nowrap', paddingBottom: 4 }}
          onClick={handleConfirm}
          data-testid="confirm-budget"
        >
          确认
        </span>
      </div>
    </div>
  );
}
