import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import FilterChips from './FilterChips';

const items = [
  { key: 'all', label: '全部', count: 10 },
  { key: 'active', label: '进行中', count: 5 },
  { key: 'done', label: '已完成' },
];

describe('FilterChips', () => {
  it('renders all chip labels', () => {
    render(<FilterChips items={items} />);
    expect(screen.getByText(/全部/)).toBeDefined();
    expect(screen.getByText(/进行中/)).toBeDefined();
    expect(screen.getByText(/已完成/)).toBeDefined();
  });

  it('renders count when provided', () => {
    render(<FilterChips items={items} />);
    expect(screen.getByText('10')).toBeDefined();
    expect(screen.getByText('5')).toBeDefined();
  });

  it('calls onChange when chip is clicked', () => {
    const onChange = vi.fn();
    render(<FilterChips items={items} onChange={onChange} />);
    fireEvent.click(screen.getByText(/进行中/));
    expect(onChange).toHaveBeenCalledWith('active');
  });

  it('highlights active chip', () => {
    const { container } = render(<FilterChips items={items} value="active" />);
    const chips = container.querySelectorAll('span.ant-tag');
    const activeChip = Array.from(chips).find((el) => el.textContent?.includes('进行中'));
    expect(activeChip).toBeDefined();
  });
});
