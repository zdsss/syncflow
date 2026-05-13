import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfigProvider } from 'antd';
import FileListTable from './FileListTable';

const mockSetFiles = vi.fn();
const mockSetTotal = vi.fn();
const mockSetStorageStats = vi.fn();
const mockSetPagination = vi.fn();
const mockSetLoading = vi.fn();

vi.mock('@/stores/useFileStore', () => ({
  useFileStore: () => ({
    files: [
      { id: 'f1', name: '项目计划.docx', type: 'document', size: 1048576, createdAt: '2025-03-15T10:30:00Z', uploaderId: 'u1', uploaderName: '邓智豪' },
      { id: 'f2', name: '设计稿.png', type: 'image', size: 5242880, createdAt: '2025-03-14T09:00:00Z', uploaderId: 'u2', uploaderName: '王美玲' },
      { id: 'f3', name: 'index.tsx', type: 'code', size: 2048, createdAt: '2025-03-13T15:45:00Z', uploaderId: 'u3', uploaderName: '陈思远' },
    ],
    total: 3,
    page: 1,
    pageSize: 10,
    loading: false,
    fileTypeTab: 'all',
    setFiles: mockSetFiles,
    setTotal: mockSetTotal,
    setStorageStats: mockSetStorageStats,
    setPagination: mockSetPagination,
    setLoading: mockSetLoading,
  }),
}));

vi.mock('@/services/file.service', () => ({
  getFiles: vi.fn().mockResolvedValue({
    code: 200,
    data: [],
    total: 0,
    storageStats: { totalFiles: 0, usedSpace: 0, totalSpace: 0 },
  }),
  renameFile: vi.fn().mockResolvedValue({}),
  deleteFile: vi.fn().mockResolvedValue({}),
}));

vi.mock('./FileVersionModal', () => ({
  default: ({ visible, fileId, fileName, onClose }: any) =>
    visible ? (
      <div data-testid="version-modal">
        <span>VersionModal-{fileId}-{fileName}</span>
        <button data-testid="modal-close-btn" onClick={onClose}>Close</button>
      </div>
    ) : null,
}));

const renderWithAntd = (ui: React.ReactElement) =>
  render(<ConfigProvider>{ui}</ConfigProvider>);

describe('FileListTable', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders file table', () => {
    renderWithAntd(<FileListTable />);
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  it('shows file name column', () => {
    renderWithAntd(<FileListTable />);
    expect(screen.getByText('文件名')).toBeInTheDocument();
  });

  it('displays file names', () => {
    renderWithAntd(<FileListTable />);
    expect(screen.getByText('项目计划.docx')).toBeInTheDocument();
    expect(screen.getByText('设计稿.png')).toBeInTheDocument();
    expect(screen.getByText('index.tsx')).toBeInTheDocument();
  });

  it('shows size and upload time columns', () => {
    renderWithAntd(<FileListTable />);
    expect(screen.getByText('大小')).toBeInTheDocument();
    expect(screen.getByText('上传时间')).toBeInTheDocument();
    expect(screen.getByText('上传人')).toBeInTheDocument();
  });

  it('shows version history button', () => {
    renderWithAntd(<FileListTable />);
    const versionButtons = screen.getAllByText('版本历史');
    expect(versionButtons.length).toBeGreaterThan(0);
  });

  // --- New tests for uncovered lines ---

  it('opens version modal when version history button is clicked', async () => {
    renderWithAntd(<FileListTable />);
    expect(screen.queryByTestId('version-modal')).not.toBeInTheDocument();

    const versionButtons = screen.getAllByText('版本历史');
    await userEvent.click(versionButtons[0]);

    expect(screen.getByTestId('version-modal')).toBeInTheDocument();
    expect(screen.getByText('VersionModal-f1-项目计划.docx')).toBeInTheDocument();
  });

  it('selects rows when checkboxes are clicked', async () => {
    renderWithAntd(<FileListTable />);
    const checkboxes = screen.getAllByRole('checkbox');
    // First checkbox is the "select all" header checkbox; row checkboxes follow
    expect(checkboxes.length).toBeGreaterThan(1);

    await userEvent.click(checkboxes[1]);
    // The row selection onChange should be invoked (line 146)
    // antd Table internally manages selectedRowKeys; we verify the checkbox is checked
    await waitFor(() => {
      expect(checkboxes[1]).toBeChecked();
    });
  });

  it('calls onSelectionChange when rows are selected', async () => {
    const onSelectionChange = vi.fn();
    renderWithAntd(<FileListTable onSelectionChange={onSelectionChange} />);
    const checkboxes = screen.getAllByRole('checkbox');

    await userEvent.click(checkboxes[1]);
    await waitFor(() => {
      expect(onSelectionChange).toHaveBeenCalledWith(['f1']);
    });

    await userEvent.click(checkboxes[2]);
    await waitFor(() => {
      expect(onSelectionChange).toHaveBeenCalledWith(['f1', 'f2']);
    });
  });

  it('calls onSelectionChange with empty array when all deselected', async () => {
    const onSelectionChange = vi.fn();
    renderWithAntd(<FileListTable onSelectionChange={onSelectionChange} />);
    const checkboxes = screen.getAllByRole('checkbox');

    // Select a row first
    await userEvent.click(checkboxes[1]);
    await waitFor(() => {
      expect(onSelectionChange).toHaveBeenCalledWith(['f1']);
    });

    // Deselect the same row
    await userEvent.click(checkboxes[1]);
    await waitFor(() => {
      expect(onSelectionChange).toHaveBeenCalledWith([]);
    });
  });

  it('closes version modal when onClose is called', async () => {
    renderWithAntd(<FileListTable />);
    // Open modal
    const versionButtons = screen.getAllByText('版本历史');
    await userEvent.click(versionButtons[0]);
    expect(screen.getByTestId('version-modal')).toBeInTheDocument();

    // Close via modal close button
    await userEvent.click(screen.getByTestId('modal-close-btn'));

    await waitFor(() => {
      expect(screen.queryByTestId('version-modal')).not.toBeInTheDocument();
    });
  });

  it('shows preview button when onPreview is provided', () => {
    const onPreview = vi.fn();
    renderWithAntd(<FileListTable onPreview={onPreview} />);
    expect(screen.getByTestId('preview-btn-f1')).toBeInTheDocument();
    expect(screen.getByTestId('preview-btn-f2')).toBeInTheDocument();
    expect(screen.getByTestId('preview-btn-f3')).toBeInTheDocument();
  });

  it('does not show preview button when onPreview is not provided', () => {
    renderWithAntd(<FileListTable />);
    expect(screen.queryByTestId('preview-btn-f1')).not.toBeInTheDocument();
  });

  it('calls onPreview with file record when preview button is clicked', async () => {
    const onPreview = vi.fn();
    renderWithAntd(<FileListTable onPreview={onPreview} />);
    await userEvent.click(screen.getByTestId('preview-btn-f1'));
    expect(onPreview).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'f1', name: '项目计划.docx' })
    );
  });

  it('calls onPreview for image file', async () => {
    const onPreview = vi.fn();
    renderWithAntd(<FileListTable onPreview={onPreview} />);
    await userEvent.click(screen.getByTestId('preview-btn-f2'));
    expect(onPreview).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'f2', name: '设计稿.png' })
    );
  });

  // --- Rename tests ---

  it('renders rename button for each row', () => {
    renderWithAntd(<FileListTable />);
    expect(screen.getByTestId('rename-btn-f1')).toBeInTheDocument();
    expect(screen.getByTestId('rename-btn-f2')).toBeInTheDocument();
    expect(screen.getByTestId('rename-btn-f3')).toBeInTheDocument();
    expect(screen.getAllByText('重命名')).toHaveLength(3);
  });

  it('opens rename modal with pre-filled name when rename button is clicked', async () => {
    renderWithAntd(<FileListTable />);
    expect(screen.queryByTestId('rename-modal')).not.toBeInTheDocument();

    await userEvent.click(screen.getByTestId('rename-btn-f1'));

    expect(screen.getByTestId('rename-modal')).toBeInTheDocument();
    const input = screen.getByTestId('rename-modal-input');
    expect((input as HTMLInputElement).value).toBe('项目计划.docx');
  });

  it('calls renameFile when modal OK is clicked', async () => {
    const fileService = await import('@/services/file.service');
    renderWithAntd(<FileListTable />);
    await userEvent.click(screen.getByTestId('rename-btn-f1'));
    const input = screen.getByTestId('rename-modal-input');
    await userEvent.clear(input);
    await userEvent.type(input, '新名称.docx');
    const okBtn = screen.getByRole('button', { name: /确\s*定/ });
    await userEvent.click(okBtn);
    await waitFor(() => {
      expect(fileService.renameFile).toHaveBeenCalledWith('f1', '新名称.docx');
    });
  });

  it('rename modal has cancel button', () => {
    renderWithAntd(<FileListTable />);
    fireEvent.click(screen.getByTestId('rename-btn-f1'));
    const cancelBtn = screen.getByRole('button', { name: /取\s*消/ });
    expect(cancelBtn).toBeInTheDocument();
  });

  it('shows error message when rename fails', async () => {
    const fileService = await import('@/services/file.service');
    vi.mocked(fileService.renameFile).mockRejectedValueOnce(new Error('fail'));
    renderWithAntd(<FileListTable />);
    await userEvent.click(screen.getByTestId('rename-btn-f1'));
    const input = screen.getByTestId('rename-modal-input');
    await userEvent.clear(input);
    await userEvent.type(input, 'new-name.docx');
    const okBtn = screen.getByRole('button', { name: /确\s*定/ });
    await userEvent.click(okBtn);
    await waitFor(() => {
      expect(screen.getByText('重命名失败')).toBeInTheDocument();
    });
  });

  // --- Context menu tests ---

  it('renders context menu on right-click of table row', async () => {
    renderWithAntd(<FileListTable />);
    const rows = document.querySelectorAll('tbody tr');
    expect(rows.length).toBeGreaterThan(0);

    fireEvent.contextMenu(rows[0]);

    await waitFor(() => {
      expect(screen.getByTestId('context-menu')).toBeInTheDocument();
      expect(screen.getByTestId('context-menu-open')).toBeInTheDocument();
      expect(screen.getByTestId('context-menu-download')).toBeInTheDocument();
      expect(screen.getByTestId('context-menu-rename')).toBeInTheDocument();
      expect(screen.getByTestId('context-menu-versions')).toBeInTheDocument();
      expect(screen.getByTestId('context-menu-delete')).toBeInTheDocument();
    });
  });

  it('context menu items trigger correct actions', async () => {
    renderWithAntd(<FileListTable />);
    const rows = document.querySelectorAll('tbody tr');

    // Right-click to open context menu
    fireEvent.contextMenu(rows[0]);

    await waitFor(() => {
      expect(screen.getByTestId('context-menu-versions')).toBeInTheDocument();
    });

    // Click "版本历史" from context menu
    fireEvent.click(screen.getByTestId('context-menu-versions'));

    await waitFor(() => {
      expect(screen.getByTestId('version-modal')).toBeInTheDocument();
    });
  });

  // --- Share button tests ---

  it('share button renders and copies link to clipboard', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: { writeText },
    });

    renderWithAntd(<FileListTable />);
    const shareBtn = screen.getByTestId('share-btn-f1');
    expect(shareBtn).toBeInTheDocument();
    expect(shareBtn).toHaveTextContent('分享');

    await userEvent.click(shareBtn);

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith('https://syncflow.com/share/f1');
      expect(screen.getByText('分享链接已复制')).toBeInTheDocument();
    });
  });
});
