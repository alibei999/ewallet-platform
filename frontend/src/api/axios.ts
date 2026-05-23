import axios from 'axios';

const BASE_URL =
  (import.meta.env.VITE_API_URL as string | undefined) ||
  'http://localhost:8080/api/v1';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let refreshQueue: Array<(token: string) => void> = [];

function drainQueue(token: string) {
  refreshQueue.forEach((cb) => cb(token));
  refreshQueue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (!axios.isAxiosError(error)) return Promise.reject(error);

    const original = error.config as typeof error.config & {
      _retry?: boolean;
    };

    if (error.response?.status !== 401 || !original || original._retry) {
      return Promise.reject(error);
    }

    original._retry = true;

    if (isRefreshing) {
      return new Promise((resolve) => {
        refreshQueue.push((newToken) => {
          if (original.headers) {
            original.headers.Authorization = `Bearer ${newToken}`;
          }
          resolve(api(original));
        });
      });
    }

    isRefreshing = true;

    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) throw new Error('No refresh token');

      const { data } = await axios.post<{
        token: string;
        refresh_token: string;
      }>(`${BASE_URL}/auth/refresh`, { refresh_token: refreshToken });

      localStorage.setItem('token', data.token);
      localStorage.setItem('refreshToken', data.refresh_token);

      drainQueue(data.token);
      isRefreshing = false;

      if (original.headers) {
        original.headers.Authorization = `Bearer ${data.token}`;
      }
      return api(original);
    } catch (refreshError) {
      isRefreshing = false;
      refreshQueue = [];
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      window.location.href = '/login';
      return Promise.reject(refreshError);
    }
  },
);

export default api;
