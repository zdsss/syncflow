import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfigProvider, message } from 'antd';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TemplateDetail from './TemplateDetail';

vi.mock('antd', async (importOriginal) => {
  const actual = await importOriginal<typeof import('antd')>();
  return {
    ...actual,
    message: {
      ...actual.message,
      success: vi.fn(),
      error: vi.fn(),
      info: vi.fn(),
    },
  };
});

const mockTemplate = {
  id: 't1',
  name: '项目管理模板',
  type: 'project',
  description: '适用于通用项目管理场景',
  usageCount: 5,
  createdAt: '2026-05-01',
};

const mockPreviewData = {
  code: 0,
  data: {
    phases: [
      {
        name: '需求阶段',
        tasks: [
          { name: '需求调研', priority: 'high' },
          { name: '需求评审', priority: 'medium' },
        ],
      },
      {
        name: '开发阶段',
        tasks: [
          { name: '编码开发', priority: 'high' },
          { name: '单元测试', priority: 'medium' },
        ],
      },
    ],
  },
};

const mockPreviewTemplate = vi.fn();
const mockDuplicateTemplate = vi.fn();
const mockDeleteTemplate = vi.fn();
const mockOnClose = vi.fn();
const mockOnApply = vi.fn();

vi.mock('@/services/template.service', () => ({
  previewTemplate: (...args: any[]) => mockPreviewTemplate(...args),
  duplicateTemplate: (...args: any[]) => mockDuplicateTemplate(...args),
  deleteTemplate: (...args: any[]) => mockDeleteTemplate(...args),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => vi.fn() };
});

const renderWithAntd = (ui: React.ReactElement) =>
  render(<ConfigProvider>{ui}</ConfigProvider>);

describe('TemplateDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPreviewTemplate.mockResolvedValue(mockPreviewData);
    mockDuplicateTemplate.mockResolvedValue({ code: 0, data: { id: 't2' } });
    mockDeleteTemplate.mockResolvedValue({ code: 0 });
  });

  it('renders template name in the drawer', () => {
    renderWithAntd(
      <TemplateDetail
        template={mockTemplate}
        open={true}
        onClose={mockOnClose}
        onApply={mockOnApply}
      />
    );
    expect(screen.getByText('项目管理模板')).toBeInTheDocument();
  });

  it('renders template description', () => {
    renderWithAntd(
      <TemplateDetail
        template={mockTemplate}
        open={true}
        onClose={mockOnClose}
        onApply={mockOnApply}
      />
    );
    expect(screen.getByText('适用于通用项目管理场景')).toBeInTheDocument();
  });

  it('renders template type tag', () => {
    renderWithAntd(
      <TemplateDetail
        template={mockTemplate}
        open={true}
        onClose={mockOnClose}
        onApply={mockOnApply}
      />
    );
    expect(screen.getByText('项目模板')).toBeInTheDocument();
  });

  it('fetches preview data when opened', async () => {
    renderWithAntd(
      <TemplateDetail
        template={mockTemplate}
        open={true}
        onClose={mockOnClose}
        onApply={mockOnApply}
      />
    );
    await waitFor(() => {
      expect(mockPreviewTemplate).toHaveBeenCalledWith('t1');
    });
  });

  it('displays phases and tasks from preview data', async () => {
    renderWithAntd(
      <TemplateDetail
        template={mockTemplate}
        open={true}
        onClose={mockOnClose}
        onApply={mockOnApply}
      />
    );
    await waitFor(() => {
      expect(screen.getByText('需求阶段')).toBeInTheDocument();
      expect(screen.getByText('需求调研')).toBeInTheDocument();
      expect(screen.getByText('需求评审')).toBeInTheDocument();
      expect(screen.getByText('开发阶段')).toBeInTheDocument();
      expect(screen.getByText('编码开发')).toBeInTheDocument();
      expect(screen.getByText('单元测试')).toBeInTheDocument();
    });
  });

  it('shows apply button', () => {
    renderWithAntd(
      <TemplateDetail
        template={mockTemplate}
        open={true}
        onClose={mockOnClose}
        onApply={mockOnApply}
      />
    );
    expect(screen.getByText('应用模板')).toBeInTheDocument();
  });

  it('calls onApply when apply button is clicked', async () => {
    const user = userEvent.setup();
    renderWithAntd(
      <TemplateDetail
        template={mockTemplate}
        open={true}
        onClose={mockOnClose}
        onApply={mockOnApply}
      />
    );
    await user.click(screen.getByText('应用模板'));
    expect(mockOnApply).toHaveBeenCalledWith('t1');
  });

  it('shows duplicate button', () => {
    renderWithAntd(
      <TemplateDetail
        template={mockTemplate}
        open={true}
        onClose={mockOnClose}
        onApply={mockOnApply}
      />
    );
    expect(screen.getByText('复制模板')).toBeInTheDocument();
  });

  it('calls duplicateTemplate API and shows success on duplicate click', async () => {
    const user = userEvent.setup();
    renderWithAntd(
      <TemplateDetail
        template={mockTemplate}
        open={true}
        onClose={mockOnClose}
        onApply={mockOnApply}
      />
    );
    await user.click(screen.getByText('复制模板'));
    await waitFor(() => {
      expect(mockDuplicateTemplate).toHaveBeenCalledWith('t1');
      expect(message.success).toHaveBeenCalledWith('模板复制成功');
    });
  });

  it('shows delete button with Popconfirm', async () => {
    const user = userEvent.setup();
    renderWithAntd(
      <TemplateDetail
        template={mockTemplate}
        open={true}
        onClose={mockOnClose}
        onApply={mockOnApply}
      />
    );
    const deleteBtn = screen.getByText('删除');
    expect(deleteBtn).toBeInTheDocument();
    await user.click(deleteBtn);
    await waitFor(() => {
      expect(screen.getByText('确定删除该模板吗？')).toBeInTheDocument();
    });
  });

  it('returns null when template is null', () => {
    const { container } = renderWithAntd(
      <TemplateDetail
        template={null}
        open={true}
        onClose={mockOnClose}
        onApply={mockOnApply}
      />
    );
    expect(container.innerHTML).toBe('');
  });

  it('shows usage count', () => {
    renderWithAntd(
      <TemplateDetail
        template={mockTemplate}
        open={true}
        onClose={mockOnClose}
        onApply={mockOnApply}
      />
    );
    expect(screen.getByText('使用 5 次')).toBeInTheDocument();
  });
});
