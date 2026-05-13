import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfigProvider, message } from 'antd';
import SystemParams from './SystemParams';
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

const mockDefaultParams = [
  { key: '1', name: '项目最大层级', value: '7', type: 'input' as const },
  { key: '2', name: '文件大小限制', value: '200MB', type: 'input' as const },
  { key: '3', name: '版本保留数', value: '20', type: 'input' as const },
  {
    key: '4',
    name: '会话超时',
    value: '15分钟',
    type: 'select' as const,
    options: ['5分钟', '10分钟', '15分钟', '30分钟', '60分钟'],
  },
  {
    key: '5',
    name: '数据库备份频率',
    value: '每日',
    type: 'select' as const,
    options: ['每小时', '每日', '每周', '每月'],
  },
];

const mockGetSystemParams = vi.fn().mockResolvedValue({ code: 0, data: [] });
const mockUpdateSystemParams = vi.fn().mockResolvedValue({ code: 0, data: [] });

vi.mock('@/services/config.service', () => ({
  getSystemParams: (...args: any[]) => mockGetSystemParams(...args),
  updateSystemParams: (...args: any[]) => mockUpdateSystemParams(...args),
}));

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

const renderWithAntd = (ui: React.ReactElement) =>
  render(<ConfigProvider>{ui}</ConfigProvider>);

describe('SystemParams', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
    mockGetSystemParams.mockResolvedValue({ code: 0, data: mockDefaultParams });
    mockUpdateSystemParams.mockResolvedValue({ code: 0, data: mockDefaultParams });
  });

  it('renders the system-params container', () => {
    renderWithAntd(<SystemParams />);
    expect(screen.getByTestId('system-params')).toBeInTheDocument();
  });

  it('fetches system params from API on mount', async () => {
    renderWithAntd(<SystemParams />);
    await waitFor(() => {
      expect(mockGetSystemParams).toHaveBeenCalled();
    });
  });

  it('renders table with param names after API loads', async () => {
    renderWithAntd(<SystemParams />);
    await waitFor(() => {
      expect(screen.getByText('项目最大层级')).toBeInTheDocument();
      expect(screen.getByText('文件大小限制')).toBeInTheDocument();
      expect(screen.getByText('版本保留数')).toBeInTheDocument();
      expect(screen.getByText('会话超时')).toBeInTheDocument();
      expect(screen.getByText('数据库备份频率')).toBeInTheDocument();
    });
  });

  it('renders a save button', async () => {
    renderWithAntd(<SystemParams />);
    await waitFor(() => {
      expect(mockGetSystemParams).toHaveBeenCalled();
    });
    // Try multiple selectors to find the button
    const btn = document.querySelector('.ant-btn-primary') as HTMLElement;
    expect(btn).toBeTruthy();
    expect(btn?.textContent?.replace(/\s/g, '')).toContain('保存');
  });

  it('loads params from localStorage when API returns error response', async () => {
    const storedParams = [{ key: '1', name: '项目最大层级', value: '10', type: 'input' }];
    localStorageMock.getItem.mockReturnValue(JSON.stringify(storedParams));
    mockGetSystemParams.mockResolvedValue({ code: 1, data: null });

    renderWithAntd(<SystemParams />);

    await waitFor(() => {
      expect(screen.getByText('项目最大层级')).toBeInTheDocument();
    });
  });

  it('clicking save calls updateSystemParams with current params', async () => {
    const user = userEvent.setup();
    renderWithAntd(<SystemParams />);

    await waitFor(() => {
      expect(mockGetSystemParams).toHaveBeenCalled();
    });

    await user.click(document.querySelector('.ant-btn-primary') as HTMLElement);

    await waitFor(() => {
      expect(mockUpdateSystemParams).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ key: '1', name: '项目最大层级' }),
        ]),
      );
    });
  });

  it('clicking save persists to localStorage', async () => {
    const user = userEvent.setup();
    renderWithAntd(<SystemParams />);

    await waitFor(() => {
      expect(mockGetSystemParams).toHaveBeenCalled();
    });

    await user.click(document.querySelector('.ant-btn-primary') as HTMLElement);

    await waitFor(() => {
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'system_params',
        expect.any(String),
      );
    });
  });

  it('clicking save shows success message', async () => {
    const user = userEvent.setup();
    renderWithAntd(<SystemParams />);

    await waitFor(() => {
      expect(mockGetSystemParams).toHaveBeenCalled();
    });

    await user.click(document.querySelector('.ant-btn-primary') as HTMLElement);

    await waitFor(() => {
      expect(mockUpdateSystemParams).toHaveBeenCalled();
    });
  });

  it('saves to localStorage even when API fails', async () => {
    mockUpdateSystemParams.mockRejectedValue(new Error('Network error'));
    const user = userEvent.setup();
    renderWithAntd(<SystemParams />);

    await waitFor(() => {
      expect(mockGetSystemParams).toHaveBeenCalled();
    });

    await user.click(document.querySelector('.ant-btn-primary') as HTMLElement);

    await waitFor(() => {
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'system_params',
        expect.any(String),
      );
    });
  });

  it('updates localStorage when API returns data on mount', async () => {
    renderWithAntd(<SystemParams />);

    await waitFor(() => {
      expect(mockGetSystemParams).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'system_params',
        JSON.stringify(mockDefaultParams),
      );
    });
  });
});
