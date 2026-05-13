import api from './api';

export async function getCategories() {
  return api.get('/knowledge/categories');
}

export async function createCategory(data: Record<string, any>) {
  return api.post('/knowledge/categories', data);
}

export async function updateCategory(id: string, data: Record<string, any>) {
  return api.patch(`/knowledge/categories/${id}`, data);
}

export async function deleteCategory(id: string) {
  return api.delete(`/knowledge/categories/${id}`);
}

export async function getTags() {
  return api.get('/knowledge/tags');
}

export async function createTag(data: Record<string, any>) {
  return api.post('/knowledge/tags', data);
}

export async function deleteTag(id: string) {
  return api.delete(`/knowledge/tags/${id}`);
}

export async function getArticles(params?: Record<string, any>) {
  return api.get('/knowledge', { params });
}

export async function getArticle(id: string) {
  return api.get(`/knowledge/${id}`);
}

export async function createArticle(data: Record<string, any>) {
  return api.post('/knowledge', data);
}

export async function updateArticle(id: string, data: Record<string, any>) {
  return api.patch(`/knowledge/${id}`, data);
}

export async function deleteArticle(id: string) {
  return api.delete(`/knowledge/${id}`);
}

export async function getArticleComments(articleId: string) {
  return api.get(`/knowledge/${articleId}/comments`);
}

export async function addArticleComment(articleId: string, data: { authorId: string; content: string; parentId?: string }) {
  return api.post(`/knowledge/${articleId}/comments`, data);
}
