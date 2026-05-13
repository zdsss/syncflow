import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfigProvider } from 'antd';
import { describe, it, expect, vi } from 'vitest';
import Sidebar from './Sidebar';

const mockNavigate = vi.fn();

vi.mock('@/stores/useAppStore', () => ({
  useAppStore: () => ({
    locale: 'zh',
  }),
}));

vi.mock('@/stores/useAuthStore', () => ({
  useAuthStore: () => ({
    currentUser: { realName: 'TestUser', username: 'testuser', avatar: null },
  }),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useLocation: () => ({ pathname: '/dashboard' }),
    useNavigate: () => mockNavigate,
  };
});

// Mock all SVG icon imports
vi.mock('@/assets/icons/nav/workspace.svg?react', () => ({ default: (props: any) => <svg data-testid="icon-workspace" {...props} /> }));
vi.mock('@/assets/icons/nav/workspace-active.svg?react', () => ({ default: (props: any) => <svg data-testid="icon-workspace-active" {...props} /> }));
vi.mock('@/assets/icons/nav/project-mgmt.svg?react', () => ({ default: (props: any) => <svg data-testid="icon-project-mgmt" {...props} /> }));
vi.mock('@/assets/icons/nav/project-mgmt-active.svg?react', () => ({ default: (props: any) => <svg data-testid="icon-project-mgmt-active" {...props} /> }));
vi.mock('@/assets/icons/nav/dashboard.svg?react', () => ({ default: (props: any) => <svg data-testid="icon-dashboard" {...props} /> }));
vi.mock('@/assets/icons/nav/dashboard-active.svg?react', () => ({ default: (props: any) => <svg data-testid="icon-dashboard-active" {...props} /> }));
vi.mock('@/assets/icons/nav/file-mgmt.svg?react', () => ({ default: (props: any) => <svg data-testid="icon-file-mgmt" {...props} /> }));
vi.mock('@/assets/icons/nav/file-mgmt-active.svg?react', () => ({ default: (props: any) => <svg data-testid="icon-file-mgmt-active" {...props} /> }));
vi.mock('@/assets/icons/nav/bom-mgmt.svg?react', () => ({ default: (props: any) => <svg data-testid="icon-bom-mgmt" {...props} /> }));
vi.mock('@/assets/icons/nav/bom-mgmt-active.svg?react', () => ({ default: (props: any) => <svg data-testid="icon-bom-mgmt-active" {...props} /> }));
vi.mock('@/assets/icons/nav/process-mgmt.svg?react', () => ({ default: (props: any) => <svg data-testid="icon-process-mgmt" {...props} /> }));
vi.mock('@/assets/icons/nav/process-mgmt-active.svg?react', () => ({ default: (props: any) => <svg data-testid="icon-process-mgmt-active" {...props} /> }));
vi.mock('@/assets/icons/nav/config-mgmt.svg?react', () => ({ default: (props: any) => <svg data-testid="icon-config-mgmt" {...props} /> }));
vi.mock('@/assets/icons/nav/config-mgmt-active.svg?react', () => ({ default: (props: any) => <svg data-testid="icon-config-mgmt-active" {...props} /> }));
vi.mock('@/assets/icons/nav/resources.svg?react', () => ({ default: (props: any) => <svg data-testid="icon-resources" {...props} /> }));
vi.mock('@/assets/icons/nav/resources-active.svg?react', () => ({ default: (props: any) => <svg data-testid="icon-resources-active" {...props} /> }));
vi.mock('@/assets/icons/nav/personal-folder.svg?react', () => ({ default: (props: any) => <svg data-testid="icon-personal-folder" {...props} /> }));
vi.mock('@/assets/icons/nav/personal-folder-active.svg?react', () => ({ default: (props: any) => <svg data-testid="icon-personal-folder-active" {...props} /> }));
vi.mock('@/assets/icons/nav/approval.svg?react', () => ({ default: (props: any) => <svg data-testid="icon-approval" {...props} /> }));
vi.mock('@/assets/icons/nav/approval-active.svg?react', () => ({ default: (props: any) => <svg data-testid="icon-approval-active" {...props} /> }));
vi.mock('@/assets/icons/nav/query-stats.svg?react', () => ({ default: (props: any) => <svg data-testid="icon-query-stats" {...props} /> }));
vi.mock('@/assets/icons/nav/query-stats-active.svg?react', () => ({ default: (props: any) => <svg data-testid="icon-query-stats-active" {...props} /> }));
vi.mock('@/assets/icons/nav/knowledge.svg?react', () => ({ default: (props: any) => <svg data-testid="icon-knowledge" {...props} /> }));
vi.mock('@/assets/icons/nav/knowledge-active.svg?react', () => ({ default: (props: any) => <svg data-testid="icon-knowledge-active" {...props} /> }));
vi.mock('@/assets/icons/nav/template.svg?react', () => ({ default: (props: any) => <svg data-testid="icon-template" {...props} /> }));
vi.mock('@/assets/icons/nav/template-active.svg?react', () => ({ default: (props: any) => <svg data-testid="icon-template-active" {...props} /> }));

const renderWithAntd = (ui: React.ReactElement) =>
  render(<ConfigProvider>{ui}</ConfigProvider>);

describe('Sidebar', () => {
  it('renders user avatar with initial letter', () => {
    renderWithAntd(<Sidebar />);
    expect(screen.getByText('T')).toBeInTheDocument();
  });

  it('renders online status dot', () => {
    const { container } = renderWithAntd(<Sidebar />);
    const dots = container.querySelectorAll('[class*="onlineDot"]');
    expect(dots.length).toBe(1);
  });

  it('renders all 13 navigation icons', () => {
    renderWithAntd(<Sidebar />);
    expect(screen.getByTestId('icon-workspace')).toBeInTheDocument();
    expect(screen.getByTestId('icon-project-mgmt')).toBeInTheDocument();
    expect(screen.getByTestId('icon-dashboard-active')).toBeInTheDocument();
    expect(screen.getByTestId('icon-file-mgmt')).toBeInTheDocument();
    expect(screen.getByTestId('icon-bom-mgmt')).toBeInTheDocument();
    expect(screen.getByTestId('icon-process-mgmt')).toBeInTheDocument();
    expect(screen.getByTestId('icon-approval')).toBeInTheDocument();
    expect(screen.getByTestId('icon-config-mgmt')).toBeInTheDocument();
    expect(screen.getByTestId('icon-query-stats')).toBeInTheDocument();
    expect(screen.getByTestId('icon-resources')).toBeInTheDocument();
    expect(screen.getByTestId('icon-knowledge')).toBeInTheDocument();
    expect(screen.getByTestId('icon-template')).toBeInTheDocument();
    expect(screen.getByTestId('icon-personal-folder')).toBeInTheDocument();
  });

  it('renders settings icon at bottom', () => {
    const { container } = renderWithAntd(<Sidebar />);
    const settingsBtn = container.querySelector('[class*="settingsItem"]');
    expect(settingsBtn).toBeInTheDocument();
  });

  it('navigates when a nav icon is clicked', async () => {
    const user = userEvent.setup();
    renderWithAntd(<Sidebar />);
    const projectIcon = screen.getByTestId('icon-project-mgmt');
    await user.click(projectIcon.closest('[class*="navItem"]')!);
    expect(mockNavigate).toHaveBeenCalledWith('/project');
  });

  it('navigates to config when settings is clicked', async () => {
    const user = userEvent.setup();
    const { container } = renderWithAntd(<Sidebar />);
    const settingsBtn = container.querySelector('[class*="settingsItem"]')!;
    await user.click(settingsBtn);
    expect(mockNavigate).toHaveBeenCalledWith('/config');
  });
});
