import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfigProvider, message } from 'antd';
import BomVersionPanel from './BomVersionPanel';

const mockVersions = [
  { id: 1, bomId: 10, version: '1', changeSummary: '初始版本', createdBy: '张三', createdAt: '2026-04-01T00:00:00Z' },
  { id: 2, bomId: 10, version: '2', changeSummary: '第二版', createdBy: '李四', createdAt: '2026-04-15T00:00:00Z' },
];

const mockGetBomVersions = vi.fn().mockResolvedValue({ data: mockVersions });
const mockSaveBomVersion = vi.fn().mockResolvedValue({ data: { id: 3, version: '3' } });
const mockRollbackBomVersion = vi.fn().mockResolvedValue({ data: null });

vi.mock('@/services/bom.service', () => ({
  getBomVersions: (...args: any[]) => mockGetBomVersions(...args),
  saveBomVersion: (...args: any[]) => mockSaveBomVersion(...args),
  rollbackBomVersion: (...args: any[]) => mockRollbackBomVersion(...args),
  getBomsByProject: vi.fn().mockResolvedValue({ data: [] }),
  getBomStructure: vi.fn().mockResolvedValue({ data: [] }),
  compareBomVersions: vi.fn(),
}));

vi.mock('./BomCompareModal', () => ({
  default: (props: any) => (
    <div data-testid="bom-compare-modal">
      <span data-testid="compare-v1">{props.v1}</span>
      <span data-testid="compare-v2">{props.v2}</span>
      {props.open && <span data-testid="compare-open">open</span>}
      <button data-testid="close-compare" onClick={props.onClose}>Close</button>
    </div>
  ),
}));

const renderWithAntd = (ui: React.ReactElement) =>
  render(<ConfigProvider>{ui}</ConfigProvider>);

describe('BomVersionPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Destroy antd message singletons to prevent cross-test DOM contamination
    message.destroy();
  });

  it('renders drawer with title when open', () => {
    renderWithAntd(<BomVersionPanel bomId={10} open={true} onClose={vi.fn()} />);
    expect(screen.getByText('版本管理')).toBeInTheDocument();
  });

  it('does not render content when closed', () => {
    renderWithAntd(<BomVersionPanel bomId={10} open={false} onClose={vi.fn()} />);
    expect(screen.queryByText('版本管理')).not.toBeInTheDocument();
  });

  it('fetches versions when opened', async () => {
    renderWithAntd(<BomVersionPanel bomId={10} open={true} onClose={vi.fn()} />);
    await waitFor(() => {
      expect(mockGetBomVersions).toHaveBeenCalledWith(10);
    });
  });

  it('does not fetch versions when bomId is null', () => {
    renderWithAntd(<BomVersionPanel bomId={null} open={true} onClose={vi.fn()} />);
    expect(mockGetBomVersions).not.toHaveBeenCalled();
  });

  it('displays version list in table', async () => {
    renderWithAntd(<BomVersionPanel bomId={10} open={true} onClose={vi.fn()} />);
    await waitFor(() => {
      expect(screen.getByText('初始版本')).toBeInTheDocument();
      expect(screen.getByText('第二版')).toBeInTheDocument();
    });
  });

  it('displays version numbers', async () => {
    renderWithAntd(<BomVersionPanel bomId={10} open={true} onClose={vi.fn()} />);
    await waitFor(() => {
      expect(screen.getByText('v1')).toBeInTheDocument();
      expect(screen.getByText('v2')).toBeInTheDocument();
    });
  });

  it('displays creator names', async () => {
    renderWithAntd(<BomVersionPanel bomId={10} open={true} onClose={vi.fn()} />);
    await waitFor(() => {
      expect(screen.getByText('张三')).toBeInTheDocument();
      expect(screen.getByText('李四')).toBeInTheDocument();
    });
  });

  it('renders create new version button', () => {
    renderWithAntd(<BomVersionPanel bomId={10} open={true} onClose={vi.fn()} />);
    expect(screen.getByText('创建新版本')).toBeInTheDocument();
  });

  it('creates a new version when create button is clicked', async () => {
    const user = userEvent.setup();
    renderWithAntd(<BomVersionPanel bomId={10} open={true} onClose={vi.fn()} />);
    await user.click(screen.getByText('创建新版本'));
    await waitFor(() => {
      expect(mockSaveBomVersion).toHaveBeenCalledWith(10, undefined);
    });
  });

  it('refetches versions after creating a new version', async () => {
    const user = userEvent.setup();
    renderWithAntd(<BomVersionPanel bomId={10} open={true} onClose={vi.fn()} />);
    await waitFor(() => {
      expect(mockGetBomVersions).toHaveBeenCalledTimes(1);
    });
    await user.click(screen.getByText('创建新版本'));
    await waitFor(() => {
      expect(mockGetBomVersions).toHaveBeenCalledTimes(2);
    });
  });

  it('renders version compare button', () => {
    renderWithAntd(<BomVersionPanel bomId={10} open={true} onClose={vi.fn()} />);
    expect(screen.getByText('版本对比')).toBeInTheDocument();
  });

  it('shows compare modal when compare button is clicked', async () => {
    const user = userEvent.setup();
    renderWithAntd(<BomVersionPanel bomId={10} open={true} onClose={vi.fn()} />);
    await user.click(screen.getByText('版本对比'));
    await waitFor(() => {
      expect(screen.getByTestId('bom-compare-modal')).toBeInTheDocument();
    });
  });

  it('renders rollback button for each version', async () => {
    renderWithAntd(<BomVersionPanel bomId={10} open={true} onClose={vi.fn()} />);
    await waitFor(() => {
      expect(screen.getByText('初始版本')).toBeInTheDocument();
    });
    const rollbackBtns = screen.getAllByText('回滚');
    expect(rollbackBtns.length).toBe(2);
  });

  it('shows error message when fetching versions fails', async () => {
    mockGetBomVersions.mockRejectedValueOnce(new Error('fail'));
    renderWithAntd(<BomVersionPanel bomId={10} open={true} onClose={vi.fn()} />);
    await waitFor(() => {
      expect(screen.getByText('获取版本列表失败')).toBeInTheDocument();
    });
  });

  it('shows error message when creating version fails', async () => {
    mockSaveBomVersion.mockRejectedValueOnce(new Error('fail'));
    const user = userEvent.setup();
    renderWithAntd(<BomVersionPanel bomId={10} open={true} onClose={vi.fn()} />);
    await user.click(screen.getByText('创建新版本'));
    await waitFor(() => {
      expect(screen.getByText('创建版本失败')).toBeInTheDocument();
    });
  });

  it('allows entering a changeSummary for new version', async () => {
    const user = userEvent.setup();
    renderWithAntd(<BomVersionPanel bomId={10} open={true} onClose={vi.fn()} />);
    const input = screen.getByPlaceholderText('变更说明（可选）');
    await user.type(input, '新增了螺丝物料');
    await user.click(screen.getByText('创建新版本'));
    await waitFor(() => {
      expect(mockSaveBomVersion).toHaveBeenCalledWith(10, '新增了螺丝物料');
    });
  });

  it('calls onClose when drawer close is triggered', async () => {
    const onClose = vi.fn();
    renderWithAntd(<BomVersionPanel bomId={10} open={true} onClose={onClose} />);
    const closeBtn = document.querySelector('.ant-drawer-close');
    if (closeBtn) {
      const user = userEvent.setup();
      await user.click(closeBtn);
      await waitFor(() => {
        expect(onClose).toHaveBeenCalled();
      });
    }
  });
});
