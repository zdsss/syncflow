import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfigProvider } from 'antd';
import { describe, it, expect, vi } from 'vitest';
import RouteList from './RouteList';

vi.mock('@/components/ui/EmptyState/EmptyState', () => ({
  default: (props: any) => <div>{props.title}</div>,
}));

vi.mock('@/components/ui/LoadingSkeleton/LoadingSkeleton', () => ({
  default: () => <div data-testid="loading-skeleton">Loading...</div>,
}));

const renderWithAntd = (ui: React.ReactElement) =>
  render(<ConfigProvider>{ui}</ConfigProvider>);

const mockRoutes = [
  {
    id: 'r1',
    name: '工艺路线A',
    description: '路线A描述',
    status: 'active',
    steps: [{ id: 's1', name: '工序1', sortOrder: 1 }],
  },
  {
    id: 'r2',
    name: '工艺路线B',
    status: 'draft',
    steps: [
      { id: 's2', name: '工序1', sortOrder: 1 },
      { id: 's3', name: '工序2', sortOrder: 2 },
    ],
  },
];

describe('RouteList', () => {
  const defaultProps = {
    routes: mockRoutes,
    selectedId: null,
    onSelect: vi.fn(),
    onDelete: vi.fn(),
    loading: false,
  };

  it('renders route list with names', () => {
    renderWithAntd(<RouteList {...defaultProps} />);

    expect(screen.getByText('工艺路线A')).toBeTruthy();
    expect(screen.getByText('工艺路线B')).toBeTruthy();
  });

  it('shows empty message when no routes', () => {
    renderWithAntd(<RouteList {...defaultProps} routes={[]} />);

    expect(screen.getByText('暂无工艺路线')).toBeTruthy();
  });

  it('shows loading skeleton when loading', () => {
    renderWithAntd(<RouteList {...defaultProps} loading={true} routes={[]} />);

    expect(screen.getByTestId('loading-skeleton')).toBeTruthy();
  });

  it('calls onSelect when route is clicked', async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    renderWithAntd(<RouteList {...defaultProps} onSelect={onSelect} />);

    await user.click(screen.getByText('工艺路线A'));

    expect(onSelect).toHaveBeenCalledWith('r1');
  });

  it('shows delete button for each route', () => {
    renderWithAntd(<RouteList {...defaultProps} />);

    const deleteButtons = document.querySelectorAll('.anticon-delete');
    expect(deleteButtons.length).toBe(2);
  });

  it('shows step count for each route', () => {
    renderWithAntd(<RouteList {...defaultProps} />);

    expect(screen.getByText(/1 个工序/)).toBeTruthy();
    expect(screen.getByText(/2 个工序/)).toBeTruthy();
  });

  it('calls onDelete when delete is confirmed via Popconfirm', async () => {
    const onDelete = vi.fn();
    const user = userEvent.setup();
    renderWithAntd(<RouteList {...defaultProps} onDelete={onDelete} />);

    const deleteButtons = document.querySelectorAll('.anticon-delete');
    await user.click(deleteButtons[0]);

    const okButton = await screen.findByRole('button', { name: /ok/i });
    await user.click(okButton);

    expect(onDelete).toHaveBeenCalledWith('r1');
  });
});
