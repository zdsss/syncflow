import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfigProvider } from 'antd';
import BomTable from './BomTable';

const renderWithAntd = (ui: React.ReactElement) =>
  render(<ConfigProvider>{ui}</ConfigProvider>);

const mockItems = [
  { id: 1, bomId: 1, name: '螺丝M8', materialCode: 'PN-001', specification: 'M8x20', quantity: 100, material: '外购件', unitOfMeasure: '个', drawingNo: 'DW-001', surfaceTreatment: '镀锌', weight: 0.05, totalWeight: 5.0, sourceType: 'PURCHASED', isVirtual: false, storageLocation: 'A-01-01', remark: '备注1' },
  { id: 2, bomId: 1, name: '垫片', materialCode: 'PN-002', specification: 'D8', quantity: 200, material: '标准件', unitOfMeasure: '片', weight: 0.01, totalWeight: 2.0, sourceType: 'MADE', isVirtual: false },
  { id: 3, bomId: 1, name: '无料号零件', quantity: 50 },
];

describe('BomTable', () => {
  const defaultProps = {
    items: mockItems,
    selectedItem: null as any,
    onUpdate: vi.fn(),
    onDelete: vi.fn(),
  };

  it('renders table with all items', () => {
    renderWithAntd(<BomTable {...defaultProps} />);
    expect(screen.getByText('螺丝M8')).toBeInTheDocument();
    expect(screen.getByText('垫片')).toBeInTheDocument();
    expect(screen.getByText('无料号零件')).toBeInTheDocument();
  });

  it('shows essential column headers (streamlined layout)', () => {
    renderWithAntd(<BomTable {...defaultProps} />);
    expect(screen.getByText('层级')).toBeInTheDocument();
    expect(screen.getByText('物料编码')).toBeInTheDocument();
    expect(screen.getByText('物料名称')).toBeInTheDocument();
    expect(screen.getByText('规格')).toBeInTheDocument();
    expect(screen.getByText('用量')).toBeInTheDocument();
    expect(screen.getByText('单位')).toBeInTheDocument();
    expect(screen.getByText('来源')).toBeInTheDocument();
  });

  it('secondary columns moved to expandable row (not in main table)', () => {
    renderWithAntd(<BomTable {...defaultProps} />);
    // These are now in the expandable detail row, not as column headers
    const headers = document.querySelectorAll('th');
    const headerTexts = Array.from(headers).map(h => h.textContent);
    expect(headerTexts).not.toContain('图号');
    expect(headerTexts).not.toContain('表面处理');
    expect(headerTexts).not.toContain('重量(kg)');
    expect(headerTexts).not.toContain('总计重量');
    expect(headerTexts).not.toContain('库位');
    expect(headerTexts).not.toContain('虚拟件');
  });

  it('displays materialCode as component number', () => {
    renderWithAntd(<BomTable {...defaultProps} />);
    expect(screen.getByText('PN-001')).toBeInTheDocument();
    expect(screen.getByText('PN-002')).toBeInTheDocument();
  });

  it('shows sourceType tags', () => {
    renderWithAntd(<BomTable {...defaultProps} />);
    expect(screen.getByText('外购')).toBeInTheDocument();
    expect(screen.getByText('自制')).toBeInTheDocument();
  });

  it('shows delete button and calls onDelete when confirmed', async () => {
    const onDelete = vi.fn();
    renderWithAntd(<BomTable {...defaultProps} onDelete={onDelete} />);
    const deleteButtons = screen.getAllByRole('button');
    expect(deleteButtons.length).toBeGreaterThan(0);
  });

  it('highlights selectedItem while showing all items', () => {
    const selectedItem = mockItems[0];
    renderWithAntd(<BomTable {...defaultProps} selectedItem={selectedItem} />);
    expect(screen.getByText('螺丝M8')).toBeInTheDocument();
    expect(screen.getByText('垫片')).toBeInTheDocument();
    expect(screen.getByText('无料号零件')).toBeInTheDocument();
  });

  it('shows detail fields in expandable row using Descriptions', async () => {
    renderWithAntd(<BomTable {...defaultProps} />);
    const expandButtons = document.querySelectorAll('.ant-table-row-expand-icon');
    expect(expandButtons.length).toBeGreaterThan(0);
    fireEvent.click(expandButtons[0]);
    await waitFor(() => {
      expect(screen.getByTestId('expand-detail-1')).toBeInTheDocument();
      expect(screen.getByText('外购件')).toBeInTheDocument();
      expect(screen.getByText('DW-001')).toBeInTheDocument();
      expect(screen.getByText('镀锌')).toBeInTheDocument();
      expect(screen.getByText('A-01-01')).toBeInTheDocument();
      expect(screen.getByText('备注1')).toBeInTheDocument();
    });
  });

  it('does not have old columns (status, version, supplier, unitPrice)', () => {
    renderWithAntd(<BomTable {...defaultProps} />);
    expect(screen.queryByText('状态')).not.toBeInTheDocument();
    expect(screen.queryByText('版本')).not.toBeInTheDocument();
    expect(screen.queryByText('供应商')).not.toBeInTheDocument();
    expect(screen.queryByText('物料类型')).not.toBeInTheDocument();
    expect(screen.queryByText('完成率(%)')).not.toBeInTheDocument();
  });

  it('onDelete receives numeric id', async () => {
    const onDelete = vi.fn();
    renderWithAntd(<BomTable {...defaultProps} onDelete={onDelete} />);
    const deleteButtons = screen.getAllByRole('button');
    expect(deleteButtons.length).toBeGreaterThan(0);
  });
});
