import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfigProvider, message } from 'antd';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ChangeRequestModal from './ChangeRequestModal';

vi.mock('@/services/bom.service', () => ({
  createChangeRequest: vi.fn().mockResolvedValue({}),
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

describe('ChangeRequestModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders modal when open', () => {
    renderWithAntd(
      <ChangeRequestModal bomId={1} open onClose={vi.fn()} onSuccess={vi.fn()} />,
    );
    expect(screen.getByText('变更申请')).toBeTruthy();
  });

  it('does not render modal content when closed', () => {
    renderWithAntd(
      <ChangeRequestModal bomId={1} open={false} onClose={vi.fn()} onSuccess={vi.fn()} />,
    );
    expect(screen.queryByText('变更申请')).toBeNull();
  });

  it('shows change type selector', () => {
    renderWithAntd(
      <ChangeRequestModal bomId={1} open onClose={vi.fn()} onSuccess={vi.fn()} />,
    );
    expect(screen.getByText('变更类型')).toBeTruthy();
    expect(screen.getByText('请选择变更类型')).toBeTruthy();
  });

  it('shows description textarea', () => {
    renderWithAntd(
      <ChangeRequestModal bomId={1} open onClose={vi.fn()} onSuccess={vi.fn()} />,
    );
    expect(screen.getByText('变更说明')).toBeTruthy();
    expect(screen.getByPlaceholderText('请详细描述变更内容，例如：将M4螺丝改为M5')).toBeTruthy();
  });

  it('shows submit and cancel buttons', () => {
    renderWithAntd(
      <ChangeRequestModal bomId={1} open onClose={vi.fn()} onSuccess={vi.fn()} />,
    );
    expect(screen.getByRole('button', { name: /提\s*交/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: /取\s*消/ })).toBeTruthy();
  });

  it('shows warning when no type is selected', async () => {
    const user = userEvent.setup();
    renderWithAntd(
      <ChangeRequestModal bomId={1} open onClose={vi.fn()} onSuccess={vi.fn()} />,
    );

    await user.click(screen.getByRole('button', { name: /提\s*交/ }));

    await waitFor(() => {
      expect(message.warning).toHaveBeenCalledWith('请选择变更类型');
    });
  });

  it('shows warning when description is empty', async () => {
    renderWithAntd(
      <ChangeRequestModal bomId={1} open onClose={vi.fn()} onSuccess={vi.fn()} />,
    );

    const selector = screen.getByRole('combobox');
    fireEvent.mouseDown(selector);

    await waitFor(() => {
      expect(screen.getByText('新增物料')).toBeTruthy();
    });
    fireEvent.click(screen.getByText('新增物料'));

    fireEvent.click(screen.getByRole('button', { name: /提\s*交/ }));

    await waitFor(() => {
      expect(message.warning).toHaveBeenCalledWith('请输入变更说明');
    });
  });

  it('disables submit button when no bomId', async () => {
    renderWithAntd(
      <ChangeRequestModal bomId={null} open onClose={vi.fn()} onSuccess={vi.fn()} />,
    );

    const submitBtn = screen.getByRole('button', { name: /提\s*交\s*审\s*批/ });
    expect(submitBtn).toBeDisabled();
  });

  it('calls onSuccess after successful submission', async () => {
    const onSuccess = vi.fn();
    renderWithAntd(
      <ChangeRequestModal bomId={1} open onClose={vi.fn()} onSuccess={onSuccess} />,
    );

    const selector = screen.getByRole('combobox');
    fireEvent.mouseDown(selector);

    await waitFor(() => {
      expect(screen.getByText('修改物料')).toBeTruthy();
    });
    fireEvent.click(screen.getByText('修改物料'));

    const textarea = screen.getByPlaceholderText('请详细描述变更内容，例如：将M4螺丝改为M5');
    fireEvent.change(textarea, { target: { value: '修改螺丝规格' } });

    fireEvent.click(screen.getByRole('button', { name: /提\s*交/ }));

    await waitFor(() => {
      expect(message.success).toHaveBeenCalledWith('变更申请已提交，等待审批');
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  it('calls onClose when cancel is clicked', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    renderWithAntd(
      <ChangeRequestModal bomId={1} open onClose={onClose} onSuccess={vi.fn()} />,
    );

    await user.click(screen.getByRole('button', { name: /取\s*消/ }));
    expect(onClose).toHaveBeenCalled();
  });
});
