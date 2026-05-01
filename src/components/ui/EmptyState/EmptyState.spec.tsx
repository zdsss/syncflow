import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EmptyState from './EmptyState';

describe('EmptyState', () => {
  it('renders title text', () => {
    render(<EmptyState title="No data" />);
    expect(screen.getByText('No data', { selector: 'div' })).toBeInTheDocument();
  });

  it('renders description when provided', () => {
    render(<EmptyState title="No data" description="Try adjusting filters" />);
    expect(screen.getByText('Try adjusting filters')).toBeInTheDocument();
  });

  it('does not render description when not provided', () => {
    render(<EmptyState title="No data" />);
    expect(screen.queryByText(/Try adjusting/)).not.toBeInTheDocument();
  });

  it('renders action button when actionText and onAction provided', () => {
    const onAction = vi.fn();
    render(<EmptyState title="No data" actionText="Create new" onAction={onAction} />);
    expect(screen.getByRole('button', { name: 'Create new' })).toBeInTheDocument();
  });

  it('calls onAction when button clicked', async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    render(<EmptyState title="No data" actionText="Create new" onAction={onAction} />);
    await user.click(screen.getByRole('button', { name: 'Create new' }));
    expect(onAction).toHaveBeenCalledTimes(1);
  });
});
