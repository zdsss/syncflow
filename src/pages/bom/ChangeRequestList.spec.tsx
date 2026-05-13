import { render, screen } from '@testing-library/react';
import { ConfigProvider, Empty } from 'antd';
import { describe, it, expect, vi } from 'vitest';
import ChangeRequestList from './ChangeRequestList';

vi.mock('@/services/bom.service', () => ({
  getChangeRequests: vi.fn().mockResolvedValue({ data: [] }),
}));

const renderWithAntd = (ui: React.ReactElement) =>
  render(<ConfigProvider>{ui}</ConfigProvider>);

describe('ChangeRequestList', () => {
  it('renders empty state when no bomId', () => {
    renderWithAntd(<ChangeRequestList bomId={null} />);
    expect(screen.getByText('请先选择BOM')).toBeTruthy();
  });

  it('renders the list container when bomId provided', () => {
    renderWithAntd(<ChangeRequestList bomId={1} />);
    expect(screen.getByTestId('change-request-list')).toBeTruthy();
  });

  it('renders table headers', () => {
    renderWithAntd(<ChangeRequestList bomId={1} />);
    expect(screen.getByText('变更类型')).toBeTruthy();
    expect(screen.getByText('状态')).toBeTruthy();
    expect(screen.getByText('申请人')).toBeTruthy();
    expect(screen.getByText('申请时间')).toBeTruthy();
    expect(screen.getByText('处理时间')).toBeTruthy();
  });
});
