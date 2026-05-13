import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfigProvider, message } from 'antd';
import RoleFormEnhanced from './RoleFormEnhanced';

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

const mockMenuTree = [
  { id: 'menu1', code: 'system', name: '系统管理', type: 'menu', status: 1, sortOrder: 1, description: '' },
];

const mockDataPermissions = [
  { id: 'dp1', code: 'data:global', description: '全局数据', type: 'field', optional: true, status: 1 },
  { id: 'dp2', code: 'data:dept', description: '部门数据', type: 'record', optional: false, status: 1 },
];

const mockAppAuths = [
  { id: 'app1', keyName: 'api:task:read', description: '任务读取', type: 'api', scope: 'global', status: 1 },
];

const mockFuncPerms = [
  { permCode: 'task:create', permValue: true },
  { permCode: 'task:edit', permValue: false },
];
const mockDataPerms = [
  { permCode: 'data:global', permValue: true },
  { permCode: 'data:dept', permValue: false },
];
const mockAppPerms = [
  { permCode: 'api:task:read', permValue: true },
];
const mockMenuPerms = [
  { permCode: 'menu1', permValue: true },
];

const mockGetMenuTree = vi.fn().mockResolvedValue({ code: 0, data: mockMenuTree });
const mockGetDataPermissions = vi.fn().mockResolvedValue({ code: 0, data: mockDataPermissions });
const mockGetAppAuthorizations = vi.fn().mockResolvedValue({ code: 0, data: mockAppAuths });
const mockGetRolePermissions = vi.fn();
const mockUpdateRolePermissions = vi.fn().mockResolvedValue({ code: 0, data: {} });

vi.mock('@/services/config.service', () => ({
  getMenuTree: (...args: any[]) => mockGetMenuTree(...args),
  getDataPermissions: (...args: any[]) => mockGetDataPermissions(...args),
  getAppAuthorizations: (...args: any[]) => mockGetAppAuthorizations(...args),
  getRolePermissions: (...args: any[]) => mockGetRolePermissions(...args),
  updateRolePermissions: (...args: any[]) => mockUpdateRolePermissions(...args),
}));

const renderWithAntd = (ui: React.ReactElement) =>
  render(<ConfigProvider>{ui}</ConfigProvider>);

describe('RoleFormEnhanced', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetMenuTree.mockResolvedValue({ code: 0, data: mockMenuTree });
    mockGetDataPermissions.mockResolvedValue({ code: 0, data: mockDataPermissions });
    mockGetAppAuthorizations.mockResolvedValue({ code: 0, data: mockAppAuths });
    mockGetRolePermissions.mockImplementation((_roleId: string, type: string) => {
      const map: Record<string, any> = {
        function: { code: 0, data: mockFuncPerms },
        data: { code: 0, data: mockDataPerms },
        app: { code: 0, data: mockAppPerms },
        menu: { code: 0, data: mockMenuPerms },
      };
      return Promise.resolve(map[type] ?? { code: 0, data: [] });
    });
    mockUpdateRolePermissions.mockResolvedValue({ code: 0, data: {} });
  });

  it('renders modal when open is true', async () => {
    renderWithAntd(
      <RoleFormEnhanced open={true} roleId="role1" roleName="管理员" onClose={() => {}} />,
    );
    await waitFor(() => {
      expect(screen.getByText('权限配置 - 管理员')).toBeInTheDocument();
    });
  });

  it('does not render modal content when open is false', () => {
    renderWithAntd(
      <RoleFormEnhanced open={false} roleId="role1" roleName="管理员" onClose={() => {}} />,
    );
    expect(screen.queryByText('权限配置 - 管理员')).not.toBeInTheDocument();
  });

  it('fetches all permission data on open', async () => {
    renderWithAntd(
      <RoleFormEnhanced open={true} roleId="role1" roleName="管理员" onClose={() => {}} />,
    );
    await waitFor(() => {
      expect(mockGetMenuTree).toHaveBeenCalled();
      expect(mockGetDataPermissions).toHaveBeenCalled();
      expect(mockGetAppAuthorizations).toHaveBeenCalled();
      expect(mockGetRolePermissions).toHaveBeenCalledWith('role1', 'function');
      expect(mockGetRolePermissions).toHaveBeenCalledWith('role1', 'data');
      expect(mockGetRolePermissions).toHaveBeenCalledWith('role1', 'app');
      expect(mockGetRolePermissions).toHaveBeenCalledWith('role1', 'menu');
    });
  });

  it('shows function permission checkboxes with correct state', async () => {
    renderWithAntd(
      <RoleFormEnhanced open={true} roleId="role1" roleName="管理员" onClose={() => {}} />,
    );
    await waitFor(() => {
      expect(screen.getByText('创建任务')).toBeInTheDocument();
      expect(screen.getByText('编辑任务')).toBeInTheDocument();
    });
  });

  it('shows data permission radio options', async () => {
    const user = userEvent.setup();
    renderWithAntd(
      <RoleFormEnhanced open={true} roleId="role1" roleName="管理员" onClose={() => {}} />,
    );
    await waitFor(() => {
      expect(screen.getByText('创建任务')).toBeInTheDocument();
    });
    // Switch to "数据权限" tab
    fireEvent.click(screen.getByText('数据权限'));
    await waitFor(() => {
      expect(screen.getByText((content) => content.includes('全局数据'))).toBeInTheDocument();
      expect(screen.getByText((content) => content.includes('部门数据'))).toBeInTheDocument();
    });
  });

  it('shows tabs for different permission types', async () => {
    renderWithAntd(
      <RoleFormEnhanced open={true} roleId="role1" roleName="管理员" onClose={() => {}} />,
    );
    await waitFor(() => {
      expect(screen.getByText('功能权限')).toBeInTheDocument();
      expect(screen.getByText('数据权限')).toBeInTheDocument();
      expect(screen.getByText('应用权限')).toBeInTheDocument();
      expect(screen.getByText('菜单权限')).toBeInTheDocument();
    });
  });

  it('calls updateRolePermissions on save', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    renderWithAntd(
      <RoleFormEnhanced open={true} roleId="role1" roleName="管理员" onClose={onClose} />,
    );
    await waitFor(() => {
      expect(screen.getByText('创建任务')).toBeInTheDocument();
    });
    // Click the save button (保存)
    const saveBtn = document.querySelector('.ant-modal-footer .ant-btn-primary') as HTMLElement;
    expect(saveBtn).toBeTruthy();
    await user.click(saveBtn);
    await waitFor(() => {
      expect(mockUpdateRolePermissions).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });
  });
});
