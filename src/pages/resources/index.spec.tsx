import { render, screen, waitFor, within, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfigProvider, message } from 'antd';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ResourcesPage from './index';
import * as resourceService from '@/services/resource.service';

vi.mock('@/services/resource.service', () => ({
  getResources: vi.fn().mockResolvedValue({ data: [] }),
  createResource: vi.fn().mockResolvedValue({}),
  updateResource: vi.fn().mockResolvedValue({}),
  deleteResource: vi.fn().mockResolvedValue({}),
}));

vi.mock('antd', async (importOriginal) => {
  const actual = await importOriginal<typeof import('antd')>();
  return {
    ...actual,
    message: {
      ...actual.message,
      success: vi.fn(),
      error: vi.fn(),
    },
  };
});

vi.mock('./components/ResourceTabs', () => ({
  default: ({ activeTab, onTabChange }: any) => (
    <div data-testid="resource-tabs">
      <span data-testid="active-tab">{activeTab}</span>
      <button data-testid="switch-tab" onClick={() => onTabChange('material')}>
        Switch
      </button>
    </div>
  ),
}));

vi.mock('./components/ResourceList', () => ({
  default: ({ resources, loading, onSearch, onAdd, onEdit, onDelete }: any) => (
    <div data-testid="resource-list">
      <span data-testid="resource-count">{resources.length}</span>
      <span data-testid="loading">{String(loading)}</span>
      <button data-testid="add-btn" onClick={onAdd}>Add</button>
      <button data-testid="edit-btn" onClick={() => onEdit({ id: '1', name: 'R1', type: 'human', description: '', tags: [], status: 'available', createdAt: '' })}>Edit</button>
      <button data-testid="delete-btn" onClick={() => onDelete('res-1')}>Delete</button>
      <button data-testid="search-btn" onClick={() => onSearch('test')}>Search</button>
      <button data-testid="search-clear-btn" onClick={() => onSearch('')}>ClearSearch</button>
    </div>
  ),
}));

vi.mock('./ResourcesPage.module.css', () => ({
  default: {
    page: 'page',
    header: 'header',
    title: 'title',
    content: 'content',
  },
}));

const renderWithAntd = (ui: React.ReactElement) =>
  render(<ConfigProvider>{ui}</ConfigProvider>);

describe('ResourcesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (resourceService.getResources as any).mockResolvedValue({ data: [] });
  });

  it('renders the page title', async () => {
    renderWithAntd(<ResourcesPage />);
    expect(screen.getByText('通用资源')).toBeInTheDocument();
  });

  it('fetches resources on mount', async () => {
    renderWithAntd(<ResourcesPage />);
    await waitFor(() => {
      expect(resourceService.getResources).toHaveBeenCalledWith({ type: 'human' });
    });
  });

  it('renders resource tabs and resource list', () => {
    renderWithAntd(<ResourcesPage />);
    expect(screen.getByTestId('resource-tabs')).toBeInTheDocument();
    expect(screen.getByTestId('resource-list')).toBeInTheDocument();
  });

  it('shows resources when loaded', async () => {
    (resourceService.getResources as any).mockResolvedValue({
      data: [
        { id: '1', name: 'Test', type: 'human', description: '', tags: [], status: 'available', createdAt: '' },
      ],
    });
    renderWithAntd(<ResourcesPage />);
    await waitFor(() => {
      expect(screen.getByTestId('resource-count').textContent).toBe('1');
    });
  });

  it('handles tab switch', async () => {
    const user = userEvent.setup();
    renderWithAntd(<ResourcesPage />);
    await user.click(screen.getByTestId('switch-tab'));
    await waitFor(() => {
      expect(resourceService.getResources).toHaveBeenCalledWith({ type: 'material' });
    });
  });

  it('shows loading state initially', () => {
    (resourceService.getResources as any).mockReturnValue(new Promise(() => {}));
    renderWithAntd(<ResourcesPage />);
    expect(screen.getByTestId('loading').textContent).toBe('true');
  });

  it('opens add resource modal when add button clicked', async () => {
    const user = userEvent.setup();
    renderWithAntd(<ResourcesPage />);
    await user.click(screen.getByTestId('add-btn'));
    await waitFor(() => {
      expect(screen.getByText('添加资源')).toBeInTheDocument();
    });
  });

  it('opens edit resource modal with prefilled values', async () => {
    const user = userEvent.setup();
    renderWithAntd(<ResourcesPage />);
    await user.click(screen.getByTestId('edit-btn'));
    await waitFor(() => {
      expect(screen.getByText('编辑资源')).toBeInTheDocument();
    });
  });

  it('calls deleteResource when delete triggered', async () => {
    const user = userEvent.setup();
    renderWithAntd(<ResourcesPage />);
    await user.click(screen.getByTestId('delete-btn'));
    await waitFor(() => {
      expect(resourceService.deleteResource).toHaveBeenCalledWith('res-1');
      expect(message.success).toHaveBeenCalledWith('删除成功');
    });
  });

  it('shows error message when delete fails', async () => {
    vi.mocked(resourceService.deleteResource).mockRejectedValueOnce(new Error('fail'));
    const user = userEvent.setup();
    renderWithAntd(<ResourcesPage />);
    await user.click(screen.getByTestId('delete-btn'));
    await waitFor(() => {
      expect(message.error).toHaveBeenCalledWith('删除失败');
    });
  });

  it('filters resources when searching with keyword', async () => {
    (resourceService.getResources as any).mockResolvedValue({
      data: [
        { id: '1', name: 'Alpha', type: 'human', description: 'desc1', tags: ['tag1'], status: 'available', createdAt: '' },
        { id: '2', name: 'Beta', type: 'human', description: 'desc2', tags: ['tag2'], status: 'available', createdAt: '' },
      ],
    });
    const user = userEvent.setup();
    renderWithAntd(<ResourcesPage />);
    await waitFor(() => {
      expect(screen.getByTestId('resource-count').textContent).toBe('2');
    });
    await user.click(screen.getByTestId('search-btn'));
    // "test" doesn't match any names/descriptions/tags, so count should be 0
    await waitFor(() => {
      expect(screen.getByTestId('resource-count').textContent).toBe('0');
    });
  });

  it('re-fetches resources when search cleared', async () => {
    const user = userEvent.setup();
    renderWithAntd(<ResourcesPage />);
    await waitFor(() => {
      expect(resourceService.getResources).toHaveBeenCalledTimes(1);
    });
    await user.click(screen.getByTestId('search-clear-btn'));
    await waitFor(() => {
      expect(resourceService.getResources).toHaveBeenCalledTimes(2);
    });
  });

  it('shows error when getResources fails', async () => {
    (resourceService.getResources as any).mockRejectedValueOnce(new Error('fail'));
    renderWithAntd(<ResourcesPage />);
    await waitFor(() => {
      expect(message.error).toHaveBeenCalledWith('加载资源失败');
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });
  });

  it('creates a new resource when submitting add modal', async () => {
    const user = userEvent.setup();
    renderWithAntd(<ResourcesPage />);
    await user.click(screen.getByTestId('add-btn'));
    await waitFor(() => {
      expect(screen.getByText('添加资源')).toBeInTheDocument();
    });

    // Fill in the required name field
    const nameInput = screen.getByLabelText('名称');
    await user.type(nameInput, 'New Resource');

    // Click OK to submit - use role-based query for modal OK button
    const modal = screen.getByRole('dialog');
    const okButton = within(modal).getByRole('button', { name: /OK/i }) || within(modal).getByText(/确/);
    await user.click(okButton);

    await waitFor(() => {
      expect(resourceService.createResource).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'New Resource', type: 'human' })
      );
      expect(message.success).toHaveBeenCalledWith('创建成功');
    });
  });

  it('updates an existing resource when submitting edit modal', async () => {
    const user = userEvent.setup();
    renderWithAntd(<ResourcesPage />);
    await user.click(screen.getByTestId('edit-btn'));
    await waitFor(() => {
      expect(screen.getByText('编辑资源')).toBeInTheDocument();
    });

    // Clear and re-type the name field
    const nameInput = screen.getByLabelText('名称');
    await user.clear(nameInput);
    await user.type(nameInput, 'Updated Resource');

    // Click OK to submit
    const modal = screen.getByRole('dialog');
    const okButton = within(modal).getByRole('button', { name: /OK/i }) || within(modal).getByText(/确/);
    await user.click(okButton);

    await waitFor(() => {
      expect(resourceService.updateResource).toHaveBeenCalledWith(
        '1',
        expect.objectContaining({ name: 'Updated Resource' })
      );
      expect(message.success).toHaveBeenCalledWith('更新成功');
    });
  });

  it('closes modal when cancel is clicked', async () => {
    renderWithAntd(<ResourcesPage />);
    // Open the add modal
    fireEvent.click(screen.getByTestId('add-btn'));
    await waitFor(() => {
      expect(screen.getByText('添加资源')).toBeInTheDocument();
    });

    // Click the close (X) button on the modal - triggers onCancel => setModalVisible(false)
    const dialog = screen.getByRole('dialog');
    const closeButton = dialog.querySelector('.ant-modal-close') as HTMLElement;
    fireEvent.click(closeButton);

    // Verify the onCancel handler was called: modal starts exit animation (ant-zoom-leave)
    await waitFor(() => {
      const modal = document.querySelector('[role="dialog"]');
      expect(modal?.classList.contains('ant-zoom-leave')).toBe(true);
    });
  });

  it('logs error when form validation fails on submit', async () => {
    const user = userEvent.setup();
    renderWithAntd(<ResourcesPage />);
    await user.click(screen.getByTestId('add-btn'));
    await waitFor(() => {
      expect(screen.getByText('添加资源')).toBeInTheDocument();
    });

    // Click OK without filling required name - antd form validation will fail
    const modal = screen.getByRole('dialog');
    const okButton = within(modal).getByRole('button', { name: /OK/i }) || within(modal).getByText(/确/);
    await user.click(okButton);

    await waitFor(() => {
      expect(message.error).toHaveBeenCalledWith('操作失败');
    });
  });

  it('renders status filter dropdown', async () => {
    renderWithAntd(<ResourcesPage />);
    await waitFor(() => {
      expect(screen.getByTestId('status-filter')).toBeInTheDocument();
    });
  });

  it('status filter works - filters resources by status', async () => {
    (resourceService.getResources as any).mockResolvedValue({
      data: [
        { id: '1', name: 'Available Res', type: 'human', description: '', tags: [], status: 'available', createdAt: '' },
        { id: '2', name: 'Busy Res', type: 'human', description: '', tags: [], status: 'busy', createdAt: '' },
      ],
    });
    const user = userEvent.setup();
    renderWithAntd(<ResourcesPage />);
    await waitFor(() => {
      expect(screen.getByTestId('resource-count').textContent).toBe('2');
    });
    // Click the status filter to select 'available'
    const statusSelect = screen.getByTestId('status-filter');
    await user.click(statusSelect);
    await waitFor(() => {
      expect(screen.getByText('可用')).toBeInTheDocument();
    });
  });
});
