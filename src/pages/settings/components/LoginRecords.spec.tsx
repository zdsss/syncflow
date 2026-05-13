import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfigProvider } from 'antd';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import LoginRecords from './LoginRecords';

const mockRecords = [
  { id: 'lr-1', userId: 'u1', username: '张伟', ip: '192.168.1.100', userAgent: 'Chrome/120.0', loginTime: '2026-05-08T08:30:00Z', status: 'success' },
  { id: 'lr-2', userId: 'u2', username: '王美玲', ip: '192.168.1.101', userAgent: 'Firefox/121.0', loginTime: '2026-05-08T09:15:00Z', status: 'success' },
  { id: 'lr-3', userId: 'u3', username: '陈思远', ip: '10.0.0.55', userAgent: 'Safari/17.2', loginTime: '2026-05-07T14:00:00Z', logoutTime: '2026-05-07T18:00:00Z', status: 'success' },
  { id: 'lr-4', userId: 'u4', username: '未知', ip: '203.0.113.42', userAgent: 'curl/8.4.0', loginTime: '2026-05-07T03:22:00Z', status: 'failed' },
  { id: 'lr-5', userId: 'u1', username: '张伟', ip: '192.168.1.100', userAgent: 'Chrome/120.0', loginTime: '2026-05-06T08:00:00Z', logoutTime: '2026-05-06T17:30:00Z', status: 'success' },
];

const mockGetLoginRecords = vi.fn().mockResolvedValue({
  code: 0,
  data: { records: mockRecords, total: 5, pageNum: 1, pageSize: 20 },
});

vi.mock('@/services/auth.service', () => ({
  getLoginRecords: (...args: any[]) => mockGetLoginRecords(...args),
}));

const renderWithAntd = (ui: React.ReactElement) =>
  render(<ConfigProvider>{ui}</ConfigProvider>);

describe('LoginRecords', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetLoginRecords.mockResolvedValue({
      code: 0,
      data: { records: mockRecords, total: 5, pageNum: 1, pageSize: 20 },
    });
  });

  it('renders the login records table with data', async () => {
    renderWithAntd(<LoginRecords />);
    await waitFor(() => {
      expect(screen.getAllByText('张伟').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('王美玲')).toBeInTheDocument();
      expect(screen.getByText('陈思远')).toBeInTheDocument();
    });
  });

  it('displays IP addresses and status tags', async () => {
    renderWithAntd(<LoginRecords />);
    await waitFor(() => {
      expect(screen.getAllByText('192.168.1.100').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('成功').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('失败')).toBeInTheDocument();
    });
  });

  it('renders the date range picker', () => {
    const { container } = renderWithAntd(<LoginRecords />);
    expect(container.querySelector('.ant-picker-range')).toBeInTheDocument();
  });

  it('calls getLoginRecords on mount', async () => {
    renderWithAntd(<LoginRecords />);
    await waitFor(() => {
      expect(mockGetLoginRecords).toHaveBeenCalledWith({ pageNum: 1, pageSize: 20 });
    });
  });

  it('renders table with pagination', async () => {
    renderWithAntd(<LoginRecords />);
    await waitFor(() => {
      expect(screen.getByTestId('login-records-table')).toBeInTheDocument();
    });
  });
});
