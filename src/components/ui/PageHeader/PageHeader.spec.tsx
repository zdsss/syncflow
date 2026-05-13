import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PageHeader from './PageHeader';

describe('PageHeader', () => {
  it('renders title', () => {
    render(<PageHeader title="Page Title" />);
    expect(screen.getByText('Page Title')).toBeDefined();
  });

  it('renders subtitle when provided', () => {
    render(<PageHeader title="Title" subtitle="Subtitle text" />);
    expect(screen.getByText('Subtitle text')).toBeDefined();
  });

  it('renders extra content', () => {
    render(<PageHeader title="Title" extra={<button>Extra</button>} />);
    expect(screen.getByText('Extra')).toBeDefined();
  });

  it('renders back button and calls onBack', () => {
    const onBack = vi.fn();
    render(<PageHeader title="Title" onBack={onBack} />);
    const backBtn = screen.getByRole('button', { name: '返回' });
    fireEvent.click(backBtn);
    expect(onBack).toHaveBeenCalled();
  });

  it('does not render back button when onBack is not provided', () => {
    render(<PageHeader title="Title" />);
    expect(screen.queryByRole('button', { name: '返回' })).toBeNull();
  });
});
