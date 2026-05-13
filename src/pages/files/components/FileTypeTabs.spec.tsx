import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfigProvider } from 'antd';
import FileTypeTabs from './FileTypeTabs';

const mockSetFileTypeTab = vi.fn();

vi.mock('@/stores/useFileStore', () => ({
  useFileStore: () => ({
    fileTypeTab: 'all',
    setFileTypeTab: mockSetFileTypeTab,
  }),
}));

const renderWithAntd = (ui: React.ReactElement) =>
  render(<ConfigProvider>{ui}</ConfigProvider>);

describe('FileTypeTabs', () => {
  beforeEach(() => {
    mockSetFileTypeTab.mockClear();
  });

  it('renders all tab labels', () => {
    renderWithAntd(<FileTypeTabs />);
    expect(screen.getByText('全部')).toBeInTheDocument();
    expect(screen.getByText('文档')).toBeInTheDocument();
    expect(screen.getByText('图片')).toBeInTheDocument();
    expect(screen.getByText('代码')).toBeInTheDocument();
  });

  it('shows "全部" as active tab', () => {
    renderWithAntd(<FileTypeTabs />);
    const allTab = screen.getByText('全部').closest('[role="tab"]');
    expect(allTab).toHaveAttribute('aria-selected', 'true');
  });

  it('calls setFileTypeTab when clicking another tab', async () => {
    const user = userEvent.setup();
    renderWithAntd(<FileTypeTabs />);
    await user.click(screen.getByText('文档'));
    expect(mockSetFileTypeTab).toHaveBeenCalledWith('document');
  });

  it('renders 4 tabs total', () => {
    renderWithAntd(<FileTypeTabs />);
    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(4);
  });
});
