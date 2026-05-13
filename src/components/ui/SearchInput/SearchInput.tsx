import { Input } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useState, useCallback } from 'react';

interface SearchInputProps {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  onSearch?: (value: string) => void;
  debounceMs?: number;
  className?: string;
  style?: React.CSSProperties;
}

export default function SearchInput({
  placeholder = '搜索...',
  value: controlledValue,
  onChange,
  onSearch,
  className,
  style,
}: SearchInputProps) {
  const [internalValue, setInternalValue] = useState('');
  const value = controlledValue !== undefined ? controlledValue : internalValue;

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      if (controlledValue === undefined) {
        setInternalValue(newValue);
      }
      onChange?.(newValue);
    },
    [controlledValue, onChange],
  );

  const handleSearch = useCallback(
    (searchValue: string) => {
      onSearch?.(searchValue);
    },
    [onSearch],
  );

  return (
    <Input
      className={className}
      style={{
        borderRadius: 18,
        backgroundColor: '#F5F7FA',
        ...style,
      }}
      prefix={<SearchOutlined style={{ color: '#999999' }} />}
      placeholder={placeholder}
      value={value}
      onChange={handleChange}
      onPressEnter={(e) => handleSearch((e.target as HTMLInputElement).value)}
      allowClear
    />
  );
}
