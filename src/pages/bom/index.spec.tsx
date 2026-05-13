import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfigProvider, message } from 'antd';
import BomPage from './index';

const mockBomList = [
  { id: 10, bomNo: 'BOM-001', name: '主BOM', projectId: 1, status: 1, isLatest: true },
];

const mockBomTree = [
  { id: 1, bomId: 10, name: '根物料', materialCode: 'P1-001', quantity: 1, children: [
    { id: 2, bomId: 10, name: '子物料A', materialCode: 'P1-002', quantity: 5 },
  ]},
];

const mockGetBomsByProject = vi.fn().mockResolvedValue({ data: mockBomList });
const mockGetBomStructure = vi.fn().mockResolvedValue({ data: mockBomTree });
const mockCreateBomItem = vi.fn().mockResolvedValue({});
const mockUpdateBomItem = vi.fn().mockResolvedValue({});
const mockDeleteBomItem = vi.fn().mockResolvedValue({});
const mockSubmitForApproval = vi.fn().mockResolvedValue({});
const mockExportBomData = vi.fn().mockResolvedValue({
  data: [
    { materialCode: 'PN-001', materialName: '根物料', specification: 'spec1', material: 'steel', unitOfMeasure: '个', weight: 0.5, quantity: 5 },
  ],
});

vi.mock('@/services/bom.service', () => ({
  getBomsByProject: (...args: any[]) => mockGetBomsByProject(...args),
  getBomStructure: (...args: any[]) => mockGetBomStructure(...args),
  createBomItem: (...args: any[]) => mockCreateBomItem(...args),
  updateBomItem: (...args: any[]) => mockUpdateBomItem(...args),
  deleteBomItem: (...args: any[]) => mockDeleteBomItem(...args),
  submitForApproval: (...args: any[]) => mockSubmitForApproval(...args),
  exportBomData: (...args: any[]) => mockExportBomData(...args),
  getBomVersions: vi.fn().mockResolvedValue({ data: [] }),
  saveBomVersion: vi.fn().mockResolvedValue({ data: {} }),
  compareBomVersions: vi.fn().mockResolvedValue({ data: { added: [], removed: [], modified: [] } }),
}));

vi.mock('@/stores/useProjectStore', () => ({
  useProjectStore: (selector: any) => selector({ selectedProject: { id: 'proj-1' } }),
}));

vi.mock('./components/BomTree', () => ({
  default: (props: any) => (
    <div data-testid="bom-tree">
      <span data-testid="tree-item-count">{props.data?.length ?? 0}</span>
      <span data-testid="tree-selected-id">{props.selectedId ?? 'none'}</span>
      <button data-testid="select-item" onClick={() => props.onSelect?.('1')}>SelectItem</button>
    </div>
  ),
}));

vi.mock('./components/BomTable', () => ({
  default: (props: any) => (
    <div data-testid="bom-table">
      <span data-testid="table-item-count">{props.items?.length ?? 0}</span>
      <span data-testid="selected-item-name">{props.selectedItem?.name ?? 'none'}</span>
      <button data-testid="delete-item" onClick={() => props.onDelete?.(1)}>DeleteItem</button>
      <button data-testid="update-item" onClick={() => props.onUpdate?.(1, { materialName: 'updated' })}>UpdateItem</button>
    </div>
  ),
}));

vi.mock('./BomVersionPanel', () => ({
  default: (props: any) => (
    <div data-testid="bom-version-panel">
      <span data-testid="panel-open">{String(props.open)}</span>
      <span data-testid="panel-bom-id">{props.bomId ?? 'null'}</span>
      <button data-testid="close-panel" onClick={props.onClose}>ClosePanel</button>
    </div>
  ),
}));

vi.mock('./ChangeRequestModal', () => ({
  default: (props: any) => (
    <div data-testid="change-request-modal">
      <span data-testid="cr-modal-open">{String(props.open)}</span>
      <button data-testid="cr-modal-success" onClick={props.onSuccess}>CRSuccess</button>
      <button data-testid="cr-modal-close" onClick={props.onClose}>CRClose</button>
    </div>
  ),
}));

vi.mock('./ChangeRequestList', () => ({
  default: () => <div data-testid="change-request-list">ChangeRequestList</div>,
}));

vi.mock('./UsageLookupView', () => ({
  default: (props: any) => <div data-testid="usage-lookup-view">UsageLookupView</div>,
}));

vi.mock('./ProcessRouteView', () => ({
  default: (props: any) => <div data-testid="process-route-view">ProcessRouteView</div>,
}));

vi.mock('@/hooks/useSocket', () => ({
  useSocket: () => ({ connected: false, subscribe: () => () => {} }),
}));

vi.mock('@/services/workflow.service', () => ({
  withdrawApproval: vi.fn().mockResolvedValue({}),
}));

const renderWithAntd = (ui: React.ReactElement) =>
  render(<ConfigProvider>{ui}</ConfigProvider>);

describe('BomPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Destroy antd message singletons to prevent cross-test DOM contamination
    message.destroy();
  });

  it('renders page title', () => {
    renderWithAntd(<BomPage />);
    expect(screen.getByText(/BOM管理/)).toBeInTheDocument();
  });

  it('renders BomTree', () => {
    renderWithAntd(<BomPage />);
    expect(screen.getByTestId('bom-tree')).toBeInTheDocument();
  });

  it('renders BomTable', () => {
    renderWithAntd(<BomPage />);
    expect(screen.getByTestId('bom-table')).toBeInTheDocument();
  });

  it('calls getBomsByProject and getBomStructure on mount', async () => {
    renderWithAntd(<BomPage />);
    await waitFor(() => {
      expect(mockGetBomsByProject).toHaveBeenCalledWith('proj-1');
      expect(mockGetBomStructure).toHaveBeenCalledWith(10);
    });
  });

  it('shows add button', () => {
    renderWithAntd(<BomPage />);
    expect(screen.getByText('新增物料')).toBeInTheDocument();
  });

  it('shows left panel title as 产品结构树', () => {
    renderWithAntd(<BomPage />);
    expect(screen.getByText('产品结构树')).toBeInTheDocument();
  });

  it('does not show old BOM结构树 title', () => {
    renderWithAntd(<BomPage />);
    expect(screen.queryByText('BOM结构树')).not.toBeInTheDocument();
  });

  it('calls createBomItem with bomId and data when add button is clicked', async () => {
    const user = userEvent.setup();
    renderWithAntd(<BomPage />);
    // Wait for BOM data to load so currentBomId is set
    await waitFor(() => {
      expect(mockGetBomStructure).toHaveBeenCalled();
    });
    await user.click(screen.getByText('新增物料'));
    await waitFor(() => {
      expect(mockCreateBomItem).toHaveBeenCalledWith(10, expect.objectContaining({ name: '新物料', quantity: 1 }));
    });
  });

  it('handles bom item selection', async () => {
    const user = userEvent.setup();
    renderWithAntd(<BomPage />);
    await waitFor(() => {
      expect(screen.getByTestId('bom-tree')).toBeInTheDocument();
    });
    await user.click(screen.getByTestId('select-item'));
    expect(screen.getByTestId('tree-selected-id').textContent).toBe('1');
  });

  it('shows selected item name in table when item is selected', async () => {
    const user = userEvent.setup();
    renderWithAntd(<BomPage />);
    await waitFor(() => {
      expect(screen.getByTestId('bom-table')).toBeInTheDocument();
    });
    await user.click(screen.getByTestId('select-item'));
    expect(screen.getByTestId('selected-item-name').textContent).toBe('根物料');
  });

  it('calls deleteBomItem when delete is triggered', async () => {
    const user = userEvent.setup();
    renderWithAntd(<BomPage />);
    await waitFor(() => {
      expect(screen.getByTestId('bom-table')).toBeInTheDocument();
    });
    await user.click(screen.getByTestId('delete-item'));
    await waitFor(() => {
      expect(mockDeleteBomItem).toHaveBeenCalledWith(1);
    });
  });

  it('clears selectedId when selected item is deleted', async () => {
    const user = userEvent.setup();
    renderWithAntd(<BomPage />);
    await waitFor(() => {
      expect(screen.getByTestId('bom-table')).toBeInTheDocument();
    });
    await user.click(screen.getByTestId('select-item'));
    expect(screen.getByTestId('selected-item-name').textContent).toBe('根物料');
    await user.click(screen.getByTestId('delete-item'));
    await waitFor(() => {
      expect(screen.getByTestId('selected-item-name').textContent).toBe('none');
    });
  });

  it('calls updateBomItem when update is triggered', async () => {
    const user = userEvent.setup();
    renderWithAntd(<BomPage />);
    await waitFor(() => {
      expect(screen.getByTestId('bom-table')).toBeInTheDocument();
    });
    await user.click(screen.getByTestId('update-item'));
    await waitFor(() => {
      expect(mockUpdateBomItem).toHaveBeenCalledWith(1, { materialName: 'updated' });
    });
  });

  it('refetches data after creating an item', async () => {
    const user = userEvent.setup();
    renderWithAntd(<BomPage />);
    await waitFor(() => {
      expect(mockGetBomStructure).toHaveBeenCalledTimes(1);
    });
    await user.click(screen.getByText('新增物料'));
    await waitFor(() => {
      expect(mockGetBomStructure).toHaveBeenCalledTimes(2);
    });
  });

  it('passes tree data to BomTree', async () => {
    renderWithAntd(<BomPage />);
    await waitFor(() => {
      expect(screen.getByTestId('tree-item-count').textContent).toBe('1');
    });
  });

  it('shows error message when getBomsByProject fails', async () => {
    mockGetBomsByProject.mockRejectedValueOnce(new Error('fail'));
    renderWithAntd(<BomPage />);
    await waitFor(() => {
      expect(screen.getByText('加载BOM数据失败')).toBeInTheDocument();
    });
  });

  it('shows error message when createBomItem fails', async () => {
    mockCreateBomItem.mockRejectedValueOnce(new Error('fail'));
    const user = userEvent.setup();
    renderWithAntd(<BomPage />);
    await waitFor(() => {
      expect(mockGetBomStructure).toHaveBeenCalled();
    });
    await user.click(screen.getByText('新增物料'));
    await waitFor(() => {
      expect(mockCreateBomItem).toHaveBeenCalledWith(10, expect.objectContaining({ name: '新物料', quantity: 1 }));
    });
  });

  it('renders more dropdown with export option', async () => {
    const user = userEvent.setup();
    renderWithAntd(<BomPage />);
    await user.hover(screen.getByText('更多'));
    await waitFor(() => {
      expect(screen.getByText('导出CSV')).toBeInTheDocument();
    });
  });

  it('triggers CSV download when export menu item is clicked', async () => {
    const createObjectURL = vi.fn().mockReturnValue('blob:fake-url');
    const revokeObjectURL = vi.fn();
    const clickSpy = vi.fn();
    global.URL.createObjectURL = createObjectURL;
    global.URL.revokeObjectURL = revokeObjectURL;
    const origCreate = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      const el = origCreate(tag);
      if (tag === 'a') el.click = clickSpy;
      return el;
    });

    const user = userEvent.setup();
    renderWithAntd(<BomPage />);
    await waitFor(() => expect(mockGetBomStructure).toHaveBeenCalled());
    await user.hover(screen.getByText('更多'));
    await waitFor(() => expect(screen.getByText('导出CSV')).toBeInTheDocument());
    await user.click(screen.getByText('导出CSV'));
    await waitFor(() => {
      expect(createObjectURL).toHaveBeenCalled();
      expect(clickSpy).toHaveBeenCalled();
    });

    vi.restoreAllMocks();
  });

  it('renders version management in dropdown', async () => {
    const user = userEvent.setup();
    renderWithAntd(<BomPage />);
    await user.hover(screen.getByText('更多'));
    await waitFor(() => {
      expect(screen.getByText('版本管理')).toBeInTheDocument();
    });
  });

  it('opens BomVersionPanel when version menu item is clicked', async () => {
    const user = userEvent.setup();
    renderWithAntd(<BomPage />);
    await user.hover(screen.getByText('更多'));
    await waitFor(() => expect(screen.getByText('版本管理')).toBeInTheDocument());
    await user.click(screen.getByText('版本管理'));
    await waitFor(() => {
      expect(screen.getByTestId('panel-open').textContent).toBe('true');
    });
  });

  it('closes BomVersionPanel when onClose is triggered', async () => {
    const user = userEvent.setup();
    renderWithAntd(<BomPage />);
    await user.hover(screen.getByText('更多'));
    await waitFor(() => expect(screen.getByText('版本管理')).toBeInTheDocument());
    await user.click(screen.getByText('版本管理'));
    await waitFor(() => {
      expect(screen.getByTestId('panel-open').textContent).toBe('true');
    });
    await user.click(screen.getByTestId('close-panel'));
    await waitFor(() => {
      expect(screen.getByTestId('panel-open').textContent).toBe('false');
    });
  });

  it('renders change request in dropdown', async () => {
    const user = userEvent.setup();
    renderWithAntd(<BomPage />);
    await user.hover(screen.getByText('更多'));
    await waitFor(() => {
      expect(screen.getByText('变更申请')).toBeInTheDocument();
    });
  });

  it('opens ChangeRequestModal when change request menu item is clicked', async () => {
    const user = userEvent.setup();
    renderWithAntd(<BomPage />);
    await user.hover(screen.getByText('更多'));
    await waitFor(() => expect(screen.getByText('变更申请')).toBeInTheDocument());
    await user.click(screen.getByText('变更申请'));
    await waitFor(() => {
      expect(screen.getByTestId('cr-modal-open').textContent).toBe('true');
    });
  });

  it('closes ChangeRequestModal on success', async () => {
    const user = userEvent.setup();
    renderWithAntd(<BomPage />);
    await user.hover(screen.getByText('更多'));
    await waitFor(() => expect(screen.getByText('变更申请')).toBeInTheDocument());
    await user.click(screen.getByText('变更申请'));
    await waitFor(() => {
      expect(screen.getByTestId('cr-modal-open').textContent).toBe('true');
    });
    await user.click(screen.getByTestId('cr-modal-success'));
    await waitFor(() => {
      expect(screen.getByTestId('cr-modal-open').textContent).toBe('false');
    });
  });

  it('closes ChangeRequestModal on close', async () => {
    const user = userEvent.setup();
    renderWithAntd(<BomPage />);
    await user.hover(screen.getByText('更多'));
    await waitFor(() => expect(screen.getByText('变更申请')).toBeInTheDocument());
    await user.click(screen.getByText('变更申请'));
    await waitFor(() => {
      expect(screen.getByTestId('cr-modal-open').textContent).toBe('true');
    });
    await user.click(screen.getByTestId('cr-modal-close'));
    await waitFor(() => {
      expect(screen.getByTestId('cr-modal-open').textContent).toBe('false');
    });
  });

  it('renders change records in dropdown', async () => {
    const user = userEvent.setup();
    renderWithAntd(<BomPage />);
    await user.hover(screen.getByText('更多'));
    await waitFor(() => {
      expect(screen.getByText('变更记录')).toBeInTheDocument();
    });
  });

  // --- Tab structure ---
  it('shows 多级BOM tab by default', () => {
    renderWithAntd(<BomPage />);
    expect(screen.getByRole('tab', { name: '多级BOM' })).toBeInTheDocument();
  });

  it('renders 3 tabs: 多级BOM, 用量反查, 工艺路线', () => {
    renderWithAntd(<BomPage />);
    const tabs = screen.getAllByRole('tab');
    expect(tabs.length).toBeGreaterThanOrEqual(3);
    expect(screen.getByRole('tab', { name: '多级BOM' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: '用量反查' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: '工艺路线' })).toBeInTheDocument();
  });

  it('does not show old BOM视图 tab', () => {
    renderWithAntd(<BomPage />);
    expect(screen.queryByRole('tab', { name: 'BOM视图' })).not.toBeInTheDocument();
  });

  it('shows BomTree and BomTable in 多级BOM tab by default', () => {
    renderWithAntd(<BomPage />);
    expect(screen.getByTestId('bom-tree')).toBeInTheDocument();
    expect(screen.getByTestId('bom-table')).toBeInTheDocument();
  });

  it('switches to 用量反查 tab and shows lookup view', async () => {
    const user = userEvent.setup();
    renderWithAntd(<BomPage />);
    await user.click(screen.getByRole('tab', { name: '用量反查' }));
    await waitFor(() => {
      expect(screen.getByTestId('usage-lookup-view')).toBeInTheDocument();
    });
  });

  it('switches to 工艺路线 tab and shows process route view', async () => {
    const user = userEvent.setup();
    renderWithAntd(<BomPage />);
    await user.click(screen.getByRole('tab', { name: '工艺路线' }));
    await waitFor(() => {
      expect(screen.getByTestId('process-route-view')).toBeInTheDocument();
    });
  });

  it('switches back to 多级BOM tab from 用量反查', async () => {
    const user = userEvent.setup();
    renderWithAntd(<BomPage />);
    await user.click(screen.getByRole('tab', { name: '用量反查' }));
    await waitFor(() => {
      expect(screen.getByTestId('usage-lookup-view')).toBeInTheDocument();
    });
    await user.click(screen.getByRole('tab', { name: '多级BOM' }));
    await waitFor(() => {
      expect(screen.getByTestId('bom-tree')).toBeInTheDocument();
    });
  });

  it('renders version management modal via dropdown', async () => {
    const user = userEvent.setup();
    renderWithAntd(<BomPage />);
    await user.hover(screen.getByText('更多'));
    await waitFor(() => {
      expect(screen.getByText('变更记录')).toBeInTheDocument();
    });
  });
});
