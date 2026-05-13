import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfigProvider, message } from 'antd';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ApprovalDetail from './ApprovalDetail';
import { completeTask, getApprovalHistory } from '@/services/workflow.service';

vi.mock('@/services/workflow.service', () => ({
  completeTask: vi.fn().mockResolvedValue({}),
  getApprovalHistory: vi.fn().mockResolvedValue([]),
  getBusinessObject: vi.fn().mockResolvedValue({ approvalMode: 'single' }),
  remindApproval: vi.fn().mockResolvedValue({}),
  withdrawApproval: vi.fn().mockResolvedValue({}),
}));

vi.mock('@/stores/useNotificationStore', () => ({
  useNotificationStore: {
    getState: () => ({
      addNotification: vi.fn(),
    }),
  },
}));

vi.mock('@/stores/useAuthStore', () => ({
  useAuthStore: (selector: any) => selector({ currentUser: { id: '1', name: 'Test User' } }),
}));

vi.mock('../ApprovalChainView', () => ({
  default: (props: any) => (
    <div data-testid="approval-chain-view">
      <span data-testid="chain-steps-count">{props.chainSteps?.length ?? 0}</span>
      <span data-testid="chain-approval-id">{props.approvalId}</span>
    </div>
  ),
}));

vi.mock('./AddSignerModal', () => ({
  default: (props: any) => (
    <div data-testid="add-signer-modal">
      <span data-testid="modal-open">{String(props.open)}</span>
      <button data-testid="modal-success" onClick={props.onSuccess}>Success</button>
      <button data-testid="modal-close" onClick={props.onClose}>Close</button>
    </div>
  ),
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

const pendingTask = {
  taskId: 'wf-t1',
  taskName: '技术评审',
  businessObjectId: 101,
  objectType: 'TASK',
  objectName: '完成设计文档',
  projectId: 1,
  applicantName: '张三',
  createdAt: '2026-05-01T10:00:00Z',
};

const bomTask = {
  taskId: 'wf-t2',
  taskName: '工艺评审',
  businessObjectId: 202,
  objectType: 'BOM',
  objectName: '产品A的BOM',
  objectCode: 'BOM-001',
  projectId: 1,
  applicantName: '李四',
  createdAt: '2026-05-01T11:00:00Z',
};

describe('ApprovalDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows empty hint when no task selected', () => {
    renderWithAntd(<ApprovalDetail task={null} onRefresh={vi.fn()} />);

    expect(screen.getByText('请选择一条审批记录')).toBeTruthy();
  });

  it('renders detail view with task info', () => {
    renderWithAntd(<ApprovalDetail task={pendingTask} onRefresh={vi.fn()} />);

    expect(screen.getByText('审批类型')).toBeTruthy();
    expect(screen.getByText('任务')).toBeTruthy();
    expect(screen.getByText('名称')).toBeTruthy();
    expect(screen.getByText('完成设计文档')).toBeTruthy();
    expect(screen.getByText('张三')).toBeTruthy();
    expect(screen.getByText('技术评审')).toBeTruthy();
  });

  it('shows object code when present', () => {
    renderWithAntd(<ApprovalDetail task={bomTask} onRefresh={vi.fn()} />);

    expect(screen.getByText('编号')).toBeTruthy();
    expect(screen.getByText('BOM-001')).toBeTruthy();
  });

  it('shows action buttons', () => {
    renderWithAntd(<ApprovalDetail task={pendingTask} onRefresh={vi.fn()} />);

    expect(screen.getByRole('button', { name: /通\s*过/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: /拒\s*绝/ })).toBeTruthy();
    expect(screen.getByPlaceholderText('审批意见/拒绝原因（拒绝时必填）')).toBeTruthy();
  });

  it('handles approve click and calls onRefresh', async () => {
    const user = userEvent.setup();
    const onRefresh = vi.fn();
    renderWithAntd(<ApprovalDetail task={pendingTask} onRefresh={onRefresh} />);

    await user.click(screen.getByRole('button', { name: /通\s*过/ }));
    const confirmBtn = await screen.findByRole('button', { name: /确\s*认/ });
    await user.click(confirmBtn);

    await waitFor(() => {
      expect(completeTask).toHaveBeenCalledWith('wf-t1', { approved: true });
      expect(message.success).toHaveBeenCalledWith('审批通过');
      expect(onRefresh).toHaveBeenCalled();
    });
  });

  it('shows error message when approve fails', async () => {
    vi.mocked(completeTask).mockRejectedValueOnce(new Error('fail'));
    const user = userEvent.setup();
    renderWithAntd(<ApprovalDetail task={pendingTask} onRefresh={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /通\s*过/ }));
    const confirmBtn = await screen.findByRole('button', { name: /确\s*认/ });
    await user.click(confirmBtn);

    await waitFor(() => {
      expect(message.error).toHaveBeenCalledWith('审批失败');
    });
  });

  it('handles reject with comment', async () => {
    const user = userEvent.setup();
    const onRefresh = vi.fn();
    renderWithAntd(<ApprovalDetail task={pendingTask} onRefresh={onRefresh} />);

    const textarea = screen.getByPlaceholderText('审批意见/拒绝原因（拒绝时必填）');
    await user.type(textarea, '不符合要求');
    await user.click(screen.getByRole('button', { name: /拒\s*绝/ }));
    const confirmBtn = await screen.findByRole('button', { name: /确认拒绝/ });
    await user.click(confirmBtn);

    await waitFor(() => {
      expect(completeTask).toHaveBeenCalledWith('wf-t1', { approved: false, comment: '不符合要求' });
      expect(message.success).toHaveBeenCalledWith('已拒绝');
      expect(onRefresh).toHaveBeenCalled();
    });
  });

  it('shows warning when rejecting without comment', async () => {
    const user = userEvent.setup();
    renderWithAntd(<ApprovalDetail task={pendingTask} onRefresh={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /拒\s*绝/ }));

    await waitFor(() => {
      expect(message.warning).toHaveBeenCalledWith('请先输入拒绝原因');
      expect(completeTask).not.toHaveBeenCalled();
    });
  });

  it('shows error when reject fails', async () => {
    vi.mocked(completeTask).mockRejectedValueOnce(new Error('fail'));
    const user = userEvent.setup();
    renderWithAntd(<ApprovalDetail task={pendingTask} onRefresh={vi.fn()} />);

    const textarea = screen.getByPlaceholderText('审批意见/拒绝原因（拒绝时必填）');
    await user.type(textarea, '原因');
    await user.click(screen.getByRole('button', { name: /拒\s*绝/ }));
    const confirmBtn = await screen.findByRole('button', { name: /确认拒绝/ });
    await user.click(confirmBtn);

    await waitFor(() => {
      expect(message.error).toHaveBeenCalledWith('操作失败');
    });
  });

  it('renders type labels for known object types', () => {
    renderWithAntd(<ApprovalDetail task={bomTask} onRefresh={vi.fn()} />);
    expect(screen.getByText('BOM')).toBeTruthy();
  });

  it('falls back to raw type for unknown object types', () => {
    const unknownTask = { ...pendingTask, objectType: 'UNKNOWN_TYPE' };
    renderWithAntd(<ApprovalDetail task={unknownTask} onRefresh={vi.fn()} />);
    expect(screen.getByText('UNKNOWN_TYPE')).toBeTruthy();
  });

  it('fetches and shows approval history', async () => {
    vi.mocked(getApprovalHistory).mockResolvedValueOnce([
      { id: 1, nodeName: '技术评审', approverName: '王工', action: 'APPROVE', createdAt: '2026-05-01T10:30:00Z' },
    ]);

    renderWithAntd(<ApprovalDetail task={pendingTask} onRefresh={vi.fn()} />);

    await waitFor(() => {
      expect(getApprovalHistory).toHaveBeenCalledWith(101);
      expect(screen.getByTestId('approval-chain-view')).toBeTruthy();
      expect(screen.getByTestId('chain-steps-count').textContent).toBe('1');
    });
  });

  it('shows remind button', () => {
    renderWithAntd(<ApprovalDetail task={pendingTask} onRefresh={vi.fn()} />);
    expect(screen.getByRole('button', { name: /催\s*办/ })).toBeTruthy();
  });

  it('shows success message when remind button is clicked', async () => {
    const user = userEvent.setup();
    renderWithAntd(<ApprovalDetail task={pendingTask} onRefresh={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /催\s*办/ }));

    await waitFor(() => {
      expect(message.success).toHaveBeenCalledWith('催办通知已发送');
    });
  });

  it('shows add signer button', () => {
    renderWithAntd(<ApprovalDetail task={pendingTask} onRefresh={vi.fn()} />);
    expect(screen.getByRole('button', { name: /加\s*签/ })).toBeTruthy();
  });

  it('opens AddSignerModal when add signer button is clicked', async () => {
    const user = userEvent.setup();
    renderWithAntd(<ApprovalDetail task={pendingTask} onRefresh={vi.fn()} />);

    expect(screen.getByTestId('modal-open').textContent).toBe('false');
    await user.click(screen.getByRole('button', { name: /加\s*签/ }));
    expect(screen.getByTestId('modal-open').textContent).toBe('true');
  });

  it('closes AddSignerModal on success', async () => {
    const onRefresh = vi.fn();
    const user = userEvent.setup();
    renderWithAntd(<ApprovalDetail task={pendingTask} onRefresh={onRefresh} />);

    await user.click(screen.getByRole('button', { name: /加\s*签/ }));
    expect(screen.getByTestId('modal-open').textContent).toBe('true');

    await user.click(screen.getByTestId('modal-success'));
    expect(screen.getByTestId('modal-open').textContent).toBe('false');
    expect(onRefresh).toHaveBeenCalled();
  });

  it('renders approval mode as read-only label', () => {
    renderWithAntd(<ApprovalDetail task={pendingTask} onRefresh={vi.fn()} />);
    expect(screen.getByText('审批模式')).toBeInTheDocument();
    expect(screen.getAllByText('单人审批').length).toBeGreaterThanOrEqual(1);
  });
});
