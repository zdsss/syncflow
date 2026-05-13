import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfigProvider } from 'antd';
import BomTree from './BomTree';

const renderWithAntd = (ui: React.ReactElement) =>
  render(<ConfigProvider>{ui}</ConfigProvider>);

const mockData = [
  {
    id: 1,
    name: '总装',
    materialCode: 'ASM-001',
    levelNo: 'L1',
    children: [
      { id: 2, name: '子组件A', materialCode: 'SUB-A', levelNo: 'L1.1' },
      { id: 3, name: '子组件B', levelNo: 'L1.2', children: [
        { id: 4, name: '零件C', levelNo: 'L1.2.1' },
      ]},
    ],
  },
  { id: 5, name: '独立组件', materialCode: 'IND-001', levelNo: 'L2' },
];

describe('BomTree', () => {
  const defaultProps = {
    data: mockData,
    selectedId: null as string | null,
    onSelect: vi.fn(),
    loading: false,
  };

  it('renders tree with node names', () => {
    renderWithAntd(<BomTree {...defaultProps} />);
    expect(screen.getByText(/总装/)).toBeInTheDocument();
    expect(screen.getByText(/子组件A/)).toBeInTheDocument();
    expect(screen.getByText(/子组件B/)).toBeInTheDocument();
    expect(screen.getByText(/零件C/)).toBeInTheDocument();
    expect(screen.getByText(/独立组件/)).toBeInTheDocument();
  });

  it('shows levelNo, materialName and materialCode in node title', () => {
    renderWithAntd(<BomTree {...defaultProps} />);
    expect(screen.getByText('[L1] 总装 (ASM-001)')).toBeInTheDocument();
    expect(screen.getByText('[L1.1] 子组件A (SUB-A)')).toBeInTheDocument();
    expect(screen.getByText('[L2] 独立组件 (IND-001)')).toBeInTheDocument();
  });

  it('shows name without materialCode when materialCode is absent', () => {
    renderWithAntd(<BomTree {...defaultProps} />);
    expect(screen.getByText('[L1.2.1] 零件C')).toBeInTheDocument();
  });

  it('shows loading spinner when loading is true', () => {
    const { container } = renderWithAntd(<BomTree {...defaultProps} loading={true} />);
    expect(container.querySelector('.ant-spin')).toBeInTheDocument();
    expect(screen.queryByText(/总装/)).not.toBeInTheDocument();
  });

  it('shows empty message when data is empty', () => {
    renderWithAntd(<BomTree {...defaultProps} data={[]} />);
    expect(screen.getByText('暂无BOM数据')).toBeInTheDocument();
  });

  it('calls onSelect when a node is clicked', async () => {
    const onSelect = vi.fn();
    renderWithAntd(<BomTree {...defaultProps} onSelect={onSelect} />);
    const treeNode = screen.getByText('[L2] 独立组件 (IND-001)');
    await userEvent.click(treeNode);
    expect(onSelect).toHaveBeenCalledWith('5');
  });

  it('shows context menu on right-click with correct options', async () => {
    renderWithAntd(<BomTree {...defaultProps} />);
    const treeNode = screen.getByTestId('tree-node-5');
    fireEvent.contextMenu(treeNode);
    await waitFor(() => {
      expect(screen.getByText('新增子物料')).toBeInTheDocument();
      expect(screen.getByText('编辑')).toBeInTheDocument();
      expect(screen.getByText('删除')).toBeInTheDocument();
    });
  });

  it('calls onDelete when delete menu item is clicked', async () => {
    const onDelete = vi.fn();
    renderWithAntd(<BomTree {...defaultProps} onDelete={onDelete} />);
    const treeNode = screen.getByTestId('tree-node-5');
    fireEvent.contextMenu(treeNode);
    await waitFor(() => {
      expect(screen.getByText('删除')).toBeInTheDocument();
    });
    await userEvent.click(screen.getByText('删除'));
    expect(onDelete).toHaveBeenCalledWith('5');
  });
});
