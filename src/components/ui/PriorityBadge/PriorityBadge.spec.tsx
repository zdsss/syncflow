import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import PriorityBadge from './PriorityBadge';
import { TaskPriority } from '@/types';

describe('PriorityBadge', () => {
  it('renders urgent priority label', () => {
    render(<PriorityBadge priority={TaskPriority.URGENT} />);
    expect(screen.getByText('紧急')).toBeDefined();
  });

  it('renders high priority label', () => {
    render(<PriorityBadge priority={TaskPriority.HIGH} />);
    expect(screen.getByText('高')).toBeDefined();
  });

  it('renders medium priority label', () => {
    render(<PriorityBadge priority={TaskPriority.MEDIUM} />);
    expect(screen.getByText('中')).toBeDefined();
  });

  it('renders low priority label', () => {
    render(<PriorityBadge priority={TaskPriority.LOW} />);
    expect(screen.getByText('低')).toBeDefined();
  });

  it('applies custom className', () => {
    const { container } = render(<PriorityBadge priority={TaskPriority.HIGH} className="custom" />);
    expect(container.querySelector('.custom')).toBeDefined();
  });
});
