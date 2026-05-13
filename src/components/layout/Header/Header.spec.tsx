import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfigProvider } from 'antd';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Header from './Header';

const mockSetLocale = vi.fn();
const mockNavigate = vi.fn();
const mockFetchNotifications = vi.fn().mockResolvedValue(undefined);
const mockFetchUnreadCount = vi.fn().mockResolvedValue(undefined);

vi.mock('@/stores/useAppStore', () => ({
  useAppStore: (sel?: any) => {
    const state = { locale: 'zh', setLocale: mockSetLocale };
    return sel ? sel(state) : state;
  },
}));

vi.mock('@/stores/useAuthStore', () => ({
  useAuthStore: () => ({
    currentUser: { name: 'TestUser', realName: '张晓青', phone: '18012345880' },
    currentTeam: { name: 'TestTeam', memberCount: 5 },
    setCurrentUser: vi.fn(),
    setCurrentTeam: vi.fn(),
    setTeams: vi.fn(),
  }),
}));

vi.mock('@/stores/useNotificationStore', () => ({
  useNotificationStore: (sel?: any) => {
    const state = {
      notifications: [],
      addNotification: vi.fn(),
      markAsRead: vi.fn(),
      markAllAsRead: vi.fn(),
      unreadCount: 3,
      fetchNotificationsAsync: mockFetchNotifications,
      fetchUnreadCountAsync: mockFetchUnreadCount,
    };
    return sel ? sel(state) : state;
  },
  getDisplayTime: vi.fn(() => '刚刚'),
}));

vi.mock('@/hooks/useSocket', () => ({
  useSocket: () => ({
    connected: true,
    subscribe: vi.fn(),
    unsubscribe: vi.fn(),
  }),
}));

vi.mock('@/services/auth.service', () => ({
  getCurrentUser: vi.fn().mockResolvedValue({ data: { user: {}, team: {} } }),
  getTeams: vi.fn().mockResolvedValue({ data: [] }),
}));

vi.mock('@/components/ui/GlobalSearch', () => ({
  default: () => <div data-testid="global-search" />,
}));

vi.mock('@/components/ui/NotificationPanel', () => ({
  default: ({ open, onClose }: { open: boolean; onClose: () => void }) =>
    open ? (
      <div data-testid="notification-panel">
        <button data-testid="mock-close-panel" onClick={onClose}>close</button>
      </div>
    ) : null,
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

const renderWithAntd = (ui: React.ReactElement) =>
  render(<ConfigProvider>{ui}</ConfigProvider>);

describe('Header', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders user name', () => {
    renderWithAntd(<Header />);
    expect(screen.getByText('TestUser')).toBeInTheDocument();
  });

  it('renders realName in user identity area', () => {
    renderWithAntd(<Header />);
    expect(screen.getByText('张晓青')).toBeInTheDocument();
  });

  it('renders masked phone number in user identity area', () => {
    renderWithAntd(<Header />);
    expect(screen.getByText('180***880')).toBeInTheDocument();
  });

  it('navigates to /settings when user identity is clicked', async () => {
    mockNavigate.mockClear();
    const user = userEvent.setup();
    renderWithAntd(<Header />);
    await user.click(screen.getByTestId('user-identity'));
    expect(mockNavigate).toHaveBeenCalledWith('/settings');
  });

  it('renders team name', () => {
    renderWithAntd(<Header />);
    expect(screen.getByText('TestTeam')).toBeInTheDocument();
  });

  it('renders team member count', () => {
    renderWithAntd(<Header />);
    expect(screen.getByText(/5/)).toBeInTheDocument();
  });

  it('renders notification bell icon', () => {
    renderWithAntd(<Header />);
    const bellIcon = document.querySelector('.anticon-bell');
    expect(bellIcon).toBeInTheDocument();
  });

  it('shows unread count badge on bell icon', () => {
    renderWithAntd(<Header />);
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('renders language toggle button', () => {
    renderWithAntd(<Header />);
    expect(screen.getByText('中/EN')).toBeInTheDocument();
  });

  it('renders GlobalSearch component', () => {
    renderWithAntd(<Header />);
    expect(screen.getByTestId('global-search')).toBeInTheDocument();
  });

  it('toggles locale when language button is clicked', async () => {
    const user = userEvent.setup();
    renderWithAntd(<Header />);
    await user.click(screen.getByText('中/EN'));
    expect(mockSetLocale).toHaveBeenCalledWith('en');
  });

  it('renders settings icon', () => {
    renderWithAntd(<Header />);
    const settingIcon = document.querySelector('.anticon-setting');
    expect(settingIcon).toBeInTheDocument();
  });

  it('dispatches Cmd+K keyboard event when search icon is clicked', async () => {
    const user = userEvent.setup();
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
    renderWithAntd(<Header />);

    const searchIcon = document.querySelector('.anticon-search')!;
    await user.click(searchIcon);

    expect(dispatchSpy).toHaveBeenCalled();
    const event = dispatchSpy.mock.calls[0][0] as KeyboardEvent;
    expect(event.key).toBe('k');
    expect(event.metaKey).toBe(true);

    dispatchSpy.mockRestore();
  });

  it('navigates to /config when settings icon is clicked', async () => {
    mockNavigate.mockClear();
    const user = userEvent.setup();
    renderWithAntd(<Header />);

    const settingIcon = document.querySelector('.anticon-setting')!;
    await user.click(settingIcon);

    expect(mockNavigate).toHaveBeenCalledWith('/config');
  });

  // --- NotificationPanel integration ---

  it('does not show notification panel by default', () => {
    renderWithAntd(<Header />);
    expect(screen.queryByTestId('notification-panel')).not.toBeInTheDocument();
  });

  it('shows notification panel when bell icon is clicked', async () => {
    const user = userEvent.setup();
    renderWithAntd(<Header />);
    const bellIcon = document.querySelector('.anticon-bell')!;
    await user.click(bellIcon);
    expect(screen.getByTestId('notification-panel')).toBeInTheDocument();
  });

  it('hides notification panel when bell icon is clicked again', async () => {
    const user = userEvent.setup();
    renderWithAntd(<Header />);
    const bellIcon = document.querySelector('.anticon-bell')!;
    await user.click(bellIcon);
    expect(screen.getByTestId('notification-panel')).toBeInTheDocument();
    await user.click(bellIcon);
    expect(screen.queryByTestId('notification-panel')).not.toBeInTheDocument();
  });

  it('hides notification panel when onClose is called', async () => {
    const user = userEvent.setup();
    renderWithAntd(<Header />);
    const bellIcon = document.querySelector('.anticon-bell')!;
    await user.click(bellIcon);
    expect(screen.getByTestId('notification-panel')).toBeInTheDocument();
    await user.click(screen.getByTestId('mock-close-panel'));
    expect(screen.queryByTestId('notification-panel')).not.toBeInTheDocument();
  });
});
