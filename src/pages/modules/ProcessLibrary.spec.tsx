import { render, screen } from '@testing-library/react';
import { ConfigProvider } from 'antd';
import { describe, it, expect } from 'vitest';
import ProcessLibrary from './ProcessLibrary';

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

describe('ProcessLibrary', () => {
  it('renders without crashing', () => {
    renderWithAntd(<ProcessLibrary />);
    expect(screen.getByTestId('process-library')).toBeInTheDocument();
  });

  it('displays tree title', () => {
    renderWithAntd(<ProcessLibrary />);
    expect(screen.getByText('工艺结构树')).toBeInTheDocument();
  });

  it('displays default process data in table', () => {
    renderWithAntd(<ProcessLibrary />);
    expect(screen.getByText('激光焊接工艺')).toBeInTheDocument();
    expect(screen.getByText('PRC-W001')).toBeInTheDocument();
  });

  it('renders toolbar buttons', () => {
    renderWithAntd(<ProcessLibrary />);
    expect(screen.getByText('新增')).toBeInTheDocument();
    expect(screen.getByText('修改')).toBeInTheDocument();
    expect(screen.getByText('删除')).toBeInTheDocument();
    expect(screen.getByText('审批')).toBeInTheDocument();
    expect(screen.getByText('保存')).toBeInTheDocument();
  });

  it('displays table columns', () => {
    renderWithAntd(<ProcessLibrary />);
    expect(screen.getByText('工艺名称')).toBeInTheDocument();
    expect(screen.getByText('工艺编码')).toBeInTheDocument();
    expect(screen.getByText('工艺类型')).toBeInTheDocument();
    expect(screen.getByText('设备')).toBeInTheDocument();
  });
});
