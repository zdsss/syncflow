import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfigProvider, message } from 'antd';
import DataPermissionPage from './DataPermissionPage';

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

const mockDataPerms = [
  { id: 'dp1', code: 'data:global', description: '全局数据', type: 'field', optional: true, status: 1 },
  { id: 'dp2', code: 'data:dept', description: '部门数据', type: 'record', optional: false, status: 1 },
  { id: 'dp3', code: 'data:personal', description: '个人数据', type: 'function', optional: true, status: 0 },
];

const mockGetDataPermissions = vi.fn().mockResolvedValue({ code: 0, data: mockDataPerms });
const mockCreateDataPermission = vi.fn().mockResolvedValue({ code: 0, data: { id: 'dp-new' } });
const mockUpdateDataPermission = vi.fn().mockResolvedValue({ code: 0, data: {} });
const mockDeleteDataPermission = vi.fn().mockResolvedValue({ code: 0, data: null });

vi.mock('@/services/config.service', () => ({
  getDataPermissions: (...args: any[]) => mockGetDataPermissions(...args),
  createDataPermission: (...args: any[]) => mockCreateDataPermission(...args),
  updateDataPermission: (...args: any[]) => mockUpdateDataPermission(...args),
  deleteDataPermission: (...args: any[]) => mockDeleteDataPermission(...args),
}));

const renderWithAntd = (ui: React.ReactElement) =>
  render(<ConfigProvider>{ui}</ConfigProvider>);

describe('DataPermissionPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetDataPermissions.mockResolvedValue({ code: 0, data: mockDataPerms });
  });

  it('renders the data permission page container', async () => {
    renderWithAntd(<DataPermissionPage />);
    expect(screen.getByTestId('data-permission-page')).toBeInTheDocument();
    await waitFor(() => {
      expect(mockGetDataPermissions).toHaveBeenCalled();
    });
  });

  it('displays data permission items after loading', async () => {
    renderWithAntd(<DataPermissionPage />);
    await waitFor(() => {
      expect(screen.getByText('data:global')).toBeInTheDocument();
      expect(screen.getByText('全局数据')).toBeInTheDocument();
      expect(screen.getByText('data:dept')).toBeInTheDocument();
      expect(screen.getByText('部门数据')).toBeInTheDocument();
      expect(screen.getByText('data:personal')).toBeInTheDocument();
    });
  });

  it('shows type labels', async () => {
    renderWithAntd(<DataPermissionPage />);
    await waitFor(() => {
      expect(screen.getByText('字段级')).toBeInTheDocument();
      expect(screen.getByText('记录级')).toBeInTheDocument();
      expect(screen.getByText('功能级')).toBeInTheDocument();
    });
  });

  it('shows optional column values', async () => {
    renderWithAntd(<DataPermissionPage />);
    await waitFor(() => {
      const yesElements = screen.getAllByText('是');
      const noElements = screen.getAllByText('否');
      expect(yesElements.length).toBeGreaterThanOrEqual(1);
      expect(noElements.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('shows status tags', async () => {
    renderWithAntd(<DataPermissionPage />);
    await waitFor(() => {
      expect(screen.getAllByText('启用').length).toBeGreaterThanOrEqual(2);
      expect(screen.getByText('禁用')).toBeInTheDocument();
    });
  });

  it('opens add modal when clicking add button', async () => {
    const user = userEvent.setup();
    renderWithAntd(<DataPermissionPage />);
    await waitFor(() => {
      expect(mockGetDataPermissions).toHaveBeenCalled();
    });
    const addBtn = screen.getByText('新增数据权限');
    await user.click(addBtn);
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  it('handles delete action', async () => {
    const user = userEvent.setup();
    renderWithAntd(<DataPermissionPage />);
    await waitFor(() => {
      expect(screen.getByText('data:global')).toBeInTheDocument();
    });
    const deleteButtons = document.querySelectorAll('.ant-btn-icon-only.ant-btn-dangerous');
    expect(deleteButtons.length).toBeGreaterThan(0);
    await user.click(deleteButtons[0] as HTMLElement);
    await waitFor(() => {
      const confirmBtn = document.querySelector('.ant-popconfirm-buttons .ant-btn-primary') as HTMLElement;
      expect(confirmBtn).toBeTruthy();
    });
    const confirmBtn = document.querySelector('.ant-popconfirm-buttons .ant-btn-primary') as HTMLElement;
    await user.click(confirmBtn);
    await waitFor(() => {
      expect(mockDeleteDataPermission).toHaveBeenCalledWith('dp1');
    });
  });
});
