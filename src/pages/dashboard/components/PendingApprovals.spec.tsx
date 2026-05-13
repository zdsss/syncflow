import { render, screen } from '@testing-library/react';
import { ConfigProvider } from 'antd';
import { describe, it, expect, vi } from 'vitest';
import PendingApprovals from './PendingApprovals';

const renderWithAntd = (ui: React.ReactElement) =>
  render(<ConfigProvider>{ui}</ConfigProvider>);

const mockItems = [
  {
    id: 1,
    title: '变更审批: 材料替换方案',
    type: 'CHANGE',
    applicantName: '张三',
    createdAt: '2026-05-08',
    status: 'pending',
    projectName: '项目A',
    currentTaskId: 'task-1',
  },
  {
    id: 2,
    title: '里程碑审批: 设计阶段完成',
    type: 'MILESTONE',
    applicantName: '李四',
    createdAt: '2026-05-07',
    status: 'pending',
    currentTaskId: 'task-2',
  },
];

describe('PendingApprovals', () => {
  it('renders with approval items', () => {
    renderWithAntd(<PendingApprovals items={mockItems} />);
    expect(screen.getByTestId('pending-approvals')).toBeInTheDocument();
    expect(screen.getByText('审批待办')).toBeInTheDocument();
    expect(screen.getByText(/变更审批/)).toBeInTheDocument();
    expect(screen.getByText(/里程碑审批/)).toBeInTheDocument();
  });

  it('renders empty state when no items', () => {
    renderWithAntd(<PendingApprovals items={[]} />);
    expect(screen.getByText('暂无审批待办')).toBeInTheDocument();
  });

  it('renders loading state', () => {
    renderWithAntd(<PendingApprovals items={[]} loading={true} />);
    expect(screen.getByTestId('pending-approvals')).toBeInTheDocument();
  });

  it('displays submitter info', () => {
    renderWithAntd(<PendingApprovals items={mockItems} />);
    expect(screen.getByText(/张三/)).toBeInTheDocument();
    expect(screen.getByText(/李四/)).toBeInTheDocument();
  });

  it('displays type tags', () => {
    renderWithAntd(<PendingApprovals items={mockItems} />);
    expect(screen.getByText('变更')).toBeInTheDocument();
    expect(screen.getByText('里程碑')).toBeInTheDocument();
  });

  it('renders approve and reject buttons', () => {
    renderWithAntd(<PendingApprovals items={mockItems} />);
    const approveButtons = screen.getAllByText('通过');
    const rejectButtons = screen.getAllByText('驳回');
    expect(approveButtons.length).toBe(2);
    expect(rejectButtons.length).toBe(2);
  });

  it('calls onApprove when approve button is clicked', () => {
    const onApprove = vi.fn();
    renderWithAntd(<PendingApprovals items={mockItems} onApprove={onApprove} />);
    const approveButtons = screen.getAllByText('通过');
    approveButtons[0].click();
    expect(onApprove).toHaveBeenCalledWith('task-1');
  });

  it('calls onReject when reject button is clicked', () => {
    const onReject = vi.fn();
    renderWithAntd(<PendingApprovals items={mockItems} onReject={onReject} />);
    const rejectButtons = screen.getAllByText('驳回');
    rejectButtons[0].click();
    expect(onReject).toHaveBeenCalledWith('task-1');
  });
});
