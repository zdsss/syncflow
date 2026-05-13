import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfigProvider, message } from 'antd';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AddSignerModal from './AddSignerModal';

vi.mock('@/services/config.service', () => ({
  getUsers: vi.fn().mockResolvedValue({
    data: { records: [
      { id: 1, realName: '邓智豪', username: 'deng' },
      { id: 2, realName: '王美玲', username: 'wang' },
      { id: 3, realName: '陈思远', username: 'chen' },
    ] },
  }),
}));

vi.mock('@/services/workflow.service', () => ({
  addCandidateUser: vi.fn().mockResolvedValue({}),
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

describe('AddSignerModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders modal when open', () => {
    renderWithAntd(
      <AddSignerModal open businessObjectId={1} taskId="task-1" onClose={vi.fn()} onSuccess={vi.fn()} />,
    );
    expect(screen.getByText('加签')).toBeTruthy();
  });

  it('does not render modal content when closed', () => {
    renderWithAntd(
      <AddSignerModal open={false} businessObjectId={1} taskId="task-1" onClose={vi.fn()} onSuccess={vi.fn()} />,
    );
    expect(screen.queryByText('加签')).toBeNull();
  });

  it('shows user selector', () => {
    renderWithAntd(
      <AddSignerModal open businessObjectId={1} taskId="task-1" onClose={vi.fn()} onSuccess={vi.fn()} />,
    );
    expect(screen.getByText('请选择审批人')).toBeTruthy();
  });

  it('shows confirm and cancel buttons', () => {
    renderWithAntd(
      <AddSignerModal open businessObjectId={1} taskId="task-1" onClose={vi.fn()} onSuccess={vi.fn()} />,
    );
    expect(screen.getByRole('button', { name: /确认添加/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: /取\s*消/ })).toBeTruthy();
  });

  it('shows warning when no user is selected', async () => {
    const user = userEvent.setup();
    renderWithAntd(
      <AddSignerModal open businessObjectId={1} taskId="task-1" onClose={vi.fn()} onSuccess={vi.fn()} />,
    );

    await user.click(screen.getByRole('button', { name: /确认添加/ }));

    await waitFor(() => {
      expect(message.warning).toHaveBeenCalledWith('请选择要添加的审批人');
    });
  });

  it('calls addCandidateUser API and onSuccess after successful submission', async () => {
    const { addCandidateUser } = await import('@/services/workflow.service');
    const onSuccess = vi.fn();
    renderWithAntd(
      <AddSignerModal open businessObjectId={42} taskId="task-42" onClose={vi.fn()} onSuccess={onSuccess} />,
    );

    const selector = screen.getByRole('combobox');
    fireEvent.mouseDown(selector);

    await waitFor(() => {
      expect(screen.getByText('邓智豪')).toBeTruthy();
    });
    fireEvent.click(screen.getByText('邓智豪'));

    fireEvent.click(screen.getByRole('button', { name: /确认添加/ }));

    await waitFor(() => {
      expect(addCandidateUser).toHaveBeenCalledWith('task-42', 1);
      expect(message.success).toHaveBeenCalledWith('已添加审批人');
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  it('calls onClose when cancel is clicked', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    renderWithAntd(
      <AddSignerModal open businessObjectId={1} taskId="task-1" onClose={onClose} onSuccess={vi.fn()} />,
    );

    await user.click(screen.getByRole('button', { name: /取\s*消/ }));
    expect(onClose).toHaveBeenCalled();
  });
});
