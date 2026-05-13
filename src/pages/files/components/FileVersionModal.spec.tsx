import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfigProvider } from 'antd';
import FileVersionModal from './FileVersionModal';

const renderWithAntd = (ui: React.ReactElement) =>
  render(<ConfigProvider>{ui}</ConfigProvider>);

describe('FileVersionModal', () => {
  it('renders modal when visible', () => {
    renderWithAntd(
      <FileVersionModal visible={true} fileId="f1" fileName="项目计划.docx" onClose={vi.fn()} />,
    );
    expect(screen.getByText('版本历史 - 项目计划.docx')).toBeInTheDocument();
  });

  it('does not render content when not visible', () => {
    renderWithAntd(
      <FileVersionModal visible={false} fileId="f1" fileName="项目计划.docx" onClose={vi.fn()} />,
    );
    expect(screen.queryByText('版本历史 - 项目计划.docx')).not.toBeInTheDocument();
  });

  it('shows version table columns', () => {
    renderWithAntd(
      <FileVersionModal visible={true} fileId="f1" fileName="项目计划.docx" onClose={vi.fn()} />,
    );
    expect(screen.getByText('版本号')).toBeInTheDocument();
    expect(screen.getByText('上传时间')).toBeInTheDocument();
    expect(screen.getByText('上传人')).toBeInTheDocument();
  });

  it('shows version entries with download button', () => {
    renderWithAntd(
      <FileVersionModal visible={true} fileId="f1" fileName="项目计划.docx" onClose={vi.fn()} />,
    );
    const downloadButtons = screen.getAllByText('下载');
    expect(downloadButtons.length).toBeGreaterThan(0);
  });

  it('shows current version marker', () => {
    renderWithAntd(
      <FileVersionModal visible={true} fileId="f1" fileName="项目计划.docx" onClose={vi.fn()} />,
    );
    expect(screen.getByText(/(当前)/)).toBeInTheDocument();
  });

  // --- Version diff tests ---

  it('allows selecting two versions via checkboxes', async () => {
    renderWithAntd(
      <FileVersionModal visible={true} fileId="f1" fileName="项目计划.docx" onClose={vi.fn()} />,
    );

    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes.length).toBeGreaterThanOrEqual(2);

    // Select first two version checkboxes
    await userEvent.click(checkboxes[0]);
    await userEvent.click(checkboxes[1]);

    await waitFor(() => {
      expect(checkboxes[0]).toBeChecked();
      expect(checkboxes[1]).toBeChecked();
    });

    // The "对比" button should appear
    expect(screen.getByTestId('compare-btn')).toBeInTheDocument();
    expect(screen.getByText('对比')).toBeInTheDocument();
  });

  it('shows comparison view when compare button is clicked', async () => {
    renderWithAntd(
      <FileVersionModal visible={true} fileId="f1" fileName="项目计划.docx" onClose={vi.fn()} />,
    );

    const checkboxes = screen.getAllByRole('checkbox');
    await userEvent.click(checkboxes[0]);
    await userEvent.click(checkboxes[1]);

    await waitFor(() => {
      expect(screen.getByTestId('compare-btn')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByTestId('compare-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('diff-view')).toBeInTheDocument();
    });

    // Should show comparison table attributes
    expect(screen.getByText('文件大小')).toBeInTheDocument();
    expect(screen.getAllByText('上传人').length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText('上传时间').length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText('属性')).toBeInTheDocument();
  });
});
