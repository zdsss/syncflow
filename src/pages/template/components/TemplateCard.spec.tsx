import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfigProvider } from 'antd';
import TemplateCard from './TemplateCard';

const renderWithAntd = (ui: React.ReactElement) =>
  render(<ConfigProvider>{ui}</ConfigProvider>);

const mockTemplate = {
  id: '1',
  name: '项目模板A',
  type: 'project',
  description: '这是一个项目模板',
  usageCount: 15,
  createdAt: '2025-01-01',
};

describe('TemplateCard', () => {
  it('renders card with template name', () => {
    renderWithAntd(<TemplateCard template={mockTemplate} onClick={vi.fn()} />);
    expect(screen.getByText('项目模板A')).toBeInTheDocument();
  });

  it('shows type label for project', () => {
    renderWithAntd(<TemplateCard template={mockTemplate} onClick={vi.fn()} />);
    expect(screen.getByText(/类型:/)).toBeInTheDocument();
    const typeSpan = screen.getByText(/类型:/);
    expect(typeSpan).toHaveTextContent('项目');
  });

  it('shows type label for task', () => {
    const taskTemplate = { ...mockTemplate, type: 'task' };
    renderWithAntd(<TemplateCard template={taskTemplate} onClick={vi.fn()} />);
    expect(screen.getByText(/类型:/)).toBeInTheDocument();
    const typeSpan = screen.getByText(/类型:/);
    expect(typeSpan).toHaveTextContent('任务');
  });

  it('shows usage count', () => {
    renderWithAntd(<TemplateCard template={mockTemplate} onClick={vi.fn()} />);
    expect(screen.getByText(/使用/)).toBeInTheDocument();
    expect(screen.getByText(/15/)).toBeInTheDocument();
  });

  it('calls onClick when card is clicked', async () => {
    const onClick = vi.fn();
    renderWithAntd(<TemplateCard template={mockTemplate} onClick={onClick} />);
    await userEvent.click(screen.getByText('项目模板A'));
    expect(onClick).toHaveBeenCalledWith('1');
  });

  it('shows "暂无描述" when description is empty', () => {
    const noDescTemplate = { ...mockTemplate, description: '' };
    renderWithAntd(<TemplateCard template={noDescTemplate} onClick={vi.fn()} />);
    expect(screen.getByText('暂无描述')).toBeInTheDocument();
  });

  it('shows export button when onExport is provided', () => {
    const onExport = vi.fn();
    renderWithAntd(<TemplateCard template={mockTemplate} onClick={vi.fn()} onExport={onExport} />);
    expect(screen.getByTestId('export-btn')).toBeInTheDocument();
  });

  it('does not show export button when onExport is not provided', () => {
    renderWithAntd(<TemplateCard template={mockTemplate} onClick={vi.fn()} />);
    expect(screen.queryByTestId('export-btn')).not.toBeInTheDocument();
  });

  it('calls onExport when export button is clicked without triggering card onClick', async () => {
    const onExport = vi.fn();
    const onClick = vi.fn();
    renderWithAntd(<TemplateCard template={mockTemplate} onClick={onClick} onExport={onExport} />);
    await userEvent.click(screen.getByTestId('export-btn'));
    expect(onExport).toHaveBeenCalledWith('1');
    expect(onClick).not.toHaveBeenCalled();
  });
});
