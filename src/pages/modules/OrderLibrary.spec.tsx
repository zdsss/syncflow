import { render, screen } from '@testing-library/react';
import { ConfigProvider } from 'antd';
import { describe, it, expect } from 'vitest';
import OrderLibrary from './OrderLibrary';

vi.mock('./ModulePage.module.css', () => ({
  default: {
    splitLayout: 'splitLayout',
    treePanel: 'treePanel',
    treeTitle: 'treeTitle',
    dataPanel: 'dataPanel',
    tableToolbar: 'tableToolbar',
    tableContent: 'tableContent',
    tableWrapper: 'tableWrapper',
    tableTitle: 'tableTitle',
  },
}));

const renderWithAntd = (ui: React.ReactElement) =>
  render(<ConfigProvider>{ui}</ConfigProvider>);

describe('OrderLibrary', () => {
  it('renders without crashing', () => {
    renderWithAntd(<OrderLibrary />);
    expect(screen.getByTestId('order-library')).toBeInTheDocument();
  });

  it('displays tree title', () => {
    renderWithAntd(<OrderLibrary />);
    expect(screen.getByText('订单分类树')).toBeInTheDocument();
  });

  it('displays default order data in table', () => {
    renderWithAntd(<OrderLibrary />);
    expect(screen.getByText('比亚迪')).toBeInTheDocument();
    expect(screen.getByText('ORD-2026-001')).toBeInTheDocument();
  });

  it('renders toolbar buttons', () => {
    renderWithAntd(<OrderLibrary />);
    expect(screen.getByText('新增')).toBeInTheDocument();
    expect(screen.getByText('修改')).toBeInTheDocument();
    expect(screen.getByText('删除')).toBeInTheDocument();
    expect(screen.getByText('审批')).toBeInTheDocument();
    expect(screen.getByText('保存')).toBeInTheDocument();
  });

  it('displays table columns', () => {
    renderWithAntd(<OrderLibrary />);
    expect(screen.getByText('订单编号')).toBeInTheDocument();
    expect(screen.getByText('客户名称')).toBeInTheDocument();
    expect(screen.getByText('产品')).toBeInTheDocument();
  });
});
