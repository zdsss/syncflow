import { render, screen } from '@testing-library/react';
import { ConfigProvider } from 'antd';
import { describe, it, expect } from 'vitest';
import ModuleLibrary from './ModuleLibrary';

vi.mock('./ModulePage.module.css', () => ({
  default: {
    splitLayout: 'splitLayout',
    treePanel: 'treePanel',
    treeTitle: 'treeTitle',
    dataPanel: 'dataPanel',
    bomTable: 'bomTable',
  },
}));

const renderWithAntd = (ui: React.ReactElement) =>
  render(<ConfigProvider>{ui}</ConfigProvider>);

describe('ModuleLibrary', () => {
  it('renders without crashing', () => {
    renderWithAntd(<ModuleLibrary />);
    expect(screen.getByTestId('bom-tree-panel')).toBeInTheDocument();
    expect(screen.getByTestId('data-table-panel')).toBeInTheDocument();
  });

  it('displays tree title', () => {
    renderWithAntd(<ModuleLibrary />);
    expect(screen.getByText('产品结构树')).toBeInTheDocument();
  });

  it('displays default BOM data in table', () => {
    renderWithAntd(<ModuleLibrary />);
    expect(screen.getByText('电池Pack总成')).toBeInTheDocument();
    expect(screen.getByText('PK-001')).toBeInTheDocument();
  });

  it('renders tree nodes', () => {
    renderWithAntd(<ModuleLibrary />);
    expect(screen.getByText('电池Pack')).toBeInTheDocument();
  });

  it('displays table columns', () => {
    renderWithAntd(<ModuleLibrary />);
    expect(screen.getAllByText('组件编号').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('名称').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('版本').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('供应商').length).toBeGreaterThanOrEqual(1);
  });
});
