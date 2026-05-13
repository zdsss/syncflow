import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfigProvider } from 'antd';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import PermissionMatrix from './PermissionMatrix';

const mockGetPermissions = vi.fn();
const mockUpdatePermissions = vi.fn();

vi.mock('@/services/config.service', () => ({
  getPermissions: (...args: any[]) => mockGetPermissions(...args),
  updatePermissions: (...args: any[]) => mockUpdatePermissions(...args),
}));

const renderWithAntd = (ui: React.ReactElement) =>
  render(<ConfigProvider>{ui}</ConfigProvider>);

const MOCK_PERMISSIONS = [
  { id: 'r1', name: '管理员', project: true, task: true, file: true, bom: true, approval: true, config: true, dataPermission: 'global' },
  { id: 'r2', name: '项目经理', project: true, task: true, file: true, bom: true, approval: true, config: false, dataPermission: 'department' },
  { id: 'r3', name: '工程师', project: true, task: true, file: true, bom: true, approval: false, config: false, dataPermission: 'project' },
  { id: 'r4', name: '设计师', project: true, task: true, file: true, bom: false, approval: false, config: false, dataPermission: 'project' },
  { id: 'r5', name: '访客', project: true, task: false, file: false, bom: false, approval: false, config: false, dataPermission: 'personal' },
];

describe('PermissionMatrix', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetPermissions.mockResolvedValue({ code: 0, data: MOCK_PERMISSIONS });
    mockUpdatePermissions.mockResolvedValue({ code: 0, message: 'ok' });
  });

  it('fetches permissions from API on mount', async () => {
    renderWithAntd(<PermissionMatrix />);
    expect(mockGetPermissions).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(screen.getByText('管理员')).toBeInTheDocument();
    });
  });

  it('renders all roles from API data', async () => {
    renderWithAntd(<PermissionMatrix />);
    await waitFor(() => {
      expect(screen.getByText('管理员')).toBeInTheDocument();
      expect(screen.getByText('项目经理')).toBeInTheDocument();
      expect(screen.getByText('工程师')).toBeInTheDocument();
      expect(screen.getByText('设计师')).toBeInTheDocument();
      expect(screen.getByText('访客')).toBeInTheDocument();
    });
  });

  it('renders module column headers', async () => {
    renderWithAntd(<PermissionMatrix />);
    await waitFor(() => {
      expect(screen.getByText('管理员')).toBeInTheDocument();
    });
    // Module headers appear as column headers in the table
    expect(screen.getAllByText(/项目/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/任务/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/文件/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/BOM/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/审批/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/配置/).length).toBeGreaterThan(0);
  });

  it('renders data permission section with roles from API', async () => {
    renderWithAntd(<PermissionMatrix />);
    await waitFor(() => {
      expect(screen.getByText('管理员')).toBeInTheDocument();
    });
    const section = screen.getByTestId('data-permission');
    expect(section).toBeInTheDocument();
    expect(within(section).getByText('数据权限')).toBeInTheDocument();
    expect(within(section).getByText('管理员:')).toBeInTheDocument();
    expect(within(section).getByText('项目经理:')).toBeInTheDocument();
    expect(within(section).getByText('工程师:')).toBeInTheDocument();
    expect(within(section).getByText('设计师:')).toBeInTheDocument();
    expect(within(section).getByText('访客:')).toBeInTheDocument();
  });

  it('renders data permission level descriptions', async () => {
    renderWithAntd(<PermissionMatrix />);
    await waitFor(() => {
      expect(screen.getByText('管理员')).toBeInTheDocument();
    });
    const section = screen.getByTestId('data-permission');
    expect(within(section).getAllByText(/管理员可见所有数据/).length).toBeGreaterThanOrEqual(1);
    expect(within(section).getAllByText(/同部门可见/).length).toBeGreaterThanOrEqual(1);
    expect(within(section).getAllByText(/项目成员可见/).length).toBeGreaterThanOrEqual(1);
    expect(within(section).getAllByText(/仅自己可见/).length).toBeGreaterThanOrEqual(1);
  });

  it('checkboxes are enabled (not disabled)', async () => {
    renderWithAntd(<PermissionMatrix />);
    await waitFor(() => {
      expect(screen.getByText('管理员')).toBeInTheDocument();
    });
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes.length).toBeGreaterThan(0);
    // At least some checkboxes should not be disabled
    const enabledCheckboxes = checkboxes.filter((cb) => !cb.hasAttribute('disabled'));
    expect(enabledCheckboxes.length).toBeGreaterThan(0);
  });

  it('toggling a checkbox calls updatePermissions', async () => {
    const user = userEvent.setup();
    renderWithAntd(<PermissionMatrix />);
    await waitFor(() => {
      expect(screen.getByText('管理员')).toBeInTheDocument();
    });

    // Find checkboxes - antd Checkbox uses role="checkbox"
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes.length).toBeGreaterThan(0);

    // Click the first enabled checkbox
    const enabledBox = checkboxes.find((cb) => !cb.hasAttribute('disabled'));
    expect(enabledBox).toBeTruthy();
    await user.click(enabledBox!);

    await waitFor(() => {
      expect(mockUpdatePermissions).toHaveBeenCalled();
    }, { timeout: 3000 });
  });

  it('changing data permission radio calls updatePermissions', async () => {
    const user = userEvent.setup();
    renderWithAntd(<PermissionMatrix />);
    await waitFor(() => {
      expect(screen.getByText('管理员')).toBeInTheDocument();
    });

    const section = screen.getByTestId('data-permission');
    // Find a radio that is not currently selected for 访客 (currently 'personal')
    // Click '全局' for 访客 role
    const radios = within(section).getAllByRole('radio');
    // Find the '全局 (管理员可见所有数据)' radio associated with 访客
    // The radios are laid out: 4 per role (global/department/project/personal) x 5 roles = 20 radios
    // 访客 is the 5th role (index 4), so radios[16..19]
    // radios[16] = global, radios[17] = department, radios[18] = project, radios[19] = personal
    // personal should be checked for 访客
    const guestGlobalRadio = radios[16]; // global for 访客
    expect(guestGlobalRadio).toBeTruthy();

    await user.click(guestGlobalRadio);

    await waitFor(() => {
      expect(mockUpdatePermissions).toHaveBeenCalled();
    });
  });

  it('shows loading state initially', () => {
    // Return a never-resolving promise to keep loading
    mockGetPermissions.mockReturnValue(new Promise(() => {}));
    renderWithAntd(<PermissionMatrix />);
    // While loading, the main content should not be rendered yet
    expect(screen.queryByText('管理员')).not.toBeInTheDocument();
  });

  it('renders with empty permissions when API returns empty', async () => {
    mockGetPermissions.mockResolvedValue({ code: 0, data: [] });
    renderWithAntd(<PermissionMatrix />);
    await waitFor(() => {
      expect(screen.getByTestId('permission-matrix')).toBeInTheDocument();
    });
    // No roles should appear in the table body
    const section = screen.getByTestId('data-permission');
    expect(within(section).queryByText('管理员:')).not.toBeInTheDocument();
  });
});
