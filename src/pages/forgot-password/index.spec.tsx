import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfigProvider } from 'antd';
import { MemoryRouter } from 'react-router-dom';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('@/services/auth.service', () => ({
  forgotPassword: vi.fn().mockResolvedValue({}),
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

import ForgotPasswordPage from './index';

const renderWithProviders = (ui: React.ReactElement) =>
  render(
    <ConfigProvider>
      <MemoryRouter>{ui}</MemoryRouter>
    </ConfigProvider>,
  );

describe('ForgotPasswordPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the page title', () => {
    renderWithProviders(<ForgotPasswordPage />);
    expect(screen.getByText(/找回密码/)).toBeInTheDocument();
  });

  it('renders an email input field', () => {
    renderWithProviders(<ForgotPasswordPage />);
    expect(screen.getByLabelText(/邮箱/)).toBeInTheDocument();
  });

  it('renders the submit button with correct text', () => {
    renderWithProviders(<ForgotPasswordPage />);
    expect(screen.getByRole('button', { name: /发送重置链接/ })).toBeInTheDocument();
  });

  it('renders a back to login link', () => {
    renderWithProviders(<ForgotPasswordPage />);
    const link = screen.getByText(/返回登录/);
    expect(link).toBeInTheDocument();
    expect(link.closest('a')).toHaveAttribute('href', '/login');
  });

  it('validates email is required', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ForgotPasswordPage />);

    await user.click(screen.getByRole('button', { name: /发送重置链接/ }));

    await waitFor(() => {
      expect(screen.getByText(/请输入邮箱/)).toBeInTheDocument();
    });
  });

  it('validates email format', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ForgotPasswordPage />);

    await user.type(screen.getByLabelText(/邮箱/), 'not-an-email');
    await user.click(screen.getByRole('button', { name: /发送重置链接/ }));

    await waitFor(() => {
      expect(screen.getByText(/请输入有效的邮箱地址/)).toBeInTheDocument();
    });
  });

  it('shows success message after submitting valid email', async () => {
    const { message } = await import('antd');
    const user = userEvent.setup();
    renderWithProviders(<ForgotPasswordPage />);

    await user.type(screen.getByLabelText(/邮箱/), 'test@example.com');
    await user.click(screen.getByRole('button', { name: /发送重置链接/ }));

    await waitFor(() => {
      expect(message.success).toHaveBeenCalledWith('重置链接已发送到您的邮箱，请查收');
    });
  });

  it('redirects to login after 3 seconds on success', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderWithProviders(<ForgotPasswordPage />);

    await user.type(screen.getByLabelText(/邮箱/), 'test@example.com');
    await user.click(screen.getByRole('button', { name: /发送重置链接/ }));

    await waitFor(() => {
      expect(mockNavigate).not.toHaveBeenCalledWith('/login');
    });

    vi.advanceTimersByTime(3000);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });
});
