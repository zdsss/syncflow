import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
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

import LoginPage from './index';

const renderWithProviders = (ui: React.ReactElement) =>
  render(
    <ConfigProvider>
      <MemoryRouter>{ui}</MemoryRouter>
    </ConfigProvider>,
  );

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the login form with username and password fields', () => {
    renderWithProviders(<LoginPage />);
    expect(screen.getByLabelText(/用户名/)).toBeInTheDocument();
    expect(screen.getByLabelText(/密码/)).toBeInTheDocument();
  });

  it('renders the login button', () => {
    renderWithProviders(<LoginPage />);
    expect(screen.getByRole('button', { name: /登\s*录/ })).toBeInTheDocument();
  });

  it('calls loginAsync on form submit with username and password', async () => {
    mockLoginAsync.mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />);

    await user.type(screen.getByLabelText(/用户名/), 'alice');
    await user.type(screen.getByLabelText(/密码/), 'password123');
    await user.click(screen.getByRole('button', { name: /登\s*录/ }));

    await waitFor(() => {
      expect(mockLoginAsync).toHaveBeenCalledWith('alice', 'password123');
    });
  });

  it('navigates to /dashboard on successful login', async () => {
    mockLoginAsync.mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />);

    await user.type(screen.getByLabelText(/用户名/), 'alice');
    await user.type(screen.getByLabelText(/密码/), 'password123');
    await user.click(screen.getByRole('button', { name: /登\s*录/ }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
    });
  });

  it('shows error message when login fails', async () => {
    const { message } = await import('antd');
    mockLoginAsync.mockRejectedValue(new Error('Invalid credentials'));
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />);

    await user.type(screen.getByLabelText(/用户名/), 'alice');
    await user.type(screen.getByLabelText(/密码/), 'wrong');
    await user.click(screen.getByRole('button', { name: /登\s*录/ }));

    await waitFor(() => {
      expect(message.error).toHaveBeenCalled();
    });
  });

  it('validates required fields', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />);

    await user.click(screen.getByRole('button', { name: /登\s*录/ }));

    await waitFor(() => {
      expect(mockLoginAsync).not.toHaveBeenCalled();
    });
  });
});
