import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SearchInput from './SearchInput';

describe('SearchInput', () => {
  it('renders with placeholder', () => {
    render(<SearchInput placeholder="搜索任务..." />);
    expect(screen.getByPlaceholderText('搜索任务...')).toBeDefined();
  });

  it('renders with default placeholder', () => {
    render(<SearchInput />);
    expect(screen.getByPlaceholderText('搜索...')).toBeDefined();
  });

  it('calls onChange when typing', () => {
    const onChange = vi.fn();
    render(<SearchInput onChange={onChange} />);
    const input = screen.getByPlaceholderText('搜索...');
    fireEvent.change(input, { target: { value: 'test' } });
    expect(onChange).toHaveBeenCalledWith('test');
  });

  it('calls onSearch on Enter key', () => {
    const onSearch = vi.fn();
    render(<SearchInput onSearch={onSearch} />);
    const input = screen.getByPlaceholderText('搜索...');
    fireEvent.change(input, { target: { value: 'query' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
    expect(onSearch).toHaveBeenCalledWith('query');
  });

  it('renders with controlled value', () => {
    render(<SearchInput value="controlled" onChange={() => {}} />);
    const input = screen.getByPlaceholderText('搜索...') as HTMLInputElement;
    expect(input.value).toBe('controlled');
  });
});
