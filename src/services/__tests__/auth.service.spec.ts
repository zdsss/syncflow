import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../api', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: {} }),
    post: vi.fn().mockResolvedValue({ data: {} }),
    put: vi.fn().mockResolvedValue({ data: {} }),
    patch: vi.fn().mockResolvedValue({ data: {} }),
    delete: vi.fn().mockResolvedValue({ data: {} }),
  },
}));

import api from '../api';
import { login, getCurrentUser, refreshToken, logout } from '../auth.service';

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('login calls POST /auth/login with credentials', async () => {
    const data = { username: 'alice', password: 'pass123' };
    await login(data);
    expect(api.post).toHaveBeenCalledWith('/auth/login', data);
  });

  it('getCurrentUser calls GET /auth/me', async () => {
    await getCurrentUser();
    expect(api.get).toHaveBeenCalledWith('/auth/me');
  });

  it('refreshToken calls POST /auth/refresh with refreshToken as query param', async () => {
    api.post.mockResolvedValue({ data: { token: 'new-access' } });
    const result = await refreshToken('my-refresh-token');
    expect(api.post).toHaveBeenCalledWith('/auth/refresh?refreshToken=my-refresh-token');
    expect(result).toEqual({ data: { token: 'new-access' } });
  });

  it('logout calls POST /auth/logout', async () => {
    api.post.mockResolvedValue({ data: { code: 0 } });
    await logout();
    expect(api.post).toHaveBeenCalledWith('/auth/logout');
  });
});
