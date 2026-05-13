import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfigProvider, message } from 'antd';
import AppAuthorizationPage from './AppAuthorizationPage';

vi.mock('antd', async (importOriginal) => {
  const actual = await importOriginal<typeof import('antd')>();
  return {
    ...actual,
    message: {
      ...actual.message,
      success: vi.fn(),
      error: vi.fn(),
    },
  };
});

const mockAuthItems = [
  { id: 'auth1', keyName: 'api:task:read', description: '任务读取', type: 'api', scope: 'global', status: 1 },
  { id: 'auth2', keyName: 'api:task:write', description: '任务写入', type: 'api', scope: 'global', status: 1 },
  { id: 'auth3', keyName: 'func:export', description: '导出功能', type: 'function', scope: 'department', status: 0 },
];

const mockGetAppAuthorizations = vi.fn().mockResolvedValue({ code: 0, data: mockAuthItems });
const mockCreateAppAuthorization = vi.fn().mockResolvedValue({ code: 0, data: { id: 'auth-new' } });
const mockUpdateAppAuthorization = vi.fn().mockResolvedValue({ code: 0, data: {} });
const mockDeleteAppAuthorization = vi.fn().mockResolvedValue({ code: 0, data: null });

vi.mock('@/services/config.service', () => ({
  getAppAuthorizations: (...args: any[]) => mockGetAppAuthorizations(...args),
  createAppAuthorization: (...args: any[]) => mockCreateAppAuthorization(...args),
  updateAppAuthorization: (...args: any[]) => mockUpdateAppAuthorization(...args),
  deleteAppAuthorization: (...args: any[]) => mockDeleteAppAuthorization(...args),
}));

const renderWithAntd = (ui: React.ReactElement) =>
  render(<ConfigProvider>{ui}</ConfigProvider>);

describe('AppAuthorizationPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAppAuthorizations.mockResolvedValue({ code: 0, data: mockAuthItems });
  });

  it('renders the app authorization page container', async () => {
    renderWithAntd(<AppAuthorizationPage />);
    expect(screen.getByTestId('app-authorization-page')).toBeInTheDocument();
    await waitFor(() => {
      expect(mockGetAppAuthorizations).toHaveBeenCalled();
    });
  });

  it('displays authorization items after loading', async () => {
    renderWithAntd(<AppAuthorizationPage />);
    await waitFor(() => {
      expect(screen.getByText('api:task:read')).toBeInTheDocument();
      expect(screen.getByText('任务读取')).toBeInTheDocument();
      expect(screen.getByText('api:task:write')).toBeInTheDocument();
      expect(screen.getByText('导出功能')).toBeInTheDocument();
    });
  });

  it('shows type labels', async () => {
    renderWithAntd(<AppAuthorizationPage />);
    await waitFor(() => {
      expect(screen.getAllByText('API').length).toBeGreaterThanOrEqual(2);
      expect(screen.getByText('功能')).toBeInTheDocument();
    });
  });

  it('shows status tags', async () => {
    renderWithAntd(<AppAuthorizationPage />);
    await waitFor(() => {
      expect(screen.getAllByText('启用').length).toBeGreaterThanOrEqual(2);
      expect(screen.getByText('禁用')).toBeInTheDocument();
    });
  });

  it('opens add modal when clicking add button', async () => {
    const user = userEvent.setup();
    renderWithAntd(<AppAuthorizationPage />);
    await waitFor(() => {
      expect(mockGetAppAuthorizations).toHaveBeenCalled();
    });
    const addBtn = screen.getByText('新增应用授权');
    await user.click(addBtn);
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('新增应用授权', { selector: '.ant-modal-title' })).toBeInTheDocument();
    });
  });

  it('handles delete action', async () => {
    const user = userEvent.setup();
    renderWithAntd(<AppAuthorizationPage />);
    await waitFor(() => {
      expect(screen.getByText('api:task:read')).toBeInTheDocument();
    });
    // Find delete buttons (icon buttons with DeleteOutlined)
    const deleteButtons = document.querySelectorAll('.ant-btn-icon-only.ant-btn-dangerous');
    expect(deleteButtons.length).toBeGreaterThan(0);
    await user.click(deleteButtons[0] as HTMLElement);
    // Confirm the popconfirm
    await waitFor(() => {
      const confirmBtn = document.querySelector('.ant-popconfirm-buttons .ant-btn-primary') as HTMLElement;
      expect(confirmBtn).toBeTruthy();
    });
    const confirmBtn = document.querySelector('.ant-popconfirm-buttons .ant-btn-primary') as HTMLElement;
    await user.click(confirmBtn);
    await waitFor(() => {
      expect(mockDeleteAppAuthorization).toHaveBeenCalledWith('auth1');
    });
  });
});
