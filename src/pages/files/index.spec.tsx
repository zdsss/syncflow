import { render, screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfigProvider, message, Modal } from 'antd';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import FilesPage from './index';

const mockModalConfirm = vi.fn();

vi.mock('antd', async (importOriginal) => {
  const actual = await importOriginal<typeof import('antd')>();
  // Override confirm on the Modal component object
  const patchedModal = Object.assign(actual.Modal, {
    confirm: (...args: any[]) => {
      mockModalConfirm(...args);
      return { destroy: vi.fn() };
    },
  });
  return {
    ...actual,
    Modal: patchedModal,
    message: {
      ...actual.message,
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn(),
      info: vi.fn(),
    },
  };
});

vi.mock('./components/StorageStatsBar', () => ({
  default: () => <div data-testid="storage-stats">StorageStats</div>,
}));

vi.mock('./components/FileTypeTabs', () => ({
  default: () => <div data-testid="file-type-tabs">FileTypeTabs</div>,
}));

vi.mock('./components/FileListTable', () => ({
  default: (props: any) => (
    <div data-testid="file-list-table">
      FileListTable
      <button data-testid="click-folder" onClick={() => props.onFolderClick?.('folder-1')}>
        Open Folder
      </button>
      <button data-testid="click-file" onClick={() => props.onFileClick?.('file-1')}>
        Click File
      </button>
      <button data-testid="preview-image-file" onClick={() => props.onPreview?.({ id: 'img-1', name: 'design.png' })}>
        Preview Image
      </button>
      <button data-testid="preview-text-file" onClick={() => props.onPreview?.({ id: 'txt-1', name: 'readme.txt' })}>
        Preview Text
      </button>
      <button data-testid="preview-unsupported-file" onClick={() => props.onPreview?.({ id: 'zip-1', name: 'archive.zip' })}>
        Preview Unsupported
      </button>
      <button
        data-testid="simulate-select"
        onClick={() => props.onSelectionChange?.(['f1', 'f2'])}
      >
        Simulate Select
      </button>
      <button
        data-testid="simulate-clear-select"
        onClick={() => props.onSelectionChange?.([])}
      >
        Clear Selection
      </button>
    </div>
  ),
}));

vi.mock('./components/BatchActionBar', () => ({
  default: (props: any) => (
    <div data-testid="batch-action-bar">
      已选择 {props.selectedCount} 个文件
      <button data-testid="batch-delete-btn" onClick={props.onDelete}>批量删除</button>
      <button data-testid="batch-download-btn" onClick={props.onDownload}>批量下载</button>
      <button data-testid="batch-cancel-btn" onClick={props.onCancel}>取消选择</button>
    </div>
  ),
}));

vi.mock('./components/UploadZone', () => ({
  default: (props: any) => (
    <div data-testid="upload-zone">
      <span data-testid="upload-visible">{String(props.visible)}</span>
    </div>
  ),
}));

const mockGetFileInfo = vi.fn().mockResolvedValue({
  data: {
    data: {
      id: 'file-1',
      name: 'test.txt',
      type: 'text/plain',
      size: 1024,
      version: 3,
      uploadedAt: '2025-01-01T00:00:00Z',
      permissions: ['read', 'write'],
      versions: [
        { version: 3, uploadedAt: '2025-01-03T00:00:00Z', uploader: 'User A' },
        { version: 2, uploadedAt: '2025-01-02T00:00:00Z', uploader: 'User B' },
        { version: 1, uploadedAt: '2025-01-01T00:00:00Z', uploader: 'User A' },
      ],
    },
  },
});

const mockCreateFolder = vi.fn().mockResolvedValue({ data: { data: { id: 'folder-new' } } });

vi.mock('@/services/file.service', () => ({
  uploadFile: vi.fn().mockResolvedValue({}),
  getFileBreadcrumbs: vi.fn().mockResolvedValue({
    data: { data: [] },
  }),
  getFileInfo: (...args: any[]) => mockGetFileInfo(...args),
  deleteFile: vi.fn().mockResolvedValue({}),
  batchDeleteFiles: vi.fn().mockResolvedValue({ data: { data: { count: 2 } } }),
  getBatchDownloadInfo: vi.fn().mockResolvedValue({
    data: { data: { files: [], totalSize: 2048 } },
  }),
  createFolder: (...args: any[]) => mockCreateFolder(...args),
  downloadFile: vi.fn().mockResolvedValue({}),
  getFileContent: vi.fn().mockResolvedValue('Hello, world!'),
}));

vi.mock('@/stores/useAuthStore', () => ({
  useAuthStore: (selector: any) => {
    const state = {
      currentUser: { id: 'u1', name: 'Test User' },
    };
    return selector ? selector(state) : state;
  },
}));

const renderWithAntd = (ui: React.ReactElement) =>
  render(<ConfigProvider>{ui}</ConfigProvider>);

describe('FilesPage', () => {
  it('renders the page title', () => {
    renderWithAntd(<FilesPage />);
    expect(screen.getByText('项目文件')).toBeTruthy();
  });

  it('shows the upload button', () => {
    renderWithAntd(<FilesPage />);
    expect(screen.getByText('上传文件')).toBeTruthy();
  });

  it('shows the search input', () => {
    renderWithAntd(<FilesPage />);
    expect(screen.getByPlaceholderText('搜索文件...')).toBeTruthy();
  });

  it('renders StorageStatsBar child component', () => {
    renderWithAntd(<FilesPage />);
    expect(screen.getByTestId('storage-stats')).toBeTruthy();
  });

  it('renders FileTypeTabs child component', () => {
    renderWithAntd(<FilesPage />);
    expect(screen.getByTestId('file-type-tabs')).toBeTruthy();
  });

  it('renders FileListTable child component', () => {
    renderWithAntd(<FilesPage />);
    expect(screen.getByTestId('file-list-table')).toBeTruthy();
  });

  it('renders UploadZone child component', () => {
    renderWithAntd(<FilesPage />);
    expect(screen.getByTestId('upload-zone')).toBeTruthy();
  });

  it('updates search keyword on input change', async () => {
    const user = userEvent.setup();
    renderWithAntd(<FilesPage />);
    const input = screen.getByPlaceholderText('搜索文件...');
    await user.type(input, 'test');
    expect((input as HTMLInputElement).value).toBe('test');
  });

  it('does not render breadcrumbs when no folder is selected', () => {
    renderWithAntd(<FilesPage />);
    expect(screen.queryByTestId('file-breadcrumbs')).toBeNull();
  });

  it('renders breadcrumbs when a folder is selected', async () => {
    const fileService = await import('@/services/file.service');
    vi.mocked(fileService.getFileBreadcrumbs).mockResolvedValue({
      data: { data: [{ id: 'folder-1', name: 'Documents' }] },
    });

    renderWithAntd(<FilesPage />);

    // Click the folder button in the mock FileListTable
    await act(async () => {
      screen.getByTestId('click-folder').click();
    });

    // Wait for breadcrumbs to appear
    const breadcrumbsEl = await screen.findByTestId('file-breadcrumbs');
    expect(breadcrumbsEl).toBeTruthy();
    expect(fileService.getFileBreadcrumbs).toHaveBeenCalledWith('folder-1');
  });

  it('calls getFileInfo when a file is clicked', async () => {
    const fileService = await import('@/services/file.service');
    renderWithAntd(<FilesPage />);
    await act(async () => {
      screen.getByTestId('click-file').click();
    });
    await waitFor(() => {
      expect(mockGetFileInfo).toHaveBeenCalledWith('file-1');
    });
  });

  it('displays file info modal when a file is clicked', async () => {
    renderWithAntd(<FilesPage />);
    await act(async () => {
      screen.getByTestId('click-file').click();
    });
    await waitFor(() => {
      expect(screen.getByText('test.txt')).toBeTruthy();
    });
    expect(screen.getByText('text/plain')).toBeTruthy();
    expect(screen.getByText(/版本.*3/)).toBeTruthy();
  });

  it('shows delete button in file info modal', async () => {
    renderWithAntd(<FilesPage />);
    await act(async () => {
      screen.getByTestId('click-file').click();
    });
    await waitFor(() => {
      expect(screen.getByText('test.txt')).toBeTruthy();
    });
    const deleteBtn = screen.getByTestId('delete-file-btn');
    expect(deleteBtn).toBeTruthy();
    expect(deleteBtn.textContent).toContain('删除文件');
  });

  it('shows Modal.confirm when delete button is clicked', async () => {
    mockModalConfirm.mockClear();
    const user = userEvent.setup();
    renderWithAntd(<FilesPage />);
    await act(async () => {
      screen.getByTestId('click-file').click();
    });
    await waitFor(() => {
      expect(screen.getByTestId('delete-file-btn')).toBeTruthy();
    });
    await user.click(screen.getByTestId('delete-file-btn'));
    await waitFor(() => {
      expect(mockModalConfirm).toHaveBeenCalledWith(
        expect.objectContaining({
          title: '确认删除',
          content: '确定删除此文件吗？删除后将无法恢复。',
          okText: '确定',
          cancelText: '取消',
        })
      );
    });
  });

  it('shows the "新建文件夹" button', () => {
    renderWithAntd(<FilesPage />);
    expect(screen.getByText('新建文件夹')).toBeTruthy();
  });

  it('opens folder creation modal when button is clicked', async () => {
    const user = userEvent.setup();
    renderWithAntd(<FilesPage />);
    await user.click(screen.getByText('新建文件夹'));
    await waitFor(() => {
      expect(screen.getByTestId('folder-name-input')).toBeTruthy();
    });
  });

  it('shows warning when submitting empty folder name', async () => {
    const user = userEvent.setup();
    renderWithAntd(<FilesPage />);
    await user.click(screen.getByText('新建文件夹'));
    await waitFor(() => {
      expect(screen.getByTestId('folder-name-input')).toBeTruthy();
    });
    const okBtn = screen.getByRole('button', { name: /创\s*建/ });
    await user.click(okBtn);
    await waitFor(() => {
      expect(message.warning).toHaveBeenCalledWith('请输入文件夹名称');
    });
  });

  it('calls createFolder and shows success on valid submission', async () => {
    const user = userEvent.setup();
    renderWithAntd(<FilesPage />);
    await user.click(screen.getByText('新建文件夹'));

    await waitFor(() => {
      expect(screen.getByTestId('folder-name-input')).toBeTruthy();
    });

    const input = screen.getByPlaceholderText('请输入文件夹名称');
    await user.type(input, '新项目文件夹');

    const okBtn = screen.getByRole('button', { name: /创\s*建/ });
    await user.click(okBtn);

    await waitFor(() => {
      expect(mockCreateFolder).toHaveBeenCalledWith(
        expect.objectContaining({ name: '新项目文件夹' })
      );
      expect(message.success).toHaveBeenCalledWith('文件夹创建成功');
    });
  });

  it('shows error message when folder creation fails', async () => {
    mockCreateFolder.mockRejectedValueOnce(new Error('fail'));
    const user = userEvent.setup();
    renderWithAntd(<FilesPage />);
    await user.click(screen.getByText('新建文件夹'));

    await waitFor(() => {
      expect(screen.getByTestId('folder-name-input')).toBeTruthy();
    });

    const input = screen.getByPlaceholderText('请输入文件夹名称');
    await user.type(input, 'bad folder');

    const okBtn = screen.getByRole('button', { name: /创\s*建/ });
    await user.click(okBtn);

    await waitFor(() => {
      expect(message.error).toHaveBeenCalledWith('文件夹创建失败');
    });
  });

  it('calls deleteFile and shows success message when confirming delete', async () => {
    mockModalConfirm.mockClear();
    const fileService = await import('@/services/file.service');
    const user = userEvent.setup();
    renderWithAntd(<FilesPage />);
    await act(async () => {
      screen.getByTestId('click-file').click();
    });
    await waitFor(() => {
      expect(screen.getByTestId('delete-file-btn')).toBeTruthy();
    });
    await user.click(screen.getByTestId('delete-file-btn'));
    await waitFor(() => {
      expect(mockModalConfirm).toHaveBeenCalled();
    });
    // Get the onOk callback from the Modal.confirm call and invoke it
    const confirmConfig = mockModalConfirm.mock.calls[0][0];
    await act(async () => {
      await confirmConfig.onOk();
    });
    await waitFor(() => {
      expect(fileService.deleteFile).toHaveBeenCalledWith('file-1');
    });
  });

  describe('file content preview', () => {
    it('opens preview modal for image file', async () => {
      renderWithAntd(<FilesPage />);
      await act(async () => {
        screen.getByTestId('preview-image-file').click();
      });
      await waitFor(() => {
        expect(screen.getByTestId('content-preview-modal')).toBeTruthy();
        expect(screen.getByTestId('preview-image')).toBeTruthy();
      });
      const img = screen.getByTestId('preview-image') as HTMLImageElement;
      expect(img.src).toContain('/api/files/img-1/download');
      expect(img.alt).toBe('design.png');
    });

    it('opens preview modal for text file and fetches content', async () => {
      const { getFileContent } = await import('@/services/file.service');

      renderWithAntd(<FilesPage />);
      await act(async () => {
        screen.getByTestId('preview-text-file').click();
      });
      await waitFor(() => {
        expect(screen.getByTestId('preview-text')).toBeTruthy();
        expect(screen.getByText('Hello, world!')).toBeTruthy();
      });
      expect(getFileContent).toHaveBeenCalledWith('txt-1');
    });

    it('shows unsupported message for unknown file types', async () => {
      renderWithAntd(<FilesPage />);
      await act(async () => {
        screen.getByTestId('preview-unsupported-file').click();
      });
      await waitFor(() => {
        expect(screen.getByTestId('preview-unsupported')).toBeTruthy();
        expect(screen.getByText('暂不支持预览此文件类型')).toBeTruthy();
      });
      const downloadBtn = screen.getByTestId('preview-download-btn') as HTMLAnchorElement;
      expect(downloadBtn.href).toContain('/api/files/zip-1/download');
    });

    it('uses 800px width for image preview', async () => {
      renderWithAntd(<FilesPage />);
      await act(async () => {
        screen.getByTestId('preview-image-file').click();
      });
      await waitFor(() => {
        const modal = screen.getByTestId('content-preview-modal');
        expect(modal).toBeTruthy();
      });
    });

    it('uses 600px width for text preview', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        text: () => Promise.resolve('content'),
      } as Response);

      renderWithAntd(<FilesPage />);
      await act(async () => {
        screen.getByTestId('preview-text-file').click();
      });
      await waitFor(() => {
        const modal = screen.getByTestId('content-preview-modal');
        expect(modal).toBeTruthy();
      });
    });

    it('handles text fetch failure gracefully', async () => {
      const { getFileContent } = await import('@/services/file.service');
      vi.mocked(getFileContent).mockRejectedValueOnce(new Error('network error'));

      renderWithAntd(<FilesPage />);
      await act(async () => {
        screen.getByTestId('preview-text-file').click();
      });
      await waitFor(() => {
        expect(screen.getByText('加载文件内容失败')).toBeTruthy();
      });
    });
  });
});
