import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfigProvider } from 'antd';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import KnowledgePage from './index';

const mockArticles = [
  { id: 'a1', title: 'Article 1', content: 'Content 1', category: 'technical', tags: ['React', 'TypeScript'], status: 'published', viewCount: 10, createdAt: '2026-05-01', updatedAt: '2026-05-01' },
  { id: 'a2', title: 'Article 2', content: 'Content 2', category: 'process', tags: ['React', 'flow'], status: 'draft', viewCount: 5, createdAt: '2026-05-02', updatedAt: '2026-05-02' },
  { id: 'a3', title: 'Article 3', content: 'Content 3', category: 'design', tags: ['UI'], status: 'published', viewCount: 20, createdAt: '2026-05-03', updatedAt: '2026-05-03' },
];

const mockGetArticles = vi.fn();
const mockGetArticle = vi.fn();
const mockGetCategories = vi.fn();
const mockCreateArticle = vi.fn();
const mockUpdateArticle = vi.fn();

vi.mock('@/services/knowledge.service', () => ({
  getArticles: (...args: any[]) => mockGetArticles(...args),
  getArticle: (...args: any[]) => mockGetArticle(...args),
  getCategories: (...args: any[]) => mockGetCategories(...args),
  createArticle: (...args: any[]) => mockCreateArticle(...args),
  updateArticle: (...args: any[]) => mockUpdateArticle(...args),
}));

vi.mock('./components/ArticleList', () => ({
  default: (props: any) => (
    <div data-testid="article-list">
      <span data-testid="article-count">{props.articles?.length ?? 0}</span>
      {props.onTagClick && (
        <button data-testid="click-tag-react" onClick={() => props.onTagClick('React')}>ClickTagReact</button>
      )}
      <button data-testid="select-article" onClick={() => props.onSelect?.('a1')}>Select</button>
    </div>
  ),
}));

vi.mock('./components/ArticleDetail', () => ({
  default: (props: any) => (
    <div data-testid="article-detail">
      <span data-testid="detail-title">{props.article?.title ?? ''}</span>
      <button data-testid="back-btn" onClick={props.onBack}>Back</button>
    </div>
  ),
}));

const renderWithAntd = (ui: React.ReactElement) =>
  render(<ConfigProvider>{ui}</ConfigProvider>);

describe('KnowledgePage - Tag Filtering', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetArticles.mockResolvedValue({ code: 0, data: mockArticles });
    mockGetArticle.mockResolvedValue({ code: 0, data: mockArticles[0] });
    mockGetCategories.mockResolvedValue({ code: 0, data: ['technical', 'process', 'design', 'general'] });
  });

  it('shows all articles by default (no tag filter)', async () => {
    renderWithAntd(<KnowledgePage />);
    await waitFor(() => {
      expect(screen.getByTestId('article-count').textContent).toBe('3');
    });
  });

  it('filters articles when a tag is clicked', async () => {
    const user = userEvent.setup();
    renderWithAntd(<KnowledgePage />);
    await waitFor(() => {
      expect(screen.getByTestId('article-count').textContent).toBe('3');
    });

    mockGetArticles.mockClear();
    await user.click(screen.getByTestId('click-tag-react'));

    await waitFor(() => {
      expect(mockGetArticles).toHaveBeenCalledWith(
        expect.objectContaining({ tag: 'React' })
      );
    });
  });

  it('shows a tag filter indicator when a tag is selected', async () => {
    const user = userEvent.setup();
    renderWithAntd(<KnowledgePage />);
    await waitFor(() => {
      expect(screen.getByTestId('article-count').textContent).toBe('3');
    });

    await user.click(screen.getByTestId('click-tag-react'));
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText(/清除筛选/)).toBeInTheDocument();
  });

  it('clears tag filter when clear button is clicked', async () => {
    const user = userEvent.setup();
    renderWithAntd(<KnowledgePage />);
    await waitFor(() => {
      expect(screen.getByTestId('article-count').textContent).toBe('3');
    });

    await user.click(screen.getByTestId('click-tag-react'));
    mockGetArticles.mockClear();

    await user.click(screen.getByText(/清除筛选/));
    await waitFor(() => {
      expect(mockGetArticles).toHaveBeenCalledWith(
        expect.not.objectContaining({ tag: expect.anything() })
      );
    });
  });

  it('client-side filters articles by tag, reducing displayed count', async () => {
    const user = userEvent.setup();
    renderWithAntd(<KnowledgePage />);
    await waitFor(() => {
      expect(screen.getByTestId('article-count').textContent).toBe('3');
    });

    // Click tag "React" — mockArticles a1 and a2 both have "React", a3 does not
    await user.click(screen.getByTestId('click-tag-react'));
    await waitFor(() => {
      expect(screen.getByTestId('article-count').textContent).toBe('2');
    });
  });
});

describe('KnowledgePage - Article Editor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetArticles.mockResolvedValue({ code: 0, data: mockArticles });
    mockGetArticle.mockResolvedValue({ code: 0, data: mockArticles[0] });
    mockGetCategories.mockResolvedValue({ code: 0, data: ['technical', 'process', 'design', 'general'] });
    mockCreateArticle.mockResolvedValue({ code: 0, data: { id: 'new1' } });
  });

  it('opens article editor modal when "新建文章" is clicked', async () => {
    const user = userEvent.setup();
    renderWithAntd(<KnowledgePage />);
    await user.click(screen.getByText('新建文章'));
    expect(screen.getByText('新建文章', { selector: '.ant-modal-title' })).toBeInTheDocument();
  });

  it('shows tag input in the editor modal', async () => {
    const user = userEvent.setup();
    renderWithAntd(<KnowledgePage />);
    await user.click(screen.getByText('新建文章'));
    expect(screen.getByText('标签')).toBeInTheDocument();
  });

  it('creates article with tags when form is submitted', async () => {
    const user = userEvent.setup();
    renderWithAntd(<KnowledgePage />);
    await user.click(screen.getByText('新建文章'));

    // Fill in title
    const titleInput = screen.getByPlaceholderText('请输入文章标题');
    await user.type(titleInput, 'New Article');

    // Fill in content
    const contentInput = screen.getByPlaceholderText('请输入文章内容');
    await user.type(contentInput, 'Some content');

    // Submit form
    const submitBtn = document.querySelector('.ant-modal-footer .ant-btn-primary') as HTMLButtonElement;
    await user.click(submitBtn);

    await waitFor(() => {
      expect(mockCreateArticle).toHaveBeenCalled();
    });
  });
});

describe('KnowledgePage - Tag Cloud', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetArticles.mockResolvedValue({ code: 0, data: mockArticles });
    mockGetArticle.mockResolvedValue({ code: 0, data: mockArticles[0] });
    mockGetCategories.mockResolvedValue({ code: 0, data: ['technical', 'process', 'design', 'general'] });
  });

  it('renders popular tags section with tags from articles', async () => {
    renderWithAntd(<KnowledgePage />);
    await waitFor(() => {
      expect(screen.getByText('热门标签')).toBeInTheDocument();
    });
    // Tags: React(2), TypeScript(1), flow(1), UI(1)
    expect(screen.getByTestId('tag-cloud-React')).toBeInTheDocument();
    expect(screen.getByTestId('tag-cloud-TypeScript')).toBeInTheDocument();
    expect(screen.getByTestId('tag-cloud-UI')).toBeInTheDocument();
  });

  it('filters articles when a tag cloud tag is clicked', async () => {
    const user = userEvent.setup();
    renderWithAntd(<KnowledgePage />);
    await waitFor(() => {
      expect(screen.getByTestId('tag-cloud-React')).toBeInTheDocument();
    });

    mockGetArticles.mockClear();
    await user.click(screen.getByTestId('tag-cloud-UI'));

    await waitFor(() => {
      expect(mockGetArticles).toHaveBeenCalledWith(
        expect.objectContaining({ tag: 'UI' }),
      );
    });
  });
});
