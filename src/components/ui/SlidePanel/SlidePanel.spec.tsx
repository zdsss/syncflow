import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import SlidePanel from './SlidePanel';

describe('SlidePanel', () => {
  it('renders children when open', () => {
    render(
      <SlidePanel open onClose={vi.fn()}>
        <div>Panel Content</div>
      </SlidePanel>
    );
    expect(screen.getByText('Panel Content')).toBeDefined();
  });

  it('renders title when provided', () => {
    render(
      <SlidePanel open onClose={vi.fn()} title="Details">
        <div>Content</div>
      </SlidePanel>
    );
    expect(screen.getByText('Details')).toBeDefined();
  });

  it('does not render children when closed', () => {
    render(
      <SlidePanel open={false} onClose={vi.fn()}>
        <div>Hidden Content</div>
      </SlidePanel>
    );
    expect(screen.queryByText('Hidden Content')).toBeNull();
  });
});
