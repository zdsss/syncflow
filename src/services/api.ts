import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
});

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      // TODO: redirect to login
      console.warn('Auth expired');
    }
    return Promise.reject(error);
  }
);

export default api;
