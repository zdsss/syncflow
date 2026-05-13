import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfigProvider } from 'antd';
import { describe, it, expect, vi } from 'vitest';
import StepDetail from './StepDetail';

const renderWithAntd = (ui: React.ReactElement) =>
  render(<ConfigProvider>{ui}</ConfigProvider>);

const mockRoute = {
  id: 'r1',
  name: '工艺路线A',
  description: '路线A的描述',
  status: 'active',
  version: 2,
  steps: [
    { id: 's1', name: '切割', description: '按尺寸切割', sortOrder: 1 },
    { id: 's2', name: '焊接', description: '点焊固定', sortOrder: 2, parameters: { temp: 300 } },
  ],
};

describe('StepDetail', () => {
  it('shows empty hint when no route selected', () => {
    renderWithAntd(<StepDetail route={null} onAddStep={vi.fn()} />);

    expect(screen.getByText('请选择一个工艺路线')).toBeTruthy();
  });

  it('renders route name and description', () => {
    renderWithAntd(<StepDetail route={mockRoute} onAddStep={vi.fn()} />);

    expect(screen.getByText('工艺路线A')).toBeTruthy();
    expect(screen.getByText('路线A的描述')).toBeTruthy();
  });

  it('renders step list with names and descriptions', () => {
    renderWithAntd(<StepDetail route={mockRoute} onAddStep={vi.fn()} />);

    expect(screen.getByText('工序列表')).toBeTruthy();
    expect(screen.getByText('切割')).toBeTruthy();
    expect(screen.getByText('按尺寸切割')).toBeTruthy();
    expect(screen.getByText('焊接')).toBeTruthy();
    expect(screen.getByText('点焊固定')).toBeTruthy();
  });

  it('shows step parameters when present', () => {
    renderWithAntd(<StepDetail route={mockRoute} onAddStep={vi.fn()} />);

    expect(screen.getByText(/参数:.*temp/)).toBeTruthy();
  });

  it('shows empty message when route has no steps', () => {
    const emptyRoute = { ...mockRoute, steps: [] };
    renderWithAntd(<StepDetail route={emptyRoute} onAddStep={vi.fn()} />);

    expect(screen.getByText(/暂无工序/)).toBeTruthy();
  });

  it('calls onAddStep when add button is clicked', async () => {
    const onAddStep = vi.fn();
    const user = userEvent.setup();
    renderWithAntd(<StepDetail route={mockRoute} onAddStep={onAddStep} />);

    await user.click(screen.getByText('添加工序'));

    expect(onAddStep).toHaveBeenCalledWith('r1');
  });

  it('renders step numbers for each step', () => {
    renderWithAntd(<StepDetail route={mockRoute} onAddStep={vi.fn()} />);

    expect(screen.getByText('1')).toBeTruthy();
    expect(screen.getByText('2')).toBeTruthy();
  });

  it('renders drag handles for reordering', () => {
    renderWithAntd(<StepDetail route={mockRoute} onAddStep={vi.fn()} />);

    const holders = document.querySelectorAll('.anticon-holder');
    expect(holders.length).toBe(2);
  });
});
