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
  getPersonalFiles,
  uploadPersonalFile,
  deletePersonalFile,
  getNotes,
  createNote,
  updateNote,
  deleteNote,
  getFavorites,
  addFavorite,
  removeFavorite,
} from '../personal.service';

describe('PersonalService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Files ────────────────────────────────────────────────────
  it('calls GET /personal/files with userId param', async () => {
    await getPersonalFiles('user-1');
    expect(api.get).toHaveBeenCalledWith('/personal/files', { params: { userId: 'user-1' } });
  });

  it('calls POST /personal/files with data', async () => {
    await uploadPersonalFile({ name: 'file.pdf', size: 1024 });
    expect(api.post).toHaveBeenCalledWith('/personal/files', { name: 'file.pdf', size: 1024 });
  });

  it('calls DELETE /personal/files/:id', async () => {
    await deletePersonalFile('f1');
    expect(api.delete).toHaveBeenCalledWith('/personal/files/f1');
  });

  // ── Notes ────────────────────────────────────────────────────
  it('calls GET /personal/notes with userId and params', async () => {
    await getNotes('user-1', { category: '工作', page: 1, pageSize: 10 });
    expect(api.get).toHaveBeenCalledWith('/personal/notes', {
      params: { userId: 'user-1', category: '工作', page: 1, pageSize: 10 },
    });
  });

  it('calls GET /personal/notes with only userId', async () => {
    await getNotes('user-1');
    expect(api.get).toHaveBeenCalledWith('/personal/notes', {
      params: { userId: 'user-1' },
    });
  });

  it('calls POST /personal/notes with data', async () => {
    const data = { userId: 'user-1', title: 'Test Note', content: 'Hello', category: '工作' };
    await createNote(data);
    expect(api.post).toHaveBeenCalledWith('/personal/notes', data);
  });

  it('calls PATCH /personal/notes/:id with data', async () => {
    const data = { title: 'Updated', content: 'Updated content' };
    await updateNote('n1', data);
    expect(api.patch).toHaveBeenCalledWith('/personal/notes/n1', data);
  });

  it('calls DELETE /personal/notes/:id', async () => {
    await deleteNote('n1');
    expect(api.delete).toHaveBeenCalledWith('/personal/notes/n1');
  });

  // ── Favorites ────────────────────────────────────────────────
  it('calls GET /personal/favorites with userId', async () => {
    await getFavorites('user-1');
    expect(api.get).toHaveBeenCalledWith('/personal/favorites', { params: { userId: 'user-1' } });
  });

  it('calls POST /personal/favorites with data', async () => {
    await addFavorite({ userId: 'user-1', entityType: 'task', entityId: 't1' });
    expect(api.post).toHaveBeenCalledWith('/personal/favorites', { userId: 'user-1', entityType: 'task', entityId: 't1' });
  });

  it('calls DELETE /personal/favorites/:id', async () => {
    await removeFavorite('fav-1');
    expect(api.delete).toHaveBeenCalledWith('/personal/favorites/fav-1');
  });
});
