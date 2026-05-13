import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfigProvider, message } from 'antd';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ApprovalChainView from './ApprovalChainView';
import { approveApproval, rejectApproval } from '@/services/approval.service';

vi.mock('@/services/approval.service', () => ({
  approveApproval: vi.fn().mockResolvedValue({}),
  rejectApproval: vi.fn().mockResolvedValue({}),
  createApprovalChain: vi.fn().mockResolvedValue({}),
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

const mockChainSteps = [
  {
    id: 's1',
    approvalId: 'a1',
    stepOrder: 1,
    approverId: 'user-1',
    status: 'approved',
    comment: '同意',
    actedAt: '2026-05-01T10:00:00Z',
  },
  {
    id: 's2',
    approvalId: 'a1',
    stepOrder: 2,
    approverId: 'user-2',
    status: 'pending',
    comment: null,
    actedAt: null,
  },
  {
    id: 's3',
    approvalId: 'a1',
    stepOrder: 3,
    approverId: 'user-3',
    status: 'pending',
    comment: null,
    actedAt: null,
  },
];

const rejectedChainSteps = [
  {
    id: 's1',
    approvalId: 'a1',
    stepOrder: 1,
    approverId: 'user-1',
    status: 'approved',
    comment: '同意',
    actedAt: '2026-05-01T10:00:00Z',
  },
  {
    id: 's2',
    approvalId: 'a1',
    stepOrder: 2,
    approverId: 'user-2',
    status: 'rejected',
    comment: '不符合要求',
    actedAt: '2026-05-01T11:00:00Z',
  },
];

describe('ApprovalChainView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the approval chain title', () => {
    renderWithAntd(
      <ApprovalChainView
        approvalId="a1"
        chainSteps={mockChainSteps}
        currentUserId="user-2"
        onRefresh={vi.fn()}
      />,
    );
    expect(screen.getByText('审批链')).toBeTruthy();
  });

  it('renders all chain steps', () => {
    renderWithAntd(
      <ApprovalChainView
        approvalId="a1"
        chainSteps={mockChainSteps}
        currentUserId="user-2"
        onRefresh={vi.fn()}
      />,
    );
    expect(screen.getByText('user-1')).toBeTruthy();
    expect(screen.getByText('user-2')).toBeTruthy();
    expect(screen.getByText('user-3')).toBeTruthy();
  });

  it('shows step order labels', () => {
    renderWithAntd(
      <ApprovalChainView
        approvalId="a1"
        chainSteps={mockChainSteps}
        currentUserId="user-2"
        onRefresh={vi.fn()}
      />,
    );
    expect(screen.getByText('第1步')).toBeTruthy();
    expect(screen.getByText('第2步')).toBeTruthy();
    expect(screen.getByText('第3步')).toBeTruthy();
  });

  it('shows status tags for each step', () => {
    renderWithAntd(
      <ApprovalChainView
        approvalId="a1"
        chainSteps={mockChainSteps}
        currentUserId="user-2"
        onRefresh={vi.fn()}
      />,
    );
    const approvedTags = screen.getAllByText('已通过');
    expect(approvedTags.length).toBeGreaterThanOrEqual(1);
    const pendingTags = screen.getAllByText('待审批');
    expect(pendingTags.length).toBeGreaterThanOrEqual(1);
  });

  it('shows comment when present', () => {
    renderWithAntd(
      <ApprovalChainView
        approvalId="a1"
        chainSteps={mockChainSteps}
        currentUserId="user-2"
        onRefresh={vi.fn()}
      />,
    );
    expect(screen.getByText(/意见：同意/)).toBeTruthy();
  });

  it('shows acted time when present', () => {
    renderWithAntd(
      <ApprovalChainView
        approvalId="a1"
        chainSteps={mockChainSteps}
        currentUserId="user-2"
        onRefresh={vi.fn()}
      />,
    );
    // actedAt is formatted to locale string
    expect(screen.getByText(/2026/)).toBeTruthy();
  });

  it('shows approve and reject buttons for current user pending step', () => {
    renderWithAntd(
      <ApprovalChainView
        approvalId="a1"
        chainSteps={mockChainSteps}
        currentUserId="user-2"
        onRefresh={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: /通\s*过/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: /拒\s*绝/ })).toBeTruthy();
  });

  it('does not show approve/reject buttons when user has no pending step', () => {
    renderWithAntd(
      <ApprovalChainView
        approvalId="a1"
        chainSteps={mockChainSteps}
        currentUserId="user-99"
        onRefresh={vi.fn()}
      />,
    );
    expect(screen.queryByRole('button', { name: /通\s*过/ })).toBeNull();
    expect(screen.queryByRole('button', { name: /拒\s*绝/ })).toBeNull();
  });

  it('shows transfer button for current user pending step', () => {
    renderWithAntd(
      <ApprovalChainView
        approvalId="a1"
        chainSteps={mockChainSteps}
        currentUserId="user-2"
        onRefresh={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: /转\s*交/ })).toBeTruthy();
  });

  it('does not show transfer button when user has no pending step', () => {
    renderWithAntd(
      <ApprovalChainView
        approvalId="a1"
        chainSteps={mockChainSteps}
        currentUserId="user-99"
        onRefresh={vi.fn()}
      />,
    );
    expect(screen.queryByRole('button', { name: /转\s*交/ })).toBeNull();
  });

  it('handles approve click', async () => {
    const onRefresh = vi.fn();
    const user = userEvent.setup();
    renderWithAntd(
      <ApprovalChainView
        approvalId="a1"
        chainSteps={mockChainSteps}
        currentUserId="user-2"
        onRefresh={onRefresh}
      />,
    );

    await user.click(screen.getByRole('button', { name: /通\s*过/ }));
    await waitFor(() => {
      expect(approveApproval).toHaveBeenCalledWith('a1', 'user-2');
      expect(message.success).toHaveBeenCalledWith('审批通过');
      expect(onRefresh).toHaveBeenCalled();
    });
  });

  it('handles reject with comment', async () => {
    const onRefresh = vi.fn();
    const user = userEvent.setup();
    renderWithAntd(
      <ApprovalChainView
        approvalId="a1"
        chainSteps={mockChainSteps}
        currentUserId="user-2"
        onRefresh={onRefresh}
      />,
    );

    const textarea = screen.getByPlaceholderText('审批意见（拒绝时必填）');
    await user.type(textarea, '质量不达标');
    await user.click(screen.getByRole('button', { name: /拒\s*绝/ }));

    await waitFor(() => {
      expect(rejectApproval).toHaveBeenCalledWith('a1', 'user-2', '质量不达标');
      expect(message.success).toHaveBeenCalledWith('已拒绝');
      expect(onRefresh).toHaveBeenCalled();
    });
  });

  it('shows warning when rejecting without comment', async () => {
    const user = userEvent.setup();
    renderWithAntd(
      <ApprovalChainView
        approvalId="a1"
        chainSteps={mockChainSteps}
        currentUserId="user-2"
        onRefresh={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: /拒\s*绝/ }));

    await waitFor(() => {
      expect(message.warning).toHaveBeenCalledWith('请输入拒绝原因');
      expect(rejectApproval).not.toHaveBeenCalled();
    });
  });

  it('shows error when approve fails', async () => {
    vi.mocked(approveApproval).mockRejectedValueOnce(new Error('fail'));
    const user = userEvent.setup();
    renderWithAntd(
      <ApprovalChainView
        approvalId="a1"
        chainSteps={mockChainSteps}
        currentUserId="user-2"
        onRefresh={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: /通\s*过/ }));
    await waitFor(() => {
      expect(message.error).toHaveBeenCalledWith('审批失败');
    });
  });

  it('shows error when reject fails', async () => {
    vi.mocked(rejectApproval).mockRejectedValueOnce(new Error('fail'));
    const user = userEvent.setup();
    renderWithAntd(
      <ApprovalChainView
        approvalId="a1"
        chainSteps={mockChainSteps}
        currentUserId="user-2"
        onRefresh={vi.fn()}
      />,
    );

    const textarea = screen.getByPlaceholderText('审批意见（拒绝时必填）');
    await user.type(textarea, '原因');
    await user.click(screen.getByRole('button', { name: /拒\s*绝/ }));

    await waitFor(() => {
      expect(message.error).toHaveBeenCalledWith('操作失败');
    });
  });

  it('shows rejected status tag', () => {
    renderWithAntd(
      <ApprovalChainView
        approvalId="a1"
        chainSteps={rejectedChainSteps}
        currentUserId="user-99"
        onRefresh={vi.fn()}
      />,
    );
    expect(screen.getByText('已拒绝')).toBeTruthy();
  });

  it('opens transfer modal when transfer button is clicked', async () => {
    const user = userEvent.setup();
    renderWithAntd(
      <ApprovalChainView
        approvalId="a1"
        chainSteps={mockChainSteps}
        currentUserId="user-2"
        onRefresh={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: /转\s*交/ }));
    expect(screen.getByText('转交审批')).toBeTruthy();
  });

  it('shows empty message when no chain steps', () => {
    renderWithAntd(
      <ApprovalChainView
        approvalId="a1"
        chainSteps={[]}
        currentUserId="user-1"
        onRefresh={vi.fn()}
      />,
    );
    expect(screen.getByText('暂无审批链')).toBeTruthy();
  });
});
