import axios, { type AxiosInstance } from 'axios';
import { refreshToken as refreshTokenApi } from './auth.service';

const api: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 30000,
});

let isRefreshing = false;
let failedQueue: Array<{ resolve: (value: any) => void; reject: (reason?: any) => void }> = [];

const processQueue = (error: any) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(undefined);
    }
  });
  failedQueue = [];
};

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => api(originalRequest));
      }

      originalRequest._retry = true;
      const rt = localStorage.getItem('refreshToken');

      if (!rt) {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        window.location.href = '/';
        return Promise.reject(error);
      }

      isRefreshing = true;

      try {
        const res = await refreshTokenApi(rt) as { data?: { token?: string }; token?: string };
        const newToken = res.data?.token ?? res.token;
        localStorage.setItem('token', newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        processQueue(null);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        window.location.href = '/';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export function getErrorMessage(error: any): string {
  if (error?.response?.data?.message) return error.response.data.message;
  if (error?.message) return error.message;
  return '系统异常，请稍后重试';
}

/** Typed request helpers — the response interceptor returns `response.data` directly */
export const request = {
  get: <T = any>(url: string, config?: any) => api.get(url, config) as unknown as Promise<T>,
  post: <T = any>(url: string, data?: any, config?: any) => api.post(url, data, config) as unknown as Promise<T>,
  put: <T = any>(url: string, data?: any, config?: any) => api.put(url, data, config) as unknown as Promise<T>,
  delete: <T = any>(url: string, config?: any) => api.delete(url, config) as unknown as Promise<T>,
};

export default api;
