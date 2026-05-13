import { render, screen } from '@testing-library/react';
import { ConfigProvider } from 'antd';
import TemplateGrid from './TemplateGrid';

const renderWithAntd = (ui: React.ReactElement) =>
  render(<ConfigProvider>{ui}</ConfigProvider>);

const mockTemplates = [
  {
    id: '1',
    name: '模板A',
    type: 'project',
    description: '描述A',
    usageCount: 10,
    createdAt: '2025-01-01',
  },
  {
    id: '2',
    name: '模板B',
    type: 'task',
    description: '描述B',
    usageCount: 5,
    createdAt: '2025-02-01',
  },
];

describe('TemplateGrid', () => {
  it('renders grid of templates', () => {
    renderWithAntd(<TemplateGrid templates={mockTemplates} onClick={vi.fn()} />);
    expect(screen.getByText('模板A')).toBeInTheDocument();
    expect(screen.getByText('模板B')).toBeInTheDocument();
  });

  it('shows template names', () => {
    renderWithAntd(<TemplateGrid templates={mockTemplates} onClick={vi.fn()} />);
    expect(screen.getByText('模板A')).toBeInTheDocument();
    expect(screen.getByText('模板B')).toBeInTheDocument();
  });

  it('shows empty state when no templates', () => {
    renderWithAntd(<TemplateGrid templates={[]} onClick={vi.fn()} />);
    expect(screen.getByText('暂无模板')).toBeInTheDocument();
  });

  it('renders correct number of templates', () => {
    renderWithAntd(<TemplateGrid templates={mockTemplates} onClick={vi.fn()} />);
    expect(screen.getByText('模板A')).toBeInTheDocument();
    expect(screen.getByText('模板B')).toBeInTheDocument();
  });
});
