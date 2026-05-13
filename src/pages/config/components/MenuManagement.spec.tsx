import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfigProvider, message } from 'antd';
import MenuManagement from './MenuManagement';

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
  {
    id: 'menu1', code: 'system', name: '系统管理', type: 'menu', status: 1, sortOrder: 1, description: '系统管理',
    children: [
      { id: 'menu1-1', code: 'system:user', name: '用户管理', type: 'menu', status: 1, parentId: 'menu1', sortOrder: 1, description: '用户管理' },
      { id: 'menu1-2', code: 'system:role', name: '角色管理', type: 'menu', status: 1, parentId: 'menu1', sortOrder: 2, description: '角色管理' },
    ],
  },
  {
    id: 'menu2', code: 'project', name: '项目管理', type: 'menu', status: 1, sortOrder: 2, description: '项目管理',
    children: [],
  },
];

const mockGetMenuTree = vi.fn().mockResolvedValue({ code: 0, data: mockMenuTree });
const mockCreateMenuItem = vi.fn().mockResolvedValue({ code: 0, data: { id: 'menu-new' } });
const mockUpdateMenuItem = vi.fn().mockResolvedValue({ code: 0, data: {} });
const mockDeleteMenuItem = vi.fn().mockResolvedValue({ code: 0, data: null });

vi.mock('@/services/config.service', () => ({
  getMenuTree: (...args: any[]) => mockGetMenuTree(...args),
  createMenuItem: (...args: any[]) => mockCreateMenuItem(...args),
  updateMenuItem: (...args: any[]) => mockUpdateMenuItem(...args),
  deleteMenuItem: (...args: any[]) => mockDeleteMenuItem(...args),
}));

const renderWithAntd = (ui: React.ReactElement) =>
  render(<ConfigProvider>{ui}</ConfigProvider>);

describe('MenuManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetMenuTree.mockResolvedValue({ code: 0, data: mockMenuTree });
  });

  it('renders the menu management container', async () => {
    renderWithAntd(<MenuManagement />);
    expect(screen.getByTestId('menu-management')).toBeInTheDocument();
    await waitFor(() => {
      expect(mockGetMenuTree).toHaveBeenCalled();
    });
  });

  it('displays menu tree items after loading', async () => {
    renderWithAntd(<MenuManagement />);
    await waitFor(() => {
      expect(screen.getByText('系统管理')).toBeInTheDocument();
      expect(screen.getByText('项目管理')).toBeInTheDocument();
    });
  });

  it('shows menu type labels', async () => {
    renderWithAntd(<MenuManagement />);
    await waitFor(() => {
      expect(screen.getByText('系统管理')).toBeInTheDocument();
    });
    const menuLabels = screen.getAllByText((content) => content === '菜单');
    expect(menuLabels.length).toBeGreaterThanOrEqual(2);
  });

  it('shows status tags in tree nodes', async () => {
    renderWithAntd(<MenuManagement />);
    await waitFor(() => {
      expect(screen.getByText('系统管理')).toBeInTheDocument();
    });
    const enabledTags = screen.getAllByText((content) => content === '启用');
    expect(enabledTags.length).toBeGreaterThanOrEqual(2);
  });

  it('opens add menu modal when clicking add button', async () => {
    const user = userEvent.setup();
    renderWithAntd(<MenuManagement />);
    await waitFor(() => {
      expect(mockGetMenuTree).toHaveBeenCalled();
    });
    const addBtn = screen.getByText('新增菜单');
    await user.click(addBtn);
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('新增菜单', { selector: '.ant-modal-title' })).toBeInTheDocument();
    });
  });

  it('handles delete action on a menu item', async () => {
    const user = userEvent.setup();
    renderWithAntd(<MenuManagement />);
    await waitFor(() => {
      expect(screen.getByText('系统管理')).toBeInTheDocument();
    });
    // Find all delete icon buttons (Popconfirm triggers with DeleteOutlined)
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
      expect(mockDeleteMenuItem).toHaveBeenCalledWith('menu1');
    });
  });
});
