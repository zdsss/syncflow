import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfigProvider } from 'antd';
import BatchActionBar from './BatchActionBar';

const renderWithAntd = (ui: React.ReactElement) =>
  render(<ConfigProvider>{ui}</ConfigProvider>);

describe('BatchActionBar', () => {
  const defaultProps = {
    selectedCount: 3,
    onDelete: vi.fn(),
    onDownload: vi.fn(),
    onCancel: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the bar with selected count', () => {
    renderWithAntd(<BatchActionBar {...defaultProps} />);
    expect(screen.getByText('已选择 3 个文件')).toBeInTheDocument();
  });

  it('renders batch delete button', () => {
    renderWithAntd(<BatchActionBar {...defaultProps} />);
    expect(screen.getByText('批量删除')).toBeInTheDocument();
  });

  it('renders batch download button', () => {
    renderWithAntd(<BatchActionBar {...defaultProps} />);
    expect(screen.getByText('批量下载')).toBeInTheDocument();
  });

  it('renders cancel selection button', () => {
    renderWithAntd(<BatchActionBar {...defaultProps} />);
    expect(screen.getByText('取消选择')).toBeInTheDocument();
  });

  it('calls onCancel when cancel button is clicked', async () => {
    const onCancel = vi.fn();
    renderWithAntd(<BatchActionBar {...defaultProps} onCancel={onCancel} />);
    await userEvent.click(screen.getByText('取消选择'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('calls onDownload when download button is clicked', async () => {
    const onDownload = vi.fn();
    renderWithAntd(<BatchActionBar {...defaultProps} onDownload={onDownload} />);
    await userEvent.click(screen.getByText('批量下载'));
    expect(onDownload).toHaveBeenCalledTimes(1);
  });

  it('shows popconfirm when delete button is clicked', async () => {
    renderWithAntd(<BatchActionBar {...defaultProps} />);
    await userEvent.click(screen.getByText('批量删除'));
    await waitFor(() => {
      expect(screen.getByText('确定要删除选中的 3 个文件吗？')).toBeInTheDocument();
    });
  });

  it('calls onDelete when confirming delete', async () => {
    const onDelete = vi.fn();
    renderWithAntd(<BatchActionBar {...defaultProps} onDelete={onDelete} />);
    await userEvent.click(screen.getByText('批量删除'));
    await waitFor(() => {
      expect(screen.getByText('确定要删除选中的 3 个文件吗？')).toBeInTheDocument();
    });
    const okButton = screen.getByRole('button', { name: /确\s*定/ });
    await userEvent.click(okButton);
    await waitFor(() => {
      expect(onDelete).toHaveBeenCalledTimes(1);
    });
  });

  it('renders nothing when selectedCount is 0', () => {
    const { container } = renderWithAntd(<BatchActionBar {...defaultProps} selectedCount={0} />);
    expect(container.querySelector('[data-testid="batch-action-bar"]')).toBeNull();
  });

  it('updates count display with different selectedCount', () => {
    renderWithAntd(<BatchActionBar {...defaultProps} selectedCount={10} />);
    expect(screen.getByText('已选择 10 个文件')).toBeInTheDocument();
  });

  it('shows progress message when batch download is clicked', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const onDownload = vi.fn();
    renderWithAntd(<BatchActionBar {...defaultProps} onDownload={onDownload} />);

    await userEvent.click(screen.getByText('批量下载'));

    expect(onDownload).toHaveBeenCalled();

    // Advance past the 1000ms delay
    await act(async () => {
      vi.advanceTimersByTime(1100);
    });

    await waitFor(() => {
      expect(screen.getByText('下载已开始')).toBeInTheDocument();
    });

    vi.useRealTimers();
  });
});
