import { Tag } from 'antd';

interface FilterChip {
  key: string;
  label: string;
  count?: number;
}

interface FilterChipsProps {
  items: FilterChip[];
  value?: string;
  onChange?: (key: string) => void;
}

export default function FilterChips({ items, value, onChange }: FilterChipsProps) {
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {items.map((item) => {
        const isActive = item.key === value;
        return (
          <Tag
            key={item.key}
            onClick={() => onChange?.(item.key)}
            style={{
              cursor: 'pointer',
              padding: '4px 12px',
              borderRadius: 16,
              fontSize: 13,
              color: isActive ? '#3366FF' : '#333333',
              backgroundColor: isActive ? '#EBF0FF' : '#F5F7FA',
              border: isActive ? '1px solid #3366FF' : '1px solid #E8E8E8',
            }}
          >
            {item.label}
            {item.count !== undefined && (
              <span style={{ marginLeft: 4, color: isActive ? '#3366FF' : '#999999' }}>{item.count}</span>
            )}
          </Tag>
        );
      })}
    </div>
  );
}
