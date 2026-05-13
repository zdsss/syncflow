import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfigProvider, message } from 'antd';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ProcessPage from './index';

const mockRoutes = [
  { id: 'r1', name: 'Route A', projectId: 'proj-1', status: 'active', version: 1, steps: [{ id: 's1', name: 'Step 1', sortOrder: 1, routeId: 'r1' }] },
  { id: 'r2', name: 'Route B', projectId: 'proj-1', status: 'active', version: 1, steps: [] },
];

const mockGetProcessRoutes = vi.fn().mockResolvedValue({ data: mockRoutes });
const mockCreateProcessRoute = vi.fn().mockResolvedValue({ data: { id: 'r3' } });
const mockDeleteProcessRoute = vi.fn().mockResolvedValue({});
const mockAddProcessStep = vi.fn().mockResolvedValue({});

vi.mock('@/services/process.service', () => ({
  getProcessRoutes: (...args: any[]) => mockGetProcessRoutes(...args),
  createProcessRoute: (...args: any[]) => mockCreateProcessRoute(...args),
  deleteProcessRoute: (...args: any[]) => mockDeleteProcessRoute(...args),
  addProcessStep: (...args: any[]) => mockAddProcessStep(...args),
  reorderOperations: vi.fn().mockResolvedValue({}),
  submitRouteForApproval: vi.fn().mockResolvedValue({}),
  withdrawRouteApproval: vi.fn().mockResolvedValue({}),
}));

vi.mock('@/services/file.service', () => ({
  getFiles: vi.fn().mockResolvedValue({ data: [] }),
}));

vi.mock('@/hooks/useSocket', () => ({
  useSocket: () => ({ connected: true, subscribe: () => () => {} }),
}));

vi.mock('@/stores/useProjectStore', () => ({
  useProjectStore: (selector: any) => selector({ selectedProject: { id: 'proj-1' } }),
}));

vi.mock('./components/RouteList', () => ({
  default: (props: any) => (
    <div data-testid="route-list">
      <span data-testid="route-count">{props.routes?.length ?? 0}</span>
      <span data-testid="route-loading">{String(props.loading)}</span>
      <button data-testid="select-route" onClick={() => props.onSelect?.('r1')}>Select</button>
      <button data-testid="delete-route" onClick={() => props.onDelete?.('r1')}>Delete</button>
    </div>
  ),
}));

vi.mock('./components/StepDetail', () => ({
  default: (props: any) => (
    <div data-testid="step-detail">
      <span data-testid="route-id">{props.route?.id ?? 'none'}</span>
      <button data-testid="add-step" onClick={() => props.onAddStep?.('r1')}>AddStep</button>
    </div>
  ),
}));

vi.mock('./components/CreateRouteModal', () => ({
  default: (props: any) => props.open ? (
    <div data-testid="create-modal">
      <button data-testid="modal-submit" onClick={() => props.onSubmit?.({ name: '新工艺路线', bomId: 0, projectId: 0, productCode: '', productName: '' })}>Submit</button>
    </div>
  ) : null,
}));

const renderWithAntd = (ui: React.ReactElement) =>
  render(<ConfigProvider>{ui}</ConfigProvider>);

describe('ProcessPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetProcessRoutes.mockResolvedValue({ data: mockRoutes });
  });

  it('renders the page title', async () => {
    renderWithAntd(<ProcessPage />);
    expect(screen.getByText('工艺管理')).toBeTruthy();
  });

  it('fetches process routes on mount', async () => {
    renderWithAntd(<ProcessPage />);
    await waitFor(() => {
      expect(mockGetProcessRoutes).toHaveBeenCalledWith({ projectId: 'proj-1' });
    });
  });

  it('renders the add route button', () => {
    renderWithAntd(<ProcessPage />);
    expect(screen.getByText('新增工艺路线')).toBeTruthy();
  });

  it('renders RouteList child component', async () => {
    renderWithAntd(<ProcessPage />);
    await waitFor(() => {
      expect(screen.getByTestId('route-list')).toBeTruthy();
    });
  });

  it('renders StepDetail child component', async () => {
    renderWithAntd(<ProcessPage />);
    await waitFor(() => {
      expect(screen.getByTestId('step-detail')).toBeTruthy();
    });
  });

  it('passes fetched routes to RouteList', async () => {
    renderWithAntd(<ProcessPage />);
    await waitFor(() => {
      expect(screen.getByTestId('route-count').textContent).toBe('2');
    });
  });

  it('shows selected route in StepDetail', async () => {
    const user = userEvent.setup();
    renderWithAntd(<ProcessPage />);
    await waitFor(() => {
      expect(screen.getByTestId('route-count').textContent).toBe('2');
    });

    await user.click(screen.getByTestId('select-route'));
    expect(screen.getByTestId('route-id').textContent).toBe('r1');
  });

  it('creates a process route when modal is submitted', async () => {
    const user = userEvent.setup();
    renderWithAntd(<ProcessPage />);
    await waitFor(() => {
      expect(mockGetProcessRoutes).toHaveBeenCalled();
    });

    await user.click(screen.getByText('新增工艺路线'));
    await waitFor(() => {
      expect(screen.getByTestId('create-modal')).toBeInTheDocument();
    });
    await user.click(screen.getByTestId('modal-submit'));
    await waitFor(() => {
      expect(mockCreateProcessRoute).toHaveBeenCalledWith({
        name: '新工艺路线',
        bomId: 0,
        projectId: 0,
        productCode: '',
        productName: '',
      });
    });
  });

  it('deletes a process route when delete is triggered', async () => {
    const user = userEvent.setup();
    renderWithAntd(<ProcessPage />);
    await waitFor(() => {
      expect(screen.getByTestId('route-count').textContent).toBe('2');
    });

    await user.click(screen.getByTestId('delete-route'));
    await waitFor(() => {
      expect(mockDeleteProcessRoute).toHaveBeenCalledWith('r1');
    });
  });

  it('clears selectedId when selected route is deleted', async () => {
    const user = userEvent.setup();
    renderWithAntd(<ProcessPage />);
    await waitFor(() => {
      expect(screen.getByTestId('route-count').textContent).toBe('2');
    });

    await user.click(screen.getByTestId('select-route'));
    expect(screen.getByTestId('route-id').textContent).toBe('r1');

    await user.click(screen.getByTestId('delete-route'));
    await waitFor(() => {
      expect(screen.getByTestId('route-id').textContent).toBe('none');
    });
  });

  it('adds a step to a route', async () => {
    const user = userEvent.setup();
    renderWithAntd(<ProcessPage />);
    await waitFor(() => {
      expect(screen.getByTestId('route-count').textContent).toBe('2');
    });

    await user.click(screen.getByTestId('add-step'));
    await waitFor(() => {
      expect(mockAddProcessStep).toHaveBeenCalledWith('r1', { name: '新步骤', sortOrder: expect.any(Number) });
    });
  });

  it('refetches routes after creating a route', async () => {
    const user = userEvent.setup();
    renderWithAntd(<ProcessPage />);
    await waitFor(() => {
      expect(mockGetProcessRoutes).toHaveBeenCalledTimes(1);
    });

    await user.click(screen.getByText('新增工艺路线'));
    await waitFor(() => {
      expect(screen.getByTestId('create-modal')).toBeInTheDocument();
    });
    await user.click(screen.getByTestId('modal-submit'));
    await waitFor(() => {
      expect(mockGetProcessRoutes).toHaveBeenCalledTimes(2);
    });
  });

  it('refetches routes after deleting a route', async () => {
    const user = userEvent.setup();
    renderWithAntd(<ProcessPage />);
    await waitFor(() => {
      expect(mockGetProcessRoutes).toHaveBeenCalledTimes(1);
    });

    await user.click(screen.getByTestId('delete-route'));
    await waitFor(() => {
      expect(mockGetProcessRoutes).toHaveBeenCalledTimes(2);
    });
  });

  it('shows error message when getProcessRoutes fails', async () => {
    mockGetProcessRoutes.mockRejectedValueOnce(new Error('network error'));
    renderWithAntd(<ProcessPage />);
    await waitFor(() => {
      expect(screen.getByText('加载工艺路线失败')).toBeInTheDocument();
    });
  });

  it('shows error message when createProcessRoute fails', async () => {
    mockCreateProcessRoute.mockRejectedValueOnce(new Error('fail'));
    const user = userEvent.setup();
    renderWithAntd(<ProcessPage />);
    await waitFor(() => {
      expect(mockGetProcessRoutes).toHaveBeenCalled();
    });

    await user.click(screen.getByText('新增工艺路线'));
    await waitFor(() => {
      expect(screen.getByTestId('create-modal')).toBeInTheDocument();
    });
    await user.click(screen.getByTestId('modal-submit'));
    await waitFor(() => {
      expect(screen.getByText('创建工艺路线失败')).toBeInTheDocument();
    });
  });

  it('renders the process file section', async () => {
    renderWithAntd(<ProcessPage />);
    expect(screen.getByText('工艺文件')).toBeInTheDocument();
    expect(screen.getByText('上传文件')).toBeInTheDocument();
  });

  it('shows message when upload button is clicked', async () => {
    const messageSpy = vi.spyOn(message, 'info');
    const user = userEvent.setup();
    renderWithAntd(<ProcessPage />);
    const uploadBtn = screen.getByText('上传文件');
    await user.click(uploadBtn);
    expect(messageSpy).toHaveBeenCalledWith('功能开发中');
    messageSpy.mockRestore();
  });
});
