import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfigProvider } from 'antd';
import { describe, it, expect } from 'vitest';
import ConfigPage from './index';

vi.mock('./components/DepartmentTabs', () => ({
  default: () => <div data-testid="department-tabs">DepartmentTabs</div>,
}));

vi.mock('./components/RolePanel', () => ({
  default: () => <div data-testid="role-panel">RolePanel</div>,
}));

vi.mock('./components/MemberPanel', () => ({
  default: () => <div data-testid="member-panel">MemberPanel</div>,
}));

vi.mock('./components/RoleCardGrid', () => ({
  default: () => <div data-testid="role-card-grid">RoleCardGrid</div>,
}));

vi.mock('./components/NotificationSettings', () => ({
  default: () => <div data-testid="notification-settings">NotificationSettings</div>,
}));

vi.mock('./components/PermissionMatrix', () => ({
  default: () => <div data-testid="permission-matrix">PermissionMatrix</div>,
}));

vi.mock('./components/SystemParams', () => ({
  default: () => <div data-testid="system-params">SystemParams</div>,
}));

vi.mock('./config.module.css', () => ({
  default: {
    page: 'page',
    title: 'title',
    body: 'body',
    dualPanel: 'dualPanel',
    leftPanel: 'leftPanel',
    rightPanel: 'rightPanel',
  },
}));

const renderWithAntd = (ui: React.ReactElement) =>
  render(<ConfigProvider>{ui}</ConfigProvider>);

describe('ConfigPage', () => {
  it('renders the page title', () => {
    renderWithAntd(<ConfigPage />);
    expect(screen.getByText('配置管理')).toBeInTheDocument();
  });

  it('shows default tab role config content', () => {
    renderWithAntd(<ConfigPage />);
    expect(screen.getByTestId('department-tabs')).toBeInTheDocument();
    expect(screen.getByTestId('role-panel')).toBeInTheDocument();
    expect(screen.getByTestId('member-panel')).toBeInTheDocument();
  });

  it('shows tab labels', () => {
    renderWithAntd(<ConfigPage />);
    expect(screen.getByText('角色权限配置')).toBeInTheDocument();
    expect(screen.getByText('角色卡片视图')).toBeInTheDocument();
    expect(screen.getByText('通知设置')).toBeInTheDocument();
  });

  it('switches to role cards tab', async () => {
    const user = userEvent.setup();
    renderWithAntd(<ConfigPage />);
    await user.click(screen.getByText('角色卡片视图'));
    expect(screen.getByTestId('role-card-grid')).toBeInTheDocument();
  });

  it('shows permission matrix tab', () => {
    renderWithAntd(<ConfigPage />);
    expect(screen.getByText('权限配置')).toBeInTheDocument();
  });

  it('switches to permission matrix tab', async () => {
    const user = userEvent.setup();
    renderWithAntd(<ConfigPage />);
    await user.click(screen.getByText('权限配置'));
    expect(screen.getByTestId('permission-matrix')).toBeInTheDocument();
  });

  it('switches to notification settings tab', async () => {
    const user = userEvent.setup();
    renderWithAntd(<ConfigPage />);
    await user.click(screen.getByText('通知设置'));
    expect(screen.getByTestId('notification-settings')).toBeInTheDocument();
  });

  it('shows system params tab label', () => {
    renderWithAntd(<ConfigPage />);
    expect(screen.getByText('系统参数')).toBeInTheDocument();
  });

  it('switches to system params tab', async () => {
    const user = userEvent.setup();
    renderWithAntd(<ConfigPage />);
    await user.click(screen.getByText('系统参数'));
    expect(screen.getByTestId('system-params')).toBeInTheDocument();
  });
});
