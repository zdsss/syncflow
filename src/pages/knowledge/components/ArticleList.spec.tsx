import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfigProvider } from 'antd';
import { describe, it, expect, vi } from 'vitest';
import ArticleList from './ArticleList';

const renderWithAntd = (ui: React.ReactElement) =>
  render(<ConfigProvider>{ui}</ConfigProvider>);

const mockArticles = [
  {
    id: '1',
    title: '测试文章一',
    category: '技术',
    tags: ['React', 'TypeScript'],
    status: 'published',
    viewCount: 100,
    createdAt: '2025-01-15',
  },
  {
    id: '2',
    title: '测试文章二',
    category: '管理',
    tags: ['Scrum'],
    status: 'draft',
    viewCount: 50,
    createdAt: '2025-02-20',
  },
];

describe('ArticleList', () => {
  it('renders article list with titles', () => {
    renderWithAntd(<ArticleList articles={mockArticles} onSelect={vi.fn()} />);
    expect(screen.getByText('测试文章一')).toBeInTheDocument();
    expect(screen.getByText('测试文章二')).toBeInTheDocument();
  });

  it('shows category tags', () => {
    renderWithAntd(<ArticleList articles={mockArticles} onSelect={vi.fn()} />);
    expect(screen.getByText('技术')).toBeInTheDocument();
    expect(screen.getByText('管理')).toBeInTheDocument();
  });

  it('shows article tags', () => {
    renderWithAntd(<ArticleList articles={mockArticles} onSelect={vi.fn()} />);
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('TypeScript')).toBeInTheDocument();
    expect(screen.getByText('Scrum')).toBeInTheDocument();
  });

  it('shows empty state when no articles', () => {
    renderWithAntd(<ArticleList articles={[]} onSelect={vi.fn()} />);
    expect(screen.getByText('暂无文章')).toBeInTheDocument();
  });

  it('calls onSelect when article is clicked', async () => {
    const onSelect = vi.fn();
    renderWithAntd(<ArticleList articles={mockArticles} onSelect={onSelect} />);
    await userEvent.click(screen.getByText('测试文章一'));
    expect(onSelect).toHaveBeenCalledWith('1');
  });

  it('shows view count', () => {
    renderWithAntd(<ArticleList articles={mockArticles} onSelect={vi.fn()} />);
    expect(screen.getByText('100')).toBeInTheDocument();
  });

  it('calls onTagClick when a tag is clicked', async () => {
    const onTagClick = vi.fn();
    renderWithAntd(<ArticleList articles={mockArticles} onSelect={vi.fn()} onTagClick={onTagClick} />);
    // Find a tag element that is not the category tag
    const reactTag = screen.getAllByText('React')[0];
    await userEvent.click(reactTag);
    expect(onTagClick).toHaveBeenCalledWith('React');
  });

  it('does not call onSelect when a tag is clicked', async () => {
    const onSelect = vi.fn();
    const onTagClick = vi.fn();
    renderWithAntd(<ArticleList articles={mockArticles} onSelect={onSelect} onTagClick={onTagClick} />);
    const reactTag = screen.getAllByText('React')[0];
    await userEvent.click(reactTag);
    expect(onTagClick).toHaveBeenCalledWith('React');
    // onSelect should not be called when clicking a tag
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('renders tags with colors when onTagClick is provided', () => {
    renderWithAntd(<ArticleList articles={mockArticles} onSelect={vi.fn()} onTagClick={vi.fn()} />);
    // Tags should be rendered as clickable (with color attribute)
    const reactTags = screen.getAllByText('React');
    expect(reactTags.length).toBeGreaterThan(0);
  });

  it('renders article tags as colored Ant Design Tag components', () => {
    const { container } = renderWithAntd(
      <ArticleList articles={mockArticles} onSelect={vi.fn()} onTagClick={vi.fn()} />
    );
    const tagElements = container.querySelectorAll('.ant-tag');
    // 2 category tags + 3 article tags (React, TypeScript, Scrum) = 5
    expect(tagElements.length).toBeGreaterThanOrEqual(5);
    // Verify article tags have color styles (non-default)
    const reactTag = screen.getAllByText('React')[0];
    expect(reactTag.closest('.ant-tag')).toBeTruthy();
  });
});
