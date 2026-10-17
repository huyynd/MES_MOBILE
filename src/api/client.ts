import axios from 'axios';
import { tokenStorage } from '@/utils/tokenStorage';
import { API_BASE_URL } from '@/utils/config';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor request: Đính kèm token
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await tokenStorage.get();
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      console.error('Error fetching token from storage', e);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor response: 401 (token hết hạn / không hợp lệ) → tự đăng xuất về màn Login.
// Bỏ qua /auth/login (sai mật khẩu cũng trả 401) và /auth/logout (tránh vòng lặp).
let loggingOut = false;
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const url: string = error.config?.url || '';
    if (error.response?.status === 401 && !url.includes('/auth/login') && !url.includes('/auth/logout') && !loggingOut) {
      loggingOut = true;
      try {
        // require lười để tránh vòng import client ↔ authStore
        const { useAuthStore } = require('@/store/authStore');
        await useAuthStore.getState().logout();
      } finally {
        loggingOut = false;
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
