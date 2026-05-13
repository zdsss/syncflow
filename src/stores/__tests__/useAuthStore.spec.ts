import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAuthStore } from '../useAuthStore';

const mockStorage: Record<string, string> = {};
const mockLocalStorage = {
  getItem: vi.fn((key: string) => mockStorage[key] ?? null),
  setItem: vi.fn((key: string, value: string) => { mockStorage[key] = value; }),
  removeItem: vi.fn((key: string) => { delete mockStorage[key]; }),
  clear: vi.fn(() => { Object.keys(mockStorage).forEach(k => delete mockStorage[k]); }),
};
vi.stubGlobal('localStorage', mockLocalStorage);

vi.mock('@/services/auth.service', () => ({
  login: vi.fn(),
  getCurrentUser: vi.fn(),
  refreshToken: vi.fn(),
  logout: vi.fn().mockResolvedValue({}),
}));

import { login as loginApi, getCurrentUser as getCurrentUserApi, logout as logoutApi } from '@/services/auth.service';

const mockLoginApi = vi.mocked(loginApi);
const mockGetCurrentUserApi = vi.mocked(getCurrentUserApi);
const mockLogoutApi = vi.mocked(logoutApi);

const mockUser = {
  id: 1,
  username: 'alice',
  realName: 'Alice',
  email: '',
  avatar: undefined,
  status: 1,
  roles: ['admin'],
};

describe('useAuthStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.keys(mockStorage).forEach(k => delete mockStorage[k]);
    useAuthStore.setState({ currentUser: null, token: null, loading: false, error: null });
  });

  it('has correct initial state', () => {
    const state = useAuthStore.getState();
    expect(state.currentUser).toBeNull();
    expect(state.token).toBeNull();
  });

  it('setCurrentUser sets user', () => {
    useAuthStore.getState().setCurrentUser(mockUser);
    expect(useAuthStore.getState().currentUser).toEqual(mockUser);
  });

  // --- Async action tests ---

  describe('loginAsync', () => {
    beforeEach(() => {
      vi.clearAllMocks();
      useAuthStore.setState({
        currentUser: null,
        loading: false,
        error: null,
        token: null,
      });
    });

    it('sets loading=true while login is in flight', async () => {
      mockLoginApi.mockResolvedValue({
        code: 0,
        data: { token: 'jwt-access', refreshToken: 'jwt-refresh', userId: 1, username: 'alice', realName: 'Alice', roles: ['admin'] },
        message: 'ok',
        timestamp: Date.now(),
      } as any);

      const promise = useAuthStore.getState().loginAsync('alice', 'password');
      expect(useAuthStore.getState().loading).toBe(true);

      await promise;
    });

    it('sets user, token and localStorage on success', async () => {
      mockLoginApi.mockResolvedValue({
        code: 0,
        data: { token: 'jwt-access', refreshToken: 'jwt-refresh', userId: 1, username: 'alice', realName: 'Alice', roles: ['admin'] },
        message: 'ok',
        timestamp: Date.now(),
      } as any);

      await useAuthStore.getState().loginAsync('alice', 'password');

      const state = useAuthStore.getState();
      expect(state.currentUser).toEqual(mockUser);
      expect(state.token).toBe('jwt-access');
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('token', 'jwt-access');
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('refreshToken', 'jwt-refresh');
    });

    it('sets error and loading=false on failure', async () => {
      mockLoginApi.mockRejectedValue(new Error('Invalid credentials'));

      await useAuthStore.getState().loginAsync('alice', 'wrong');

      const state = useAuthStore.getState();
      expect(state.loading).toBe(false);
      expect(state.error).toBe('Invalid credentials');
      expect(state.currentUser).toBeNull();
      expect(state.token).toBeNull();
    });

    it('sets default error message when error has no message', async () => {
      mockLoginApi.mockRejectedValue('some error');

      await useAuthStore.getState().loginAsync('alice', 'wrong');

      expect(useAuthStore.getState().error).toBe('Login failed');
    });
  });

  describe('fetchCurrentUserAsync', () => {
    beforeEach(() => {
      vi.clearAllMocks();
      useAuthStore.setState({
        currentUser: null,
        loading: false,
        error: null,
      });
    });

    it('sets loading=true while fetching', async () => {
      mockGetCurrentUserApi.mockResolvedValue({
        code: 0,
        data: mockUser,
      } as any);

      const promise = useAuthStore.getState().fetchCurrentUserAsync();
      expect(useAuthStore.getState().loading).toBe(true);

      await promise;
    });

    it('sets user on success', async () => {
      mockGetCurrentUserApi.mockResolvedValue({
        code: 0,
        data: mockUser,
      } as any);

      await useAuthStore.getState().fetchCurrentUserAsync();

      const state = useAuthStore.getState();
      expect(state.currentUser).toEqual(mockUser);
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('sets error and loading=false on failure', async () => {
      mockGetCurrentUserApi.mockRejectedValue(new Error('Unauthorized'));

      await useAuthStore.getState().fetchCurrentUserAsync();

      const state = useAuthStore.getState();
      expect(state.loading).toBe(false);
      expect(state.error).toBe('Unauthorized');
      expect(state.currentUser).toBeNull();
    });

    it('sets default error message when error has no message', async () => {
      mockGetCurrentUserApi.mockRejectedValue('some error');

      await useAuthStore.getState().fetchCurrentUserAsync();

      expect(useAuthStore.getState().error).toBe('Failed to fetch current user');
    });
  });

  describe('logoutAsync', () => {
    beforeEach(() => {
      vi.clearAllMocks();
      mockLocalStorage.setItem('token', 'jwt-access');
      mockLocalStorage.setItem('refreshToken', 'jwt-refresh');
      useAuthStore.setState({
        currentUser: mockUser,
        token: 'jwt-access',
        loading: false,
        error: null,
      });
    });

    it('calls logout API, clears user, token and localStorage', async () => {
      await useAuthStore.getState().logoutAsync();

      expect(mockLogoutApi).toHaveBeenCalled();
      const state = useAuthStore.getState();
      expect(state.currentUser).toBeNull();
      expect(state.token).toBeNull();
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('token');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('refreshToken');
    });
  });
});
