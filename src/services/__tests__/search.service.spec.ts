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
import { search, globalSearch, getSearchSuggestions, SearchResults } from '../search.service';

describe('SearchService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls GET /search with query param', async () => {
    await search('test');
    expect(api.get).toHaveBeenCalledWith('/search', { params: { q: 'test' } });
  });

  it('calls GET /search with empty query', async () => {
    await search('');
    expect(api.get).toHaveBeenCalledWith('/search', { params: { q: '' } });
  });

  it('globalSearch calls GET /search with all params', async () => {
    await globalSearch({ keyword: 'battery', module: 'task', pageNum: 1, pageSize: 10 });
    expect(api.get).toHaveBeenCalledWith('/search', {
      params: { q: 'battery', module: 'task', pageNum: 1, pageSize: 10 },
    });
  });

  it('globalSearch calls GET /search with minimal params', async () => {
    await globalSearch({ keyword: 'test' });
    expect(api.get).toHaveBeenCalledWith('/search', {
      params: { q: 'test', module: undefined, pageNum: undefined, pageSize: undefined },
    });
  });

  it('getSearchSuggestions calls GET /search/suggestions', async () => {
    await getSearchSuggestions('battery');
    expect(api.get).toHaveBeenCalledWith('/search/suggestions', { params: { keyword: 'battery' } });
  });

  it('exports SearchResults type with all 6 types', () => {
    const results: SearchResults = {
      projects: [{ id: 'p1', name: 'Project 1', status: 'in_progress' }],
      tasks: [{ id: 't1', name: 'Task 1', status: 'not_started', priority: 'high' }],
      files: [{ id: 'f1', name: 'file.pdf' }],
      bomItems: [{ id: 'b1', name: 'Motor', partNumber: 'MOT-001' }],
      articles: [{ id: 'a1', title: 'Article 1', status: 'published' }],
      users: [{ id: 'u1', name: 'User 1', email: 'user@test.com' }],
    };
    expect(results.projects).toHaveLength(1);
    expect(results.tasks).toHaveLength(1);
    expect(results.files).toHaveLength(1);
    expect(results.bomItems).toHaveLength(1);
    expect(results.articles).toHaveLength(1);
    expect(results.users).toHaveLength(1);
  });
});
