import axios from 'axios';
import { tokenStore } from '@/lib/token';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    // Never run the refresh-then-redirect flow for the auth endpoints themselves:
    // a wrong-password 401 on /auth/login must surface to the login page as an
    // error toast, not trigger a token refresh and a full-page redirect.
    const url: string = originalRequest?.url || '';
    const isAuthRoute = url.includes('/auth/login') || url.includes('/auth/refresh');
    if (error.response?.status === 401 && !originalRequest._retry && !isAuthRoute) {
      originalRequest._retry = true;
      try {
        const { data } = await axios.post(`${API_URL}/auth/refresh`, {}, { withCredentials: true });
        if (data.success) {
          tokenStore.set(data.data.accessToken);
          originalRequest.headers.Authorization = `Bearer ${data.data.accessToken}`;
          return api(originalRequest);
        }
      } catch {
        tokenStore.remove();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
