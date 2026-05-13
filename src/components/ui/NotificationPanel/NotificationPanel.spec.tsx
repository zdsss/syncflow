import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfigProvider } from 'antd';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import NotificationPanel from './NotificationPanel';

const mockMarkAsRead = vi.fn();
const mockMarkAllAsRead = vi.fn();
const mockFetchNotifications = vi.fn().mockResolvedValue(undefined);
const mockNavigate = vi.fn();

const now = new Date();
const fiveMinAgo = new Date(now.getTime() - 5 * 60 * 1000);
const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

const baseNotifications = [
  { id: 'n1', title: '任务通知1', desc: '你有一个新任务', type: 'task', createdAt: fiveMinAgo, read: false },
  { id: 'n2', title: '审批通知1', desc: '请审批采购单', type: 'approval', createdAt: oneHourAgo, read: false },
  { id: 'n3', title: '系统通知1', desc: '系统维护公告', type: 'system', createdAt: yesterday, read: true },
  { id: 'n4', title: '任务通知2', desc: '任务已完成', type: 'task', createdAt: fiveMinAgo, read: true },
];

vi.mock('@/stores/useNotificationStore', () => ({
  useNotificationStore: (sel?: any) => {
    const state = {
      notifications: baseNotifications,
      unreadCount: 2,
      markAsRead: mockMarkAsRead,
      markAllAsRead: mockMarkAllAsRead,
      fetchNotificationsAsync: mockFetchNotifications,
    };
    return sel ? sel(state) : state;
  },
  getDisplayTime: (notification: any) => {
    const diff = Date.now() - notification.createdAt.getTime();
    if (diff < 60 * 1000) return '刚刚';
    if (diff < 60 * 60 * 1000) return `${Math.floor(diff / (60 * 1000))}分钟前`;
    if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / (60 * 60 * 1000))}小时前`;
    return `${Math.floor(diff / (24 * 60 * 60 * 1000))}天前`;
  },
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

const renderWithAntd = (ui: React.ReactElement) =>
  render(<ConfigProvider>{ui}</ConfigProvider>);

describe('NotificationPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --- Visibility ---

  it('renders nothing when open is false', () => {
    renderWithAntd(<NotificationPanel open={false} onClose={vi.fn()} />);
    expect(screen.queryByText('通知')).not.toBeInTheDocument();
  });

  it('renders panel when open is true', () => {
    renderWithAntd(<NotificationPanel open={true} onClose={vi.fn()} />);
    expect(screen.getByText('通知')).toBeInTheDocument();
  });

  // --- Header ---

  it('displays panel title', () => {
    renderWithAntd(<NotificationPanel open={true} onClose={vi.fn()} />);
    expect(screen.getByText('通知')).toBeInTheDocument();
  });

  it('displays "全部标为已读" button', () => {
    renderWithAntd(<NotificationPanel open={true} onClose={vi.fn()} />);
    expect(screen.getByText('全部标为已读')).toBeInTheDocument();
  });

  it('calls markAllAsRead when "全部标为已读" is clicked', async () => {
    const user = userEvent.setup();
    renderWithAntd(<NotificationPanel open={true} onClose={vi.fn()} />);
    await user.click(screen.getByText('全部标为已读'));
    expect(mockMarkAllAsRead).toHaveBeenCalledTimes(1);
  });

  // --- Notification list rendering ---

  it('renders notification items', async () => {
    renderWithAntd(<NotificationPanel open={true} onClose={vi.fn()} />);
    await waitFor(() => {
      expect(screen.getByText('任务通知1')).toBeInTheDocument();
    });
    expect(screen.getByText('审批通知1')).toBeInTheDocument();
    expect(screen.getByText('系统通知1')).toBeInTheDocument();
    expect(screen.getByText('任务通知2')).toBeInTheDocument();
  });

  it('renders notification description text', async () => {
    renderWithAntd(<NotificationPanel open={true} onClose={vi.fn()} />);
    await waitFor(() => {
      expect(screen.getByText('你有一个新任务')).toBeInTheDocument();
    });
    expect(screen.getByText('请审批采购单')).toBeInTheDocument();
  });

  // --- Unread dot indicator ---

  it('shows unread indicator for unread notifications', async () => {
    const { container } = renderWithAntd(<NotificationPanel open={true} onClose={vi.fn()} />);
    await waitFor(() => {
      const unreadDots = container.querySelectorAll('[data-unread="true"]');
      expect(unreadDots.length).toBe(2);
    });
  });

  it('does not show unread indicator for read notifications', async () => {
    const { container } = renderWithAntd(<NotificationPanel open={true} onClose={vi.fn()} />);
    await waitFor(() => {
      const readDots = container.querySelectorAll('[data-unread="false"]');
      expect(readDots.length).toBe(2);
    });
  });

  // --- Tab filtering ---

  it('renders filter tabs: 全部, 任务通知, 审批通知, 系统通知', () => {
    renderWithAntd(<NotificationPanel open={true} onClose={vi.fn()} />);
    expect(screen.getByText('全部')).toBeInTheDocument();
    expect(screen.getByText('任务通知')).toBeInTheDocument();
    expect(screen.getByText('审批通知')).toBeInTheDocument();
    expect(screen.getByText('系统通知')).toBeInTheDocument();
  });

  it('shows all notifications by default (全部 tab)', async () => {
    renderWithAntd(<NotificationPanel open={true} onClose={vi.fn()} />);
    await waitFor(() => {
      expect(screen.getByText('任务通知1')).toBeInTheDocument();
    });
    expect(screen.getByText('审批通知1')).toBeInTheDocument();
    expect(screen.getByText('系统通知1')).toBeInTheDocument();
    expect(screen.getByText('任务通知2')).toBeInTheDocument();
  });

  it('filters to show only task notifications when 任务通知 tab is clicked', async () => {
    const user = userEvent.setup();
    renderWithAntd(<NotificationPanel open={true} onClose={vi.fn()} />);
    await waitFor(() => {
      expect(screen.getByText('任务通知1')).toBeInTheDocument();
    });
    await user.click(screen.getByText('任务通知'));
    expect(screen.getByText('任务通知1')).toBeInTheDocument();
    expect(screen.getByText('任务通知2')).toBeInTheDocument();
    expect(screen.queryByText('审批通知1')).not.toBeInTheDocument();
    expect(screen.queryByText('系统通知1')).not.toBeInTheDocument();
  });

  it('filters to show only approval notifications when 审批通知 tab is clicked', async () => {
    const user = userEvent.setup();
    renderWithAntd(<NotificationPanel open={true} onClose={vi.fn()} />);
    await waitFor(() => {
      expect(screen.getByText('审批通知1')).toBeInTheDocument();
    });
    await user.click(screen.getByText('审批通知'));
    expect(screen.getByText('审批通知1')).toBeInTheDocument();
    expect(screen.queryByText('任务通知1')).not.toBeInTheDocument();
    expect(screen.queryByText('系统通知1')).not.toBeInTheDocument();
  });

  it('filters to show only system notifications when 系统通知 tab is clicked', async () => {
    const user = userEvent.setup();
    renderWithAntd(<NotificationPanel open={true} onClose={vi.fn()} />);
    await waitFor(() => {
      expect(screen.getByText('系统通知1')).toBeInTheDocument();
    });
    await user.click(screen.getByText('系统通知'));
    expect(screen.getByText('系统通知1')).toBeInTheDocument();
    expect(screen.queryByText('任务通知1')).not.toBeInTheDocument();
    expect(screen.queryByText('审批通知1')).not.toBeInTheDocument();
  });

  // --- Mark single as read ---

  it('calls markAsRead when a notification item is clicked', async () => {
    const user = userEvent.setup();
    renderWithAntd(<NotificationPanel open={true} onClose={vi.fn()} />);
    await waitFor(() => {
      expect(screen.getByText('任务通知1')).toBeInTheDocument();
    });
    await user.click(screen.getByText('任务通知1'));
    expect(mockMarkAsRead).toHaveBeenCalledWith('n1');
  });

  it('calls markAsRead with correct id for different items', async () => {
    const user = userEvent.setup();
    renderWithAntd(<NotificationPanel open={true} onClose={vi.fn()} />);
    await waitFor(() => {
      expect(screen.getByText('审批通知1')).toBeInTheDocument();
    });
    await user.click(screen.getByText('审批通知1'));
    expect(mockMarkAsRead).toHaveBeenCalledWith('n2');
  });

  // --- Close panel ---

  it('calls onClose when close button is clicked', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    renderWithAntd(<NotificationPanel open={true} onClose={onClose} />);
    const closeBtn = document.querySelector('[data-testid="close-btn"]') ||
      document.querySelector('.anticon-close');
    if (closeBtn) {
      await user.click(closeBtn);
      expect(onClose).toHaveBeenCalledTimes(1);
    }
  });

  // --- Empty state ---

  it('shows empty state when no notifications exist', async () => {
    vi.resetModules();
    vi.doMock('@/stores/useNotificationStore', () => ({
      useNotificationStore: (sel?: any) => {
        const state = {
          notifications: [],
          unreadCount: 0,
          markAsRead: vi.fn(),
          markAllAsRead: vi.fn(),
          fetchNotificationsAsync: vi.fn().mockResolvedValue(undefined),
        };
        return sel ? sel(state) : state;
      },
      getDisplayTime: () => '刚刚',
    }));

    const { default: EmptyPanel } = await import('./NotificationPanel');
    renderWithAntd(<EmptyPanel open={true} onClose={vi.fn()} />);
    await waitFor(() => {
      expect(screen.getByText('暂无通知')).toBeInTheDocument();
    });
  });

  // --- Loading state ---

  it('shows loading state while fetching', async () => {
    vi.resetModules();
    vi.doMock('@/stores/useNotificationStore', () => ({
      useNotificationStore: (sel?: any) => {
        const state = {
          notifications: [],
          unreadCount: 0,
          markAsRead: vi.fn(),
          markAllAsRead: vi.fn(),
          fetchNotificationsAsync: vi.fn().mockImplementation(() => new Promise(() => {})),
        };
        return sel ? sel(state) : state;
      },
      getDisplayTime: () => '刚刚',
    }));

    const { default: LoadingPanel } = await import('./NotificationPanel');
    const { container } = renderWithAntd(<LoadingPanel open={true} onClose={vi.fn()} />);
    const spinner = container.querySelector('.ant-spin');
    expect(spinner).toBeInTheDocument();
  });

  // --- Relative time display ---

  it('displays relative time for notifications', async () => {
    renderWithAntd(<NotificationPanel open={true} onClose={vi.fn()} />);
    await waitFor(() => {
      expect(screen.getAllByText('5分钟前').length).toBe(2);
    });
    expect(screen.getByText('1小时前')).toBeInTheDocument();
    expect(screen.getByText('1天前')).toBeInTheDocument();
  });

  // --- Footer ---

  it('displays "查看全部" link in footer', () => {
    renderWithAntd(<NotificationPanel open={true} onClose={vi.fn()} />);
    expect(screen.getByText('查看全部')).toBeInTheDocument();
  });

  // --- Fetch on open ---

  it('fetches notifications when panel opens', () => {
    renderWithAntd(<NotificationPanel open={true} onClose={vi.fn()} />);
    expect(mockFetchNotifications).toHaveBeenCalled();
  });

  it('does not fetch notifications when panel is closed', () => {
    renderWithAntd(<NotificationPanel open={false} onClose={vi.fn()} />);
    expect(mockFetchNotifications).not.toHaveBeenCalled();
  });

  // --- Type color dots ---

  it('renders color-coded type dots for each notification type', async () => {
    renderWithAntd(<NotificationPanel open={true} onClose={vi.fn()} />);
    await waitFor(() => {
      expect(screen.getByText('任务通知1')).toBeInTheDocument();
    });
    // task dot: blue (#1890FF)
    const taskDots = screen.getAllByTestId('type-dot-task');
    expect(taskDots.length).toBe(2);
    expect(taskDots[0]).toHaveStyle({ background: '#1890FF' });
    // approval dot: orange (#FA8C16)
    const approvalDot = screen.getByTestId('type-dot-approval');
    expect(approvalDot).toHaveStyle({ background: '#FA8C16' });
    // system dot: gray (#999999)
    const systemDot = screen.getByTestId('type-dot-system');
    expect(systemDot).toHaveStyle({ background: '#999999' });
  });

  it('renders system announcement tab and shows placeholder content when clicked', async () => {
    const user = userEvent.setup();
    renderWithAntd(<NotificationPanel open={true} onClose={vi.fn()} />);
    expect(screen.getByText('系统公告')).toBeInTheDocument();
    await user.click(screen.getByText('系统公告'));
    expect(screen.getByTestId('system-announcement-content')).toBeInTheDocument();
    expect(screen.getByText('欢迎使用 SyncFlow 协同管理系统')).toBeInTheDocument();
  });
});
