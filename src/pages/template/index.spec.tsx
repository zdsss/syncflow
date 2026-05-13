import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfigProvider, message } from 'antd';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TemplatePage from './index';

vi.mock('antd', async (importOriginal) => {
  const actual = await importOriginal<typeof import('antd')>();
  return {
    ...actual,
    message: {
      ...actual.message,
      error: vi.fn(),
    },
  };
});

const mockTemplates = [
  { id: 't1', name: 'Template A', type: 'project', description: 'Desc A', usageCount: 5, createdAt: '2026-05-01' },
  { id: 't2', name: 'Template B', type: 'task', description: 'Desc B', usageCount: 3, createdAt: '2026-05-02' },
];

const mockGetTemplates = vi.fn();

vi.mock('@/services/template.service', () => ({
  getTemplates: (...args: any[]) => mockGetTemplates(...args),
}));

vi.mock('./components/TemplateGrid', () => ({
  default: (props: any) => (
    <div data-testid="template-grid">
      <span data-testid="template-count">{props.templates?.length ?? 0}</span>
      <button data-testid="click-template" onClick={() => props.onClick?.('t1')}>Click</button>
    </div>
  ),
}));

vi.mock('./TemplateDetail', () => ({
  default: (props: any) => (
    props.open && props.template ? (
      <div data-testid="template-detail">
        <span data-testid="detail-template-id">{props.template.id}</span>
        <span data-testid="detail-template-name">{props.template.name}</span>
        <button data-testid="detail-close" onClick={props.onClose}>Close</button>
        <button data-testid="detail-apply" onClick={() => props.onApply?.(props.template.id)}>Apply</button>
      </div>
    ) : null
  ),
}));

vi.mock('./ApplyTemplateModal', () => ({
  default: (props: any) => (
    props.open && props.templateId ? (
      <div data-testid="apply-modal">
        <span data-testid="apply-template-id">{props.templateId}</span>
        <button data-testid="apply-close" onClick={props.onClose}>Close</button>
        <button data-testid="apply-success" onClick={props.onSuccess}>Success</button>
      </div>
    ) : null
  ),
}));

const renderWithAntd = (ui: React.ReactElement) =>
  render(<ConfigProvider>{ui}</ConfigProvider>);

describe('TemplatePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetTemplates.mockResolvedValue({ code: 0, data: mockTemplates });
  });

  it('renders the page title', async () => {
    renderWithAntd(<TemplatePage />);
    expect(screen.getByText('模板定义')).toBeTruthy();
  });

  it('shows the search input', () => {
    renderWithAntd(<TemplatePage />);
    expect(screen.getByPlaceholderText('搜索模板...')).toBeTruthy();
  });

  it('shows the add template button', () => {
    renderWithAntd(<TemplatePage />);
    expect(screen.getByText('新建模板')).toBeTruthy();
  });

  it('shows the type filter select', () => {
    renderWithAntd(<TemplatePage />);
    expect(screen.getByText('筛选类型')).toBeTruthy();
  });

  it('fetches templates on mount', async () => {
    renderWithAntd(<TemplatePage />);
    await waitFor(() => {
      expect(mockGetTemplates).toHaveBeenCalled();
    });
  });

  it('passes fetched templates to TemplateGrid', async () => {
    renderWithAntd(<TemplatePage />);
    await waitFor(() => {
      expect(screen.getByTestId('template-count').textContent).toBe('2');
    });
  });

  it('renders TemplateGrid child component', async () => {
    renderWithAntd(<TemplatePage />);
    await waitFor(() => {
      expect(screen.getByTestId('template-grid')).toBeTruthy();
    });
  });

  it('opens TemplateDetail drawer when a template card is clicked', async () => {
    const user = userEvent.setup();
    renderWithAntd(<TemplatePage />);
    await waitFor(() => {
      expect(screen.getByTestId('template-grid')).toBeTruthy();
    });
    await user.click(screen.getByTestId('click-template'));
    await waitFor(() => {
      expect(screen.getByTestId('template-detail')).toBeTruthy();
      expect(screen.getByTestId('detail-template-id').textContent).toBe('t1');
    });
  });

  it('logs error when fetch templates fails', async () => {
    mockGetTemplates.mockRejectedValueOnce(new Error('network error'));
    renderWithAntd(<TemplatePage />);
    await waitFor(() => {
      expect(message.error).toHaveBeenCalledWith('加载模板失败');
    });
  });

  it('updates search keyword when typing in search input', async () => {
    const user = userEvent.setup();
    renderWithAntd(<TemplatePage />);
    const input = screen.getByPlaceholderText('搜索模板...');
    await user.type(input, 'project');
    expect(input).toHaveValue('project');
  });

  it('refetches templates with type filter when select changes', async () => {
    const user = userEvent.setup();
    renderWithAntd(<TemplatePage />);
    // Wait for initial fetch
    await waitFor(() => {
      expect(mockGetTemplates).toHaveBeenCalledTimes(1);
    });

    // Open the Select dropdown and choose "项目模板"
    const select = screen.getByText('筛选类型').closest('.ant-select') ?? screen.getByText('筛选类型').closest('div')!;
    await user.click(select);
    await waitFor(() => {
      expect(screen.getByText('项目模板')).toBeInTheDocument();
    });
    await user.click(screen.getByText('项目模板'));

    // Should trigger a re-fetch due to typeFilter changing
    await waitFor(() => {
      expect(mockGetTemplates).toHaveBeenCalledTimes(2);
      expect(mockGetTemplates).toHaveBeenLastCalledWith({ type: 'project' });
    });
  });

  it('opens ApplyTemplateModal when apply is triggered from detail', async () => {
    const user = userEvent.setup();
    renderWithAntd(<TemplatePage />);
    await waitFor(() => {
      expect(screen.getByTestId('template-grid')).toBeTruthy();
    });
    // Open detail
    await user.click(screen.getByTestId('click-template'));
    await waitFor(() => {
      expect(screen.getByTestId('template-detail')).toBeTruthy();
    });
    // Click apply in detail
    await user.click(screen.getByTestId('detail-apply'));
    await waitFor(() => {
      expect(screen.getByTestId('apply-modal')).toBeTruthy();
      expect(screen.getByTestId('apply-template-id').textContent).toBe('t1');
    });
  });

  it('closes detail drawer and refetches after successful apply', async () => {
    const user = userEvent.setup();
    renderWithAntd(<TemplatePage />);
    await waitFor(() => {
      expect(screen.getByTestId('template-grid')).toBeTruthy();
    });
    // Open detail
    await user.click(screen.getByTestId('click-template'));
    await waitFor(() => {
      expect(screen.getByTestId('template-detail')).toBeTruthy();
    });
    // Open apply modal
    await user.click(screen.getByTestId('detail-apply'));
    await waitFor(() => {
      expect(screen.getByTestId('apply-modal')).toBeTruthy();
    });
    // Trigger success
    await user.click(screen.getByTestId('apply-success'));
    await waitFor(() => {
      expect(screen.queryByTestId('template-detail')).not.toBeTruthy();
      expect(screen.queryByTestId('apply-modal')).not.toBeTruthy();
      // Refetch should have been called
      expect(mockGetTemplates).toHaveBeenCalledTimes(2);
    });
  });
});
