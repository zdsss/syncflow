import { render, screen } from '@testing-library/react';
import { TaskStatus } from '@/types';
import { TASK_STATUS_CONFIG } from '@/constants/enums';
import StatusBadge from './StatusBadge';

describe('StatusBadge', () => {
  it.each(Object.values(TaskStatus))('renders correct label for %s', (status) => {
    render(<StatusBadge status={status} />);
    const config = TASK_STATUS_CONFIG[status];
    expect(screen.getByText(config.label)).toBeInTheDocument();
  });

  it.each(Object.values(TaskStatus))('applies correct background color for %s', (status) => {
    render(<StatusBadge status={status} />);
    const config = TASK_STATUS_CONFIG[status];
    const badge = screen.getByText(config.label);
    expect(badge).toHaveStyle({ backgroundColor: config.bgColor });
  });

  it('applies custom className', () => {
    render(<StatusBadge status={TaskStatus.IN_PROGRESS} className="custom-class" />);
    const config = TASK_STATUS_CONFIG[TaskStatus.IN_PROGRESS];
    const badge = screen.getByText(config.label);
    expect(badge).toHaveClass('custom-class');
  });
});
