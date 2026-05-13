import { render, screen, fireEvent } from '@testing-library/react';
import { ConfigProvider } from 'antd';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TemplateSelectModal from './TemplateSelectModal';

vi.mock('./TemplateSelectModal.module.css', () => ({
  default: {
    modal: 'modal',
    splitLayout: 'splitLayout',
    leftPanel: 'leftPanel',
    grid: 'grid',
    card: 'card',
    cardSelected: 'cardSelected',
    cardIcon: 'cardIcon',
    cardContent: 'cardContent',
    cardName: 'cardName',
    cardDesc: 'cardDesc',
    cardMeta: 'cardMeta',
    rightPanel: 'rightPanel',
    previewTitle: 'previewTitle',
    treeContainer: 'treeContainer',
    tree: 'tree',
    treeRoot: 'treeRoot',
    treeIcon: 'treeIcon',
    treeItem: 'treeItem',
    treeArrow: 'treeArrow',
    treeNode: 'treeNode',
    treeChild: 'treeChild',
    treeEmpty: 'treeEmpty',
    treePlaceholder: 'treePlaceholder',
    footer: 'footer',
    footerHint: 'footerHint',
  },
}));

const mockTemplates = [
  {
    id: '1',
    name: '标准项目模板',
    type: 'project',
    description: '适用于标准项目',
    usageCount: 15,
    createdAt: '2026-01-01',
    tasks: [
      { id: 't1', name: '需求分析', children: [{ id: 'c1', name: '需求评审' }] },
      { id: 't2', name: '设计开发' },
    ],
  },
  {
    id: '2',
    name: '紧急任务模板',
    type: 'task',
    description: '适用于紧急任务',
    usageCount: 8,
    createdAt: '2026-02-01',
    tasks: [],
  },
];

const mockOnClose = vi.fn();
const mockOnApply = vi.fn();

const renderWithAntd = (ui: React.ReactElement) =>
  render(<ConfigProvider>{ui}</ConfigProvider>);

describe('TemplateSelectModal', () => {
  beforeEach(() => {
    mockOnClose.mockClear();
    mockOnApply.mockClear();
  });

  it('renders modal when open', () => {
    renderWithAntd(
      <TemplateSelectModal
        templates={mockTemplates}
        open={true}
        onClose={mockOnClose}
        onApply={mockOnApply}
      />
    );
    expect(screen.getByText('选择模板')).toBeInTheDocument();
  });

  it('displays template cards', () => {
    renderWithAntd(
      <TemplateSelectModal
        templates={mockTemplates}
        open={true}
        onClose={mockOnClose}
        onApply={mockOnApply}
      />
    );
    expect(screen.getByText('标准项目模板')).toBeInTheDocument();
    expect(screen.getByText('紧急任务模板')).toBeInTheDocument();
  });

  it('displays template descriptions', () => {
    renderWithAntd(
      <TemplateSelectModal
        templates={mockTemplates}
        open={true}
        onClose={mockOnClose}
        onApply={mockOnApply}
      />
    );
    expect(screen.getByText('适用于标准项目')).toBeInTheDocument();
    expect(screen.getByText('适用于紧急任务')).toBeInTheDocument();
  });

  it('displays template usage counts', () => {
    renderWithAntd(
      <TemplateSelectModal
        templates={mockTemplates}
        open={true}
        onClose={mockOnClose}
        onApply={mockOnApply}
      />
    );
    expect(screen.getByText('使用 15 次')).toBeInTheDocument();
    expect(screen.getByText('使用 8 次')).toBeInTheDocument();
  });

  it('shows preview placeholder when no template selected', () => {
    renderWithAntd(
      <TemplateSelectModal
        templates={mockTemplates}
        open={true}
        onClose={mockOnClose}
        onApply={mockOnApply}
      />
    );
    expect(screen.getByText('选择左侧模板查看结构预览')).toBeInTheDocument();
  });

  it('shows template structure when card is clicked', () => {
    renderWithAntd(
      <TemplateSelectModal
        templates={mockTemplates}
        open={true}
        onClose={mockOnClose}
        onApply={mockOnApply}
      />
    );
    fireEvent.click(screen.getByTestId('template-card-1'));
    expect(screen.getByText('模板结构预览')).toBeInTheDocument();
    expect(screen.getByText('需求分析')).toBeInTheDocument();
    expect(screen.getByText('设计开发')).toBeInTheDocument();
  });

  it('displays footer hint text', () => {
    renderWithAntd(
      <TemplateSelectModal
        templates={mockTemplates}
        open={true}
        onClose={mockOnClose}
        onApply={mockOnApply}
      />
    );
    expect(screen.getByText('请选择一个模板')).toBeInTheDocument();
  });

  it('shows empty state when no templates', () => {
    renderWithAntd(
      <TemplateSelectModal
        templates={[]}
        open={true}
        onClose={mockOnClose}
        onApply={mockOnApply}
      />
    );
    expect(screen.getByText('暂无模板')).toBeInTheDocument();
  });

  it('enables apply button after selecting template', () => {
    renderWithAntd(
      <TemplateSelectModal
        templates={mockTemplates}
        open={true}
        onClose={mockOnClose}
        onApply={mockOnApply}
      />
    );
    const applyBtn = screen.getByText('应用模板').closest('button')!;
    expect(applyBtn).toBeDisabled();
    fireEvent.click(screen.getByTestId('template-card-1'));
    expect(applyBtn).not.toBeDisabled();
  });
});
