import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ProgressIndicator from './ProgressIndicator';

describe('ProgressIndicator', () => {
  it('renders percentage text', () => {
    render(<ProgressIndicator percent={75} />);
    expect(screen.getByText('75%')).toBeDefined();
  });

  it('hides text when showText is false', () => {
    render(<ProgressIndicator percent={50} showText={false} />);
    expect(screen.queryByText('50%')).toBeNull();
  });

  it('clamps percent to 0-100 range', () => {
    render(<ProgressIndicator percent={150} />);
    expect(screen.getByText('100%')).toBeDefined();
  });

  it('clamps negative percent to 0', () => {
    render(<ProgressIndicator percent={-10} />);
    expect(screen.getByText('0%')).toBeDefined();
  });

  it('applies custom className', () => {
    const { container } = render(<ProgressIndicator percent={60} className="custom" />);
    expect(container.querySelector('.custom')).toBeDefined();
  });
});
