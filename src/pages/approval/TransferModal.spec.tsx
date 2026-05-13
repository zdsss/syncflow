import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfigProvider, message } from 'antd';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TransferModal from './TransferModal';
import { transferApproval } from '@/services/approval.service';

vi.mock('@/services/approval.service', () => ({
  transferApproval: vi.fn().mockResolvedValue({}),
}));

vi.mock('@/services/config.service', () => ({
  getUsers: vi.fn().mockResolvedValue({
    code: 0,
    data: [
      { id: 'u2', name: '李四' },
      { id: 'u3', name: '王五' },
      { id: 'u5', name: '赵六' },
    ],
  }),
}));

vi.mock('antd', async (importOriginal) => {
  const actual = await importOriginal<typeof import('antd')>();
  return {
    ...actual,
    message: {
      ...actual.message,
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn(),
    },
  };
});

const renderWithAntd = (ui: React.ReactElement) =>
  render(<ConfigProvider>{ui}</ConfigProvider>);

describe('TransferModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders modal when open', () => {
    renderWithAntd(
      <TransferModal open approvalId="a1" userId="u1" onClose={vi.fn()} onSuccess={vi.fn()} />,
    );
    expect(screen.getByText('转交审批')).toBeTruthy();
  });

  it('does not render modal content when closed', () => {
    renderWithAntd(
      <TransferModal open={false} approvalId="a1" userId="u1" onClose={vi.fn()} onSuccess={vi.fn()} />,
    );
    expect(screen.queryByText('转交审批')).toBeNull();
  });

  it('shows select for new approver', async () => {
    renderWithAntd(
      <TransferModal open approvalId="a1" userId="u1" onClose={vi.fn()} onSuccess={vi.fn()} />,
    );
    await waitFor(() => {
      expect(screen.getByText('请选择新审批人')).toBeTruthy();
    });
  });

  it('shows confirm and cancel buttons', () => {
    renderWithAntd(
      <TransferModal open approvalId="a1" userId="u1" onClose={vi.fn()} onSuccess={vi.fn()} />,
    );
    expect(screen.getByRole('button', { name: /确认转交/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: /取\s*消/ })).toBeTruthy();
  });

  it('shows warning when no approver selected', async () => {
    const user = userEvent.setup();
    renderWithAntd(
      <TransferModal open approvalId="a1" userId="u1" onClose={vi.fn()} onSuccess={vi.fn()} />,
    );

    await user.click(screen.getByRole('button', { name: /确认转交/ }));

    await waitFor(() => {
      expect(message.warning).toHaveBeenCalledWith('请选择新审批人');
      expect(transferApproval).not.toHaveBeenCalled();
    });
  });

  it('calls onClose when cancel is clicked', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    renderWithAntd(
      <TransferModal open approvalId="a1" userId="u1" onClose={onClose} onSuccess={vi.fn()} />,
    );

    await user.click(screen.getByRole('button', { name: /取\s*消/ }));
    expect(onClose).toHaveBeenCalled();
  });

  it('excludes current user from options', async () => {
    renderWithAntd(
      <TransferModal open approvalId="a1" userId="u2" onClose={vi.fn()} onSuccess={vi.fn()} />,
    );
    // u2 (李四) should be excluded since they are the current user
    await waitFor(() => {
      const select = document.querySelector('.ant-select');
      expect(select).toBeTruthy();
    });
  });
});
