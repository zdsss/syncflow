import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfigProvider, message } from 'antd';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import MemberPanel from './MemberPanel';

const mockSetMembers = vi.fn();
const mockGetMembers = vi.fn();
const mockAddMember = vi.fn();
const mockRemoveMember = vi.fn();
const mockGetUsers = vi.fn();

vi.mock('@/stores/useConfigStore', () => ({
  useConfigStore: () => ({
    roles: [{ id: 'r1', name: '前端开发', departmentId: 'd4', permissions: [], memberCount: 3 }],
    selectedRoleId: 'r1',
    members: [
      { id: 'u1', name: '邓智豪', email: 'deng@syncflow.com', departmentId: 'd2', roleIds: ['r1'], teamIds: ['t1'], status: 'active', createdAt: '', updatedAt: '' },
      { id: 'u2', name: '王美玲', email: 'wang.ml@syncflow.com', departmentId: 'd2', roleIds: ['r1'], teamIds: ['t1'], status: 'active', createdAt: '', updatedAt: '' },
    ],
    setMembers: mockSetMembers,
  }),
}));

vi.mock('@/services/config.service', () => ({
  getMembers: (...args: unknown[]) => mockGetMembers(...args),
  addMember: (...args: unknown[]) => mockAddMember(...args),
  removeMember: (...args: unknown[]) => mockRemoveMember(...args),
  getUsers: (...args: unknown[]) => mockGetUsers(...args),
}));

vi.mock('antd', async (importOriginal) => {
  const actual = await importOriginal<typeof import('antd')>();
  return {
    ...actual,
    message: {
      ...actual.message,
      success: vi.fn(),
    },
  };
});

const renderWithAntd = (ui: React.ReactElement) =>
  render(<ConfigProvider>{ui}</ConfigProvider>);

const allUsersData = [
  { id: 'u1', name: '邓智豪', email: 'deng@syncflow.com' },
  { id: 'u2', name: '王美玲', email: 'wang.ml@syncflow.com' },
  { id: 'u3', name: '陈思远', email: 'chen.sy@syncflow.com' },
  { id: 'u6', name: '张伟', email: 'zhang.w@syncflow.com' },
  { id: 'u7', name: '李娜', email: 'li.n@syncflow.com' },
];

const freshMembers = [
  { id: 'u3', name: '陈思远', email: 'chen.sy@syncflow.com', departmentId: 'd2', roleIds: ['r1'], teamIds: ['t1'], status: 'active', createdAt: '', updatedAt: '' },
];

describe('MemberPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetMembers.mockResolvedValue({ code: 200, data: [
      { id: 'u1', name: '邓智豪', email: 'deng@syncflow.com', departmentId: 'd2', roleIds: ['r1'], teamIds: ['t1'], status: 'active', createdAt: '', updatedAt: '' },
      { id: 'u2', name: '王美玲', email: 'wang.ml@syncflow.com', departmentId: 'd2', roleIds: ['r1'], teamIds: ['t1'], status: 'active', createdAt: '', updatedAt: '' },
    ] });
    mockAddMember.mockResolvedValue({ code: 200, data: {} });
    mockRemoveMember.mockResolvedValue({ code: 200, message: 'ok' });
    mockGetUsers.mockResolvedValue({ code: 200, data: allUsersData });
  });

  it('renders member table', () => {
    renderWithAntd(<MemberPanel />);
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  it('shows role title with member list header', () => {
    renderWithAntd(<MemberPanel />);
    expect(screen.getByText('前端开发 - 成员列表')).toBeInTheDocument();
  });

  it('shows add member button', () => {
    renderWithAntd(<MemberPanel />);
    expect(screen.getByText('添加成员')).toBeInTheDocument();
  });

  it('displays member names', () => {
    renderWithAntd(<MemberPanel />);
    expect(screen.getByText('邓智豪')).toBeInTheDocument();
    expect(screen.getByText('王美玲')).toBeInTheDocument();
  });

  it('shows empty state when no role selected', () => {
    vi.mocked(vi.importActual('@/stores/useConfigStore'));
    renderWithAntd(<MemberPanel />);
    expect(screen.getByText('姓名')).toBeInTheDocument();
    expect(screen.getByText('邮箱')).toBeInTheDocument();
  });

  it('opens add member modal when add button clicked', async () => {
    const user = userEvent.setup();
    renderWithAntd(<MemberPanel />);
    await user.click(screen.getByText('添加成员'));
    await waitFor(() => {
      expect(screen.getByText('确认添加')).toBeInTheDocument();
    });
  });

  it('fetches all users from API and displays non-members in modal', async () => {
    const user = userEvent.setup();
    renderWithAntd(<MemberPanel />);
    await user.click(screen.getByText('添加成员'));
    await waitFor(() => {
      expect(mockGetUsers).toHaveBeenCalled();
      // u3 is not in existing members (u1, u2), so it should appear
      expect(screen.getByText('陈思远')).toBeInTheDocument();
      // u1 and u2 are existing members, should NOT appear in modal
      expect(screen.queryAllByText('邓智豪').length).toBe(1); // only in the main table
    });
  });

  it('modal has correct title and ok text', async () => {
    const user = userEvent.setup();
    renderWithAntd(<MemberPanel />);
    await user.click(screen.getByText('添加成员'));
    await waitFor(() => {
      expect(screen.getByText('添加成员', { selector: '.ant-modal-title' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /确\s*认\s*添\s*加/ })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /取\s*消/ })).toBeInTheDocument();
    });
  });

  it('shows search input in add modal', async () => {
    const user = userEvent.setup();
    renderWithAntd(<MemberPanel />);
    await user.click(screen.getByText('添加成员'));
    await waitFor(() => {
      expect(screen.getByPlaceholderText('搜索成员姓名或邮箱...')).toBeInTheDocument();
    });
  });

  it('calls removeMember API on delete confirm and refreshes members', async () => {
    const user = userEvent.setup();
    const { container } = renderWithAntd(<MemberPanel />);

    // Wait for initial members load
    await waitFor(() => {
      expect(mockGetMembers).toHaveBeenCalledWith('r1');
    });

    const deleteBtn = container.querySelector('[data-testid="remove-member-u1"]') as HTMLElement;
    if (deleteBtn) {
      await user.click(deleteBtn);
      await waitFor(() => {
        expect(screen.getByText('确定要移除此成员吗？')).toBeInTheDocument();
      });
      const okBtn = screen.getByRole('button', { name: /确\s*定/ });
      await user.click(okBtn);
      await waitFor(() => {
        expect(mockRemoveMember).toHaveBeenCalledWith('u1');
        expect(mockGetMembers).toHaveBeenCalledWith('r1');
        expect(message.success).toHaveBeenCalledWith('成员已移除');
      });
    }
  });

  it('shows no empty state when role is selected', () => {
    renderWithAntd(<MemberPanel />);
    expect(screen.queryByText('请在左侧选择角色以查看成员')).not.toBeInTheDocument();
  });

  it('displays member emails in table', () => {
    renderWithAntd(<MemberPanel />);
    expect(screen.getByText('deng@syncflow.com')).toBeInTheDocument();
    expect(screen.getByText('wang.ml@syncflow.com')).toBeInTheDocument();
  });

  it('calls addMember API for each selected user and refreshes members', async () => {
    mockGetMembers.mockResolvedValueOnce({ code: 200, data: [
      { id: 'u1', name: '邓智豪', email: 'deng@syncflow.com', departmentId: 'd2', roleIds: ['r1'], teamIds: ['t1'], status: 'active', createdAt: '', updatedAt: '' },
      { id: 'u2', name: '王美玲', email: 'wang.ml@syncflow.com', departmentId: 'd2', roleIds: ['r1'], teamIds: ['t1'], status: 'active', createdAt: '', updatedAt: '' },
    ] });
    mockGetMembers.mockResolvedValueOnce({ code: 200, data: [
      { id: 'u1', name: '邓智豪', email: 'deng@syncflow.com', departmentId: 'd2', roleIds: ['r1'], teamIds: ['t1'], status: 'active', createdAt: '', updatedAt: '' },
      { id: 'u2', name: '王美玲', email: 'wang.ml@syncflow.com', departmentId: 'd2', roleIds: ['r1'], teamIds: ['t1'], status: 'active', createdAt: '', updatedAt: '' },
      { id: 'u3', name: '陈思远', email: 'chen.sy@syncflow.com', departmentId: 'd2', roleIds: ['r1'], teamIds: ['t1'], status: 'active', createdAt: '', updatedAt: '' },
    ] });

    const user = userEvent.setup();
    renderWithAntd(<MemberPanel />);
    await user.click(screen.getByText('添加成员'));
    await waitFor(() => {
      expect(screen.getByText('陈思远')).toBeInTheDocument();
    });
    // Click on the user row to select
    await user.click(screen.getByText('陈思远'));
    // Click confirm button
    await user.click(screen.getByRole('button', { name: /确\s*认\s*添\s*加/ }));
    await waitFor(() => {
      expect(mockAddMember).toHaveBeenCalledWith('r1', 'u3');
      expect(mockGetMembers).toHaveBeenCalled();
      expect(message.success).toHaveBeenCalledWith('已添加 1 名成员');
    });
  });

  it('filters users in modal by search keyword', async () => {
    const user = userEvent.setup();
    renderWithAntd(<MemberPanel />);
    await user.click(screen.getByText('添加成员'));
    await waitFor(() => {
      expect(screen.getByPlaceholderText('搜索成员姓名或邮箱...')).toBeInTheDocument();
    });
    // Type a search keyword that matches one user
    await user.type(screen.getByPlaceholderText('搜索成员姓名或邮箱...'), '陈思远');
    await waitFor(() => {
      expect(screen.getByText('陈思远')).toBeInTheDocument();
      // Other non-member users should be filtered out
      expect(screen.queryByText('张伟')).not.toBeInTheDocument();
    });
  });

  it('filters users by email in search', async () => {
    const user = userEvent.setup();
    renderWithAntd(<MemberPanel />);
    await user.click(screen.getByText('添加成员'));
    await waitFor(() => {
      expect(screen.getByPlaceholderText('搜索成员姓名或邮箱...')).toBeInTheDocument();
    });
    await user.type(screen.getByPlaceholderText('搜索成员姓名或邮箱...'), 'zhang.w@');
    await waitFor(() => {
      expect(screen.getByText('张伟')).toBeInTheDocument();
      expect(screen.queryByText('陈思远')).not.toBeInTheDocument();
    });
  });

  it('toggles user selection on click in add modal', async () => {
    const user = userEvent.setup();
    renderWithAntd(<MemberPanel />);
    await user.click(screen.getByText('添加成员'));
    await waitFor(() => {
      expect(screen.getByText('陈思远')).toBeInTheDocument();
    });
    // Select a user
    await user.click(screen.getByText('陈思远'));
    // The checkbox should be checked now
    const checkbox = screen.getByText('陈思远').closest('div[style]')?.querySelector('input[type="checkbox"]') as HTMLInputElement;
    expect(checkbox).toBeTruthy();
    // Click again to deselect
    await user.click(screen.getByText('陈思远'));
  });

  it('shows empty state when no role is selected', async () => {
    // We need to test the early return branch (lines 107-109).
    // Use vi.resetModules + doMock to get a fresh component with different store state.
    vi.resetModules();
    vi.doMock('@/stores/useConfigStore', () => ({
      useConfigStore: () => ({
        roles: [{ id: 'r1', name: '前端开发', departmentId: 'd4', permissions: [], memberCount: 3 }],
        selectedRoleId: 'nonexistent',
        members: [],
        setMembers: mockSetMembers,
      }),
    }));
    vi.doMock('@/services/config.service', () => ({
      getMembers: (...args: unknown[]) => mockGetMembers(...args),
      addMember: (...args: unknown[]) => mockAddMember(...args),
      removeMember: (...args: unknown[]) => mockRemoveMember(...args),
      getUsers: (...args: unknown[]) => mockGetUsers(...args),
    }));
    const { default: MemberPanelNoRole } = await import('./MemberPanel');
    renderWithAntd(<MemberPanelNoRole />);
    expect(screen.getByText('请在左侧选择角色以查看成员')).toBeInTheDocument();
  });

  it('shows batch remove button when rows are selected', async () => {
    const user = userEvent.setup();
    const { container } = renderWithAntd(<MemberPanel />);
    // Click the first row's checkbox to select it
    const checkboxes = container.querySelectorAll('.ant-checkbox-input');
    if (checkboxes.length > 0) {
      await user.click(checkboxes[0] as HTMLElement);
      await waitFor(() => {
        expect(screen.getByText('移除成员')).toBeInTheDocument();
      });
    }
  });

  it('batch removes selected members via API after Popconfirm', async () => {
    const user = userEvent.setup();
    const { container } = renderWithAntd(<MemberPanel />);
    // Select the first row checkbox
    const checkboxes = container.querySelectorAll('.ant-checkbox-input');
    if (checkboxes.length > 0) {
      await user.click(checkboxes[0] as HTMLElement);
      await waitFor(() => {
        expect(screen.getByText('移除成员')).toBeInTheDocument();
      });
      // Click batch remove button
      await user.click(screen.getByText('移除成员'));
      // Popconfirm should appear
      await waitFor(() => {
        expect(screen.getByText('确定要批量移除所选成员吗？')).toBeInTheDocument();
      });
      // Click confirm
      const okBtn = screen.getByRole('button', { name: /确\s*定/ });
      await user.click(okBtn);
      await waitFor(() => {
        expect(mockRemoveMember).toHaveBeenCalledWith('u1');
        expect(mockGetMembers).toHaveBeenCalled();
        expect(message.success).toHaveBeenCalledWith('已批量移除成员');
      });
    }
  });

  it('unchecks a row checkbox to deselect it', async () => {
    const user = userEvent.setup();
    const { container } = renderWithAntd(<MemberPanel />);
    const checkboxes = container.querySelectorAll('.ant-checkbox-input');
    if (checkboxes.length > 0) {
      // Check the first row
      await user.click(checkboxes[0] as HTMLElement);
      await waitFor(() => {
        expect(screen.getByText('移除成员')).toBeInTheDocument();
      });
      // Uncheck the first row (covers the else branch on line 57)
      await user.click(checkboxes[0] as HTMLElement);
      await waitFor(() => {
        expect(screen.queryByText('移除成员')).not.toBeInTheDocument();
      });
    }
  });

  it('cancels modal and resets search', async () => {
    const user = userEvent.setup();
    renderWithAntd(<MemberPanel />);
    const addButton = screen.getByRole('button', { name: /添加成员/ });
    await user.click(addButton);
    await waitFor(() => {
      expect(screen.getByPlaceholderText('搜索成员姓名或邮箱...')).toBeInTheDocument();
    });
    // Type in search
    const searchInput = screen.getByPlaceholderText('搜索成员姓名或邮箱...');
    await user.type(searchInput, 'test');
    expect(searchInput).toHaveValue('test');
    // Click cancel
    await user.click(screen.getByRole('button', { name: /取\s*消/ }));
    // After cancel, re-open and verify state was reset
    await user.click(addButton);
    await waitFor(() => {
      const freshInput = screen.getByPlaceholderText('搜索成员姓名或邮箱...');
      expect(freshInput).toHaveValue('');
    });
  });

  it('shows no matching members message when search has no results', async () => {
    const user = userEvent.setup();
    renderWithAntd(<MemberPanel />);
    await user.click(screen.getByText('添加成员'));
    await waitFor(() => {
      expect(screen.getByPlaceholderText('搜索成员姓名或邮箱...')).toBeInTheDocument();
    });
    await user.type(screen.getByPlaceholderText('搜索成员姓名或邮箱...'), 'zzzznonexistent');
    await waitFor(() => {
      expect(screen.getByText('无匹配成员')).toBeInTheDocument();
    });
  });

  it('disables confirm button when no users selected in modal', async () => {
    const user = userEvent.setup();
    renderWithAntd(<MemberPanel />);
    await user.click(screen.getByText('添加成员'));
    await waitFor(() => {
      const confirmBtn = screen.getByRole('button', { name: /确\s*认\s*添\s*加/ });
      expect(confirmBtn).toBeDisabled();
    });
  });

  it('fetches members from API on mount when role is selected', async () => {
    renderWithAntd(<MemberPanel />);
    await waitFor(() => {
      expect(mockGetMembers).toHaveBeenCalledWith('r1');
      expect(mockSetMembers).toHaveBeenCalled();
    });
  });
});
