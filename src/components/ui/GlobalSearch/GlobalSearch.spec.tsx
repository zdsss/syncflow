import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfigProvider } from 'antd';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import GlobalSearch from './GlobalSearch';

const mockNavigate = vi.fn();

const mockStorage: Record<string, string> = {};
const mockLocalStorage = {
  getItem: vi.fn((key: string) => mockStorage[key] ?? null),
  setItem: vi.fn((key: string, value: string) => { mockStorage[key] = value; }),
  removeItem: vi.fn((key: string) => { delete mockStorage[key]; }),
  clear: vi.fn(() => { Object.keys(mockStorage).forEach(k => delete mockStorage[k]); }),
};
vi.stubGlobal('localStorage', mockLocalStorage);

vi.mock('@/services/search.service', () => ({
  search: vi.fn(),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

const renderWithAntd = (ui: React.ReactElement) =>
  render(<ConfigProvider>{ui}</ConfigProvider>);

describe('GlobalSearch', () => {
  let searchMock: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    Object.keys(mockStorage).forEach(k => delete mockStorage[k]);
    vi.clearAllMocks();
    searchMock = (await import('@/services/search.service')).search as ReturnType<typeof vi.fn>;
    searchMock.mockReset();
  });

  it('returns null when not visible', () => {
    renderWithAntd(<GlobalSearch />);
    expect(screen.queryByPlaceholderText('搜索项目、任务、文件、物料、知识库...')).not.toBeInTheDocument();
  });

  it('shows search input when Cmd+K is pressed', async () => {
    renderWithAntd(<GlobalSearch />);
    fireEvent.keyDown(window, { key: 'k', metaKey: true });
    expect(await screen.findByPlaceholderText('搜索项目、任务、文件、物料、知识库...')).toBeInTheDocument();
  });

  it('shows hint text when no query is entered', async () => {
    renderWithAntd(<GlobalSearch />);
    fireEvent.keyDown(window, { key: 'k', metaKey: true });
    expect(await screen.findByText('输入关键词搜索项目、任务、文件、物料、知识库...')).toBeInTheDocument();
  });

  it('shows ESC shortcut hint', async () => {
    renderWithAntd(<GlobalSearch />);
    fireEvent.keyDown(window, { key: 'k', metaKey: true });
    expect(await screen.findByText('ESC')).toBeInTheDocument();
  });

  it('hides when Escape is pressed', async () => {
    renderWithAntd(<GlobalSearch />);
    fireEvent.keyDown(window, { key: 'k', metaKey: true });
    await screen.findByPlaceholderText('搜索项目、任务、文件、物料、知识库...');
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByPlaceholderText('搜索项目、任务、文件、物料、知识库...')).not.toBeInTheDocument();
  });

  it('calls search service after debounce when typing', async () => {
    searchMock.mockResolvedValue({
      data: { data: { projects: [], tasks: [], files: [], bomItems: [], articles: [], users: [] } },
    });

    const user = userEvent.setup();
    renderWithAntd(<GlobalSearch />);
    fireEvent.keyDown(window, { key: 'k', metaKey: true });
    const input = await screen.findByPlaceholderText('搜索项目、任务、文件、物料、知识库...');
    await user.type(input, 'test');

    await waitFor(() => {
      expect(searchMock).toHaveBeenCalledWith('test');
    });
  });

  it('searches and shows matching project results', async () => {
    searchMock.mockResolvedValue({
      data: {
        data: {
          projects: [{ id: 'p1', name: 'Test Project', status: 'in_progress' }],
          tasks: [],
          files: [],
          bomItems: [],
          articles: [],
          users: [],
        },
      },
    });

    const user = userEvent.setup();
    renderWithAntd(<GlobalSearch />);
    fireEvent.keyDown(window, { key: 'k', metaKey: true });
    const input = await screen.findByPlaceholderText('搜索项目、任务、文件、物料、知识库...');
    await user.type(input, 'Test Project');
    expect(await screen.findByText('Test Project')).toBeInTheDocument();
    expect(screen.getAllByText('项目').length).toBeGreaterThanOrEqual(2);
  });

  it('searches and shows matching task results', async () => {
    searchMock.mockResolvedValue({
      data: {
        data: {
          projects: [],
          tasks: [{ id: 't1', name: 'Test Task', status: 'in_progress', priority: 'high' }],
          files: [],
          bomItems: [],
          articles: [],
          users: [],
        },
      },
    });

    const user = userEvent.setup();
    renderWithAntd(<GlobalSearch />);
    fireEvent.keyDown(window, { key: 'k', metaKey: true });
    const input = await screen.findByPlaceholderText('搜索项目、任务、文件、物料、知识库...');
    await user.type(input, 'Test Task');
    expect(await screen.findByText('Test Task')).toBeInTheDocument();
    expect(screen.getAllByText('任务').length).toBeGreaterThanOrEqual(2);
  });

  it('searches and shows matching file results', async () => {
    searchMock.mockResolvedValue({
      data: {
        data: {
          projects: [],
          tasks: [],
          files: [{ id: 'f1', name: 'test.pdf' }],
          bomItems: [],
          articles: [],
          users: [],
        },
      },
    });

    const user = userEvent.setup();
    renderWithAntd(<GlobalSearch />);
    fireEvent.keyDown(window, { key: 'k', metaKey: true });
    const input = await screen.findByPlaceholderText('搜索项目、任务、文件、物料、知识库...');
    await user.type(input, 'test.pdf');
    expect(await screen.findByText('test.pdf')).toBeInTheDocument();
    expect(screen.getAllByText('文件').length).toBeGreaterThanOrEqual(2);
  });

  it('searches and shows matching BOM item results', async () => {
    searchMock.mockResolvedValue({
      data: {
        data: {
          projects: [],
          tasks: [],
          files: [],
          bomItems: [{ id: 'b1', name: 'Test Motor', partNumber: 'MOT-001' }],
          articles: [],
          users: [],
        },
      },
    });

    const user = userEvent.setup();
    renderWithAntd(<GlobalSearch />);
    fireEvent.keyDown(window, { key: 'k', metaKey: true });
    const input = await screen.findByPlaceholderText('搜索项目、任务、文件、物料、知识库...');
    await user.type(input, 'Test Motor');
    expect(await screen.findByText('Test Motor')).toBeInTheDocument();
    expect(screen.getAllByText('物料').length).toBeGreaterThanOrEqual(2);
  });

  it('searches and shows matching article results', async () => {
    searchMock.mockResolvedValue({
      data: {
        data: {
          projects: [],
          tasks: [],
          files: [],
          bomItems: [],
          articles: [{ id: 'a1', title: 'Test Article', status: 'published' }],
          users: [],
        },
      },
    });

    const user = userEvent.setup();
    renderWithAntd(<GlobalSearch />);
    fireEvent.keyDown(window, { key: 'k', metaKey: true });
    const input = await screen.findByPlaceholderText('搜索项目、任务、文件、物料、知识库...');
    await user.type(input, 'Test Article');
    expect(await screen.findByText('Test Article')).toBeInTheDocument();
    expect(screen.getAllByText('知识库').length).toBeGreaterThanOrEqual(2);
  });

  it('searches and shows matching user results', async () => {
    searchMock.mockResolvedValue({
      data: {
        data: {
          projects: [],
          tasks: [],
          files: [],
          bomItems: [],
          articles: [],
          users: [{ id: 'u1', name: 'Test User', email: 'test@example.com' }],
        },
      },
    });

    const user = userEvent.setup();
    renderWithAntd(<GlobalSearch />);
    fireEvent.keyDown(window, { key: 'k', metaKey: true });
    const input = await screen.findByPlaceholderText('搜索项目、任务、文件、物料、知识库...');
    await user.type(input, 'Test User');
    expect(await screen.findByText('Test User')).toBeInTheDocument();
    expect(screen.getAllByText('用户').length).toBeGreaterThanOrEqual(2);
  });

  it('shows empty state when search returns no results', async () => {
    searchMock.mockResolvedValue({
      data: { data: { projects: [], tasks: [], files: [], bomItems: [], articles: [], users: [] } },
    });

    const user = userEvent.setup();
    renderWithAntd(<GlobalSearch />);
    fireEvent.keyDown(window, { key: 'k', metaKey: true });
    const input = await screen.findByPlaceholderText('搜索项目、任务、文件、物料、知识库...');
    await user.type(input, 'zzzznonexistent');
    expect(await screen.findByText('未找到匹配的结果')).toBeInTheDocument();
  });

  it('shows type badge on each result item', async () => {
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

    const user = userEvent.setup();
    renderWithAntd(<GlobalSearch />);
    fireEvent.keyDown(window, { key: 'k', metaKey: true });
    const input = await screen.findByPlaceholderText('搜索项目、任务、文件、物料、知识库...');
    await user.type(input, 'Test');
    await waitFor(() => {
      expect(searchMock).toHaveBeenCalledWith('Test');
    });
    // Each result item should have a type badge
    const typeBadges = screen.getAllByText(/^(项目|任务)$/);
    // There should be badges in both group headers and individual items
    expect(typeBadges.length).toBeGreaterThanOrEqual(4); // 2 group headers + 2 item badges
  });

  it('groups results by type with section headers and counts', async () => {
    searchMock.mockResolvedValue({
      data: {
        data: {
          projects: [
            { id: 'p1', name: 'Project A', status: 'in_progress' },
            { id: 'p2', name: 'Project B', status: 'completed' },
          ],
          tasks: [{ id: 't1', name: 'Task A', status: 'in_progress', priority: 'high' }],
          files: [],
          bomItems: [],
          articles: [],
          users: [],
        },
      },
    });

    const user = userEvent.setup();
    renderWithAntd(<GlobalSearch />);
    fireEvent.keyDown(window, { key: 'k', metaKey: true });
    const input = await screen.findByPlaceholderText('搜索项目、任务、文件、物料、知识库...');
    await user.type(input, 'test');
    // Group headers should show type name and count
    expect(await screen.findByText('(2)')).toBeInTheDocument();
    expect(screen.getByText('(1)')).toBeInTheDocument();
  });

  // --- Search History Tests ---

  it('stores search in localStorage after search', async () => {
    searchMock.mockResolvedValue({
      data: { data: { projects: [], tasks: [], files: [], bomItems: [], articles: [], users: [] } },
    });

    const user = userEvent.setup();
    renderWithAntd(<GlobalSearch />);
    fireEvent.keyDown(window, { key: 'k', metaKey: true });
    const input = await screen.findByPlaceholderText('搜索项目、任务、文件、物料、知识库...');
    await user.type(input, 'my search');
    await waitFor(() => {
      expect(searchMock).toHaveBeenCalledWith('my search');
    });
    const history = JSON.parse(localStorage.getItem('searchHistory') || '[]');
    expect(history).toContain('my search');
  });

  it('shows recent searches when input is empty', async () => {
    localStorage.setItem('searchHistory', JSON.stringify(['recent one', 'recent two']));

    renderWithAntd(<GlobalSearch />);
    fireEvent.keyDown(window, { key: 'k', metaKey: true });
    expect(await screen.findByText('recent one')).toBeInTheDocument();
    expect(screen.getByText('recent two')).toBeInTheDocument();
  });

  it('allows clearing search history', async () => {
    localStorage.setItem('searchHistory', JSON.stringify(['old search']));

    renderWithAntd(<GlobalSearch />);
    fireEvent.keyDown(window, { key: 'k', metaKey: true });
    const clearBtn = await screen.findByText('清除历史');
    fireEvent.click(clearBtn);
    expect(JSON.parse(localStorage.getItem('searchHistory') || '[]')).toEqual([]);
    expect(screen.queryByText('old search')).not.toBeInTheDocument();
  });

  it('limits search history to 10 entries', async () => {
    const existing = Array.from({ length: 10 }, (_, i) => `search ${i}`);
    localStorage.setItem('searchHistory', JSON.stringify(existing));

    searchMock.mockResolvedValue({
      data: { data: { projects: [], tasks: [], files: [], bomItems: [], articles: [], users: [] } },
    });

    const user = userEvent.setup();
    renderWithAntd(<GlobalSearch />);
    fireEvent.keyDown(window, { key: 'k', metaKey: true });
    const input = await screen.findByPlaceholderText('搜索项目、任务、文件、物料、知识库...');
    await user.type(input, 'new search');
    await waitFor(() => {
      expect(searchMock).toHaveBeenCalledWith('new search');
    });
    const history = JSON.parse(localStorage.getItem('searchHistory') || '[]');
    expect(history).toHaveLength(10);
    expect(history[0]).toBe('new search');
    expect(history).not.toContain('search 9');
  });

  it('clicking a recent search fills the input', async () => {
    localStorage.setItem('searchHistory', JSON.stringify(['clicked search']));

    renderWithAntd(<GlobalSearch />);
    fireEvent.keyDown(window, { key: 'k', metaKey: true });
    const recentItem = await screen.findByText('clicked search');
    fireEvent.click(recentItem);
    const input = screen.getByPlaceholderText('搜索项目、任务、文件、物料、知识库...') as HTMLInputElement;
    expect(input.value).toBe('clicked search');
  });

  it('does not store duplicate searches', async () => {
    localStorage.setItem('searchHistory', JSON.stringify(['existing']));

    searchMock.mockResolvedValue({
      data: { data: { projects: [], tasks: [], files: [], bomItems: [], articles: [], users: [] } },
    });

    const user = userEvent.setup();
    renderWithAntd(<GlobalSearch />);
    fireEvent.keyDown(window, { key: 'k', metaKey: true });
    const input = await screen.findByPlaceholderText('搜索项目、任务、文件、物料、知识库...');
    await user.type(input, 'existing');
    await waitFor(() => {
      expect(searchMock).toHaveBeenCalledWith('existing');
    });
    const history = JSON.parse(localStorage.getItem('searchHistory') || '[]');
    const count = history.filter((h: string) => h === 'existing').length;
    expect(count).toBe(1);
  });

  // --- Highlight Tests ---

  it('highlights matching text in search results', async () => {
    searchMock.mockResolvedValue({
      data: {
        data: {
          projects: [{ id: 'p1', name: 'Battery Pack Project', status: 'in_progress' }],
          tasks: [],
          files: [],
          bomItems: [],
          articles: [],
          users: [],
        },
      },
    });

    const user = userEvent.setup();
    renderWithAntd(<GlobalSearch />);
    fireEvent.keyDown(window, { key: 'k', metaKey: true });
    const input = await screen.findByPlaceholderText('搜索项目、任务、文件、物料、知识库...');
    await user.type(input, 'Pack');
    await waitFor(() => {
      const marks = document.querySelectorAll('mark');
      expect(marks.length).toBeGreaterThan(0);
      expect(marks[0].textContent).toBe('Pack');
    });
  });

  it('highlights matching text case-insensitively', async () => {
    searchMock.mockResolvedValue({
      data: {
        data: {
          projects: [{ id: 'p1', name: 'Battery pack Project', status: 'in_progress' }],
          tasks: [],
          files: [],
          bomItems: [],
          articles: [],
          users: [],
        },
      },
    });

    const user = userEvent.setup();
    renderWithAntd(<GlobalSearch />);
    fireEvent.keyDown(window, { key: 'k', metaKey: true });
    const input = await screen.findByPlaceholderText('搜索项目、任务、文件、物料、知识库...');
    await user.type(input, 'PACK');
    await waitFor(() => {
      const marks = document.querySelectorAll('mark');
      expect(marks.length).toBeGreaterThan(0);
      expect(marks[0].textContent).toBe('pack');
    });
  });

  it('highlights multiple occurrences of the query', async () => {
    searchMock.mockResolvedValue({
      data: {
        data: {
          projects: [],
          tasks: [],
          files: [{ id: 'f1', name: 'test-file-test.txt' }],
          bomItems: [],
          articles: [],
          users: [],
        },
      },
    });

    const user = userEvent.setup();
    renderWithAntd(<GlobalSearch />);
    fireEvent.keyDown(window, { key: 'k', metaKey: true });
    const input = await screen.findByPlaceholderText('搜索项目、任务、文件、物料、知识库...');
    await user.type(input, 'test');
    await waitFor(() => {
      const marks = document.querySelectorAll('mark');
      expect(marks.length).toBe(2);
      expect(marks[0].textContent).toBe('test');
      expect(marks[1].textContent).toBe('test');
    });
  });

  it('highlights matching text in subtitle fields', async () => {
    searchMock.mockResolvedValue({
      data: {
        data: {
          projects: [],
          tasks: [],
          files: [],
          bomItems: [{ id: 'b1', name: 'Motor Assembly', partNumber: 'MOT-123' }],
          articles: [],
          users: [],
        },
      },
    });

    const user = userEvent.setup();
    renderWithAntd(<GlobalSearch />);
    fireEvent.keyDown(window, { key: 'k', metaKey: true });
    const input = await screen.findByPlaceholderText('搜索项目、任务、文件、物料、知识库...');
    await user.type(input, 'MOT');
    await waitFor(() => {
      const marks = document.querySelectorAll('mark');
      // "Motor Assembly" has "Mot" matching, and "MOT-123" has "MOT" matching
      expect(marks.length).toBe(2);
      expect(marks[0].textContent).toBe('Mot');
      expect(marks[1].textContent).toBe('MOT');
    });
  });

  it('applies yellow background highlight style to mark elements', async () => {
    searchMock.mockResolvedValue({
      data: {
        data: {
          projects: [{ id: 'p1', name: 'Alpha Project', status: 'in_progress' }],
          tasks: [],
          files: [],
          bomItems: [],
          articles: [],
          users: [],
        },
      },
    });

    const user = userEvent.setup();
    renderWithAntd(<GlobalSearch />);
    fireEvent.keyDown(window, { key: 'k', metaKey: true });
    const input = await screen.findByPlaceholderText('搜索项目、任务、文件、物料、知识库...');
    await user.type(input, 'Alpha');
    await waitFor(() => {
      const marks = document.querySelectorAll('mark');
      expect(marks.length).toBeGreaterThan(0);
      expect(marks[0].style.background).toBe('rgb(255, 247, 230)');
    });
  });

  it('does not render mark elements when query is empty', async () => {
    localStorage.setItem('searchHistory', JSON.stringify(['recent']));

    renderWithAntd(<GlobalSearch />);
    fireEvent.keyDown(window, { key: 'k', metaKey: true });
    await screen.findByText('recent');
    const marks = document.querySelectorAll('mark');
    expect(marks.length).toBe(0);
  });

  it('handles special regex characters in query for highlighting', async () => {
    searchMock.mockResolvedValue({
      data: {
        data: {
          projects: [{ id: 'p1', name: 'Project (v2.0)', status: 'in_progress' }],
          tasks: [],
          files: [],
          bomItems: [],
          articles: [],
          users: [],
        },
      },
    });

    const user = userEvent.setup();
    renderWithAntd(<GlobalSearch />);
    fireEvent.keyDown(window, { key: 'k', metaKey: true });
    const input = await screen.findByPlaceholderText('搜索项目、任务、文件、物料、知识库...');
    await user.type(input, '(v2.0)');
    await waitFor(() => {
      const marks = document.querySelectorAll('mark');
      expect(marks.length).toBeGreaterThan(0);
      expect(marks[0].textContent).toBe('(v2.0)');
    });
  });

  // --- Type Filter Tests ---

  it('shows type filter tabs when multiple types have results', async () => {
    searchMock.mockResolvedValue({
      data: {
        data: {
          projects: [{ id: 'p1', name: 'Project A', status: 'in_progress' }],
          tasks: [{ id: 't1', name: 'Task A', status: 'in_progress', priority: 'high' }],
          files: [],
          bomItems: [],
          articles: [],
          users: [],
        },
      },
    });

    const user = userEvent.setup();
    renderWithAntd(<GlobalSearch />);
    fireEvent.keyDown(window, { key: 'k', metaKey: true });
    const input = await screen.findByPlaceholderText('搜索项目、任务、文件、物料、知识库...');
    await user.type(input, 'A');
    await waitFor(() => {
      expect(screen.getAllByText(/全部/).length).toBeGreaterThanOrEqual(1);
    });
  });

  it('shows all filter tabs with counts even for types with no results', async () => {
    searchMock.mockResolvedValue({
      data: {
        data: {
          projects: [{ id: 'p1', name: 'Project A', status: 'in_progress' }],
          tasks: [{ id: 't1', name: 'Task A', status: 'in_progress', priority: 'high' }],
          files: [],
          bomItems: [],
          articles: [],
          users: [],
        },
      },
    });

    const user = userEvent.setup();
    renderWithAntd(<GlobalSearch />);
    fireEvent.keyDown(window, { key: 'k', metaKey: true });
    const input = await screen.findByPlaceholderText('搜索项目、任务、文件、物料、知识库...');
    await user.type(input, 'A');
    await waitFor(() => {
      expect(screen.getAllByText(/全部/).length).toBeGreaterThanOrEqual(1);
    });
    // All type tabs should be visible, including those with 0 count
    expect(screen.getAllByText(/项目/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/任务/).length).toBeGreaterThanOrEqual(1);
  });

  it('clicking a specific filter tab hides non-matching result groups', async () => {
    searchMock.mockResolvedValue({
      data: {
        data: {
          projects: [{ id: 'p1', name: 'Alpha Project', status: 'in_progress' }],
          tasks: [{ id: 't1', name: 'Beta Task', status: 'in_progress', priority: 'high' }],
          files: [],
          bomItems: [],
          articles: [],
          users: [],
        },
      },
    });

    const user = userEvent.setup();
    renderWithAntd(<GlobalSearch />);
    fireEvent.keyDown(window, { key: 'k', metaKey: true });
    const input = await screen.findByPlaceholderText('搜索项目、任务、文件、物料、知识库...');
    await user.type(input, 'test');
    // Wait for results to appear by checking for a type filter button
    await waitFor(() => {
      expect(screen.getAllByText(/全部/).length).toBeGreaterThanOrEqual(1);
    });
    // Both result items should be visible
    expect(screen.getByText('Alpha Project')).toBeInTheDocument();
    expect(screen.getByText('Beta Task')).toBeInTheDocument();
    // Click on the "任务" filter button - find it by the filter button class
    const allBtns = document.querySelectorAll('[class*="typeFilterBtn"]');
    const taskBtn = Array.from(allBtns).find((btn) => btn.textContent?.includes('任务'));
    expect(taskBtn).toBeTruthy();
    await user.click(taskBtn as HTMLElement);
    // After filtering, task should remain, project should be hidden
    await waitFor(() => {
      expect(screen.getByText('Beta Task')).toBeInTheDocument();
      expect(screen.queryByText('Alpha Project')).not.toBeInTheDocument();
    });
  });

  it('filters results when type filter is clicked', async () => {
    searchMock.mockResolvedValue({
      data: {
        data: {
          projects: [{ id: 'p1', name: 'Project A', status: 'in_progress' }],
          tasks: [{ id: 't1', name: 'Task A', status: 'in_progress', priority: 'high' }],
          files: [],
          bomItems: [],
          articles: [],
          users: [],
        },
      },
    });

    const user = userEvent.setup();
    renderWithAntd(<GlobalSearch />);
    fireEvent.keyDown(window, { key: 'k', metaKey: true });
    const input = await screen.findByPlaceholderText('搜索项目、任务、文件、物料、知识库...');
    await user.type(input, 'A');
    await waitFor(() => {
      expect(document.querySelector('.resultName, [class*="resultName"]')).toBeTruthy();
    });
    // Both project and task group titles should be visible
    expect(screen.getAllByText(/项目/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/任务/).length).toBeGreaterThan(0);
    // Click on "项目" filter
    const projectFilter = screen.getByText(/项目\(/);
    await user.click(projectFilter);
    await waitFor(() => {
      // After filtering, only project group should remain
      expect(screen.getAllByText(/项目/).length).toBeGreaterThan(0);
    });
  });

  // --- Popular Searches Tests ---

  it('renders popular searches when input is empty', async () => {
    renderWithAntd(<GlobalSearch />);
    fireEvent.keyDown(window, { key: 'k', metaKey: true });
    expect(await screen.findByText('热门搜索')).toBeInTheDocument();
    expect(screen.getByText('项目管理')).toBeInTheDocument();
    expect(screen.getByText('电池pack')).toBeInTheDocument();
    expect(screen.getByText('设计评审')).toBeInTheDocument();
    expect(screen.getByText('BOM变更')).toBeInTheDocument();
    expect(screen.getByText('工艺路线')).toBeInTheDocument();
  });

  it('clicking a popular search fills the input and triggers search', async () => {
    searchMock.mockResolvedValue({
      data: { data: { projects: [], tasks: [], files: [], bomItems: [], articles: [], users: [] } },
    });

    const user = userEvent.setup();
    renderWithAntd(<GlobalSearch />);
    fireEvent.keyDown(window, { key: 'k', metaKey: true });
    const popularTerm = await screen.findByText('项目管理');
    await user.click(popularTerm);
    const input = screen.getByPlaceholderText('搜索项目、任务、文件、物料、知识库...') as HTMLInputElement;
    expect(input.value).toBe('项目管理');
    await waitFor(() => {
      expect(searchMock).toHaveBeenCalledWith('项目管理');
    });
  });

  // --- View All Results Tests ---

  it('shows "view all results" link when results are present', async () => {
    searchMock.mockResolvedValue({
      data: {
        data: {
          projects: [{ id: 'p1', name: 'Test Project', status: 'in_progress' }],
          tasks: [],
          files: [],
          bomItems: [],
          articles: [],
          users: [],
        },
      },
    });

    const user = userEvent.setup();
    renderWithAntd(<GlobalSearch />);
    fireEvent.keyDown(window, { key: 'k', metaKey: true });
    const input = await screen.findByPlaceholderText('搜索项目、任务、文件、物料、知识库...');
    await user.type(input, 'Test');
    expect(await screen.findByText('查看全部结果')).toBeInTheDocument();
  });

  it('clicking "view all results" navigates to /search?q=keyword', async () => {
    searchMock.mockResolvedValue({
      data: {
        data: {
          projects: [{ id: 'p1', name: 'Test Project', status: 'in_progress' }],
          tasks: [],
          files: [],
          bomItems: [],
          articles: [],
          users: [],
        },
      },
    });

    const user = userEvent.setup();
    renderWithAntd(<GlobalSearch />);
    fireEvent.keyDown(window, { key: 'k', metaKey: true });
    const input = await screen.findByPlaceholderText('搜索项目、任务、文件、物料、知识库...');
    await user.type(input, '电池pack');
    const viewAll = await screen.findByText('查看全部结果');
    await user.click(viewAll);
    expect(mockNavigate).toHaveBeenCalledWith('/search?q=%E7%94%B5%E6%B1%A0pack');
  });
});
