import { render, screen, fireEvent } from '@testing-library/react';
import { ConfigProvider } from 'antd';
import { describe, it, expect } from 'vitest';
import UsageLookupView from './UsageLookupView';
import type { BomItem } from './types';

vi.mock('./BomPage.module.css', () => ({ default: {} }));

const mockItems: BomItem[] = [
  { id: 1, name: '电芯模组A', materialCode: 'PK-001', quantity: 6, unitOfMeasure: '组', material: '电芯', sourceType: '采购' },
  { id: 2, name: '上壳体', materialCode: 'PK-002', quantity: 1, unitOfMeasure: '件', material: '铝合金', sourceType: '采购' },
  { id: 3, name: 'BMS主控', materialCode: 'PK-003', quantity: 1, unitOfMeasure: '块', material: 'PCB', sourceType: '自制' },
];

const renderWithAntd = (ui: React.ReactElement) =>
  render(<ConfigProvider>{ui}</ConfigProvider>);

describe('UsageLookupView', () => {
  it('renders without crashing', () => {
    renderWithAntd(<UsageLookupView items={mockItems} />);
    expect(screen.getByTestId('usage-lookup-view')).toBeInTheDocument();
  });

  it('renders search input', () => {
    renderWithAntd(<UsageLookupView items={mockItems} />);
    expect(screen.getByPlaceholderText('输入组件编号或名称搜索...')).toBeInTheDocument();
  });

  it('displays all items in the table', () => {
    renderWithAntd(<UsageLookupView items={mockItems} />);
    expect(screen.getByText('电芯模组A')).toBeInTheDocument();
    expect(screen.getByText('上壳体')).toBeInTheDocument();
    expect(screen.getByText('BMS主控')).toBeInTheDocument();
  });

  it('filters items by keyword', () => {
    renderWithAntd(<UsageLookupView items={mockItems} />);
    const input = screen.getByPlaceholderText('输入组件编号或名称搜索...');
    fireEvent.change(input, { target: { value: '电芯' } });
    expect(screen.getByText('电芯模组A')).toBeInTheDocument();
    expect(screen.queryByText('上壳体')).not.toBeInTheDocument();
  });

  it('shows empty state when no items match', () => {
    renderWithAntd(<UsageLookupView items={mockItems} />);
    const input = screen.getByPlaceholderText('输入组件编号或名称搜索...');
    fireEvent.change(input, { target: { value: 'nonexistent' } });
    expect(screen.getByText('暂无匹配的物料数据')).toBeInTheDocument();
  });

  it('shows empty state when items array is empty', () => {
    renderWithAntd(<UsageLookupView items={[]} />);
    expect(screen.getByText('暂无匹配的物料数据')).toBeInTheDocument();
  });

  it('renders material and source type columns', () => {
    renderWithAntd(<UsageLookupView items={mockItems} />);
    expect(screen.getByText('电芯')).toBeInTheDocument();
    expect(screen.getAllByText('采购').length).toBeGreaterThan(0);
    expect(screen.getByText('自制')).toBeInTheDocument();
  });
});
