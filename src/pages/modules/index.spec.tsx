import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfigProvider } from 'antd';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ModulesPage from './index';

vi.mock('./ModulePage.module.css', () => ({
  default: new Proxy({}, { get: (_, key) => String(key) }),
}));

const renderWithAntd = (ui: React.ReactElement) =>
  render(<ConfigProvider>{ui}</ConfigProvider>);

describe('ModulesPage - 物料清单', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders page title 物料清单', async () => {
    renderWithAntd(<ModulesPage />);
    expect(screen.getByText('物料清单')).toBeInTheDocument();
  });

  it('renders search input and 新增物料 button', async () => {
    renderWithAntd(<ModulesPage />);
    expect(screen.getByPlaceholderText('搜索...')).toBeInTheDocument();
    expect(screen.getByText('新增物料')).toBeInTheDocument();
  });

  it('renders three tabs: 多级BOM, 用量反查, 工艺路线', async () => {
    renderWithAntd(<ModulesPage />);
    expect(screen.getByText('多级BOM')).toBeInTheDocument();
    expect(screen.getByText('用量反查')).toBeInTheDocument();
    expect(screen.getByText('工艺路线')).toBeInTheDocument();
  });

  it('renders left tree panel with 产品结构树', async () => {
    renderWithAntd(<ModulesPage />);
    expect(screen.getByTestId('bom-tree-panel')).toBeInTheDocument();
    expect(screen.getByText('产品结构树')).toBeInTheDocument();
  });

  it('renders right data table panel', async () => {
    renderWithAntd(<ModulesPage />);
    expect(screen.getByTestId('data-table-panel')).toBeInTheDocument();
  });

  it('renders BOM tree with root node 电池Pack', async () => {
    renderWithAntd(<ModulesPage />);
    await waitFor(() => {
      expect(screen.getByText('电池Pack')).toBeInTheDocument();
    });
  });

  it('shows BOM table columns in header', async () => {
    renderWithAntd(<ModulesPage />);
    await waitFor(() => {
      // Use getAllByText since column headers may match data
      expect(screen.getAllByText('组件编号').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('名称').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('版本').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('供应商').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('物料类型').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('状态').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('shows BOM data rows', async () => {
    renderWithAntd(<ModulesPage />);
    await waitFor(() => {
      expect(screen.getByText('PK-001')).toBeInTheDocument();
      expect(screen.getByText('电池Pack总成')).toBeInTheDocument();
    });
  });

  it('shows status values', async () => {
    renderWithAntd(<ModulesPage />);
    await waitFor(() => {
      expect(screen.getAllByText('进行中').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('已完成').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('shows completion percentage', async () => {
    renderWithAntd(<ModulesPage />);
    await waitFor(() => {
      expect(screen.getByText('65%')).toBeInTheDocument();
    });
  });

  it('switches to 用量反查 tab', async () => {
    const user = userEvent.setup();
    renderWithAntd(<ModulesPage />);
    await user.click(screen.getByText('用量反查'));
    await waitFor(() => {
      expect(screen.getByText('工艺结构树')).toBeInTheDocument();
    });
  });

  it('switches to 工艺路线 tab', async () => {
    const user = userEvent.setup();
    renderWithAntd(<ModulesPage />);
    await user.click(screen.getByText('工艺路线'));
    await waitFor(() => {
      // OrderLibrary renders
      expect(screen.queryByTestId('bom-tree-panel')).not.toBeInTheDocument();
    });
  });

  it('allows clicking tree node to change table data', async () => {
    const user = userEvent.setup();
    renderWithAntd(<ModulesPage />);
    await waitFor(() => {
      expect(screen.getByText('电池Pack')).toBeInTheDocument();
    });
    // Click on 结构件 tree node to change table data
    await user.click(screen.getByText('结构件'));
    await waitFor(() => {
      // 上壳体 appears in both tree and table
      expect(screen.getAllByText('上壳体').length).toBeGreaterThanOrEqual(2);
    });
  });
});
