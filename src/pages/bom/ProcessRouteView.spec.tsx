import { render, screen, waitFor } from '@testing-library/react';
import { ConfigProvider } from 'antd';
import { describe, it, expect, vi } from 'vitest';
import ProcessRouteView from './ProcessRouteView';

const mockRoutes = [
  { id: 1, name: '主板工艺路线', routeNo: 'PR-001', bomId: 10, status: 3, version: 'V1' },
];

const mockRouteDetail = {
  id: 1,
  name: '主板工艺路线',
  operations: [
    { id: 1, seqNo: 10, operationNo: 'OP-001', name: 'SMT贴片', workCenterName: 'SMT车间', status: 5 },
    { id: 2, seqNo: 20, operationNo: 'OP-002', name: 'DIP插件', workCenterName: 'DIP车间', status: 3 },
    { id: 3, seqNo: 30, operationNo: 'OP-003', name: '回流焊接', workCenterName: '焊接车间', status: 1 },
  ],
};

const mockGetProcessRoutes = vi.fn().mockResolvedValue({ data: mockRoutes });
const mockGetProcessRoute = vi.fn().mockResolvedValue({ data: mockRouteDetail });

vi.mock('@/services/process.service', () => ({
  getProcessRoutes: (...args: any[]) => mockGetProcessRoutes(...args),
  getProcessRoute: (...args: any[]) => mockGetProcessRoute(...args),
}));

const renderWithAntd = (ui: React.ReactElement) =>
  render(<ConfigProvider>{ui}</ConfigProvider>);

describe('ProcessRouteView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing when no bomId', () => {
    renderWithAntd(<ProcessRouteView />);
    expect(screen.getByText('请先选择BOM')).toBeInTheDocument();
  });

  it('displays process route heading when bomId provided', async () => {
    renderWithAntd(<ProcessRouteView bomId={10} />);
    expect(screen.getByText('关联工艺路线')).toBeInTheDocument();
  });

  it('does not fetch routes when bomId is not provided', () => {
    renderWithAntd(<ProcessRouteView />);
    expect(mockGetProcessRoutes).not.toHaveBeenCalled();
  });

  it('fetches routes when bomId is provided', async () => {
    renderWithAntd(<ProcessRouteView bomId={10} />);
    await waitFor(() => {
      expect(mockGetProcessRoutes).toHaveBeenCalledWith({ bomId: 10 });
    });
  });

  it('fetches route detail after loading routes', async () => {
    renderWithAntd(<ProcessRouteView bomId={10} />);
    await waitFor(() => {
      expect(mockGetProcessRoute).toHaveBeenCalledWith(1);
    });
  });

  it('renders route table with route data', async () => {
    renderWithAntd(<ProcessRouteView bomId={10} />);
    await waitFor(() => {
      expect(screen.getByText('主板工艺路线')).toBeInTheDocument();
      expect(screen.getByText('PR-001')).toBeInTheDocument();
    });
  });

  it('renders operation names from API in table', async () => {
    renderWithAntd(<ProcessRouteView bomId={10} />);
    await waitFor(() => {
      expect(screen.getByText('SMT贴片')).toBeInTheDocument();
      expect(screen.getByText('DIP插件')).toBeInTheDocument();
      expect(screen.getByText('回流焊接')).toBeInTheDocument();
    });
  });

  it('renders operation numbers from API', async () => {
    renderWithAntd(<ProcessRouteView bomId={10} />);
    await waitFor(() => {
      expect(screen.getByText('OP-001')).toBeInTheDocument();
      expect(screen.getByText('OP-002')).toBeInTheDocument();
    });
  });

  it('renders work center names from API', async () => {
    renderWithAntd(<ProcessRouteView bomId={10} />);
    await waitFor(() => {
      expect(screen.getByText('SMT车间')).toBeInTheDocument();
      expect(screen.getByText('DIP车间')).toBeInTheDocument();
    });
  });

  it('shows empty table when no bomId', () => {
    renderWithAntd(<ProcessRouteView />);
    expect(screen.queryByText('OP-001')).not.toBeInTheDocument();
  });

  it('shows error message when fetching routes fails', async () => {
    mockGetProcessRoutes.mockRejectedValueOnce(new Error('fail'));
    renderWithAntd(<ProcessRouteView bomId={10} />);
    await waitFor(() => {
      expect(screen.getByText('获取工艺路线失败')).toBeInTheDocument();
    });
  });

  it('shows operation detail section when routes exist', async () => {
    renderWithAntd(<ProcessRouteView bomId={10} />);
    await waitFor(() => {
      expect(screen.getByText('工序明细')).toBeInTheDocument();
    });
  });

  it('shows published status tag for route with status 3', async () => {
    renderWithAntd(<ProcessRouteView bomId={10} />);
    await waitFor(() => {
      expect(screen.getByText('已发布')).toBeInTheDocument();
    });
  });
});
