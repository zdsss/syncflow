import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../api', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: {} }),
    post: vi.fn().mockResolvedValue({ data: {} }),
    patch: vi.fn().mockResolvedValue({ data: {} }),
    delete: vi.fn().mockResolvedValue({ data: {} }),
  },
}));

import api from '../api';
import {
  getArticles,
  getArticle,
  createArticle,
  updateArticle,
  deleteArticle,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getTags,
  createTag,
  deleteTag,
  getArticleComments,
  addArticleComment,
} from '../knowledge.service';

describe('KnowledgeService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Articles ─────────────────────────────────────────────────
  it('calls GET /knowledge with params', async () => {
    const params = { category: 'technical', keyword: 'ts' };
    await getArticles(params);
    expect(api.get).toHaveBeenCalledWith('/knowledge', { params });
  });

  it('calls GET /knowledge/:id', async () => {
    await getArticle('a1');
    expect(api.get).toHaveBeenCalledWith('/knowledge/a1');
  });

  it('calls POST /knowledge with data', async () => {
    const data = { title: 'New Article', content: 'Hello' };
    await createArticle(data);
    expect(api.post).toHaveBeenCalledWith('/knowledge', data);
  });

  it('calls PATCH /knowledge/:id with data', async () => {
    await updateArticle('a1', { title: 'Updated' });
    expect(api.patch).toHaveBeenCalledWith('/knowledge/a1', { title: 'Updated' });
  });

  it('calls DELETE /knowledge/:id', async () => {
    await deleteArticle('a1');
    expect(api.delete).toHaveBeenCalledWith('/knowledge/a1');
  });

  // ── Categories ───────────────────────────────────────────────
  it('calls GET /knowledge/categories', async () => {
    await getCategories();
    expect(api.get).toHaveBeenCalledWith('/knowledge/categories');
  });

  it('calls POST /knowledge/categories', async () => {
    await createCategory({ name: 'New Category' });
    expect(api.post).toHaveBeenCalledWith('/knowledge/categories', { name: 'New Category' });
  });

  it('calls PATCH /knowledge/categories/:id', async () => {
    await updateCategory('cat-1', { name: 'Updated' });
    expect(api.patch).toHaveBeenCalledWith('/knowledge/categories/cat-1', { name: 'Updated' });
  });

  it('calls DELETE /knowledge/categories/:id', async () => {
    await deleteCategory('cat-1');
    expect(api.delete).toHaveBeenCalledWith('/knowledge/categories/cat-1');
  });

  // ── Tags ─────────────────────────────────────────────────────
  it('calls GET /knowledge/tags', async () => {
    await getTags();
    expect(api.get).toHaveBeenCalledWith('/knowledge/tags');
  });

  it('calls POST /knowledge/tags', async () => {
    await createTag({ name: 'New Tag' });
    expect(api.post).toHaveBeenCalledWith('/knowledge/tags', { name: 'New Tag' });
  });

  it('calls DELETE /knowledge/tags/:id', async () => {
    await deleteTag('tag-1');
    expect(api.delete).toHaveBeenCalledWith('/knowledge/tags/tag-1');
  });

  // ── Comments ─────────────────────────────────────────────────
  it('calls GET /knowledge/:id/comments', async () => {
    await getArticleComments('a1');
    expect(api.get).toHaveBeenCalledWith('/knowledge/a1/comments');
  });

  it('calls POST /knowledge/:id/comments with data', async () => {
    const data = { authorId: 'u1', content: 'Great article!' };
    await addArticleComment('a1', data);
    expect(api.post).toHaveBeenCalledWith('/knowledge/a1/comments', data);
  });
});
