import api from './api';

// ── Personal Files ────────────────────────────────────────────────

export async function getPersonalFiles(userId: string) {
  return api.get('/personal/files', { params: { userId } });
}

export async function uploadPersonalFile(data: Record<string, any>) {
  return api.post('/personal/files', data);
}

export async function deletePersonalFile(id: string) {
  return api.delete(`/personal/files/${id}`);
}

// ── Notes ─────────────────────────────────────────────────────────

export async function getNotes(userId: string, params?: Record<string, any>) {
  return api.get('/personal/notes', { params: { userId, ...params } });
}

export async function createNote(data: Record<string, any>) {
  return api.post('/personal/notes', data);
}

export async function updateNote(id: string, data: Record<string, any>) {
  return api.patch(`/personal/notes/${id}`, data);
}

export async function deleteNote(id: string) {
  return api.delete(`/personal/notes/${id}`);
}

// ── Favorites ─────────────────────────────────────────────────────

export async function getFavorites(userId: string, params?: Record<string, any>) {
  return api.get('/personal/favorites', { params: { userId, ...params } });
}

export async function addFavorite(data: { userId: string; entityType: string; entityId: string }) {
  return api.post('/personal/favorites', data);
}

export async function removeFavorite(id: string) {
  return api.delete(`/personal/favorites/${id}`);
}
