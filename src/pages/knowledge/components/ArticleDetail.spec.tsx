import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfigProvider } from 'antd';
import { describe, it, expect, vi } from 'vitest';
import ArticleDetail from './ArticleDetail';

const mockAddComment = vi.fn().mockResolvedValue({ data: {} });

vi.mock('@/services/knowledge.service', () => ({
  getArticleComments: vi.fn().mockResolvedValue({
    data: [
      { id: 'c1', articleId: '1', authorId: 'user1', content: '写得很好！', createdAt: '2025-03-11' },
      { id: 'c2', articleId: '1', authorId: 'user2', content: '非常有用', createdAt: '2025-03-12' },
    ],
  }),
  addArticleComment: (...args: any[]) => mockAddComment(...args),
}));

const renderWithAntd = (ui: React.ReactElement) =>
  render(<ConfigProvider>{ui}</ConfigProvider>);

const mockArticle = {
  id: '1',
  title: '详细文章标题',
  content: '<p>这是文章正文内容</p>',
  category: '技术',
  tags: ['React', 'Vue'],
  status: 'published',
  viewCount: 200,
  createdAt: '2025-01-15',
  updatedAt: '2025-03-10',
};

describe('ArticleDetail', () => {
  it('renders article title', () => {
    renderWithAntd(<ArticleDetail article={mockArticle} onBack={vi.fn()} />);
    expect(screen.getByText('详细文章标题')).toBeInTheDocument();
  });

  it('renders article content', () => {
    renderWithAntd(<ArticleDetail article={mockArticle} onBack={vi.fn()} />);
    expect(screen.getByText('这是文章正文内容')).toBeInTheDocument();
  });

  it('renders category and tags', () => {
    renderWithAntd(<ArticleDetail article={mockArticle} onBack={vi.fn()} />);
    expect(screen.getByText('技术')).toBeInTheDocument();
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('Vue')).toBeInTheDocument();
  });

  it('renders tags with distinct colors', () => {
    const { container } = renderWithAntd(<ArticleDetail article={mockArticle} onBack={vi.fn()} />);
    // Tags should be rendered as Ant Design Tag components with color attributes
    const tagElements = container.querySelectorAll('.ant-tag');
    // At least category tag + 2 article tags = 3 tags
    expect(tagElements.length).toBeGreaterThanOrEqual(3);
  });

  it('shows view count', () => {
    renderWithAntd(<ArticleDetail article={mockArticle} onBack={vi.fn()} />);
    expect(screen.getByText(/200/)).toBeInTheDocument();
  });

  it('calls onBack when back button is clicked', async () => {
    const onBack = vi.fn();
    renderWithAntd(<ArticleDetail article={mockArticle} onBack={onBack} />);
    await userEvent.click(screen.getByText('返回列表'));
    expect(onBack).toHaveBeenCalled();
  });

  it('renders edit button', () => {
    renderWithAntd(<ArticleDetail article={mockArticle} onBack={vi.fn()} />);
    expect(screen.getByText('编辑')).toBeInTheDocument();
  });

  it('renders comments section with fetched comments', async () => {
    renderWithAntd(<ArticleDetail article={mockArticle} onBack={vi.fn()} />);
    expect(screen.getByText('评论')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('写得很好！')).toBeInTheDocument();
      expect(screen.getByText('非常有用')).toBeInTheDocument();
    });
  });

  it('renders comment input form', async () => {
    renderWithAntd(<ArticleDetail article={mockArticle} onBack={vi.fn()} />);
    await waitFor(() => {
      expect(screen.getByPlaceholderText('发表评论...')).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /提.*交/ })).toBeInTheDocument();
  });

  it('renders article with empty tags array', () => {
    const noTagsArticle = { ...mockArticle, tags: [] };
    renderWithAntd(<ArticleDetail article={noTagsArticle} onBack={vi.fn()} />);
    expect(screen.getByText('详细文章标题')).toBeInTheDocument();
    // Category tag should still be shown
    expect(screen.getByText('技术')).toBeInTheDocument();
  });

  it('renders version info placeholder', () => {
    renderWithAntd(<ArticleDetail article={mockArticle} onBack={vi.fn()} />);
    expect(screen.getByText(/版本: v1/)).toBeInTheDocument();
  });

  it('displays version with creation and update dates', () => {
    renderWithAntd(<ArticleDetail article={mockArticle} onBack={vi.fn()} />);
    const versionEl = screen.getByText(/版本: v1/);
    expect(versionEl.textContent).toMatch(/版本: v1 \| 创建于:/);
    expect(versionEl.textContent).toMatch(/更新于:/);
  });

  it('renders reply button on each comment', async () => {
    renderWithAntd(<ArticleDetail article={mockArticle} onBack={vi.fn()} />);
    await waitFor(() => {
      expect(screen.getByText('写得很好！')).toBeInTheDocument();
    });
    const replyButtons = screen.getAllByText('回复');
    // At least 2 reply buttons (one per comment), may have more from submit buttons
    expect(replyButtons.length).toBeGreaterThanOrEqual(2);
  });

  it('submits reply with parentId when reply form is used', async () => {
    const user = userEvent.setup();
    renderWithAntd(<ArticleDetail article={mockArticle} onBack={vi.fn()} />);
    await waitFor(() => {
      expect(screen.getByText('写得很好！')).toBeInTheDocument();
    });

    // Click the first reply button (for comment c1)
    const replyBtn = screen.getByTestId('reply-btn-c1');
    await user.click(replyBtn);

    // Type a reply
    const replyInput = screen.getByTestId('reply-input');
    await user.type(replyInput, '谢谢夸奖');

    // Submit the reply
    const submitBtn = screen.getByTestId('reply-submit-btn');
    await user.click(submitBtn);

    await waitFor(() => {
      expect(mockAddComment).toHaveBeenCalledWith('1', {
        authorId: 'current-user',
        content: '谢谢夸奖',
        parentId: 'c1',
      });
    });
  });

  // --- Article review flow tests ---

  it('shows submit review button for draft articles', async () => {
    const draftArticle = { ...mockArticle, status: 'draft' };
    renderWithAntd(<ArticleDetail article={draftArticle} onBack={vi.fn()} />);
    const btn = screen.getByTestId('submit-review-btn');
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveTextContent('提交审核');

    await userEvent.click(btn);
    await waitFor(() => {
      expect(screen.getByText('确定将此文章提交审核吗？')).toBeInTheDocument();
    });
  });

  it('shows publish button for articles in review', async () => {
    const reviewArticle = { ...mockArticle, status: 'review' };
    renderWithAntd(<ArticleDetail article={reviewArticle} onBack={vi.fn()} />);
    const btn = screen.getByTestId('publish-btn');
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveTextContent('发布');

    await userEvent.click(btn);
    await waitFor(() => {
      expect(screen.getByText('确定发布此文章吗？')).toBeInTheDocument();
    });
  });

  it('renders version history button', () => {
    renderWithAntd(<ArticleDetail article={mockArticle} onBack={vi.fn()} />);
    const btn = screen.getByTestId('version-history-btn');
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveTextContent('版本历史');
  });
});
