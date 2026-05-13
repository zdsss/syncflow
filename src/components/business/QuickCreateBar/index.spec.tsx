import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import QuickCreateBar from './index';

vi.mock('@/services/task.service', () => ({
  quickCreate: vi.fn().mockResolvedValue({ id: '1', name: 'Test Task' }),
}));

describe('QuickCreateBar', () => {
  it('renders input bar with placeholder', () => {
    render(<QuickCreateBar onTaskCreated={vi.fn()} />);
    expect(screen.getByPlaceholderText(/快速创建任务/)).toBeTruthy();
  });

  it('shows trigger popup when @ is typed', () => {
    render(<QuickCreateBar onTaskCreated={vi.fn()} />);
    const input = screen.getByPlaceholderText(/快速创建任务/);
    fireEvent.change(input, { target: { value: '任务名@' } });
    expect(screen.getByTestId('trigger-popup')).toBeTruthy();
  });

  it('shows trigger popup when % is typed', () => {
    render(<QuickCreateBar onTaskCreated={vi.fn()} />);
    const input = screen.getByPlaceholderText(/快速创建任务/);
    fireEvent.change(input, { target: { value: '任务名%' } });
    expect(screen.getByTestId('trigger-popup')).toBeTruthy();
  });

  it('shows trigger popup when # is typed', () => {
    render(<QuickCreateBar onTaskCreated={vi.fn()} />);
    const input = screen.getByPlaceholderText(/快速创建任务/);
    fireEvent.change(input, { target: { value: '任务名#' } });
    expect(screen.getByTestId('trigger-popup')).toBeTruthy();
  });

  it('renders right-side buttons', () => {
    render(<QuickCreateBar onTaskCreated={vi.fn()} />);
    expect(screen.getByTestId('quick-create-bar')).toBeTruthy();
  });
});
