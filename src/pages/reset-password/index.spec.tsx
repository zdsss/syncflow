import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfigProvider } from 'antd';
import { MemoryRouter } from 'react-router-dom';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useSearchParams: () => [new URLSearchParams('?token=test-token-123')],
  };
});

vi.mock('@/services/auth.service', () => ({
  resetPassword: vi.fn().mockResolvedValue({}),
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

import ResetPasswordPage from './index';

const renderWithProviders = (ui: React.ReactElement) =>
  render(
    <ConfigProvider>
      <MemoryRouter>{ui}</MemoryRouter>
    </ConfigProvider>,
  );

describe('ResetPasswordPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the page title', () => {
    renderWithProviders(<ResetPasswordPage />);
    expect(screen.getByRole('heading', { name: /重置密码/ })).toBeInTheDocument();
  });

  it('renders new password and confirm password fields', () => {
    renderWithProviders(<ResetPasswordPage />);
    expect(screen.getByLabelText(/新密码/)).toBeInTheDocument();
    expect(screen.getByLabelText(/确认密码/)).toBeInTheDocument();
  });

  it('renders the submit button with correct text', () => {
    renderWithProviders(<ResetPasswordPage />);
    expect(screen.getByRole('button', { name: /重置密码/ })).toBeInTheDocument();
  });

  it('validates password is required', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ResetPasswordPage />);

    await user.click(screen.getByRole('button', { name: /重置密码/ }));

    await waitFor(() => {
      expect(screen.getByText(/请输入新密码/)).toBeInTheDocument();
    });
  });

  it('validates password minimum length is 6', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ResetPasswordPage />);

    await user.type(screen.getByLabelText(/新密码/), 'abc');
    await user.click(screen.getByRole('button', { name: /重置密码/ }));

    await waitFor(() => {
      expect(screen.getByText(/密码至少6个字符/)).toBeInTheDocument();
    });
  });

  it('validates confirm password is required', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ResetPasswordPage />);

    await user.type(screen.getByLabelText(/新密码/), 'password123');
    await user.click(screen.getByRole('button', { name: /重置密码/ }));

    await waitFor(() => {
      expect(screen.getByText(/请确认密码/)).toBeInTheDocument();
    });
  });

  it('validates passwords match', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ResetPasswordPage />);

    await user.type(screen.getByLabelText(/新密码/), 'password123');
    await user.type(screen.getByLabelText(/确认密码/), 'different456');
    await user.click(screen.getByRole('button', { name: /重置密码/ }));

    await waitFor(() => {
      expect(screen.getByText(/两次密码不一致/)).toBeInTheDocument();
    });
  });

  it('shows success message after submitting matching passwords', async () => {
    const { message } = await import('antd');
    const user = userEvent.setup();
    renderWithProviders(<ResetPasswordPage />);

    await user.type(screen.getByLabelText(/新密码/), 'newPassword123');
    await user.type(screen.getByLabelText(/确认密码/), 'newPassword123');
    await user.click(screen.getByRole('button', { name: /重置密码/ }));

    await waitFor(() => {
      expect(message.success).toHaveBeenCalledWith('密码重置成功');
    });
  });

  it('redirects to login after successful password reset', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderWithProviders(<ResetPasswordPage />);

    await user.type(screen.getByLabelText(/新密码/), 'newPassword123');
    await user.type(screen.getByLabelText(/确认密码/), 'newPassword123');
    await user.click(screen.getByRole('button', { name: /重置密码/ }));

    await waitFor(() => {
      expect(mockNavigate).not.toHaveBeenCalledWith('/login');
    });

    vi.advanceTimersByTime(3000);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });
});
