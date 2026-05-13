import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfigProvider, message } from 'antd';
import CodeManagement from './CodeManagement';
import * as configService from '@/services/config.service';

vi.mock('antd', async (importOriginal) => {
  const actual = await importOriginal<typeof import('antd')>();
  return {
    ...actual,
    message: {
      ...actual.message,
      success: vi.fn(),
      error: vi.fn(),
    },
  };
});

const mockCodes = [
  { id: 'code1', code: 'PRJ-001', description: '项目编码规则', type: 'project', status: 1, createdAt: '2025-01-10T00:00:00Z' },
  { id: 'code2', code: 'TSK-001', description: '任务编码规则', type: 'task', status: 1, createdAt: '2025-01-15T00:00:00Z' },
  { id: 'code3', code: 'FILE-001', description: '文件编码规则', type: 'file', status: 1, createdAt: '2025-02-01T00:00:00Z' },
  { id: 'code4', code: 'BOM-001', description: 'BOM编码规则', type: 'project', status: 0, createdAt: '2025-02-10T00:00:00Z' },
  { id: 'code5', code: 'DOC-001', description: '文档编码规则', type: 'file', status: 1, createdAt: '2025-03-01T00:00:00Z' },
];

const mockGetCodeEntries = vi.fn().mockResolvedValue({ code: 0, data: mockCodes });
const mockCreateCodeEntry = vi.fn().mockResolvedValue({ code: 0, data: { id: 'code-new' } });
const mockUpdateCodeEntry = vi.fn().mockResolvedValue({ code: 0, data: {} });
const mockDeleteCodeEntry = vi.fn().mockResolvedValue({ code: 0, data: null });

vi.mock('@/services/config.service', () => ({
  getCodeEntries: (...args: any[]) => mockGetCodeEntries(...args),
  createCodeEntry: (...args: any[]) => mockCreateCodeEntry(...args),
  updateCodeEntry: (...args: any[]) => mockUpdateCodeEntry(...args),
  deleteCodeEntry: (...args: any[]) => mockDeleteCodeEntry(...args),
}));

const renderWithAntd = (ui: React.ReactElement) =>
  render(<ConfigProvider>{ui}</ConfigProvider>);

describe('CodeManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCodeEntries.mockResolvedValue({ code: 0, data: mockCodes });
  });

  it('renders the code management table', async () => {
    renderWithAntd(<CodeManagement />);
    expect(screen.getByTestId('code-management-page')).toBeInTheDocument();
    await waitFor(() => {
      expect(mockGetCodeEntries).toHaveBeenCalled();
    });
  });

  it('shows code entries in the table', async () => {
    renderWithAntd(<CodeManagement />);
    await waitFor(() => {
      expect(screen.getByText('PRJ-001')).toBeInTheDocument();
      expect(screen.getByText('TSK-001')).toBeInTheDocument();
      expect(screen.getByText('FILE-001')).toBeInTheDocument();
      expect(screen.getByText('项目编码规则')).toBeInTheDocument();
      expect(screen.getByText('任务编码规则')).toBeInTheDocument();
    });
  });

  it('opens add modal when clicking add button', async () => {
    const user = userEvent.setup();
    renderWithAntd(<CodeManagement />);

    await waitFor(() => {
      expect(mockGetCodeEntries).toHaveBeenCalled();
    });

    const addBtn = screen.getByTestId('add-code-btn');
    await user.click(addBtn);

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  it('handles delete confirm', async () => {
    const user = userEvent.setup();
    renderWithAntd(<CodeManagement />);

    await waitFor(() => {
      expect(screen.getByText('PRJ-001')).toBeInTheDocument();
    });

    const deleteBtn = screen.getByTestId('delete-code1');
    await user.click(deleteBtn);

    await waitFor(() => {
      const confirmBtn = document.querySelector('.ant-popconfirm-buttons .ant-btn-primary') as HTMLElement;
      expect(confirmBtn).toBeTruthy();
    });

    const confirmBtn = document.querySelector('.ant-popconfirm-buttons .ant-btn-primary') as HTMLElement;
    await user.click(confirmBtn);

    await waitFor(() => {
      expect(mockDeleteCodeEntry).toHaveBeenCalledWith('code1');
    });
  });
});
