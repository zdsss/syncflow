import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfigProvider, message } from 'antd';
import DictionaryManagement from './DictionaryManagement';

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

const mockDicts = [
  { id: 'dict1', code: 'task_priority', name: '任务优先级', status: 1, description: '优先级描述' },
  { id: 'dict2', code: 'task_status', name: '任务状态', status: 1, description: '状态描述' },
];

const mockDictValues = [
  { id: 'val1', code: 'high', value: '高', sortOrder: 1, status: 1, dictId: 'dict1' },
  { id: 'val2', code: 'medium', value: '中', sortOrder: 2, status: 1, dictId: 'dict1' },
  { id: 'val3', code: 'low', value: '低', sortOrder: 3, status: 0, dictId: 'dict1' },
];

const mockGetDictionaries = vi.fn().mockResolvedValue({ code: 0, data: mockDicts });
const mockCreateDictionary = vi.fn().mockResolvedValue({ code: 0, data: { id: 'dict-new' } });
const mockUpdateDictionary = vi.fn().mockResolvedValue({ code: 0, data: {} });
const mockDeleteDictionary = vi.fn().mockResolvedValue({ code: 0, data: null });
const mockGetDictionaryValues = vi.fn().mockResolvedValue({ code: 0, data: mockDictValues });
const mockCreateDictionaryValue = vi.fn().mockResolvedValue({ code: 0, data: { id: 'val-new' } });
const mockUpdateDictionaryValue = vi.fn().mockResolvedValue({ code: 0, data: {} });
const mockDeleteDictionaryValue = vi.fn().mockResolvedValue({ code: 0, data: null });

vi.mock('@/services/config.service', () => ({
  getDictionaries: (...args: any[]) => mockGetDictionaries(...args),
  createDictionary: (...args: any[]) => mockCreateDictionary(...args),
  updateDictionary: (...args: any[]) => mockUpdateDictionary(...args),
  deleteDictionary: (...args: any[]) => mockDeleteDictionary(...args),
  getDictionaryValues: (...args: any[]) => mockGetDictionaryValues(...args),
  createDictionaryValue: (...args: any[]) => mockCreateDictionaryValue(...args),
  updateDictionaryValue: (...args: any[]) => mockUpdateDictionaryValue(...args),
  deleteDictionaryValue: (...args: any[]) => mockDeleteDictionaryValue(...args),
}));

const renderWithAntd = (ui: React.ReactElement) =>
  render(<ConfigProvider>{ui}</ConfigProvider>);

describe('DictionaryManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetDictionaries.mockResolvedValue({ code: 0, data: mockDicts });
    mockGetDictionaryValues.mockResolvedValue({ code: 0, data: mockDictValues });
  });

  it('renders the dictionary management container', async () => {
    renderWithAntd(<DictionaryManagement />);
    expect(screen.getByTestId('dictionary-management')).toBeInTheDocument();
    await waitFor(() => {
      expect(mockGetDictionaries).toHaveBeenCalled();
    });
  });

  it('displays dictionary list after loading', async () => {
    renderWithAntd(<DictionaryManagement />);
    await waitFor(() => {
      expect(screen.getByText('任务优先级')).toBeInTheDocument();
      expect(screen.getByText('任务状态')).toBeInTheDocument();
    });
  });

  it('auto-selects first dictionary and loads values', async () => {
    renderWithAntd(<DictionaryManagement />);
    await waitFor(() => {
      expect(screen.getByText('任务优先级')).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(mockGetDictionaryValues).toHaveBeenCalledWith('dict1');
    });
  });

  it('displays dictionary values for selected dict', async () => {
    renderWithAntd(<DictionaryManagement />);
    await waitFor(() => {
      expect(screen.getByText('高')).toBeInTheDocument();
      expect(screen.getByText('中')).toBeInTheDocument();
      expect(screen.getByText('低')).toBeInTheDocument();
    });
  });

  it('shows value status labels', async () => {
    renderWithAntd(<DictionaryManagement />);
    await waitFor(() => {
      expect(screen.getAllByText('启用').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('禁用').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('opens add dict modal when clicking add button', async () => {
    const user = userEvent.setup();
    renderWithAntd(<DictionaryManagement />);
    await waitFor(() => {
      expect(mockGetDictionaries).toHaveBeenCalled();
    });
    const addBtn = screen.getByText('新增');
    await user.click(addBtn);
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('新增字典')).toBeInTheDocument();
    });
  });

  it('handles delete dictionary action', async () => {
    const user = userEvent.setup();
    renderWithAntd(<DictionaryManagement />);
    await waitFor(() => {
      expect(screen.getByText('任务优先级')).toBeInTheDocument();
    });
    const deleteButtons = document.querySelectorAll('.ant-btn-icon-only.ant-btn-dangerous');
    expect(deleteButtons.length).toBeGreaterThan(0);
    await user.click(deleteButtons[0] as HTMLElement);
    await waitFor(() => {
      const confirmBtn = document.querySelector('.ant-popconfirm-buttons .ant-btn-primary') as HTMLElement;
      expect(confirmBtn).toBeTruthy();
    });
    const confirmBtn = document.querySelector('.ant-popconfirm-buttons .ant-btn-primary') as HTMLElement;
    await user.click(confirmBtn);
    await waitFor(() => {
      expect(mockDeleteDictionary).toHaveBeenCalledWith('dict1');
    });
  });

  it('opens add value modal', async () => {
    const user = userEvent.setup();
    renderWithAntd(<DictionaryManagement />);
    await waitFor(() => {
      expect(screen.getByText('高')).toBeInTheDocument();
    });
    const addValueBtn = screen.getByRole('button', { name: /新增字典值/ });
    await user.click(addValueBtn);
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });
});
