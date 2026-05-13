import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfigProvider } from 'antd';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SearchPage from './index';

vi.mock('@/services/search.service', () => ({
  search: vi.fn(),
}));

const renderWithProviders = (ui: React.ReactElement, initialEntries: string[] = ['/search?q=test']) =>
  render(
    <ConfigProvider>
      <MemoryRouter initialEntries={initialEntries}>
        {ui}
      </MemoryRouter>
    </ConfigProvider>
  );

describe('SearchPage', () => {
  let searchMock: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();
    searchMock = (await import('@/services/search.service')).search as ReturnType<typeof vi.fn>;
    searchMock.mockReset();
  });

  it('renders search results page with query from URL', async () => {
    searchMock.mockResolvedValue({
      data: {
        data: {
          projects: [{ id: 'p1', name: 'Test Project', status: 'in_progress' }],
          tasks: [{ id: 't1', name: 'Test Task', status: 'in_progress', priority: 'high' }],
          files: [],
          bomItems: [],
          articles: [],
          users: [],
        },
      },
    });

    renderWithProviders(<SearchPage />, ['/search?q=test']);
    expect(screen.getByTestId('search-title')).toHaveTextContent('搜索结果: test');
    // Use function matcher because highlightMatch splits text across mark elements
    expect(await screen.findByText((_, node) => node?.textContent === 'Test Project')).toBeInTheDocument();
    expect(screen.getByText((_, node) => node?.textContent === 'Test Task')).toBeInTheDocument();
    expect(screen.getByTestId('group-project')).toBeInTheDocument();
    expect(screen.getByTestId('group-task')).toBeInTheDocument();
  });

  it('calls search service with query param', async () => {
    searchMock.mockResolvedValue({
      data: { data: { projects: [], tasks: [], files: [], bomItems: [], articles: [], users: [] } },
    });

    renderWithProviders(<SearchPage />, ['/search?q=battery']);
    await waitFor(() => {
      expect(searchMock).toHaveBeenCalledWith('battery');
    });
  });

  it('shows empty state when no query is provided', () => {
    searchMock.mockResolvedValue({
      data: { data: { projects: [], tasks: [], files: [], bomItems: [], articles: [], users: [] } },
    });

    renderWithProviders(<SearchPage />, ['/search']);
    expect(screen.getByText('请输入搜索关键词')).toBeInTheDocument();
  });

  it('shows empty state when search returns no results', async () => {
    searchMock.mockResolvedValue({
      data: { data: { projects: [], tasks: [], files: [], bomItems: [], articles: [], users: [] } },
    });

    renderWithProviders(<SearchPage />, ['/search?q=nonexistent']);
    expect(await screen.findByText('未找到匹配的结果')).toBeInTheDocument();
  });
});
