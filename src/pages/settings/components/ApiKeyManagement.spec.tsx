import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfigProvider, message } from 'antd';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ApiKeyManagement from './ApiKeyManagement';

const mockApiKeys = [
  { id: 'ak-1', name: 'CI/CD Pipeline', keyPrefix: 'sf_abc1', permissions: ['task:read', 'task:write'], expiresAt: '2027-01-01T00:00:00Z', lastUsedAt: '2026-05-07T12:00:00Z', status: 1, createdAt: '2026-01-15T00:00:00Z' },
  { id: 'ak-2', name: 'Monitoring Bot', keyPrefix: 'sf_def2', permissions: ['dashboard:read'], expiresAt: '2026-12-31T00:00:00Z', lastUsedAt: '2026-05-08T06:00:00Z', status: 1, createdAt: '2026-03-01T00:00:00Z' },
  { id: 'ak-3', name: 'Legacy Integration', keyPrefix: 'sf_ghi3', permissions: ['task:read', 'project:read'], expiresAt: '2025-06-01T00:00:00Z', lastUsedAt: '2025-05-15T10:00:00Z', status: 0, createdAt: '2025-01-10T00:00:00Z' },
];

const mockCreateResult = {
  code: 0,
  data: {
    id: 'ak-new',
    name: 'Test Key',
    keyPrefix: 'sf_new1',
    fullKey: 'sf_new1_full_secret_key_abcdef123456',
    permissions: ['task:read'],
    expiresAt: '2027-06-01T00:00:00Z',
    status: 1,
    createdAt: '2026-05-08T00:00:00Z',
  },
};

const mockGetApiKeys = vi.fn().mockResolvedValue({ code: 0, data: mockApiKeys });
const mockCreateApiKey = vi.fn().mockResolvedValue(mockCreateResult);
const mockRevokeApiKey = vi.fn().mockResolvedValue({ code: 0, data: null });

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

vi.mock('@/services/auth.service', () => ({
  getApiKeys: (...args: any[]) => mockGetApiKeys(...args),
  createApiKey: (...args: any[]) => mockCreateApiKey(...args),
  revokeApiKey: (...args: any[]) => mockRevokeApiKey(...args),
}));

const renderWithAntd = (ui: React.ReactElement) =>
  render(<ConfigProvider>{ui}</ConfigProvider>);

describe('ApiKeyManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetApiKeys.mockResolvedValue({ code: 0, data: mockApiKeys });
    mockCreateApiKey.mockResolvedValue(mockCreateResult);
    mockRevokeApiKey.mockResolvedValue({ code: 0, data: null });
  });

  it('renders API keys table with data', async () => {
    renderWithAntd(<ApiKeyManagement />);
    await waitFor(() => {
      expect(screen.getByText('CI/CD Pipeline')).toBeInTheDocument();
      expect(screen.getByText('Monitoring Bot')).toBeInTheDocument();
      expect(screen.getByText('Legacy Integration')).toBeInTheDocument();
    });
  });

  it('displays key prefixes with ellipsis', async () => {
    renderWithAntd(<ApiKeyManagement />);
    await waitFor(() => {
      expect(screen.getByText('sf_abc1...')).toBeInTheDocument();
      expect(screen.getByText('sf_def2...')).toBeInTheDocument();
    });
  });

  it('renders the create button', async () => {
    renderWithAntd(<ApiKeyManagement />);
    expect(screen.getByTestId('create-apikey-btn')).toBeInTheDocument();
  });

  it('opens create modal when button is clicked', async () => {
    const user = userEvent.setup();
    renderWithAntd(<ApiKeyManagement />);
    await user.click(screen.getByTestId('create-apikey-btn'));
    expect(screen.getByTestId('create-apikey-modal')).toBeInTheDocument();
    expect(screen.getByTestId('apikey-name-input')).toBeInTheDocument();
  });

  it('calls getApiKeys on mount', async () => {
    renderWithAntd(<ApiKeyManagement />);
    await waitFor(() => {
      expect(mockGetApiKeys).toHaveBeenCalled();
    });
  });

  it('displays status tags for active and revoked keys', async () => {
    renderWithAntd(<ApiKeyManagement />);
    await waitFor(() => {
      expect(screen.getAllByText('有效').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('已吊销')).toBeInTheDocument();
    });
  });
});
