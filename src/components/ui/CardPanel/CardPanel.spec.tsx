import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import CardPanel from './CardPanel';

describe('CardPanel', () => {
  it('renders children content', () => {
    render(<CardPanel>Test Content</CardPanel>);
    expect(screen.getByText('Test Content')).toBeDefined();
  });

  it('renders title when provided', () => {
    render(<CardPanel title="Card Title">Content</CardPanel>);
    expect(screen.getByText('Card Title')).toBeDefined();
  });

  it('renders extra when provided', () => {
    render(<CardPanel extra={<button>Action</button>}>Content</CardPanel>);
    expect(screen.getByText('Action')).toBeDefined();
  });

  it('applies custom className', () => {
    const { container } = render(<CardPanel className="custom">Content</CardPanel>);
    expect(container.querySelector('.custom')).toBeDefined();
  });
});
