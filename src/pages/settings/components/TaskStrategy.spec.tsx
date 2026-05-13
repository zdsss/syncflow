import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfigProvider, message } from 'antd';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TaskStrategy from './TaskStrategy';

vi.mock('antd', async (importOriginal) => {
  const actual = await importOriginal<typeof import('antd')>();
  return {
    ...actual,
    message: { ...actual.message, success: vi.fn(), error: vi.fn() },
  };
});

const renderWithAntd = (ui: React.ReactElement) =>
  render(<ConfigProvider>{ui}</ConfigProvider>);

describe('TaskStrategy', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders the task strategy section', () => {
    renderWithAntd(<TaskStrategy />);
    expect(screen.getByTestId('task-strategy')).toBeInTheDocument();
    expect(screen.getByText('任务策略')).toBeInTheDocument();
  });

  it('renders all strategy rows', () => {
    renderWithAntd(<TaskStrategy />);
    expect(screen.getByTestId('row-allTimeSpan')).toBeInTheDocument();
    expect(screen.getByTestId('row-issueTimeSpan')).toBeInTheDocument();
    expect(screen.getByTestId('row-riskTimeSpan')).toBeInTheDocument();
    expect(screen.getByTestId('row-suggestionTimeSpan')).toBeInTheDocument();
    expect(screen.getByTestId('row-changeTimeSpan')).toBeInTheDocument();
    expect(screen.getByTestId('row-watchTimeSpan')).toBeInTheDocument();
    expect(screen.getByTestId('row-warningAdvanceTime')).toBeInTheDocument();
    expect(screen.getByTestId('row-taskOverdueEscalationLevel')).toBeInTheDocument();
    expect(screen.getByTestId('row-milestoneOverdueEscalationLevel')).toBeInTheDocument();
  });

  it('does not show save button initially', () => {
    renderWithAntd(<TaskStrategy />);
    expect(screen.queryByTestId('save-strategy-btn')).not.toBeInTheDocument();
  });

  it('shows save button after changing a value', async () => {
    const user = userEvent.setup();
    renderWithAntd(<TaskStrategy />);

    const radios = screen.getAllByRole('radio', { name: '三个月' });
    await user.click(radios[0]);

    expect(screen.getByTestId('save-strategy-btn')).toBeInTheDocument();
  });

  it('shows custom input when custom option is selected', async () => {
    const user = userEvent.setup();
    renderWithAntd(<TaskStrategy />);

    const customRadios = screen.getAllByRole('radio', { name: '自定义' });
    await user.click(customRadios[0]);

    expect(screen.getByTestId('input-allTimeSpanCustom')).toBeInTheDocument();
  });

  it('shows success message after saving', async () => {
    const user = userEvent.setup();
    renderWithAntd(<TaskStrategy />);

    const radios = screen.getAllByRole('radio', { name: '一年' });
    await user.click(radios[0]);

    await user.click(screen.getByTestId('save-strategy-btn'));

    await waitFor(() => {
      expect(message.success).toHaveBeenCalledWith('任务策略已保存');
    });
  });

  it('hides save button after successful save', async () => {
    const user = userEvent.setup();
    renderWithAntd(<TaskStrategy />);

    const radios = screen.getAllByRole('radio', { name: '一年' });
    await user.click(radios[0]);
    await user.click(screen.getByTestId('save-strategy-btn'));

    await waitFor(() => {
      expect(screen.queryByTestId('save-strategy-btn')).not.toBeInTheDocument();
    });
  });
});
