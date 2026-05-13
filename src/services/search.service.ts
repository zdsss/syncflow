import api from './api';

export interface SearchResults {
  projects: Array<{ id: string; name: string; status: string }>;
  tasks: Array<{ id: string; name: string; status: string; priority: string }>;
  files: Array<{ id: string; name: string }>;
  bomItems: Array<{ id: string; name: string; partNumber: string }>;
  articles: Array<{ id: string; title: string; status: string }>;
  users: Array<{ id: string; name: string; email: string }>;
}

export async function search(q: string) {
  return api.get('/search', { params: { q } });
}

export async function globalSearch(params: { keyword: string; module?: string; pageNum?: number; pageSize?: number }) {
  return api.get('/search', { params: { q: params.keyword, module: params.module, pageNum: params.pageNum, pageSize: params.pageSize } });
}

export async function getSearchSuggestions(keyword: string) {
  return api.get('/search/suggestions', { params: { keyword } });
}
