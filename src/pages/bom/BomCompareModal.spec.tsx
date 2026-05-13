import { render, screen, waitFor } from '@testing-library/react';
import { ConfigProvider } from 'antd';
import BomCompareModal from './BomCompareModal';

const mockCompareResult = {
  data: {
    added: [
      { id: 'a1', name: '新螺丝', materialCode: 'PN-NEW', quantity: 10, projectId: 'proj-1', version: 2 },
    ],
    removed: [
      { id: 'r1', name: '旧垫片', materialCode: 'PN-OLD', quantity: 5, projectId: 'proj-1', version: 1 },
    ],
    modified: [
      {
        item: { id: 'm1', name: '主板', materialCode: 'PN-MB', quantity: 3, projectId: 'proj-1', version: 2 },
        changes: [
          { field: '数量', oldValue: '2', newValue: '3' },
          { field: '单价', oldValue: '100', newValue: '120' },
        ],
      },
    ],
  },
};

const mockCompareBomVersions = vi.fn().mockResolvedValue(mockCompareResult);

vi.mock('@/services/bom.service', () => ({
  compareBomVersions: (...args: any[]) => mockCompareBomVersions(...args),
  getBomItems: vi.fn().mockResolvedValue({ data: [] }),
  getBomTree: vi.fn().mockResolvedValue({ data: [] }),
  getBomVersions: vi.fn().mockResolvedValue({ data: [] }),
  createBomVersion: vi.fn(),
  rollbackBomVersion: vi.fn(),
}));

const renderWithAntd = (ui: React.ReactElement) =>
  render(<ConfigProvider>{ui}</ConfigProvider>);

describe('BomCompareModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders modal with title when open', () => {
    renderWithAntd(<BomCompareModal bomId="proj-1" open={true} onClose={vi.fn()} v1={1} v2={2} />);
    expect(screen.getByText('版本对比 v1 → v2')).toBeInTheDocument();
  });

  it('does not render content when closed', () => {
    renderWithAntd(<BomCompareModal bomId="proj-1" open={false} onClose={vi.fn()} v1={1} v2={2} />);
    expect(screen.queryByText('版本对比')).not.toBeInTheDocument();
  });

  it('calls compareBomVersions with correct params on open', async () => {
    renderWithAntd(<BomCompareModal bomId="proj-1" open={true} onClose={vi.fn()} v1={1} v2={2} />);
    await waitFor(() => {
      expect(mockCompareBomVersions).toHaveBeenCalledWith('proj-1', 1, 2);
    });
  });

  it('displays added items section', async () => {
    renderWithAntd(<BomCompareModal bomId="proj-1" open={true} onClose={vi.fn()} v1={1} v2={2} />);
    await waitFor(() => {
      expect(screen.getByText('新增物料')).toBeInTheDocument();
      expect(screen.getByText('新螺丝')).toBeInTheDocument();
    });
  });

  it('displays removed items section', async () => {
    renderWithAntd(<BomCompareModal bomId="proj-1" open={true} onClose={vi.fn()} v1={1} v2={2} />);
    await waitFor(() => {
      expect(screen.getByText('删除物料')).toBeInTheDocument();
      expect(screen.getByText('旧垫片')).toBeInTheDocument();
    });
  });

  it('displays modified items section', async () => {
    renderWithAntd(<BomCompareModal bomId="proj-1" open={true} onClose={vi.fn()} v1={1} v2={2} />);
    await waitFor(() => {
      expect(screen.getByText('修改物料')).toBeInTheDocument();
      expect(screen.getByText('主板')).toBeInTheDocument();
    });
  });

  it('displays field-level diff for modified items', async () => {
    renderWithAntd(<BomCompareModal bomId="proj-1" open={true} onClose={vi.fn()} v1={1} v2={2} />);
    await waitFor(() => {
      // 数量 appears both as table header and as change field
      expect(screen.getAllByText('数量').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('单价')).toBeInTheDocument();
      expect(screen.getByText('100')).toBeInTheDocument();
      expect(screen.getByText('120')).toBeInTheDocument();
    });
  });

  it('displays part numbers for items', async () => {
    renderWithAntd(<BomCompareModal bomId="proj-1" open={true} onClose={vi.fn()} v1={1} v2={2} />);
    await waitFor(() => {
      expect(screen.getByText('PN-NEW')).toBeInTheDocument();
      expect(screen.getByText('PN-OLD')).toBeInTheDocument();
      expect(screen.getByText('PN-MB')).toBeInTheDocument();
    });
  });

  it('shows error message when compare fails', async () => {
    mockCompareBomVersions.mockRejectedValueOnce(new Error('fail'));
    renderWithAntd(<BomCompareModal bomId="proj-1" open={true} onClose={vi.fn()} v1={1} v2={2} />);
    await waitFor(() => {
      expect(screen.getByText('版本对比失败')).toBeInTheDocument();
    });
  });

  it('shows version numbers in header', () => {
    renderWithAntd(<BomCompareModal bomId="proj-1" open={true} onClose={vi.fn()} v1={1} v2={2} />);
    expect(screen.getByText('版本对比 v1 → v2')).toBeInTheDocument();
  });

  it('shows empty state when no differences', async () => {
    mockCompareBomVersions.mockResolvedValueOnce({ data: { added: [], removed: [], modified: [] } });
    renderWithAntd(<BomCompareModal bomId="proj-1" open={true} onClose={vi.fn()} v1={1} v2={2} />);
    await waitFor(() => {
      expect(screen.getByText('两个版本无差异')).toBeInTheDocument();
    });
  });
});
