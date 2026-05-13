import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfigProvider } from 'antd';
import { MemoryRouter } from 'react-router-dom';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

const mockLoginAsync = vi.fn();
vi.mock('@/stores/useAuthStore', () => ({
  useAuthStore: (selector?: (state: any) => any) => {
    const store = {
      loginAsync: mockLoginAsync,
      loading: false,
      error: null,
    };
    return selector ? selector(store) : store;
  },
}));

const mockRegister = vi.fn();
const mockGetTeams = vi.fn();
vi.mock('@/services/auth.service', () => ({
  register: (...args: any[]) => mockRegister(...args),
  getTeams: (...args: any[]) => mockGetTeams(...args),
  login: vi.fn(),
  getCurrentUser: vi.fn(),
  switchTeam: vi.fn(),
  refreshToken: vi.fn(),
  logout: vi.fn(),
}));

const mockGetDepartments = vi.fn();
vi.mock('@/services/config.service', () => ({
  getDepartments: (...args: any[]) => mockGetDepartments(...args),
}));

vi.mock('antd', async () => {
  const actual = await vi.importActual<typeof import('antd')>('antd');
  return {
    ...actual,
    message: {
      ...actual.message,
      error: vi.fn(),
      success: vi.fn(),
    },
  };
});

import RegisterPage from './index';

const renderWithProviders = (ui: React.ReactElement) =>
  render(
    <ConfigProvider>
      <MemoryRouter>{ui}</MemoryRouter>
    </ConfigProvider>,
  );

const mockTeams = [
  { id: 't1', name: '团队A', memberCount: 5, leaderId: 'u1', createdAt: '', updatedAt: '' },
  { id: 't2', name: '团队B', memberCount: 3, leaderId: 'u2', createdAt: '', updatedAt: '' },
];

const mockDepartments = [
  { id: 'd1', name: '研发部' },
  { id: 'd2', name: '产品部' },
];

describe('RegisterPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetTeams.mockResolvedValue({ code: 0, data: mockTeams });
    mockGetDepartments.mockResolvedValue({ code: 0, data: mockDepartments });
  });

  it('renders the registration form with all fields', async () => {
    renderWithProviders(<RegisterPage />);
    expect(screen.getByLabelText(/姓名/)).toBeInTheDocument();
    expect(screen.getByLabelText(/邮箱/)).toBeInTheDocument();
    expect(screen.getByLabelText(/^密码/)).toBeInTheDocument();
    expect(screen.getByLabelText(/确认密码/)).toBeInTheDocument();
  });

  it('renders the register button', () => {
    renderWithProviders(<RegisterPage />);
    expect(screen.getByRole('button', { name: /注\s*册/ })).toBeInTheDocument();
  });

  it('renders a link to the login page', () => {
    renderWithProviders(<RegisterPage />);
    const loginLink = screen.getByText(/去登录/);
    expect(loginLink).toBeInTheDocument();
  });

  it('fetches teams on mount', async () => {
    renderWithProviders(<RegisterPage />);
    await waitFor(() => {
      expect(mockGetTeams).toHaveBeenCalled();
    });
  });

  it('fetches departments on mount', async () => {
    renderWithProviders(<RegisterPage />);
    await waitFor(() => {
      expect(mockGetDepartments).toHaveBeenCalled();
    });
  });

  it('calls register API on form submit with correct data', async () => {
    mockRegister.mockResolvedValue({ code: 0, data: { id: 'u1' } });
    mockLoginAsync.mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderWithProviders(<RegisterPage />);

    fireEvent.change(screen.getByLabelText(/姓名/), { target: { value: '张三' } });
    fireEvent.change(screen.getByLabelText(/邮箱/), { target: { value: 'zhangsan@example.com' } });
    fireEvent.change(screen.getByLabelText(/^密码/), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText(/确认密码/), { target: { value: 'password123' } });

    await user.click(screen.getByRole('button', { name: /注\s*册/ }));

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith({
        name: '张三',
        email: 'zhangsan@example.com',
        password: 'password123',
      });
    });
  });

  it('auto-logs in after successful registration', async () => {
    mockRegister.mockResolvedValue({ code: 0, data: { id: 'u1' } });
    mockLoginAsync.mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderWithProviders(<RegisterPage />);

    fireEvent.change(screen.getByLabelText(/姓名/), { target: { value: '张三' } });
    fireEvent.change(screen.getByLabelText(/邮箱/), { target: { value: 'zhangsan@example.com' } });
    fireEvent.change(screen.getByLabelText(/^密码/), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText(/确认密码/), { target: { value: 'password123' } });

    await user.click(screen.getByRole('button', { name: /注\s*册/ }));

    await waitFor(() => {
      expect(mockLoginAsync).toHaveBeenCalledWith('zhangsan@example.com', 'password123');
    });
  });

  it('navigates to /dashboard after successful registration and login', async () => {
    mockRegister.mockResolvedValue({ code: 0, data: { id: 'u1' } });
    mockLoginAsync.mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderWithProviders(<RegisterPage />);

    const nameInput = screen.getByLabelText(/姓名/);
    const emailInput = screen.getByLabelText(/邮箱/);
    const passwordInput = screen.getByLabelText(/^密码/);
    const confirmInput = screen.getByLabelText(/确认密码/);

    fireEvent.change(nameInput, { target: { value: '张三' } });
    fireEvent.change(emailInput, { target: { value: 'zhangsan@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmInput, { target: { value: 'password123' } });

    await user.click(screen.getByRole('button', { name: /注\s*册/ }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
    });
  });

  it('validates password minimum length', async () => {
    const user = userEvent.setup();
    renderWithProviders(<RegisterPage />);

    fireEvent.change(screen.getByLabelText(/姓名/), { target: { value: '张三' } });
    fireEvent.change(screen.getByLabelText(/邮箱/), { target: { value: 'zhangsan@example.com' } });
    fireEvent.change(screen.getByLabelText(/^密码/), { target: { value: '12345' } });
    fireEvent.change(screen.getByLabelText(/确认密码/), { target: { value: '12345' } });

    await user.click(screen.getByRole('button', { name: /注\s*册/ }));

    await waitFor(() => {
      expect(mockRegister).not.toHaveBeenCalled();
    });
  });

  it('validates password confirmation match', async () => {
    const user = userEvent.setup();
    renderWithProviders(<RegisterPage />);

    fireEvent.change(screen.getByLabelText(/姓名/), { target: { value: '张三' } });
    fireEvent.change(screen.getByLabelText(/邮箱/), { target: { value: 'zhangsan@example.com' } });
    fireEvent.change(screen.getByLabelText(/^密码/), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText(/确认密码/), { target: { value: 'different456' } });

    await user.click(screen.getByRole('button', { name: /注\s*册/ }));

    await waitFor(() => {
      expect(mockRegister).not.toHaveBeenCalled();
    });
  });

  it('validates required fields', async () => {
    const user = userEvent.setup();
    renderWithProviders(<RegisterPage />);

    await user.click(screen.getByRole('button', { name: /注\s*册/ }));

    await waitFor(() => {
      expect(mockRegister).not.toHaveBeenCalled();
    });
  });

  it('shows error message when registration fails', async () => {
    const { message } = await import('antd');
    mockRegister.mockRejectedValue(new Error('Email already exists'));
    const user = userEvent.setup();
    renderWithProviders(<RegisterPage />);

    fireEvent.change(screen.getByLabelText(/姓名/), { target: { value: '张三' } });
    fireEvent.change(screen.getByLabelText(/邮箱/), { target: { value: 'existing@example.com' } });
    fireEvent.change(screen.getByLabelText(/^密码/), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText(/确认密码/), { target: { value: 'password123' } });

    await user.click(screen.getByRole('button', { name: /注\s*册/ }));

    await waitFor(() => {
      expect(message.error).toHaveBeenCalled();
    });
  });

  it('populates department select with fetched departments', async () => {
    renderWithProviders(<RegisterPage />);
    await waitFor(() => {
      expect(mockGetDepartments).toHaveBeenCalled();
    });
    expect(screen.getByLabelText(/部门/)).toBeInTheDocument();
  });

  it('populates team select with fetched teams', async () => {
    renderWithProviders(<RegisterPage />);
    await waitFor(() => {
      expect(mockGetTeams).toHaveBeenCalled();
    });
    expect(screen.getByLabelText(/团队/)).toBeInTheDocument();
  });
});
