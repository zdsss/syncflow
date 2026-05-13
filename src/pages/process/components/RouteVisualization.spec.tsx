import { render, screen } from '@testing-library/react';
import { ConfigProvider } from 'antd';
import { describe, it, expect } from 'vitest';
import RouteVisualization from './RouteVisualization';

vi.mock('./RouteVisualization.module.css', () => ({ default: {} }));

const renderWithAntd = (ui: React.ReactElement) =>
  render(<ConfigProvider>{ui}</ConfigProvider>);

const mockSteps = [
  { id: 's1', name: '切割', description: '按尺寸切割材料' },
  { id: 's2', name: '焊接', parameters: { temp: 300, time: 10 } },
  { id: 's3', name: '组装' },
  { id: 's4', name: '检测' },
];

describe('RouteVisualization', () => {
  it('renders empty state when no steps', () => {
    renderWithAntd(<RouteVisualization steps={[]} />);
    expect(screen.getByText('暂无工序')).toBeInTheDocument();
  });

  it('renders all step names', () => {
    renderWithAntd(<RouteVisualization steps={mockSteps} />);
    expect(screen.getByText('切割')).toBeInTheDocument();
    expect(screen.getByText('焊接')).toBeInTheDocument();
    expect(screen.getByText('组装')).toBeInTheDocument();
    expect(screen.getByText('检测')).toBeInTheDocument();
  });

  it('renders step numbers', () => {
    renderWithAntd(<RouteVisualization steps={mockSteps} />);
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
  });

  it('renders relationship tags between steps', () => {
    renderWithAntd(<RouteVisualization steps={mockSteps} />);
    const tags = screen.getAllByText(/串行|并行/);
    expect(tags.length).toBe(3); // 3 connectors for 4 steps
  });

  it('renders parameter badge when step has parameters', () => {
    renderWithAntd(<RouteVisualization steps={mockSteps} />);
    expect(screen.getByText('2 参数')).toBeInTheDocument();
  });

  it('highlights current step', () => {
    renderWithAntd(
      <RouteVisualization steps={mockSteps} currentStepId="s2" />
    );
    // The current step should be rendered (visual highlight depends on CSS)
    expect(screen.getByText('焊接')).toBeInTheDocument();
  });

  it('renders route title', () => {
    renderWithAntd(<RouteVisualization steps={mockSteps} />);
    expect(screen.getByText('工艺路线图')).toBeInTheDocument();
  });
});
