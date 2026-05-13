import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfigProvider } from 'antd';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ApprovalPage from './index';

const mockTasks = [
  {
    taskId: 'wf-t1',
    taskName: '技术评审',
    businessObjectId: 101,
    objectType: 'TASK',
    objectName: '完成设计文档',
    projectId: 1,
    applicantName: '张三',
    createdAt: '2026-05-01T10:00:00Z',
  },
  {
    taskId: 'wf-t2',
    taskName: '工艺评审',
    businessObjectId: 202,
    objectType: 'BOM',
    objectName: '产品A的BOM',
    projectId: 1,
    applicantName: '李四',
    createdAt: '2026-05-01T11:00:00Z',
  },
];

const mockGetPendingTasks = vi.fn().mockResolvedValue(mockTasks);

vi.mock('@/services/workflow.service', () => ({
  getPendingTasks: (...args: any[]) => mockGetPendingTasks(...args),
}));

vi.mock('./components/ApprovalList', () => ({
  default: (props: any) => (
    <div data-testid="approval-list">
      <span data-testid="list-count">{props.approvals?.length ?? 0}</span>
      <span data-testid="list-loading">{String(props.loading)}</span>
      <button data-testid="select-btn" onClick={() => props.onSelect?.('wf-t1')}>Select</button>
    </div>
  ),
}));

vi.mock('./components/ApprovalDetail', () => ({
  default: (props: any) => (
    <div data-testid="approval-detail">
      <span data-testid="detail-task-id">{props.task?.taskId ?? 'none'}</span>
    </div>
  ),
}));

vi.mock('./components/AddSignerModal', () => ({
  default: () => <div data-testid="add-signer-modal" />,
}));

vi.mock('@/hooks/useSocket', () => ({
  useSocket: () => ({
    connected: false,
    subscribe: vi.fn(() => () => {}),
    unsubscribe: vi.fn(),
  }),
}));

const renderWithAntd = (ui: React.ReactElement) =>
  render(<ConfigProvider>{ui}</ConfigProvider>);

describe('ApprovalPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetPendingTasks.mockResolvedValue(mockTasks);
  });

  it('renders the page title', async () => {
    renderWithAntd(<ApprovalPage />);
    expect(screen.getByText('审批管理')).toBeTruthy();
  });

  it('fetches pending tasks on mount', async () => {
    renderWithAntd(<ApprovalPage />);
    await waitFor(() => {
      expect(mockGetPendingTasks).toHaveBeenCalled();
    });
  });

  it('renders ApprovalList child component', async () => {
    renderWithAntd(<ApprovalPage />);
    await waitFor(() => {
      expect(screen.getByTestId('approval-list')).toBeTruthy();
    });
  });

  it('renders ApprovalDetail child component', async () => {
    renderWithAntd(<ApprovalPage />);
    await waitFor(() => {
      expect(screen.getByTestId('approval-detail')).toBeTruthy();
    });
  });

  it('passes fetched tasks to ApprovalList', async () => {
    renderWithAntd(<ApprovalPage />);
    await waitFor(() => {
      expect(screen.getByTestId('list-count').textContent).toBe('2');
    });
  });

  it('selects a task and shows detail', async () => {
    const user = userEvent.setup();
    renderWithAntd(<ApprovalPage />);
    await waitFor(() => {
      expect(screen.getByTestId('list-count').textContent).toBe('2');
    });

    await user.click(screen.getByTestId('select-btn'));
    expect(screen.getByTestId('detail-task-id').textContent).toBe('wf-t1');
  });
});
