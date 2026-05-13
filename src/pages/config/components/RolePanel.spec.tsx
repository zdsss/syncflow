import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfigProvider } from 'antd';
import RolePanel from './RolePanel';

const mockSelectRole = vi.fn();
const mockSetMembers = vi.fn();
const mockSetRoles = vi.fn();

vi.mock('@/stores/useConfigStore', () => ({
  useConfigStore: () => ({
    roles: [
      { id: 'r1', name: '前端开发', departmentId: 'd4', permissions: [], memberCount: 3 },
      { id: 'r2', name: '后端开发', departmentId: 'd4', permissions: [], memberCount: 5 },
      { id: 'r3', name: 'UI设计师', departmentId: 'd4', permissions: [], memberCount: 2 },
    ],
    selectedRoleId: 'r1',
    selectedDepartmentId: 'd4',
    selectRole: mockSelectRole,
    setMembers: mockSetMembers,
    setRoles: mockSetRoles,
    loading: false,
  }),
}));

const mockCreateRole = vi.fn().mockResolvedValue({
  code: 0,
  data: { id: 'r4', name: '测试工程师', departmentId: 'd4', permissions: [], memberCount: 0 },
});

vi.mock('@/services/config.service', () => ({
  getMembers: vi.fn().mockResolvedValue({
    code: 200,
    data: [],
  }),
  createRole: (...args: any[]) => mockCreateRole(...args),
}));

const renderWithAntd = (ui: React.ReactElement) =>
  render(<ConfigProvider>{ui}</ConfigProvider>);

describe('RolePanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders role list', () => {
    renderWithAntd(<RolePanel />);
    expect(screen.getByText('前端开发')).toBeInTheDocument();
    expect(screen.getByText('后端开发')).toBeInTheDocument();
    expect(screen.getByText('UI设计师')).toBeInTheDocument();
  });

  it('shows add role button', () => {
    renderWithAntd(<RolePanel />);
    expect(screen.getByText('添加角色')).toBeInTheDocument();
  });

  it('displays member counts as badges', () => {
    renderWithAntd(<RolePanel />);
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('selects a role on click', async () => {
    const user = userEvent.setup();
    renderWithAntd(<RolePanel />);
    await user.click(screen.getByText('后端开发'));
    expect(mockSelectRole).toHaveBeenCalledWith('r2');
  });

  it('renders role panel container', () => {
    renderWithAntd(<RolePanel />);
    const panel = document.querySelector('[class*="panel"]');
    expect(panel).toBeInTheDocument();
  });

  it('highlights active role', () => {
    renderWithAntd(<RolePanel />);
    const activeItem = document.querySelector('[class*="roleItemActive"]');
    expect(activeItem).toBeInTheDocument();
    expect(activeItem).toHaveTextContent('前端开发');
  });

  describe('Add Role Modal', () => {
    it('opens modal when clicking add role button', async () => {
      const user = userEvent.setup();
      renderWithAntd(<RolePanel />);
      await user.click(screen.getByText('添加角色'));

      await waitFor(() => {
        expect(screen.getByText('新建角色')).toBeInTheDocument();
      });
    });

    it('modal contains name input', async () => {
      const user = userEvent.setup();
      renderWithAntd(<RolePanel />);
      await user.click(screen.getByText('添加角色'));

      await waitFor(() => {
        expect(screen.getByLabelText('角色名称')).toBeInTheDocument();
      });
    });

    it('form accepts role name input', async () => {
      const user = userEvent.setup();
      renderWithAntd(<RolePanel />);
      await user.click(screen.getByText('添加角色'));

      await waitFor(() => {
        expect(screen.getByLabelText('角色名称')).toBeInTheDocument();
      });

      const input = screen.getByLabelText('角色名称');
      await user.clear(input);
      await user.type(input, '测试工程师');

      expect(input).toHaveValue('测试工程师');
    });

    it('form has required name field', async () => {
      const user = userEvent.setup();
      renderWithAntd(<RolePanel />);
      await user.click(screen.getByText('添加角色'));

      await waitFor(() => {
        const input = screen.getByLabelText('角色名称');
        expect(input).toBeRequired();
      });
    });
  });
});
