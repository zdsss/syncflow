import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfigProvider, message } from 'antd';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SettingsPage from './index';

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

const mockCurrentUser = {
  id: 1,
  username: 'zhangsan',
  realName: '张三',
  email: 'zhangsan@example.com',
  avatar: 'https://example.com/avatar.png',
  phone: '13800138000',
  status: 1,
  deptId: 1,
  deptName: 'dept-1',
  roles: ['admin', 'editor'],
};

const mockSetCurrentUser = vi.fn();

vi.mock('@/stores/useAuthStore', () => ({
  useAuthStore: (selector: any) => {
    const state = {
      currentUser: mockCurrentUser,
      setCurrentUser: mockSetCurrentUser,
    };
    return selector ? selector(state) : state;
  },
}));

const mockUpdateProfile = vi.fn().mockResolvedValue({ code: 0, data: {} });
const mockChangePassword = vi.fn().mockResolvedValue({ code: 0, data: {} });

vi.mock('@/services/auth.service', () => ({
  updateProfile: (...args: any[]) => mockUpdateProfile(...args),
  changePassword: (...args: any[]) => mockChangePassword(...args),
}));

vi.mock('./components/LoginRecords', () => ({
  default: () => <div data-testid="login-records" />,
}));

vi.mock('./components/ApiKeyManagement', () => ({
  default: () => <div data-testid="api-key-management" />,
}));

const renderWithAntd = (ui: React.ReactElement) =>
  render(<ConfigProvider>{ui}</ConfigProvider>);

describe('SettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdateProfile.mockResolvedValue({ code: 0, data: {} });
    mockChangePassword.mockResolvedValue({ code: 0, data: {} });
  });

  it('renders the page title', () => {
    renderWithAntd(<SettingsPage />);
    expect(screen.getByText('个人设置')).toBeTruthy();
  });

  it('renders sidebar navigation', () => {
    renderWithAntd(<SettingsPage />);
    expect(screen.getByTestId('settings-sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('nav-profile')).toBeInTheDocument();
    expect(screen.getByTestId('nav-task-strategy')).toBeInTheDocument();
    expect(screen.getByTestId('nav-login-records')).toBeInTheDocument();
    expect(screen.getByTestId('nav-api-keys')).toBeInTheDocument();
  });

  it('shows profile section by default', () => {
    renderWithAntd(<SettingsPage />);
    expect(screen.getByText('保存修改')).toBeInTheDocument();
  });

  it('displays user realName from store', () => {
    renderWithAntd(<SettingsPage />);
    expect(screen.getAllByText('张三').length).toBeGreaterThan(0);
  });

  it('displays masked phone number in profile card', () => {
    renderWithAntd(<SettingsPage />);
    expect(screen.getByText('138***000')).toBeInTheDocument();
  });

  it('displays user email from store', () => {
    renderWithAntd(<SettingsPage />);
    expect(screen.getByText('zhangsan@example.com')).toBeTruthy();
  });

  it('displays user department', () => {
    renderWithAntd(<SettingsPage />);
    const deptEl = screen.getByTestId('user-department');
    expect(deptEl.textContent).toContain('dept-1');
  });

  it('displays user roles', () => {
    renderWithAntd(<SettingsPage />);
    const roleEl = screen.getByTestId('user-role');
    expect(roleEl.textContent).toContain('admin');
    expect(roleEl.textContent).toContain('editor');
  });

  it('renders edit profile form with pre-filled values', () => {
    renderWithAntd(<SettingsPage />);
    const nameInput = screen.getByPlaceholderText('请输入姓名') as HTMLInputElement;
    expect(nameInput.value).toBe('张三');
    const phoneInput = screen.getByPlaceholderText('请输入手机号') as HTMLInputElement;
    expect(phoneInput.value).toBe('13800138000');
  });

  it('renders profile save button', () => {
    renderWithAntd(<SettingsPage />);
    expect(screen.getByText('保存修改')).toBeTruthy();
  });

  it('renders password change form', () => {
    renderWithAntd(<SettingsPage />);
    expect(screen.getByPlaceholderText('请输入当前密码')).toBeTruthy();
    expect(screen.getByPlaceholderText('请输入新密码')).toBeTruthy();
    expect(screen.getByPlaceholderText('请再次输入新密码')).toBeTruthy();
  });

  it('submits profile form and calls updateProfile', async () => {
    const user = userEvent.setup();
    renderWithAntd(<SettingsPage />);

    const nameInput = screen.getByPlaceholderText('请输入姓名');
    await user.clear(nameInput);
    await user.type(nameInput, '李四');

    const saveBtn = screen.getByText('保存修改');
    await user.click(saveBtn);

    await waitFor(() => {
      expect(mockUpdateProfile).toHaveBeenCalledWith(
        expect.objectContaining({ name: '李四' })
      );
    });
  });

  it('calls setCurrentUser after successful profile update', async () => {
    const user = userEvent.setup();
    renderWithAntd(<SettingsPage />);

    const saveBtn = screen.getByText('保存修改');
    await user.click(saveBtn);

    await waitFor(() => {
      expect(mockSetCurrentUser).toHaveBeenCalled();
    });
  });

  it('shows success message after profile update', async () => {
    const user = userEvent.setup();
    renderWithAntd(<SettingsPage />);

    const saveBtn = screen.getByText('保存修改');
    await user.click(saveBtn);

    await waitFor(() => {
      expect(message.success).toHaveBeenCalledWith('个人资料更新成功');
    });
  });

  it('shows error message when profile update fails', async () => {
    mockUpdateProfile.mockRejectedValueOnce(new Error('fail'));
    const user = userEvent.setup();
    renderWithAntd(<SettingsPage />);

    const saveBtn = screen.getByText('保存修改');
    await user.click(saveBtn);

    await waitFor(() => {
      expect(message.error).toHaveBeenCalledWith('个人资料更新失败');
    });
  });

  it('submits password form and calls changePassword', async () => {
    const user = userEvent.setup();
    renderWithAntd(<SettingsPage />);

    await user.type(screen.getByPlaceholderText('请输入当前密码'), 'oldPass123');
    await user.type(screen.getByPlaceholderText('请输入新密码'), 'newPass123');
    await user.type(screen.getByPlaceholderText('请再次输入新密码'), 'newPass123');

    const changeBtn = screen.getByRole('button', { name: '修改密码' });
    await user.click(changeBtn);

    await waitFor(() => {
      expect(mockChangePassword).toHaveBeenCalledWith({
        oldPassword: 'oldPass123',
        newPassword: 'newPass123',
      });
    });
  });

  it('shows success message after password change', async () => {
    const user = userEvent.setup();
    renderWithAntd(<SettingsPage />);

    await user.type(screen.getByPlaceholderText('请输入当前密码'), 'oldPass');
    await user.type(screen.getByPlaceholderText('请输入新密码'), 'newPass');
    await user.type(screen.getByPlaceholderText('请再次输入新密码'), 'newPass');

    await user.click(screen.getByRole('button', { name: '修改密码' }));

    await waitFor(() => {
      expect(message.success).toHaveBeenCalledWith('密码修改成功');
    });
  });

  it('shows error message when password change fails', async () => {
    mockChangePassword.mockRejectedValueOnce(new Error('fail'));
    const user = userEvent.setup();
    renderWithAntd(<SettingsPage />);

    await user.type(screen.getByPlaceholderText('请输入当前密码'), 'oldPass');
    await user.type(screen.getByPlaceholderText('请输入新密码'), 'newPass');
    await user.type(screen.getByPlaceholderText('请再次输入新密码'), 'newPass');

    await user.click(screen.getByRole('button', { name: '修改密码' }));

    await waitFor(() => {
      expect(message.error).toHaveBeenCalledWith('密码修改失败');
    });
  });

  it('switches to task strategy section when nav item clicked', async () => {
    const user = userEvent.setup();
    renderWithAntd(<SettingsPage />);

    await user.click(screen.getByTestId('nav-task-strategy'));
    expect(screen.getByTestId('task-strategy')).toBeInTheDocument();
  });

  it('switches to login records section when nav item clicked', async () => {
    const user = userEvent.setup();
    renderWithAntd(<SettingsPage />);

    await user.click(screen.getByTestId('nav-login-records'));
    expect(screen.getByTestId('login-records')).toBeInTheDocument();
  });

  it('switches to api keys section when nav item clicked', async () => {
    const user = userEvent.setup();
    renderWithAntd(<SettingsPage />);

    await user.click(screen.getByTestId('nav-api-keys'));
    expect(screen.getByTestId('api-key-management')).toBeInTheDocument();
  });
});
