import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';

const mockStorage: Record<string, string> = {};
const mockLocalStorage = {
  getItem: vi.fn((key: string) => mockStorage[key] ?? null),
  setItem: vi.fn((key: string, value: string) => { mockStorage[key] = value; }),
  removeItem: vi.fn((key: string) => { delete mockStorage[key]; }),
  clear: vi.fn(() => { Object.keys(mockStorage).forEach(k => delete mockStorage[k]); }),
};
vi.stubGlobal('localStorage', mockLocalStorage);

const originalLocation = window.location;
const mockAssign = vi.fn();
let locationHref = '';
vi.stubGlobal('location', {
  ...originalLocation,
  assign: mockAssign,
  get href() { return locationHref; },
  set href(val: string) { locationHref = val; },
});

vi.mock('../auth.service', () => ({
  refreshToken: vi.fn(),
}));

import { refreshToken as refreshTokenApi } from '../auth.service';

describe('api', () => {
  let api: typeof axios;
  let getErrorMessage: (error: any) => string;

  beforeEach(async () => {
    vi.resetModules();
    Object.keys(mockStorage).forEach(k => delete mockStorage[k]);
    locationHref = '';
    vi.mocked(refreshTokenApi).mockReset();
    const mod = await import('../api');
    api = mod.default;
    getErrorMessage = mod.getErrorMessage;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('is an axios instance with http methods', () => {
    expect(api.get).toBeDefined();
    expect(api.post).toBeDefined();
    expect(api.patch).toBeDefined();
    expect(api.delete).toBeDefined();
  });

  it('has baseURL /api', () => {
    expect(api.defaults.baseURL).toBe('/api');
  });

  it('has timeout 30000', () => {
    expect(api.defaults.timeout).toBe(30000);
  });

  it('response interceptor unwraps response.data', async () => {
    const interceptor = api.interceptors.response.handlers[0];
    const result = interceptor.fulfilled({ data: { code: 200 } } as any);
    expect(result).toEqual({ code: 200 });
  });

  describe('401 token refresh', () => {
    it('attempts refresh on 401 when refreshToken exists', async () => {
      mockStorage['refreshToken'] = 'stored-refresh';
      // refreshTokenApi returns unwrapped data (response interceptor strips .data)
      vi.mocked(refreshTokenApi).mockResolvedValue({ data: { token: 'new-access' } } as any);

      const interceptor = api.interceptors.response.handlers[0];
      const originalRequest = {
        response: { status: 401 },
        config: { headers: {}, _retry: undefined },
        headers: {},
      };

      // Mock adapter to resolve on retry
      api.defaults.adapter = async (config: any) => ({ data: { success: true }, status: 200, statusText: 'OK', headers: {}, config });

      const result = await interceptor.rejected(originalRequest as any);
      expect(refreshTokenApi).toHaveBeenCalledWith('stored-refresh');
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('token', 'new-access');
      expect(result).toEqual({ success: true });
    });

    it('rejects when refreshToken is not available on 401', async () => {
      const interceptor = api.interceptors.response.handlers[0];
      const error = { response: { status: 401 }, config: { headers: {} } };

      await expect(interceptor.rejected(error as any)).rejects.toBe(error);
    });

    it('rejects and clears tokens when refresh call fails', async () => {
      mockStorage['refreshToken'] = 'stored-refresh';
      mockStorage['token'] = 'old-access';
      vi.mocked(refreshTokenApi).mockRejectedValue(new Error('Refresh failed'));

      const interceptor = api.interceptors.response.handlers[0];
      const error = { response: { status: 401 }, config: { headers: {} } };

      await expect(interceptor.rejected(error as any)).rejects.toBeDefined();
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('token');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('refreshToken');
    });

    it('rejects non-401 errors without attempting refresh', async () => {
      const interceptor = api.interceptors.response.handlers[0];
      const error = { response: { status: 500 }, config: { headers: {} } };

      await expect(interceptor.rejected(error as any)).rejects.toBe(error);
      expect(refreshTokenApi).not.toHaveBeenCalled();
    });
  });

  describe('getErrorMessage', () => {
    it('returns server message from response.data.message', () => {
      const error = { response: { data: { message: '服务器错误' } } };
      expect(getErrorMessage(error)).toBe('服务器错误');
    });

    it('returns error.message for network errors', () => {
      const error = { message: 'Network Error' };
      expect(getErrorMessage(error)).toBe('Network Error');
    });

    it('returns default message for unknown errors', () => {
      expect(getErrorMessage(null)).toBe('系统异常，请稍后重试');
      expect(getErrorMessage(undefined)).toBe('系统异常，请稍后重试');
      expect(getErrorMessage({})).toBe('系统异常，请稍后重试');
    });
  });

  describe('401 redirect to login', () => {
    it('redirects to root when 401 and no refreshToken', async () => {
      const interceptor = api.interceptors.response.handlers[0];
      const error = { response: { status: 401 }, config: { headers: {} } };

      await expect(interceptor.rejected(error as any)).rejects.toBe(error);
      expect(locationHref).toBe('/');
    });

    it('redirects to root when refresh call fails', async () => {
      mockStorage['refreshToken'] = 'stored-refresh';
      mockStorage['token'] = 'old-access';
      vi.mocked(refreshTokenApi).mockRejectedValue(new Error('Refresh failed'));

      const interceptor = api.interceptors.response.handlers[0];
      const error = { response: { status: 401 }, config: { headers: {} } };

      await expect(interceptor.rejected(error as any)).rejects.toBeDefined();
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('token');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('refreshToken');
      expect(locationHref).toBe('/');
    });
  });
});
